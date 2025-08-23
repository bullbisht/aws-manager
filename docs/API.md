# API Documentation
# AWS S3 Manager Web Interface

**Document Version**: 1.0  
**Date**: August 11, 2025  
**Author**: Development Team  
**Base URL**: `https://api.s3-manager.local`  

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Bucket Operations](#2-bucket-operations)
3. [Object Operations](#3-object-operations)
4. [User Management](#4-user-management)
5. [System Operations](#5-system-operations)
6. [Error Handling](#6-error-handling)
7. [Rate Limiting](#7-rate-limiting)

---

## 1. Authentication

### 1.1 Login with AWS Credentials

**Endpoint**: `POST /api/v1/auth/login`

**Description**: Authenticate user with AWS credentials

**Request Body**:
```json
{
  "authType": "aws-credentials",
  "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
  "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "region": "us-west-2"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "developer"
    },
    "expiresAt": "2025-08-12T10:30:00Z"
  }
}
```

### 1.2 Login with AWS SSO

**Endpoint**: `POST /api/v1/auth/sso`

**Description**: Authenticate user with AWS SSO

**Request Body**:
```json
{
  "authType": "aws-sso",
  "startUrl": "https://my-sso-portal.awsapps.com/start",
  "region": "us-west-2",
  "accountId": "123456789012",
  "roleName": "S3Manager"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "deviceCode": "APKAEIBAERJR2EXAMPLE",
    "userCode": "MAKV-GESG",
    "verificationUri": "https://device.sso.us-west-2.amazonaws.com/",
    "verificationUriComplete": "https://device.sso.us-west-2.amazonaws.com/?user_code=MAKV-GESG",
    "expiresIn": 600,
    "interval": 5
  }
}
```

### 1.3 Complete SSO Authentication

**Endpoint**: `POST /api/v1/auth/sso/complete`

**Description**: Complete SSO authentication after device authorization

**Request Body**:
```json
{
  "deviceCode": "APKAEIBAERJR2EXAMPLE"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "developer"
    },
    "expiresAt": "2025-08-12T10:30:00Z"
  }
}
```

### 1.4 Refresh Token

**Endpoint**: `POST /api/v1/auth/refresh`

**Description**: Refresh authentication token

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2025-08-12T11:30:00Z"
  }
}
```

### 1.5 Logout

**Endpoint**: `POST /api/v1/auth/logout`

**Description**: Invalidate user session

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

---

## 2. Bucket Operations

### 2.1 List Buckets

**Endpoint**: `GET /api/v1/buckets`

**Description**: Get list of accessible S3 buckets

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search bucket names

**Response**:
```json
{
  "success": true,
  "data": {
    "buckets": [
      {
        "name": "my-bucket-1",
        "region": "us-west-2",
        "creationDate": "2025-01-15T08:30:00Z",
        "objectCount": 1523,
        "totalSize": 5368709120,
        "versioning": "Enabled",
        "encryption": "AES256",
        "publicRead": false,
        "lastAccessed": "2025-08-11T14:22:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### 2.2 Create Bucket

**Endpoint**: `POST /api/v1/buckets`

**Description**: Create a new S3 bucket

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "my-new-bucket",
  "region": "us-west-2",
  "versioning": true,
  "encryption": {
    "type": "AES256"
  },
  "publicAccess": {
    "blockPublicAcls": true,
    "ignorePublicAcls": true,
    "blockPublicPolicy": true,
    "restrictPublicBuckets": true
  },
  "tags": {
    "Environment": "development",
    "Project": "s3-manager"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "bucket": {
      "name": "my-new-bucket",
      "region": "us-west-2",
      "creationDate": "2025-08-11T15:30:00Z",
      "location": "https://my-new-bucket.s3.us-west-2.amazonaws.com/"
    }
  }
}
```

### 2.3 Get Bucket Details

**Endpoint**: `GET /api/v1/buckets/{bucketName}`

**Description**: Get detailed information about a specific bucket

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
{
  "success": true,
  "data": {
    "bucket": {
      "name": "my-bucket-1",
      "region": "us-west-2",
      "creationDate": "2025-01-15T08:30:00Z",
      "objectCount": 1523,
      "totalSize": 5368709120,
      "versioning": "Enabled",
      "encryption": {
        "type": "AES256",
        "keyId": null
      },
      "publicAccess": {
        "blockPublicAcls": true,
        "ignorePublicAcls": true,
        "blockPublicPolicy": true,
        "restrictPublicBuckets": true
      },
      "policy": {
        "hasPolicy": true,
        "lastModified": "2025-08-10T12:00:00Z"
      },
      "cors": {
        "hasCors": false
      },
      "lifecycle": {
        "hasLifecycle": true,
        "ruleCount": 2
      },
      "tags": {
        "Environment": "production",
        "Project": "web-assets"
      },
      "metrics": {
        "requestCount24h": 15420,
        "downloadBytes24h": 2147483648,
        "uploadBytes24h": 524288000
      }
    }
  }
}
```

### 2.4 Update Bucket Settings

**Endpoint**: `PUT /api/v1/buckets/{bucketName}/settings`

**Description**: Update bucket configuration

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "versioning": true,
  "encryption": {
    "type": "aws:kms",
    "keyId": "arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012"
  },
  "tags": {
    "Environment": "production",
    "Project": "web-assets",
    "Owner": "team-backend"
  }
}
```

### 2.5 Delete Bucket

**Endpoint**: `DELETE /api/v1/buckets/{bucketName}`

**Description**: Delete an empty S3 bucket

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters**:
- `force` (optional): Force delete non-empty bucket (default: false)

**Response**:
```json
{
  "success": true,
  "message": "Bucket 'my-bucket-1' has been deleted successfully"
}
```

---

## 3. Object Operations

### 3.1 List Objects

**Endpoint**: `GET /api/v1/buckets/{bucketName}/objects`

**Description**: Get list of objects in a bucket

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters**:
- `prefix` (optional): Object key prefix filter
- `delimiter` (optional): Delimiter for grouping (default: "/")
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 1000)
- `search` (optional): Search object keys
- `sortBy` (optional): Sort field (name, size, modified)
- `sortOrder` (optional): Sort order (asc, desc)

**Response**:
```json
{
  "success": true,
  "data": {
    "objects": [
      {
        "key": "documents/report.pdf",
        "size": 2048576,
        "lastModified": "2025-08-11T14:22:00Z",
        "etag": "\"9bb58f26192e4ba00f01e2e7b136bbd8\"",
        "contentType": "application/pdf",
        "storageClass": "STANDARD",
        "isFolder": false,
        "versionId": "null",
        "metadata": {
          "uploaded-by": "john.doe",
          "project": "quarterly-report"
        }
      }
    ],
    "folders": [
      {
        "key": "images/",
        "objectCount": 145
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1523,
      "totalPages": 31
    }
  }
}
```

### 3.2 Upload Object

**Endpoint**: `POST /api/v1/buckets/{bucketName}/objects`

**Description**: Upload a file to S3 bucket

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

**Form Data**:
- `file`: File to upload
- `key`: Object key (path)
- `contentType` (optional): MIME type
- `metadata` (optional): JSON object with custom metadata
- `tags` (optional): JSON object with tags
- `storageClass` (optional): Storage class (STANDARD, REDUCED_REDUNDANCY, etc.)

**Response**:
```json
{
  "success": true,
  "data": {
    "object": {
      "key": "documents/new-report.pdf",
      "size": 1048576,
      "etag": "\"5d41402abc4b2a76b9719d911017c592\"",
      "location": "https://my-bucket.s3.us-west-2.amazonaws.com/documents/new-report.pdf",
      "versionId": "3/L4kqtJlcpXroDTDmJ+rmSpXd3dIbrHY+MTRCxf3vjVBH40Nr8X8gdRQBpUMLUo"
    }
  }
}
```

### 3.3 Multipart Upload Initialization

**Endpoint**: `POST /api/v1/buckets/{bucketName}/objects/{objectKey}/multipart`

**Description**: Initialize multipart upload for large files

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "contentType": "video/mp4",
  "metadata": {
    "uploaded-by": "john.doe",
    "description": "Training video"
  },
  "tags": {
    "category": "training",
    "department": "hr"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "uploadId": "VXBsb2FkIElEIGZvciA2aWWpbmcncyBteS1tb3ZpZS5tMnRzIHVwbG9hZA",
    "key": "videos/training-video.mp4",
    "bucket": "my-bucket"
  }
}
```

### 3.4 Upload Part

**Endpoint**: `PUT /api/v1/buckets/{bucketName}/objects/{objectKey}/multipart/{uploadId}/parts/{partNumber}`

**Description**: Upload a part of multipart upload

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/octet-stream
Content-Length: 5242880
```

**Body**: Binary data (part content)

**Response**:
```json
{
  "success": true,
  "data": {
    "etag": "\"7d865e959b2466f8e91c55c8ad0f6bb5\"",
    "partNumber": 1
  }
}
```

### 3.5 Complete Multipart Upload

**Endpoint**: `POST /api/v1/buckets/{bucketName}/objects/{objectKey}/multipart/{uploadId}/complete`

**Description**: Complete multipart upload

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "parts": [
    {
      "partNumber": 1,
      "etag": "\"7d865e959b2466f8e91c55c8ad0f6bb5\""
    },
    {
      "partNumber": 2,
      "etag": "\"2d865e959b2466f8e91c55c8ad0f6cc6\""
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "object": {
      "key": "videos/training-video.mp4",
      "size": 104857600,
      "etag": "\"3858f62230ac3c915f300c664312c11f-9\"",
      "location": "https://my-bucket.s3.us-west-2.amazonaws.com/videos/training-video.mp4",
      "versionId": "43jfkodU8493jnFJD9fjj3HHNVwqQWRT"
    }
  }
}
```

### 3.6 Get Object Details

**Endpoint**: `GET /api/v1/buckets/{bucketName}/objects/{objectKey}`

**Description**: Get detailed information about an object

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
{
  "success": true,
  "data": {
    "object": {
      "key": "documents/report.pdf",
      "size": 2048576,
      "lastModified": "2025-08-11T14:22:00Z",
      "etag": "\"9bb58f26192e4ba00f01e2e7b136bbd8\"",
      "contentType": "application/pdf",
      "storageClass": "STANDARD",
      "versionId": "null",
      "metadata": {
        "uploaded-by": "john.doe",
        "project": "quarterly-report"
      },
      "tags": {
        "category": "reports",
        "quarter": "q3-2025"
      },
      "acl": {
        "owner": "john.doe",
        "grants": [
          {
            "grantee": "john.doe",
            "permission": "FULL_CONTROL"
          }
        ]
      },
      "downloadUrl": "https://my-bucket.s3.us-west-2.amazonaws.com/documents/report.pdf?X-Amz-Algorithm=...",
      "expiresAt": "2025-08-11T16:22:00Z"
    }
  }
}
```

### 3.7 Download Object

**Endpoint**: `GET /api/v1/buckets/{bucketName}/objects/{objectKey}/download`

**Description**: Download an object from S3

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters**:
- `versionId` (optional): Specific version to download
- `responseContentType` (optional): Override content-type header
- `responseContentDisposition` (optional): Override content-disposition header

**Response**: Binary file content with appropriate headers

### 3.8 Copy Object

**Endpoint**: `POST /api/v1/buckets/{bucketName}/objects/{objectKey}/copy`

**Description**: Copy object within or between buckets

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "destinationBucket": "destination-bucket",
  "destinationKey": "documents/copied-report.pdf",
  "preserveMetadata": true,
  "metadata": {
    "copied-by": "john.doe",
    "copy-date": "2025-08-11"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sourceObject": {
      "bucket": "my-bucket",
      "key": "documents/report.pdf"
    },
    "destinationObject": {
      "bucket": "destination-bucket",
      "key": "documents/copied-report.pdf",
      "etag": "\"9bb58f26192e4ba00f01e2e7b136bbd8\"",
      "versionId": "null"
    }
  }
}
```

### 3.9 Move Object

**Endpoint**: `POST /api/v1/buckets/{bucketName}/objects/{objectKey}/move`

**Description**: Move object within or between buckets

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "destinationBucket": "destination-bucket",
  "destinationKey": "documents/moved-report.pdf"
}
```

### 3.10 Delete Object

**Endpoint**: `DELETE /api/v1/buckets/{bucketName}/objects/{objectKey}`

**Description**: Delete an object from S3

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters**:
- `versionId` (optional): Specific version to delete

**Response**:
```json
{
  "success": true,
  "message": "Object 'documents/report.pdf' has been deleted successfully"
}
```

### 3.11 Bulk Delete Objects

**Endpoint**: `DELETE /api/v1/buckets/{bucketName}/objects`

**Description**: Delete multiple objects at once

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "objects": [
    {
      "key": "documents/old-report-1.pdf"
    },
    {
      "key": "documents/old-report-2.pdf",
      "versionId": "3/L4kqtJlcpXroDTDm"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "deleted": [
      {
        "key": "documents/old-report-1.pdf",
        "versionId": "null"
      },
      {
        "key": "documents/old-report-2.pdf",
        "versionId": "3/L4kqtJlcpXroDTDm"
      }
    ],
    "errors": []
  }
}
```

### 3.12 Change Object Storage Class

**Endpoint**: `PUT /api/v1/buckets/{bucketName}/objects/{objectKey}/storage-class`

**Description**: Change the storage class of a specific S3 object with comprehensive validation

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "storageClass": "STANDARD_IA"
}
```

**Supported Storage Classes**:
- `STANDARD` - General purpose
- `STANDARD_IA` - Infrequent access
- `ONEZONE_IA` - Single AZ infrequent access
- `REDUCED_REDUNDANCY` - Legacy reduced redundancy
- `INTELLIGENT_TIERING` - Automatic cost optimization
- `GLACIER` - Long-term archive
- `GLACIER_IR` - Instant retrieval archive
- `DEEP_ARCHIVE` - Lowest cost archive

**Features**:
- **Storage Class Transition Validation**: Validates transitions according to AWS rules
- **Current State Check**: Retrieves current storage class before attempting changes
- **Restore State Detection**: Blocks transitions for archived objects that need restoration
- **Detailed Error Messages**: Provides specific guidance for blocked transitions

**Response (Success)**:
```json
{
  "success": true,
  "message": "Storage class updated to STANDARD_IA",
  "data": {
    "key": "documents/report.pdf",
    "previousClass": "STANDARD",
    "newClass": "STANDARD_IA",
    "timestamp": "2025-08-11T15:30:00Z"
  }
}
```

**Response (Validation Error)**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STORAGE_CLASS_TRANSITION",
    "message": "Objects in DEEP_ARCHIVE storage class must be restored before changing to STANDARD. Please restore the object first, then change its storage class.",
    "details": {
      "currentClass": "DEEP_ARCHIVE",
      "requestedClass": "STANDARD",
      "requiresRestore": true,
      "key": "documents/archived-report.pdf"
    },
    "timestamp": "2025-08-11T15:30:00Z"
  }
}
```

### 3.13 Bulk Change Storage Class

**Endpoint**: `PUT /api/v1/buckets/{bucketName}/objects/bulk-storage-class`

**Description**: Change the storage class of multiple objects in a directory with individual file validation

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "prefix": "documents/",
  "storageClass": "STANDARD_IA"
}
```

**Features**:
- **Per-File Validation**: Each file is validated individually before processing
- **Concurrency Control**: Processes files in batches to avoid overwhelming AWS API
- **Detailed Results**: Provides comprehensive breakdown of operation results
- **Skip Invalid Transitions**: Continues processing other files when some are blocked
- **Restore Detection**: Identifies archived objects that need restoration

**Response**:
```json
{
  "success": true,
  "message": "Bulk storage class update completed",
  "data": {
    "summary": {
      "total": 20,
      "successful": 15,
      "blocked": 3,
      "skipped": 1,
      "errors": 1
    },
    "details": [
      {
        "key": "documents/file1.pdf",
        "status": "success",
        "previousClass": "STANDARD",
        "newClass": "STANDARD_IA"
      },
      {
        "key": "documents/archived.pdf",
        "status": "blocked",
        "currentClass": "DEEP_ARCHIVE",
        "reason": "Objects in DEEP_ARCHIVE storage class must be restored before changing to STANDARD"
      },
      {
        "key": "documents/already-ia.pdf",
        "status": "skipped",
        "reason": "Object already in target storage class"
      }
    ]
  }
}
```

**Status Types**:
- **success**: Storage class changed successfully
- **blocked**: Transition not allowed due to AWS rules
- **skipped**: File already in target storage class
- **error**: Unexpected error occurred during processing

## Storage Class Validation Rules

The API implements comprehensive AWS storage class transition validation to prevent invalid operations and provide clear guidance.

### Transition Matrix

| From \ To | STANDARD | STANDARD_IA | GLACIER | DEEP_ARCHIVE |
|-----------|----------|-------------|---------|--------------|
| STANDARD | ✅ | ✅ | ✅ | ✅ |
| STANDARD_IA | ✅ | ✅ | ✅ | ✅ |
| GLACIER | 🔄 Restore First | 🔄 Restore First | ✅ | ✅ |
| DEEP_ARCHIVE | 🔄 Restore First | 🔄 Restore First | 🔄 Restore First | ✅ |

### Legend
- ✅ **Allowed**: Direct transition supported
- 🔄 **Restore First**: Object must be restored before transition

### Restore Process
For archived objects (GLACIER, DEEP_ARCHIVE):
1. Initiate restore operation through AWS console or CLI
2. Wait for restore completion (minutes to hours depending on retrieval tier)
3. Change storage class while object is in restored state
4. AWS will automatically re-archive after restore expires

### Common Validation Scenarios
- **DEEP_ARCHIVE → Any other class**: Requires restore operation first
- **GLACIER → STANDARD/STANDARD_IA**: Requires restore operation first
- **Any → GLACIER/DEEP_ARCHIVE**: Always allowed (archival)
- **STANDARD ↔ STANDARD_IA**: Always allowed (frequent access classes)

---

## 4. User Management

### 4.1 Get Current User

**Endpoint**: `GET /api/v1/user/profile`

**Description**: Get current user information

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "role": "developer",
      "permissions": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "lastLogin": "2025-08-11T09:15:00Z",
      "accountInfo": {
        "awsAccountId": "123456789012",
        "region": "us-west-2",
        "authType": "aws-sso"
      }
    }
  }
}
```

### 4.2 Update User Profile

**Endpoint**: `PUT /api/v1/user/profile`

**Description**: Update user profile information

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "John Smith",
  "preferences": {
    "theme": "dark",
    "defaultRegion": "us-west-2",
    "itemsPerPage": 50
  }
}
```

---

## 5. System Operations

### 5.1 Health Check

**Endpoint**: `GET /api/v1/health`

**Description**: Check system health status

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-08-11T15:30:00Z",
    "version": "1.0.0",
    "services": {
      "database": {
        "status": "healthy",
        "responseTime": 12
      },
      "cache": {
        "status": "healthy",
        "responseTime": 3
      },
      "aws": {
        "status": "healthy",
        "responseTime": 45
      }
    },
    "metrics": {
      "uptime": 86400,
      "requestCount24h": 15420,
      "errorRate24h": 0.02
    }
  }
}
```

### 5.2 Get System Metrics

**Endpoint**: `GET /api/v1/metrics`

**Description**: Get system performance metrics

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters**:
- `timeRange` (optional): Time range (1h, 24h, 7d, 30d)
- `granularity` (optional): Data granularity (1m, 5m, 1h, 1d)

**Response**:
```json
{
  "success": true,
  "data": {
    "timeRange": "24h",
    "granularity": "1h",
    "metrics": {
      "requests": {
        "total": 15420,
        "success": 15145,
        "errors": 275,
        "avgResponseTime": 245
      },
      "storage": {
        "totalBuckets": 45,
        "totalObjects": 125340,
        "totalSize": 536870912000
      },
      "users": {
        "activeUsers24h": 23,
        "totalSessions": 67
      }
    },
    "timeSeries": [
      {
        "timestamp": "2025-08-11T14:00:00Z",
        "requests": 642,
        "errors": 12,
        "avgResponseTime": 234
      }
    ]
  }
}
```

---

## 6. Error Handling

### 6.1 Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "BUCKET_NOT_FOUND",
    "message": "The specified bucket does not exist",
    "details": {
      "bucketName": "non-existent-bucket",
      "region": "us-west-2"
    },
    "timestamp": "2025-08-11T15:30:00Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### 6.2 Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Invalid authentication credentials |
| `ACCESS_DENIED` | 403 | Insufficient permissions |
| `BUCKET_NOT_FOUND` | 404 | Bucket does not exist |
| `OBJECT_NOT_FOUND` | 404 | Object does not exist |
| `BUCKET_ALREADY_EXISTS` | 409 | Bucket name already taken |
| `INVALID_BUCKET_NAME` | 400 | Invalid bucket name format |
| `INVALID_OBJECT_KEY` | 400 | Invalid object key format |
| `FILE_TOO_LARGE` | 413 | File exceeds maximum size limit |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### 6.3 Validation Errors

For input validation errors:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": [
        {
          "field": "bucketName",
          "message": "Bucket name must be between 3 and 63 characters",
          "value": "ab"
        }
      ]
    },
    "timestamp": "2025-08-11T15:30:00Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## 7. Rate Limiting

### 7.1 Rate Limit Headers

All responses include rate limiting information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1628779800
X-RateLimit-Retry-After: 60
```

### 7.2 Rate Limits by Endpoint

| Endpoint Category | Limit | Window |
|-------------------|-------|---------|
| Authentication | 10 requests | 1 minute |
| Bucket Operations | 100 requests | 1 minute |
| Object List | 100 requests | 1 minute |
| Object Upload | 10 requests | 1 minute |
| Object Download | 50 requests | 1 minute |
| Object Delete | 50 requests | 1 minute |
| General API | 1000 requests | 1 minute |

### 7.3 Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "details": {
      "limit": 100,
      "window": "1 minute",
      "retryAfter": 60
    },
    "timestamp": "2025-08-11T15:30:00Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## Appendices

### Appendix A: Authentication Examples

Example code snippets for different authentication methods in various languages.

### Appendix B: SDK Integration

Information about integrating with the API using popular SDKs.

### Appendix C: Postman Collection

Link to downloadable Postman collection for API testing.

---

**Document Control**
- **Last Modified**: August 11, 2025
- **Version**: 1.0
- **Next Review**: September 11, 2025
- **API Base URL**: `https://api.s3-manager.local`
