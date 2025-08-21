import { NextRequest, NextResponse } from 'next/server';
import { createS3ClientForBucket } from '@/lib/s3-client';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { verify } from 'jsonwebtoken';

// Helper function to verify authentication
async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    throw new Error('No authentication token');
  }
  
  const decoded = verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;
  return decoded;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and get user
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { bucket, folderName, prefix = '' } = await request.json();

    if (!bucket || !folderName) {
      return NextResponse.json(
        { error: 'Missing required fields: bucket, folderName' },
        { status: 400 }
      );
    }

    // Ensure folder name ends with /
    const folderKey = `${prefix}${folderName.trim()}/`;

    // Create S3 client for the specific bucket
    const s3Client = await createS3ClientForBucket(user, bucket);

    // Create an empty object with the folder key
    const putObjectParams = {
      Bucket: bucket,
      Key: folderKey,
      Body: '',
      ContentType: 'application/x-directory',
    };

    console.log('Creating folder:', { bucket, folderKey });

    await s3Client.send(new PutObjectCommand(putObjectParams));

    console.log('Folder created successfully:', { bucket, folderKey });

    return NextResponse.json({
      success: true,
      message: 'Folder created successfully',
      folderKey,
    });

  } catch (error: any) {
    console.error('Folder creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create folder',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
