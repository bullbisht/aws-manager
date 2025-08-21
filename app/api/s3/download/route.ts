import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { jwtVerify } from 'jose';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3ClientFromUser, getS3ErrorMessage } from '@/lib/s3-client';

// Validation schema for download request
const downloadSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  expiresIn: z.number().optional().default(3600), // 1 hour default
});

// Helper function to verify authentication
async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    throw new Error('No authentication token');
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-key');
  const { payload } = await jwtVerify(token, secret);
  
  // The jose library returns a different structure than jsonwebtoken
  // Ensure compatibility by handling both structures
  return payload;
}

export async function GET(request: NextRequest) {
  try {
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
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const isView = searchParams.get('view') === 'true';
    const validatedData = downloadSchema.parse({
      bucket: searchParams.get('bucket'),
      key: searchParams.get('key'),
      expiresIn: searchParams.get('expiresIn') ? parseInt(searchParams.get('expiresIn')!) : undefined,
    });

    // Create S3 client from user credentials (simplified approach)
    const s3Client = createS3ClientFromUser(user);

    // Generate presigned URL for download or view
    const command = new GetObjectCommand({
      Bucket: validatedData.bucket,
      Key: validatedData.key,
      // For downloads, set Content-Disposition to force download
      ...(isView ? {} : { 
        ResponseContentDisposition: `attachment; filename="${validatedData.key.split('/').pop() || 'download'}"` 
      }),
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: validatedData.expiresIn,
    });

    return NextResponse.json({
      success: true,
      data: {
        [isView ? 'viewUrl' : 'downloadUrl']: presignedUrl,
        bucket: validatedData.bucket,
        key: validatedData.key,
        expiresIn: validatedData.expiresIn,
        isView,
        note: isView 
          ? 'Use this URL to view the file directly in browser' 
          : 'Use this URL to download the file directly from S3',
      }
    });

  } catch (error) {
    console.error('Download URL generation error:', error);
    
    const isAuthError = error instanceof Error && (
      error.message === 'No authentication token' ||
      error.message.includes('Authentication') ||
      error.message.includes('Invalid or expired token')
    );
    
    return NextResponse.json(
      { 
        success: false, 
        error: isAuthError ? 'Authentication required' : getS3ErrorMessage(error),
        errorType: error?.constructor?.name,
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
