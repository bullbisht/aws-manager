# API Routes Implementation Documentation

## Overview

This document provides comprehensive documentation for the S3 Manager API routes implementation. The API follows REST principles and uses Next.js 15 App Router for server-side endpoints.

## Authentication

All API routes use JWT token authentication with HTTP-only cookies for security.

### Authentication Flow
1. User submits credentials via `/api/auth/login`
2. Server validates credentials and returns JWT token in HTTP-only cookie
3. Subsequent requests automatically include the cookie
4. Middleware validates token on protected routes
5. User can logout via `/api/auth/logout` which clears the cookie

### Security Features
- HTTP-only cookies prevent XSS attacks
- Middleware protection on all sensitive routes
- Input validation using Zod schemas
- Standardized error responses
- CORS configuration for cross-origin requests

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user with AWS credentials or SSO.

**Request Body:**
```json
{
  "authType": "credentials" | "sso",
  "accessKeyId": "string",      // Required for credentials
  "secretAccessKey": "string",  // Required for credentials
  "region": "string",           // Optional, defaults to us-east-1
  "ssoStartUrl": "string",      // Required for SSO
  "ssoRegion": "string"         // Optional for SSO, defaults to us-east-1
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string",
    "authType": "credentials" | "sso",
    "awsRegion": "string"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "string",
  "details": [] // Validation errors if applicable
}
```

#### POST /api/auth/logout
Clear user session and authentication cookie.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /api/user/profile
Get current user profile information.

