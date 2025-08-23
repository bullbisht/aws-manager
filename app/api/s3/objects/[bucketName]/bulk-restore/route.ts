import { NextRequest, NextResponse } from 'next/server'
import { RestoreObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3'
import { verify } from 'jsonwebtoken'
import { createS3ClientFromUser, getS3ErrorMessage } from '@/lib/s3-client'

// Helper function to verify authentication
async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    throw new Error('No authentication token')
  }
  
  const decoded = verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any
  return decoded
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bucketName: string }> }
) {
  try {
    const { bucketName } = await params
    const body = await request.json()
    const { 
      prefix = '',
      days = 1, 
      tier = 'Standard',
      description = 'Bulk restoration requested',
      objectKeys = []
    } = body

    // Verify authentication and get user
    const user = await verifyAuth(request)

    // Create S3 client using user's credentials
    const s3Client = createS3ClientFromUser(user)

    // Validate restoration parameters
    if (days < 1 || days > 30) {
      return NextResponse.json(
        { 
          error: 'Invalid restoration duration',
          details: 'Days must be between 1 and 30'
        },
        { status: 400 }
      )
    }

    if (!['Expedited', 'Standard', 'Bulk'].includes(tier)) {
      return NextResponse.json(
        { 
          error: 'Invalid restoration tier',
          details: 'Tier must be one of: Expedited, Standard, Bulk'
        },
        { status: 400 }
      )
    }

    console.log('🔄 Starting bulk restoration:', {
      bucketName,
      prefix,
      objectKeysCount: objectKeys.length,
      days,
      tier,
      timestamp: new Date().toISOString()
    })

    let objectsToRestore: string[] = []

    // If objectKeys are provided, use them directly
    if (objectKeys && objectKeys.length > 0) {
      objectsToRestore = objectKeys
    } else {
      // Otherwise, list objects with the given prefix
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        MaxKeys: 1000 // AWS limit per request
      })

      const listResponse = await s3Client.send(listCommand)
      objectsToRestore = (listResponse.Contents || [])
        .filter(obj => obj.Key && !obj.Key.endsWith('/')) // Skip folders
        .map(obj => obj.Key!)
    }

    if (objectsToRestore.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No objects found',
        details: prefix 
          ? `No objects found with prefix "${prefix}"`
          : 'No objects found in the specified list'
      }, { status: 404 })
    }

    // Check which objects are in DEEP_ARCHIVE or GLACIER before attempting restoration
    const eligibleObjects: string[] = []
    const ineligibleObjects: { key: string; reason: string }[] = []
    const restorationResults: {
      successful: string[]
      failed: { key: string; error: string }[]
      skipped: { key: string; reason: string }[]
      alreadyInProgress: string[]
    } = {
      successful: [],
      failed: [],
      skipped: [],
      alreadyInProgress: []
    }

    // First pass: Check object storage classes
    for (const objectKey of objectsToRestore) {
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: bucketName,
          Key: objectKey
        })

        const headResponse = await s3Client.send(headCommand)
        const storageClass = headResponse.StorageClass || 'STANDARD'

        // Check if object can be restored
        if (storageClass === 'DEEP_ARCHIVE' || storageClass === 'GLACIER') {
          // Check if restoration is already in progress
          if (headResponse.Restore) {
            const ongoingMatch = headResponse.Restore.match(/ongoing-request="([^"]+)"/)
            const isOngoing = ongoingMatch?.[1] === 'true'
            
            if (isOngoing) {
              restorationResults.alreadyInProgress.push(objectKey)
              continue
            }
          }
          
          eligibleObjects.push(objectKey)
        } else {
          ineligibleObjects.push({
            key: objectKey,
            reason: `Object is in ${storageClass} storage class and does not require restoration`
          })
        }
      } catch (error: any) {
        if (error.name === 'NoSuchKey') {
          restorationResults.failed.push({
            key: objectKey,
            error: 'Object not found'
          })
        } else {
          restorationResults.failed.push({
            key: objectKey,
            error: error.message || 'Failed to check object status'
          })
        }
      }
    }

    // Add ineligible objects to skipped list
    restorationResults.skipped = ineligibleObjects

    console.log('📊 Bulk restoration analysis:', {
      totalObjects: objectsToRestore.length,
      eligibleObjects: eligibleObjects.length,
      ineligibleObjects: ineligibleObjects.length,
      alreadyInProgress: restorationResults.alreadyInProgress.length,
      failed: restorationResults.failed.length
    })

    // Second pass: Perform restoration on eligible objects
    for (const objectKey of eligibleObjects) {
      try {
        const restoreCommand = new RestoreObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
          RestoreRequest: {
            Days: days,
            GlacierJobParameters: {
              Tier: tier
            },
            Description: `${description} - ${objectKey}`
          }
        })

        await s3Client.send(restoreCommand)
        restorationResults.successful.push(objectKey)

        console.log('✅ Object restoration initiated:', { bucketName, objectKey, tier })

      } catch (error: any) {
        console.error('❌ Failed to restore object:', { objectKey, error: error.message })

        if (error.name === 'RestoreAlreadyInProgress') {
          restorationResults.alreadyInProgress.push(objectKey)
        } else {
          restorationResults.failed.push({
            key: objectKey,
            error: error.message || 'Restoration failed'
          })
        }
      }
    }

    // Calculate expected completion time based on tier
    const now = new Date()
    const expectedCompletion = new Date(now)
    
    switch (tier) {
      case 'Expedited':
        expectedCompletion.setMinutes(now.getMinutes() + 5)
        break
      case 'Standard':
        expectedCompletion.setHours(now.getHours() + 5)
        break
      case 'Bulk':
        expectedCompletion.setHours(now.getHours() + 12)
        break
    }

    const summary = {
      total: objectsToRestore.length,
      successful: restorationResults.successful.length,
      failed: restorationResults.failed.length,
      skipped: restorationResults.skipped.length,
      alreadyInProgress: restorationResults.alreadyInProgress.length
    }

    console.log('📈 Bulk restoration completed:', summary)

    // Determine success status
    const hasAnySuccess = summary.successful > 0 || summary.alreadyInProgress > 0
    const hasFailures = summary.failed > 0

    return NextResponse.json({
      success: hasAnySuccess,
      message: `Bulk restoration processed ${summary.total} objects`,
      data: {
        bucketName,
        prefix,
        days,
        tier,
        summary,
        results: restorationResults,
        expectedCompletion: expectedCompletion.toISOString(),
        estimatedDurationMinutes: tier === 'Expedited' ? 5 : tier === 'Standard' ? 300 : 720,
        description
      }
    })

  } catch (error: any) {
    console.error('❌ Bulk restoration failed:', error)

    // Get params again for error handling
    try {
      const { bucketName } = await params
      
      // Handle authentication errors
      const isAuthError = error instanceof Error && error.message === 'No authentication token'
      if (isAuthError) {
        return NextResponse.json({
          success: false,
          error: 'Authentication required',
          errorCode: 'AUTH_REQUIRED'
        }, { status: 401 })
      }

      // Handle specific AWS errors
      if (error.name === 'NoSuchBucket') {
        return NextResponse.json({
          success: false,
          error: 'Bucket not found',
          details: `The bucket ${bucketName} does not exist.`,
          errorCode: 'BUCKET_NOT_FOUND'
        }, { status: 404 })
      }

      if (error.name === 'CredentialsProviderError' || error.name === 'AccessDenied') {
        return NextResponse.json({
          success: false,
          error: 'Authentication failed',
          details: 'Invalid AWS credentials or insufficient permissions to restore objects.',
          errorCode: 'AUTH_ERROR'
        }, { status: 403 })
      }

      // Generic error response
      return NextResponse.json({
        success: false,
        error: 'Bulk restoration failed',
        details: error.message || 'An unexpected error occurred during bulk restoration',
        errorCode: 'BULK_RESTORATION_ERROR'
      }, { status: 500 })

    } catch (paramError) {
      // Fallback if we can't even get params
      return NextResponse.json({
        success: false,
        error: 'Bulk restoration failed',
        details: 'An unexpected error occurred during bulk restoration',
        errorCode: 'BULK_RESTORATION_ERROR'
      }, { status: 500 })
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bucketName: string }> }
) {
  try {
    const { bucketName } = await params
    const { searchParams } = new URL(request.url)
    const prefix = searchParams.get('prefix') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)

    // Verify authentication and get user
    const user = await verifyAuth(request)

    // Create S3 client using user's credentials
    const s3Client = createS3ClientFromUser(user)

    // List objects with the given prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: limit
    })

    const listResponse = await s3Client.send(listCommand)
    const objects = (listResponse.Contents || [])
      .filter(obj => obj.Key && !obj.Key.endsWith('/')) // Skip folders
      .map(obj => obj.Key!)

    // Check restoration status for each object
    const objectsWithStatus: Array<{
      key: string
      storageClass: string
      canRestore: boolean
      restoration?: {
        inProgress: boolean
        completed: boolean
        expiryDate?: string
        timeRemaining?: number
      }
    }> = []

    for (const objectKey of objects) {
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: bucketName,
          Key: objectKey
        })

        const headResponse = await s3Client.send(headCommand)
        const storageClass = headResponse.StorageClass || 'STANDARD'
        const canRestore = storageClass === 'DEEP_ARCHIVE' || storageClass === 'GLACIER'

        let restorationStatus = undefined
        if (headResponse.Restore) {
          const ongoingMatch = headResponse.Restore.match(/ongoing-request="([^"]+)"/)
          const expiryMatch = headResponse.Restore.match(/expiry-date="([^"]+)"/)
          
          const isOngoing = ongoingMatch?.[1] === 'true'
          const expiryDate = expiryMatch?.[1] ? new Date(expiryMatch[1]) : null

          restorationStatus = {
            inProgress: isOngoing,
            completed: !isOngoing && !!expiryDate,
            expiryDate: expiryDate?.toISOString(),
            timeRemaining: expiryDate ? Math.max(0, expiryDate.getTime() - Date.now()) : undefined
          }
        }

        objectsWithStatus.push({
          key: objectKey,
          storageClass,
          canRestore,
          restoration: restorationStatus
        })

      } catch (error: any) {
        // If we can't get object info, include it anyway with unknown status
        objectsWithStatus.push({
          key: objectKey,
          storageClass: 'UNKNOWN',
          canRestore: false
        })
      }
    }

    // Calculate summary statistics
    const summary = {
      total: objectsWithStatus.length,
      canRestore: objectsWithStatus.filter(obj => obj.canRestore).length,
      inProgress: objectsWithStatus.filter(obj => obj.restoration?.inProgress).length,
      completed: objectsWithStatus.filter(obj => obj.restoration?.completed).length,
      storageClasses: Array.from(new Set(objectsWithStatus.map(obj => obj.storageClass)))
    }

    return NextResponse.json({
      success: true,
      data: {
        bucketName,
        prefix,
        objects: objectsWithStatus,
        summary,
        hasMore: listResponse.IsTruncated || false,
        nextContinuationToken: listResponse.NextContinuationToken
      }
    })

  } catch (error: any) {
    console.error('❌ Failed to get bulk restoration status:', error)

    // Handle authentication errors
    const isAuthError = error instanceof Error && error.message === 'No authentication token'
    if (isAuthError) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        errorCode: 'AUTH_REQUIRED'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to get bulk restoration status',
      details: error.message,
      errorCode: 'STATUS_CHECK_ERROR'
    }, { status: 500 })
  }
}
