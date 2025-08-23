import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verify } from 'jsonwebtoken';
import { ListBucketsCommand, CreateBucketCommand, HeadBucketCommand, DeleteBucketCommand } from '@aws-sdk/client-s3';
import { createS3ClientFromUser, getS3ErrorMessage } from '@/lib/s3-client';

// Helper function to format bytes into human-readable format
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Validation schemas - AWS S3 bucket naming rules
const createBucketSchema = z.object({
  bucketName: z.string()
    .min(3, "Bucket name must be at least 3 characters")
    .max(63, "Bucket name must be at most 63 characters")
    .regex(/^[a-z0-9][a-z0-9\-]*[a-z0-9]$/, "Bucket name must start and end with lowercase letter or number, and can contain hyphens")
    .refine(name => !name.includes('..'), "Bucket name cannot contain consecutive periods")
    .refine(name => !name.includes('.-') && !name.includes('-.'), "Bucket name cannot contain period-dash or dash-period sequences")
    .refine(name => !/^\d+\.\d+\.\d+\.\d+$/.test(name), "Bucket name cannot be formatted as an IP address"),
  region: z.string().default('us-east-1'),
});

const deleteBucketSchema = z.object({
  bucketName: z.string().min(3).max(63),
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

// GET /api/s3/buckets - List all buckets
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    // Initialize S3 client with user's credentials
    const s3Client = createS3ClientFromUser(user);
    
    // List all buckets
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    // Get additional metadata for each bucket
    const bucketsWithMetadata = await Promise.all(
      (response.Buckets || []).map(async (bucket: any) => {
        try {
          // Try to get bucket location
          const headCommand = new HeadBucketCommand({ Bucket: bucket.Name });
          await s3Client.send(headCommand);

          // Get object count and total size
          let objectCount = 0;
          let totalSize = 0;
          let hasMoreObjects = false;
          
          // Storage class analysis
          let storageClasses: { [key: string]: number } = {};
          let primaryStorageClass = 'STANDARD'; // Default
          
          try {
            const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
            const listCommand = new ListObjectsV2Command({ 
              Bucket: bucket.Name,
              MaxKeys: 1000 // Limit to avoid timeout on large buckets
            });
            const listResponse = await s3Client.send(listCommand);
            
            if (listResponse.Contents) {
              objectCount = listResponse.Contents.length;
              totalSize = listResponse.Contents.reduce((sum, obj) => sum + (obj.Size || 0), 0);
              
              // Analyze storage classes
              listResponse.Contents.forEach(obj => {
                const storageClass = obj.StorageClass || 'STANDARD';
                storageClasses[storageClass] = (storageClasses[storageClass] || 0) + 1;
              });
              
              // Determine primary storage class (most common one)
              if (Object.keys(storageClasses).length > 0) {
                primaryStorageClass = Object.entries(storageClasses)
                  .sort(([,a], [,b]) => b - a)[0][0];
              }
            }
            
            // If there are more objects, we still return the count we got
            // but we'll handle the "+" indicator differently
            hasMoreObjects = listResponse.IsTruncated || false;
          } catch (listError) {
            console.warn(`Could not list objects for bucket ${bucket.Name}:`, listError);
          }

          return {
            Name: bucket.Name,
            CreationDate: bucket.CreationDate,
            Region: user.awsRegion,
            Objects: objectCount,
            Size: totalSize > 0 ? formatBytes(totalSize) : 'Empty',
            StorageClass: primaryStorageClass,
            StorageClasses: storageClasses,
            hasMoreObjects: hasMoreObjects || false,
          };
        } catch (headError) {
          return {
            Name: bucket.Name,
            CreationDate: bucket.CreationDate,
            Region: user.awsRegion,
            Objects: 0,
            Size: 'Access Denied',
            error: 'Unable to access bucket metadata',
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      buckets: bucketsWithMetadata,
    });

  } catch (error) {
    console.error('List buckets error:', error);
    
    const isAuthError = error instanceof Error && error.message === 'No authentication token';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isAuthError ? 'Authentication required' : (error instanceof Error ? error.message : 'Unknown error'),
        errorType: error?.constructor?.name,
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined
      },
      { status: isAuthError ? 401 : 500 }
    );
  }
}

// POST /api/s3/buckets - Create a new bucket
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    const body = await request.json();
    const validatedData = createBucketSchema.parse(body);

    // Check permissions
    if (!user.permissions.includes('s3:write')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Initialize S3 client and create bucket
    const s3Client = createS3ClientFromUser(user);
    
    const createBucketConfig: any = {
      Bucket: validatedData.bucketName,
    };
    
    // Add LocationConstraint for regions other than us-east-1
    if (validatedData.region !== 'us-east-1') {
      createBucketConfig.CreateBucketConfiguration = {
        LocationConstraint: validatedData.region,
      };
    }
    
    const command = new CreateBucketCommand(createBucketConfig);
    await s3Client.send(command);

    return NextResponse.json({
      success: true,
      bucket: {
        name: validatedData.bucketName,
        region: validatedData.region,
        createdAt: new Date().toISOString(),
      },
      message: `Bucket '${validatedData.bucketName}' created successfully`,
    });

  } catch (error) {
    console.error('Create bucket error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid bucket data', details: error.errors },
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

// DELETE /api/s3/buckets - Delete a bucket
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    const body = await request.json();
    const validatedData = deleteBucketSchema.parse(body);

    // Check permissions
    if (!user.permissions.includes('s3:write')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Initialize S3 client and delete bucket
    const s3Client = createS3ClientFromUser(user);
    
    const command = new DeleteBucketCommand({
      Bucket: validatedData.bucketName,
    });
    
    await s3Client.send(command);

    return NextResponse.json({
      success: true,
      message: `Bucket '${validatedData.bucketName}' deleted successfully`,
    });

  } catch (error) {
    console.error('Delete bucket error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid bucket name', details: error.errors },
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
