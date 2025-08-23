import { NextRequest, NextResponse } from 'next/server';
import { CopyObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bucketName: string; objectKey: string }> }
) {
  try {
    const { bucketName, objectKey } = await params;
    const { storageClass } = await request.json();

    // Decode the object key in case it contains special characters
    const decodedObjectKey = decodeURIComponent(objectKey);

    // Validate storage class
    const validStorageClasses = [
      'STANDARD',
      'STANDARD_IA',
      'ONEZONE_IA',
      'INTELLIGENT_TIERING',
      'GLACIER',
      'GLACIER_IR',
      'DEEP_ARCHIVE',
      'REDUCED_REDUNDANCY'
    ];

    if (!validStorageClasses.includes(storageClass)) {
      return NextResponse.json(
        { error: 'Invalid storage class' },
        { status: 400 }
      );
    }

    // Verify authentication and get user
    const user = await verifyAuth(request);
    
    // Create S3 client using user's credentials
    const s3Client = createS3ClientFromUser(user);

    // First, get the current storage class of the object
    const headCommand = new HeadObjectCommand({
      Bucket: bucketName,
      Key: decodedObjectKey,
    });

    const headResponse = await s3Client.send(headCommand);
    const currentStorageClass = headResponse.StorageClass || 'STANDARD';

    // Validate the storage class transition
    const validation = validateStorageClassTransition(currentStorageClass, storageClass);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: validation.errorMessage,
          requiresRestore: validation.requiresRestore,
          currentStorageClass: currentStorageClass,
          requestedStorageClass: storageClass
        },
        { status: 400 }
      );
    }

    // If validation passes, proceed with the copy operation
    const copyCommand = new CopyObjectCommand({
      Bucket: bucketName,
      Key: decodedObjectKey,
      CopySource: `${bucketName}/${decodedObjectKey}`,
      StorageClass: storageClass,
      MetadataDirective: 'COPY', // Preserve existing metadata
    });

    await s3Client.send(copyCommand);

    return NextResponse.json({
      success: true,
      message: `Storage class changed from ${currentStorageClass} to ${storageClass}`,
      previousStorageClass: currentStorageClass,
      newStorageClass: storageClass
    });
  } catch (error: any) {
    console.error('Error changing storage class:', error);
    
    const isAuthError = error instanceof Error && error.message === 'No authentication token';
    const errorMessage = isAuthError ? 'Authentication required' : getS3ErrorMessage(error);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
