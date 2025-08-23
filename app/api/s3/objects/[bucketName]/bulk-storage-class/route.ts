import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, CopyObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

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
  { params }: { params: { bucketName: string } }
) {
  try {
    const { bucketName } = params;
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

    // List all objects with the given prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: 1000, // Process in batches of 1000
    });

    const listResponse = await s3Client.send(listCommand);
    const objects = listResponse.Contents || [];

    // Filter out directory markers (objects ending with '/')
    const fileObjects = objects.filter(obj => obj.Key && !obj.Key.endsWith('/'));

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
      
      const batchPromises = batch.map(async (obj) => {
        try {
          // Skip if already in the target storage class
          if (obj.StorageClass === storageClass) {
            return { key: obj.Key, status: 'skipped', reason: 'Already in target storage class' };
          }

          const copyCommand = new CopyObjectCommand({
            Bucket: bucketName,
            Key: obj.Key!,
            CopySource: `${bucketName}/${obj.Key}`,
            StorageClass: storageClass,
            MetadataDirective: 'COPY',
          });

          await s3Client.send(copyCommand);
          return { key: obj.Key, status: 'success' };
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

    return NextResponse.json({
      message: `Bulk storage class update completed`,
      summary: {
        total: fileObjects.length,
        successful: successCount,
        errors: errorCount,
        skipped: skippedCount
      },
      details: results,
      storageClass
    });

  } catch (error) {
    console.error('Error updating bulk storage class:', error);
    return NextResponse.json(
      { error: 'Failed to update storage class', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
