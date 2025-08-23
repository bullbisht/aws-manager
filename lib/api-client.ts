// API Client for S3 Manager
// Centralized API calls with error handling and type safety

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export interface LoginCredentials {
  authType: 'credentials' | 'sso';
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  ssoStartUrl?: string;
  ssoRegion?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  authType: 'credentials' | 'sso';
  awsRegion?: string;
  awsAccountId?: string;
  permissions?: string[];
}

export interface AWSIdentity {
  userId: string;
  account: string;
  arn: string;
  region: string;
  username: string;
}

export interface Bucket {
  Name: string;
  CreationDate: Date;
  Region: string;
  Objects: number;
  Size: string;
  pendingDeletion?: boolean;
}

export interface S3Object {
  Key: string;
  LastModified: Date;
  Size: number;
  StorageClass: string;
  ETag: string;
}

class ApiClient {
  private baseUrl = '';

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (response.ok) {
        return data;
      } else {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: Request failed`,
          details: data.details,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Authentication API
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; deviceAuth?: any }>> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // SSO Polling API
  async pollSSOToken(deviceCode: string, ssoStartUrl: string, ssoRegion: string): Promise<ApiResponse<{ user: User }>> {
    return this.request('/api/auth/sso-poll', {
      method: 'POST',
      body: JSON.stringify({ deviceCode, ssoStartUrl, ssoRegion }),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/api/user/profile');
  }

  async getIdentity(): Promise<ApiResponse<{ identity: any }>> {
    return this.request('/api/user/identity');
  }

  // S3 Buckets API
  async getBuckets(): Promise<ApiResponse<{ buckets: Bucket[]; total: number }>> {
    return this.request('/api/s3/buckets');
  }

  async createBucket(bucketName: string, region = 'ap-south-1'): Promise<ApiResponse<{ bucket: any }>> {
    return this.request('/api/s3/buckets', {
      method: 'POST',
      body: JSON.stringify({ bucketName, region }),
    });
  }

  async deleteBucket(bucketName: string): Promise<ApiResponse> {
    return this.request('/api/s3/buckets', {
      method: 'DELETE',
      body: JSON.stringify({ bucketName }),
    });
  }

  // S3 Objects API
  async getObjects(
    bucket: string, 
    prefix?: string, 
    maxKeys = 100
  ): Promise<ApiResponse<{ objects: S3Object[]; total: number }>> {
    const params = new URLSearchParams({
      bucket,
      ...(prefix && { prefix }),
      maxKeys: maxKeys.toString(),
    });

    return this.request(`/api/s3/objects?${params}`);
  }

  async deleteObject(bucket: string, key: string): Promise<ApiResponse> {
    return this.request('/api/s3/objects', {
      method: 'DELETE',
      body: JSON.stringify({ bucket, key }),
    });
  }

  async renameObject(bucket: string, oldKey: string, newKey: string): Promise<ApiResponse> {
    return this.request('/api/s3/objects/rename', {
      method: 'POST',
      body: JSON.stringify({ bucket, oldKey, newKey }),
    });
  }

  async createFolder(bucket: string, folderName: string, prefix = ''): Promise<ApiResponse> {
    return this.request('/api/s3/folders/create', {
      method: 'POST',
      body: JSON.stringify({ bucket, folderName, prefix }),
    });
  }

  async downloadObject(bucket: string, key: string, expiresIn = 3600): Promise<ApiResponse<{ downloadUrl: string }>> {
    const params = new URLSearchParams({
      bucket,
      key,
      expiresIn: expiresIn.toString(),
    });

    return this.request(`/api/s3/download?${params}`);
  }

  async viewObject(bucket: string, key: string, expiresIn = 3600): Promise<ApiResponse<{ viewUrl: string }>> {
    const params = new URLSearchParams({
      bucket,
      key,
      expiresIn: expiresIn.toString(),
      view: 'true', // Add view parameter
    });

    return this.request(`/api/s3/download?${params}`);
  }

  // S3 Upload API
  async getUploadUrl(
    bucket: string,
    key: string,
    contentType?: string,
    isMultipart = false,
    expiresIn = 3600
  ): Promise<ApiResponse<{ uploadUrl: string; uploadId?: string }>> {
    return this.request('/api/s3/upload', {
      method: 'POST',
      body: JSON.stringify({
        bucket,
        key,
        contentType,
        isMultipart,
        expiresIn,
      }),
    });
  }

  async uploadFileProxy(
    bucket: string,
    key: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ bucket: string; key: string; etag: string }>> {
    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('key', key);

      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          resolve({
            success: false,
            error: `Upload failed with status ${xhr.status}: ${xhr.statusText}`
          });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: `Network error: ${xhr.status || 'Connection failed'}`
        });
      });

      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      xhr.open('POST', '/api/s3/upload-proxy');
      
      if (token) {
        xhr.setRequestHeader('Cookie', `auth-token=${token}`);
      }
      
      xhr.send(formData);
    });
  }

  // Billing API
  async getBillingData(
    service?: string,
    granularity: 'DAILY' | 'MONTHLY' = 'MONTHLY'
  ): Promise<ApiResponse<{ 
    totalCost: string;
    s3Cost: string;
    currency: string;
    period: string;
    startDate: string;
    endDate: string;
    breakdown: any[];
  }>> {
    const params = new URLSearchParams({
      granularity,
    });
    
    if (service) {
      params.append('service', service);
    }

    return this.request(`/api/billing?${params}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export utility functions
export const handleApiError = (error: string) => {
  console.error('API Error:', error);
  // You can add toast notifications here
  return error;
};

export const isAuthError = (error: string) => {
  return error.includes('Authentication') || 
         error.includes('Unauthorized') || 
         error.includes('Invalid token');
};
