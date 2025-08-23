import { NextRequest, NextResponse } from 'next/server';
import { S3Client, CopyObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { bucketName: string; objectKey: string } }
) {
  try {
    const { bucketName, objectKey } = params;
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

    // Copy object to itself with new storage class
    const copyCommand = new CopyObjectCommand({
      Bucket: bucketName,
      Key: decodedObjectKey,
      CopySource: `${bucketName}/${decodedObjectKey}`,
      StorageClass: storageClass,
      MetadataDirective: 'COPY', // Preserve existing metadata
    });

    await s3.send(copyCommand);

    return NextResponse.json({
      success: true,
      message: `Storage class changed to ${storageClass}`,
    });
  } catch (error: any) {
    console.error('Error changing storage class:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to change storage class' },
      { status: 500 }
    );
  }
}
