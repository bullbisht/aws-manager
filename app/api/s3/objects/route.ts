import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verify } from 'jsonwebtoken';
import { ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createS3ClientForBucket, getS3ErrorMessage } from '@/lib/s3-client';

// Validation schemas
const listObjectsSchema = z.object({
  bucket: z.string(),
  prefix: z.string().optional(),
  maxKeys: z.number().min(1).max(1000).default(100),
});

const deleteObjectSchema = z.object({
  bucket: z.string(),
  key: z.string(),
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

// GET /api/s3/objects?bucket=name&prefix=path/&maxKeys=100
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    const { searchParams } = new URL(request.url);
    const queryData = {
      bucket: searchParams.get('bucket') || '',
      prefix: searchParams.get('prefix') || undefined,
      maxKeys: parseInt(searchParams.get('maxKeys') || '100'),
    };
    
    const validatedData = listObjectsSchema.parse(queryData);

    // Initialize S3 client for the specific bucket (with region detection)
    const s3Client = await createS3ClientForBucket(user, validatedData.bucket);
    
    const command = new ListObjectsV2Command({
      Bucket: validatedData.bucket,
      Prefix: validatedData.prefix,
      MaxKeys: validatedData.maxKeys,
    });
    
    const response = await s3Client.send(command);

    // Format the response
    const objects = (response.Contents || []).map(obj => ({
      Key: obj.Key,
      LastModified: obj.LastModified,
      Size: obj.Size,
      StorageClass: obj.StorageClass,
      ETag: obj.ETag,
    }));

    return NextResponse.json({
      success: true,
      objects: objects,
      bucket: validatedData.bucket,
      prefix: validatedData.prefix,
      total: objects.length,
      isTruncated: response.IsTruncated || false,
      nextContinuationToken: response.NextContinuationToken,
    });

  } catch (error) {
    console.error('List objects error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    const isAuthError = error instanceof Error && error.message === 'No authentication token';
    const errorMessage = getS3ErrorMessage(error);
    
    return NextResponse.json(
      { success: false, error: isAuthError ? 'Authentication required' : errorMessage },
      { status: isAuthError ? 401 : 500 }
    );
  }
}

// DELETE /api/s3/objects
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    const body = await request.json();
    const validatedData = deleteObjectSchema.parse(body);

    // Check permissions
    if (!user.permissions.includes('s3:write')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Initialize S3 client for the specific bucket (with region detection)
    const s3Client = await createS3ClientForBucket(user, validatedData.bucket);
    
    const command = new DeleteObjectCommand({
      Bucket: validatedData.bucket,
      Key: validatedData.key,
    });
    
    await s3Client.send(command);

    return NextResponse.json({
      success: true,
      message: `Object '${validatedData.key}' deleted successfully from bucket '${validatedData.bucket}'`,
    });

  } catch (error) {
    console.error('Delete object error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    const isAuthError = error instanceof Error && error.message === 'No authentication token';
    const errorMessage = getS3ErrorMessage(error);
    
    return NextResponse.json(
      { success: false, error: isAuthError ? 'Authentication required' : errorMessage },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
