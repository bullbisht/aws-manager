import { NextRequest, NextResponse } from 'next/server'
import { RestoreObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
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
  { params }: { params: Promise<{ bucketName: string; objectKey: string }> }
) {
  try {
    const { bucketName, objectKey } = await params
    const decodedObjectKey = decodeURIComponent(objectKey)
    const body = await request.json()
    const { 
      days = 1, 
      tier = 'Standard',
      description = 'Object restoration requested'
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

    console.log('🔄 Starting object restoration:', {
      bucketName,
      objectKey: decodedObjectKey,
      days,
      tier,
      timestamp: new Date().toISOString()
    })

    // Create restore command
    const restoreCommand = new RestoreObjectCommand({
      Bucket: bucketName,
      Key: decodedObjectKey,
      RestoreRequest: {
        Days: days,
        GlacierJobParameters: {
          Tier: tier
        },
        Description: description
      }
    })

    // Execute restoration
    await s3Client.send(restoreCommand)

    console.log('✅ Object restoration initiated successfully:', {
      bucketName,
      objectKey: decodedObjectKey,
      days,
      tier
    })

    // Calculate expected completion time based on tier
    const now = new Date()
    const expectedCompletion = new Date(now)
    
    switch (tier) {
      case 'Expedited':
        // 1-5 minutes for Expedited
        expectedCompletion.setMinutes(now.getMinutes() + 5)
        break
      case 'Standard':
        // 3-5 hours for Standard
        expectedCompletion.setHours(now.getHours() + 5)
        break
      case 'Bulk':
        // 5-12 hours for Bulk
        expectedCompletion.setHours(now.getHours() + 12)
        break
    }

    return NextResponse.json({
      success: true,
      message: `Restoration initiated for ${decodedObjectKey}`,
      data: {
        objectKey: decodedObjectKey,
        bucketName,
        days,
        tier,
        status: 'in-progress',
        expectedCompletion: expectedCompletion.toISOString(),
        estimatedDurationMinutes: tier === 'Expedited' ? 5 : tier === 'Standard' ? 300 : 720,
        description
      }
    })

  } catch (error: any) {
    console.error('❌ Object restoration failed:', error)

    // Get params again for error handling since they might not be in scope
    const { bucketName, objectKey } = await params
    const decodedObjectKey = decodeURIComponent(objectKey)

    // Handle specific AWS errors
    if (error.name === 'RestoreAlreadyInProgress') {
      return NextResponse.json({
        success: false,
        error: 'Restoration already in progress',
        details: 'This object is already being restored. Please check the restoration status.',
        errorCode: 'RESTORE_IN_PROGRESS'
      }, { status: 409 })
    }

    if (error.name === 'InvalidObjectState') {
      return NextResponse.json({
        success: false,
        error: 'Invalid object state',
        details: 'This object cannot be restored. It may not be in DEEP_ARCHIVE or GLACIER storage class.',
        errorCode: 'INVALID_OBJECT_STATE'
      }, { status: 400 })
    }

    if (error.name === 'NoSuchKey') {
      return NextResponse.json({
        success: false,
        error: 'Object not found',
        details: `The object ${decodedObjectKey} does not exist in bucket ${bucketName}.`,
        errorCode: 'OBJECT_NOT_FOUND'
      }, { status: 404 })
    }

    if (error.name === 'NoSuchBucket') {
      return NextResponse.json({
        success: false,
        error: 'Bucket not found',
        details: `The bucket ${bucketName} does not exist.`,
        errorCode: 'BUCKET_NOT_FOUND'
      }, { status: 404 })
    }

    // Handle credential and permission errors
    if (error.name === 'CredentialsProviderError' || error.name === 'AccessDenied') {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        details: 'Invalid AWS credentials or insufficient permissions to restore objects.',
        errorCode: 'AUTH_ERROR'
      }, { status: 403 })
    }

    // Handle authentication errors
    const isAuthError = error instanceof Error && error.message === 'No authentication token'
    if (isAuthError) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        errorCode: 'AUTH_REQUIRED'
      }, { status: 401 })
    }

    // Generic error response
    return NextResponse.json({
      success: false,
      error: 'Object restoration failed',
      details: error.message || 'An unexpected error occurred during restoration',
      errorCode: 'RESTORATION_ERROR'
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bucketName: string; objectKey: string }> }
) {
  try {
    const { bucketName, objectKey } = await params
    const decodedObjectKey = decodeURIComponent(objectKey)

    // Verify authentication and get user
    const user = await verifyAuth(request)

    // Create S3 client using user's credentials
    const s3Client = createS3ClientFromUser(user)

    // Get object metadata to check restoration status
    const headCommand = new HeadObjectCommand({
      Bucket: bucketName,
      Key: decodedObjectKey
    })

    const response = await s3Client.send(headCommand)

    // Parse restoration information
    const restore = response.Restore
    let restorationStatus = null

    if (restore) {
      // Parse the restore header: 'ongoing-request="false", expiry-date="Fri, 21 Dec 2012 00:00:00 GMT"'
      // or 'ongoing-request="true"'
      const ongoingMatch = restore.match(/ongoing-request="([^"]+)"/)
      const expiryMatch = restore.match(/expiry-date="([^"]+)"/)
      
      const isOngoing = ongoingMatch?.[1] === 'true'
      const expiryDate = expiryMatch?.[1] ? new Date(expiryMatch[1]) : null

      restorationStatus = {
        inProgress: isOngoing,
        completed: !isOngoing && expiryDate,
        expiryDate: expiryDate?.toISOString(),
        timeRemaining: expiryDate ? Math.max(0, expiryDate.getTime() - Date.now()) : null
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        objectKey: decodedObjectKey,
        bucketName,
        storageClass: response.StorageClass,
        restoration: restorationStatus,
        lastModified: response.LastModified?.toISOString(),
        size: response.ContentLength
      }
    })

  } catch (error: any) {
    console.error('❌ Failed to get restoration status:', error)

    if (error.name === 'NoSuchKey') {
      return NextResponse.json({
        success: false,
        error: 'Object not found',
        errorCode: 'OBJECT_NOT_FOUND'
      }, { status: 404 })
    }

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
      error: 'Failed to get restoration status',
      details: error.message,
      errorCode: 'STATUS_CHECK_ERROR'
    }, { status: 500 })
  }
}