**Headers Required:**
- Cookie with valid JWT token

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string",
    "authType": "credentials" | "sso",
    "permissions": ["string"]
  }
}
```

### S3 Management Endpoints

#### GET /api/s3/buckets
List all S3 buckets for the authenticated user.

**Headers Required:**
- Cookie with valid JWT token

**Response:**
```json
{
  "success": true,
  "buckets": [
    {
      "Name": "string",
      "CreationDate": "ISO 8601 date",
      "Region": "string",
      "Objects": "number",
      "Size": "string"
    }
  ],
  "total": "number"
}
```

#### POST /api/s3/buckets
Create a new S3 bucket.

**Headers Required:**
- Cookie with valid JWT token
- Content-Type: application/json

**Request Body:**
```json
{
  "bucketName": "string",  // 3-63 chars, lowercase, no spaces
  "region": "string"       // Optional, defaults to us-east-1
}
```

**Response:**
```json
{
  "success": true,
  "bucket": {
    "name": "string",
    "region": "string",
    "createdAt": "ISO 8601 date"
  },
  "message": "Bucket 'bucket-name' created successfully"
}
```

#### GET /api/s3/objects
List objects in a specific S3 bucket.

**Headers Required:**
- Cookie with valid JWT token

**Query Parameters:**
- `bucket` (required): Bucket name
- `prefix` (optional): Object key prefix filter
- `maxKeys` (optional): Maximum objects to return (1-1000, default: 100)

**Example:**
```
GET /api/s3/objects?bucket=my-bucket&prefix=uploads/&maxKeys=50
```

**Response:**
```json
{
  "success": true,
  "objects": [
    {
      "Key": "string",
      "LastModified": "ISO 8601 date",
      "Size": "number",
      "StorageClass": "string",
      "ETag": "string"
    }
  ],
  "bucket": "string",
  "prefix": "string",
  "total": "number",
  "isTruncated": "boolean"
}
```

#### DELETE /api/s3/objects
Delete an object from S3 bucket.

**Headers Required:**
- Cookie with valid JWT token
- Content-Type: application/json

**Request Body:**
```json
{
  "bucket": "string",
  "key": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Object 'file.txt' deleted successfully from bucket 'my-bucket'"
}
```

#### POST /api/s3/upload
Generate presigned URL for file upload.

**Headers Required:**
- Cookie with valid JWT token
- Content-Type: application/json

**Request Body:**
```json
{
  "bucket": "string",
  "key": "string",
  "contentType": "string",    // Optional, MIME type
  "isMultipart": "boolean",   // Optional, default: false
  "expiresIn": "number"       // Optional, seconds (60-3600), default: 3600
}
```

**Response:**
```json
{
  "success": true,
  "uploadUrl": "string",      // Presigned URL for PUT request
  "bucket": "string",
  "key": "string",
  "expiresIn": "number",
  "multipart": "boolean",
  "instructions": {
    "method": "PUT",
    "headers": {
      "Content-Type": "string"
    }
  }
}
```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": {} // Additional error context (optional)
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `500` - Internal Server Error

### Error Types
- **Validation Errors**: Invalid request data (Zod validation)
- **Authentication Errors**: Missing or invalid JWT token
- **Permission Errors**: User lacks required permissions
- **S3 Errors**: AWS S3 service errors
- **Network Errors**: Connection or timeout issues

## Middleware Protection

The application uses Next.js middleware for route protection:

**Protected Routes:**
- All `/api/s3/*` endpoints
- All `/api/user/*` endpoints
- Dashboard pages: `/dashboard`, `/buckets`, `/settings`

**Public Routes:**
- `/api/auth/login`
- Home page: `/`
- Login page: `/login`

**Middleware Behavior:**
- API routes: Return 401 JSON response
- Page routes: Redirect to `/login` with return URL

## Data Validation

All API endpoints use Zod schemas for input validation:

### Login Schema
```typescript
const loginSchema = z.object({
  authType: z.enum(['credentials', 'sso']),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  region: z.string().default('us-east-1'),
  ssoStartUrl: z.string().url().optional(),
  ssoRegion: z.string().optional(),
});
```

### Bucket Creation Schema
```typescript
const createBucketSchema = z.object({
  bucketName: z.string().min(3).max(63).regex(/^[a-z0-9.-]+$/),
  region: z.string().default('us-east-1'),
});
```

### Object Operations Schema
```typescript
const deleteObjectSchema = z.object({
  bucket: z.string(),
  key: z.string(),
});
```

## API Client Integration

The frontend uses a centralized API client (`/lib/api-client.ts`) for type-safe API calls:

```typescript
// Example usage
import { apiClient } from '@/lib/api-client';

// Login
const result = await apiClient.login({
  authType: 'credentials',
  accessKeyId: 'AKIA...',
  secretAccessKey: 'secret...',
  region: 'us-east-1'
});

// Get buckets
const buckets = await apiClient.getBuckets();

// Create bucket
const newBucket = await apiClient.createBucket('my-new-bucket', 'us-west-2');
```

## Testing

### Development Testing
Use the API test page at `/api-test` to test all endpoints interactively.

### Example cURL Commands

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "authType": "credentials",
    "accessKeyId": "test-key",
    "secretAccessKey": "test-secret",
    "region": "us-east-1"
  }' \
  -c cookies.txt
```

**Get Buckets:**
```bash
curl -X GET http://localhost:3000/api/s3/buckets \
  -b cookies.txt
```

**Create Bucket:**
```bash
curl -X POST http://localhost:3000/api/s3/buckets \
  -H "Content-Type: application/json" \
  -d '{
    "bucketName": "my-test-bucket",
    "region": "us-east-1"
  }' \
  -b cookies.txt
```

## Environment Variables

Required environment variables for production:

```bash
# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters-long

# AWS Configuration (optional - can be set via UI)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_DEFAULT_REGION=us-east-1

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Security
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_REQUESTS_PER_MINUTE=100
```

## Security Considerations

1. **JWT Secrets**: Use strong, randomly generated secrets in production
2. **HTTPS Only**: Always use HTTPS in production for cookie security
3. **CORS Configuration**: Restrict origins to your domain
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Input Validation**: All inputs are validated with Zod schemas
6. **Error Handling**: Sensitive information is not exposed in error messages

## Future Enhancements

1. **AWS SSO Integration**: Implement actual AWS SSO authentication
2. **Real S3 Operations**: Replace mock data with AWS SDK calls
3. **Caching**: Add Redis caching for bucket/object listings
4. **Rate Limiting**: Implement request rate limiting
5. **Audit Logging**: Add comprehensive audit trails
6. **Batch Operations**: Support bulk object operations
7. **WebSocket Support**: Real-time updates for large operations
