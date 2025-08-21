import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createS3ClientForBucket, getS3ErrorMessage } from '@/lib/s3-client';

// Helper function to verify authentication
async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    throw new Error('No authentication token');
  }
  
  const decoded = verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;
  return decoded;
}

// POST /api/s3/upload-proxy - Upload file through server to S3
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    // Check permissions
    if (!user.permissions?.includes('s3:write')) {
      console.log('Permission denied for user:', user.permissions);
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const key = formData.get('key') as string;

    if (!file || !bucket || !key) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: file, bucket, or key' },
        { status: 400 }
      );
    }

    console.log('Proxy upload request:', {
      bucket,
      key,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
      userRegion: user.awsRegion
    });

    // Initialize S3 client for the specific bucket (with region detection)
    const s3Client = await createS3ClientForBucket(user, bucket);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ContentLength: file.size,
    });

    const result = await s3Client.send(command);

    console.log('Upload successful:', {
      bucket,
      key,
      etag: result.ETag,
      versionId: result.VersionId
    });

    return NextResponse.json({
      success: true,
      bucket,
      key,
      etag: result.ETag,
      versionId: result.VersionId,
      size: file.size,
      contentType: file.type,
    });

  } catch (error) {
    console.error('Proxy upload error:', error);
    
    const isAuthError = error instanceof Error && error.message === 'No authentication token';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isAuthError ? 'Authentication required' : getS3ErrorMessage(error)
      },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
