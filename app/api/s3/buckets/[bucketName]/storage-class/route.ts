import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { S3Client, ListObjectsV2Command, CopyObjectCommand } from '@aws-sdk/client-s3';
import { createS3ClientFromUser } from '@/lib/s3-client';

// Helper function to verify authentication
async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    throw new Error('No authentication token');
  }
  
  const decoded = verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;
  return decoded;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { bucketName: string } }
) {
  try {
    const user = await verifyAuth(request);

    const { bucketName } = params;
    const { storageClass } = await request.json();

    if (!bucketName || !storageClass) {
      return NextResponse.json(
        { success: false, error: 'Bucket name and storage class are required' },
        { status: 400 }
      );
    }

    // Initialize S3 client with user's credentials
    const s3Client = createS3ClientFromUser(user);

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors: any[] = [];
    const BATCH_SIZE = 10;
    
    // List all objects in the bucket
    let continuationToken: string | undefined;
    const allObjects: any[] = [];

    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });

      const listResponse = await s3Client.send(listCommand);
      
      if (listResponse.Contents) {
        allObjects.push(...listResponse.Contents);
      }

      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);

    // Filter out directory markers and objects already in the target storage class
    const objectsToProcess = allObjects.filter(obj => {
      if (!obj.Key || obj.Key.endsWith('/')) {
        skippedCount++;
        return false;
      }
      
      if (obj.StorageClass === storageClass) {
        skippedCount++;
        return false;
      }
      
      return true;
    });

    console.log(`Processing ${objectsToProcess.length} objects in bucket ${bucketName} to ${storageClass}`);

    // Process objects in batches
    for (let i = 0; i < objectsToProcess.length; i += BATCH_SIZE) {
      const batch = objectsToProcess.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (object) => {
        try {
          processedCount++;
          
          const copyCommand = new CopyObjectCommand({
            Bucket: bucketName,
            Key: object.Key,
            CopySource: `${bucketName}/${object.Key}`,
            StorageClass: storageClass,
            MetadataDirective: 'COPY',
          });

          await s3Client.send(copyCommand);
          successCount++;
          
          return {
            key: object.Key,
            status: 'success',
            originalStorageClass: object.StorageClass || 'STANDARD',
            newStorageClass: storageClass,
          };
        } catch (error) {
          errorCount++;
          const errorDetail = {
            key: object.Key,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            originalStorageClass: object.StorageClass || 'STANDARD',
          };
          errors.push(errorDetail);
          return errorDetail;
        }
      });

      await Promise.all(batchPromises);
      
      // Add a small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < objectsToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const summary = {
      total: processedCount,
      successful: successCount,
      errors: errorCount,
      skipped: skippedCount,
    };

    const message = `Bucket storage class operation completed. ${successCount} objects successfully changed to ${storageClass}${errorCount > 0 ? `, ${errorCount} errors` : ''}${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}.`;

    return NextResponse.json({
      success: true,
      data: {
        message,
        summary,
        details: errors.length > 0 ? errors.slice(0, 10) : [], // Limit error details to first 10
        totalObjects: allObjects.length,
        processedObjects: objectsToProcess.length,
      },
    });

  } catch (error) {
    console.error('Bucket storage class change error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change bucket storage class',
      },
      { status: 500 }
    );
  }
}
