import { NextRequest, NextResponse } from 'next/server';
import { ListObjectsV2Command, CopyObjectCommand } from '@aws-sdk/client-s3';
import { verify } from 'jsonwebtoken';
import { createS3ClientFromUser, getS3ErrorMessage } from '@/lib/s3-client';

// Helper function to verify authentication
async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    throw new Error('No authentication token');
  }
  
  const decoded = verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;
  return decoded;
}

// Helper function to validate storage class transitions
function validateStorageClassTransition(currentStorageClass: string, newStorageClass: string): { 
  isValid: boolean; 
  errorMessage?: string; 
  requiresRestore?: boolean;
} {
  // Normalize storage class names (handle undefined/null)
  const current = currentStorageClass?.toUpperCase() || 'STANDARD';
  const target = newStorageClass?.toUpperCase();

  // Objects in GLACIER or DEEP_ARCHIVE cannot be directly transitioned
  if (current === 'GLACIER' || current === 'DEEP_ARCHIVE') {
    if (target !== current) {
      return {
        isValid: false,
        requiresRestore: true,
        errorMessage: `Objects in ${current} storage class must be restored before changing to ${target}. Please restore the object first, then change its storage class.`
      };
    }
  }

  // Objects in GLACIER_IR can transition to most classes except GLACIER/DEEP_ARCHIVE
  if (current === 'GLACIER_IR') {
    if (target === 'GLACIER' || target === 'DEEP_ARCHIVE') {
      return {
        isValid: false,
        errorMessage: `Cannot transition from ${current} to ${target}. Use lifecycle policies for such transitions.`
      };
    }
  }

  // All other transitions are generally allowed
  return { isValid: true };
}

const VALID_STORAGE_CLASSES = [
  'STANDARD',
  'STANDARD_IA',
  'ONEZONE_IA',
  'INTELLIGENT_TIERING',
  'GLACIER',
  'GLACIER_IR',
  'DEEP_ARCHIVE',
  'REDUCED_REDUNDANCY'
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bucketName: string }> }
) {
  try {
    const { bucketName } = await params;
    const { prefix, storageClass } = await request.json();

    if (!prefix || !storageClass) {
      return NextResponse.json(
        { error: 'Missing required fields: prefix and storageClass' },
        { status: 400 }
      );
    }

    if (!VALID_STORAGE_CLASSES.includes(storageClass)) {
      return NextResponse.json(
        { error: 'Invalid storage class' },
        { status: 400 }
      );
    }

    // Verify authentication and get user
    const user = await verifyAuth(request);
    
    // Create S3 client using user's credentials
    const s3Client = createS3ClientFromUser(user);

    // List all objects with the given prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: 1000, // Process in batches of 1000
    });

    const listResponse = await s3Client.send(listCommand);
    const objects = listResponse.Contents || [];

    // Filter out directory markers (objects ending with '/')
    const fileObjects = objects.filter((obj: any) => obj.Key && !obj.Key.endsWith('/'));

    if (fileObjects.length === 0) {
      return NextResponse.json(
        { message: 'No files found in the specified directory', processedCount: 0 },
        { status: 200 }
      );
    }

    // Process objects in parallel with concurrency limit
    const BATCH_SIZE = 10; // Process 10 objects at a time
    const results = [];
    
    for (let i = 0; i < fileObjects.length; i += BATCH_SIZE) {
      const batch = fileObjects.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (obj: any) => {
        try {
          const currentStorageClass = obj.StorageClass || 'STANDARD';
          
          // Skip if already in the target storage class
          if (currentStorageClass === storageClass) {
            return { key: obj.Key, status: 'skipped', reason: 'Already in target storage class' };
          }

          // Validate the storage class transition
          const validation = validateStorageClassTransition(currentStorageClass, storageClass);
          
          if (!validation.isValid) {
            return { 
              key: obj.Key, 
              status: 'blocked', 
              reason: validation.errorMessage,
              requiresRestore: validation.requiresRestore,
              currentStorageClass: currentStorageClass
            };
          }

          const copyCommand = new CopyObjectCommand({
            Bucket: bucketName,
            Key: obj.Key!,
            CopySource: `${bucketName}/${obj.Key}`,
            StorageClass: storageClass,
            MetadataDirective: 'COPY',
          });

          await s3Client.send(copyCommand);
          return { key: obj.Key, status: 'success', previousStorageClass: currentStorageClass };
        } catch (error) {
          console.error(`Failed to update storage class for ${obj.Key}:`, error);
          return { 
            key: obj.Key, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // Summarize results
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    const blockedCount = results.filter(r => r.status === 'blocked').length;

    // Check if all operations were blocked or failed
    const hasAnySuccess = successCount > 0;
    const allBlocked = blockedCount === fileObjects.length;
    const allBlockedOrSkipped = (blockedCount + skippedCount) === fileObjects.length;

    // If all operations were blocked due to invalid transitions, return error
    if (allBlocked) {
      const blockedReasons = results
        .filter(r => r.status === 'blocked')
        .map(r => r.reason)
        .filter((value, index, self) => self.indexOf(value) === index); // Get unique reasons

      return NextResponse.json({
        success: false,
        error: 'All storage class transitions were blocked',
        details: blockedReasons.length === 1 
          ? blockedReasons[0] 
          : `Multiple issues found: ${blockedReasons.join('; ')}`,
        data: {
          summary: {
            total: fileObjects.length,
            successful: successCount,
            errors: errorCount,
            skipped: skippedCount,
            blocked: blockedCount
          },
          details: results,
          storageClass
        }
      }, { status: 400 });
    }

    // If all operations were either blocked or skipped (no actual changes), return partial success
    if (allBlockedOrSkipped && successCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'No storage class changes were made',
        details: 'All files were either already in the target storage class or blocked from transitioning',
        data: {
          summary: {
            total: fileObjects.length,
            successful: successCount,
            errors: errorCount,
            skipped: skippedCount,
            blocked: blockedCount
          },
          details: results,
          storageClass
        }
      }, { status: 400 });
    }

    // Return success only if at least some operations succeeded
    return NextResponse.json({
      success: hasAnySuccess,
      data: {
        message: hasAnySuccess 
          ? `Bulk storage class update completed` 
          : 'No storage class changes were made',
        summary: {
          total: fileObjects.length,
          successful: successCount,
          errors: errorCount,
          skipped: skippedCount,
          blocked: blockedCount
        },
        details: results,
        storageClass
      }
    });

  } catch (error) {
    console.error('Error updating bulk storage class:', error);
    
    const isAuthError = error instanceof Error && error.message === 'No authentication token';
    const errorMessage = isAuthError ? 'Authentication required' : getS3ErrorMessage(error);
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage, 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
