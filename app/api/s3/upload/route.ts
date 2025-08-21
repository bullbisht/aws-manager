import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verify } from 'jsonwebtoken';
import { PutObjectCommand, CreateMultipartUploadCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3ClientForBucket, getS3ErrorMessage } from '@/lib/s3-client';

// Validation schema for upload request
const uploadSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  contentType: z.string().optional(),
  isMultipart: z.boolean().default(false),
  expiresIn: z.number().min(1).max(604800).default(3600), // 1 hour default, max 1 week
});

// Helper function to verify authentication
async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    throw new Error('No authentication token');
  }
  
  const decoded = verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;
  return decoded;
}

// POST /api/s3/upload - Generate presigned URL or initiate multipart upload
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    const body = await request.json();
    const validatedData = uploadSchema.parse(body);

    console.log('Upload request:', {
      bucket: validatedData.bucket,
      key: validatedData.key,
      contentType: validatedData.contentType,
      userRegion: user.awsRegion
    });

    // Check permissions
    if (!user.permissions?.includes('s3:write')) {
      console.log('Permission denied for user:', user.permissions);
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Initialize S3 client for the specific bucket (with region detection)
    const s3Client = await createS3ClientForBucket(user, validatedData.bucket);

    if (validatedData.isMultipart) {
      // Initiate multipart upload
      const command = new CreateMultipartUploadCommand({
        Bucket: validatedData.bucket,
        Key: validatedData.key,
        ContentType: validatedData.contentType,
      });

      const response = await s3Client.send(command);

      return NextResponse.json({
        success: true,
        uploadId: response.UploadId,
        bucket: validatedData.bucket,
        key: validatedData.key,
        isMultipart: true,
      });
    } else {
      // Generate presigned URL for single upload
      const command = new PutObjectCommand({
        Bucket: validatedData.bucket,
        Key: validatedData.key,
        ContentType: validatedData.contentType,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: validatedData.expiresIn,
      });

      console.log('Generated presigned URL successfully for:', validatedData.key);

      return NextResponse.json({
        success: true,
        uploadUrl: presignedUrl,
        bucket: validatedData.bucket,
        key: validatedData.key,
        contentType: validatedData.contentType,
        expiresIn: validatedData.expiresIn,
        isMultipart: false,
        instructions: {
          method: 'PUT',
          headers: validatedData.contentType ? { 'Content-Type': validatedData.contentType } : {},
          note: 'Use the presigned URL to upload your file directly to S3',
        },
      });
    }
  } catch (error) {
    console.error('Upload API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

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
