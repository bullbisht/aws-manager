import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createS3ClientFromUser } from '@/lib/s3-client';
import { CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// Helper function to verify authentication
async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    throw new Error('No authentication token');
  }
  
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-key');
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication first
    const user = await verifyAuth(request);
    
    // Check if user has AWS credentials
    if (!(user as any)?.awsCredentials?.accessKeyId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'AWS credentials not found in session',
          details: 'Please log in again with valid AWS credentials'
        },
        { status: 401 }
      );
    }

    const { bucket, oldKey, newKey } = await request.json();

    if (!bucket || !oldKey || !newKey) {
      return NextResponse.json(
        { error: 'Missing required fields: bucket, oldKey, newKey' },
        { status: 400 }
      );
    }

    if (oldKey === newKey) {
      return NextResponse.json(
        { error: 'Old key and new key cannot be the same' },
        { status: 400 }
      );
    }

    // Create S3 client from user credentials
    const s3Client = createS3ClientFromUser(user);

    // First, check if the source object exists
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: bucket,
        Key: oldKey,
      }));
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return NextResponse.json(
          { error: 'Source object not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Check if destination already exists
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: bucket,
        Key: newKey,
      }));
      return NextResponse.json(
        { error: 'Destination object already exists' },
        { status: 409 }
      );
    } catch (error: any) {
      if (error.name !== 'NotFound') {
        throw error;
      }
      // This is expected - destination should not exist
    }

    // Copy the object to the new key
    const copyParams = {
      Bucket: bucket,
      CopySource: `${bucket}/${encodeURIComponent(oldKey)}`,
      Key: newKey,
      MetadataDirective: 'COPY' as const,
    };

    console.log('Renaming object:', { bucket, oldKey, newKey });

    await s3Client.send(new CopyObjectCommand(copyParams));

    // Delete the original object
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: oldKey,
    }));

    console.log('Rename successful:', { bucket, oldKey, newKey });

    return NextResponse.json({
      success: true,
      message: 'Object renamed successfully',
      oldKey,
      newKey,
    });

  } catch (error: any) {
    console.error('Rename error:', error);
    
    const isAuthError = error instanceof Error && (
      error.message === 'No authentication token' ||
      error.message.includes('Authentication') ||
      error.message.includes('Invalid or expired token')
    );
    
    return NextResponse.json(
      { 
        success: false,
        error: isAuthError ? 'Authentication required' : 'Failed to rename object',
        details: error.message 
      },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
