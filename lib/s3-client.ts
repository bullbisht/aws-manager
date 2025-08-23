// AWS S3 Client Configuration and Utilities
import { S3Client, GetBucketLocationCommand } from '@aws-sdk/client-s3';
import { fromIni, fromEnv } from '@aws-sdk/credential-providers';

export interface S3Config {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
  profile?: string;
}

export class S3ClientManager {
  private clients: Map<string, S3Client> = new Map();

  /**
   * Get or create an S3 client for the given configuration
   */
  getClient(config: S3Config): S3Client {
    const clientKey = this.generateClientKey(config);
    
    if (this.clients.has(clientKey)) {
      return this.clients.get(clientKey)!;
    }

    const client = this.createClient(config);
    this.clients.set(clientKey, client);
    return client;
  }

  /**
   * Get S3 client for a specific bucket (handles region detection)
   */
  async getClientForBucket(user: any, bucketName: string): Promise<S3Client> {
    try {
      // First, try to get the bucket's region
      const defaultClient = this.createDefaultClient(user);
      
      const command = new GetBucketLocationCommand({ Bucket: bucketName });
      const response = await defaultClient.send(command);
      
      // Handle AWS's special case for us-east-1
      const bucketRegion = response.LocationConstraint || 'us-east-1';
      
      // Create or get a client for the bucket's specific region
      const config: S3Config = {
        region: bucketRegion,
      };

      if (user.awsCredentials && user.awsCredentials.accessKeyId) {
        config.credentials = {
          accessKeyId: user.awsCredentials.accessKeyId,
          secretAccessKey: user.awsCredentials.secretAccessKey,
          sessionToken: user.awsCredentials.sessionToken,
        };
      }
      // If no user credentials, let AWS SDK use default credential chain (SSO, environment variables, etc.)

      return this.getClient(config);
    } catch (error) {
      console.warn(`Failed to get bucket region for ${bucketName}, using default client:`, error);
      // Fallback to default client if region detection fails
      return this.createDefaultClient(user);
    }
  }

  /**
   * Create a default S3 client for general operations
   */
  private createDefaultClient(user: any): S3Client {
    const config: S3Config = {
      region: user.awsRegion || user.region || process.env.AWS_DEFAULT_REGION || 'ap-south-1',
    };

    if (user.awsCredentials && user.awsCredentials.accessKeyId) {
      config.credentials = {
        accessKeyId: user.awsCredentials.accessKeyId,
        secretAccessKey: user.awsCredentials.secretAccessKey,
        sessionToken: user.awsCredentials.sessionToken,
      };
    }
    // If no user credentials, let AWS SDK use default credential chain (SSO, environment variables, etc.)

    return this.getClient(config);
  }

  /**
   * Create a new S3 client with the provided configuration
   */
  private createClient(config: S3Config): S3Client {
    const clientConfig: any = {
      region: config.region,
    };

    // Configure credentials based on available options
    if (config.credentials) {
      // Use provided credentials (from user input)
      clientConfig.credentials = config.credentials;
    } else if (config.profile) {
      // Use AWS profile
      clientConfig.credentials = fromIni({ profile: config.profile });
    } else {
      // Use default AWS credential chain (supports SSO, environment variables, IAM roles, etc.)
      // Don't specify credentials - let AWS SDK use the default credential chain
      // This supports: SSO, environment variables, shared credentials file, IAM roles, etc.
    }

    return new S3Client(clientConfig);
  }

  /**
   * Generate a unique key for client caching
   */
  private generateClientKey(config: S3Config): string {
    if (config.credentials) {
      // Use first 8 chars of access key for identification
      const keyId = config.credentials.accessKeyId.substring(0, 8);
      return `${config.region}:${keyId}`;
    } else if (config.profile) {
      return `${config.region}:profile:${config.profile}`;
    } else {
      return `${config.region}:default`;
    }
  }

  /**
   * Test S3 client connectivity
   */
  async testClient(client: S3Client): Promise<boolean> {
    try {
      // Try to list buckets to test connectivity
      const { ListBucketsCommand } = await import('@aws-sdk/client-s3');
      await client.send(new ListBucketsCommand({}));
      return true;
    } catch (error) {
      console.error('S3 client test failed:', error);
      return false;
    }
  }

  /**
   * Clear cached clients (useful for credential updates)
   */
  clearCache(): void {
    this.clients.clear();
  }

  /**
   * Get client statistics
   */
  getStats(): { totalClients: number; regions: string[] } {
    const regions = Array.from(this.clients.keys()).map(key => key.split(':')[0]);
    return {
      totalClients: this.clients.size,
      regions: [...new Set(regions)],
    };
  }
}

// Export singleton instance
export const s3ClientManager = new S3ClientManager();

// Utility function to create S3 client from user session
export function createS3ClientFromUser(user: any): S3Client {
  const config: S3Config = {
    region: user.awsRegion || user.region || process.env.AWS_DEFAULT_REGION || 'ap-south-1',
  };

  // Add credentials if available in user session
  if (user.awsCredentials && user.awsCredentials.accessKeyId) {
    config.credentials = {
      accessKeyId: user.awsCredentials.accessKeyId,
      secretAccessKey: user.awsCredentials.secretAccessKey,
      sessionToken: user.awsCredentials.sessionToken,
    };
  }
  // If no user credentials, let AWS SDK use default credential chain (SSO, environment variables, etc.)

  return s3ClientManager.getClient(config);
}

// Utility function to create S3 client for a specific bucket (with region detection)
export async function createS3ClientForBucket(user: any, bucketName: string): Promise<S3Client> {
  return await s3ClientManager.getClientForBucket(user, bucketName);
}

// Error handling utilities
export function isS3Error(error: any): boolean {
  return error?.$metadata?.httpStatusCode !== undefined;
}

export function getS3ErrorMessage(error: any): string {
  if (isS3Error(error)) {
    const statusCode = error.$metadata.httpStatusCode;
    const errorCode = error.Code || 'UnknownError';
    const message = error.message || 'An S3 error occurred';
    
    return `S3 Error ${statusCode}: ${errorCode} - ${message}`;
  }
  
  return error.message || 'Unknown error occurred';
}
