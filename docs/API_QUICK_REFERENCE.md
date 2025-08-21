# API Quick Reference Guide

## 🚀 Quick Start

```bash
# Start development server
npm run dev

# Test API endpoints
visit http://localhost:3000/api-test

# View API documentation
open docs/API_ROUTES_DOCUMENTATION.md
```

## 🔑 Authentication

```javascript
import { apiClient } from '@/lib/api-client';

// Login
await apiClient.login({
  authType: 'credentials',
  accessKeyId: 'your-key',
  secretAccessKey: 'your-secret',
  region: 'us-east-1'
});

// Check if logged in
const user = await apiClient.getProfile();

// Logout
await apiClient.logout();
```

## 📦 S3 Operations

```javascript
// List all buckets
const buckets = await apiClient.getBuckets();

// Create new bucket
await apiClient.createBucket('bucket-name', 'us-west-2');

// List objects in bucket
const objects = await apiClient.getObjects('bucket-name', 'prefix/');

// Delete object
await apiClient.deleteObject('bucket-name', 'file.txt');

// Get upload URL
const { uploadUrl } = await apiClient.getUploadUrl('bucket-name', 'new-file.txt');
```

## 🛡️ Error Handling

```javascript
try {
  const buckets = await apiClient.getBuckets();
} catch (error) {
  if (error.status === 401) {
    // User not authenticated
    router.push('/login');
  } else {
    // Show error message
    console.error(error.message);
  }
}
```

## 📋 API Endpoints Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/auth/login` | POST | Login user | No |
| `/api/auth/logout` | POST | Logout user | Yes |
| `/api/user/profile` | GET | Get user info | Yes |
| `/api/s3/buckets` | GET | List buckets | Yes |
| `/api/s3/buckets` | POST | Create bucket | Yes |
| `/api/s3/objects` | GET | List objects | Yes |
| `/api/s3/objects` | DELETE | Delete object | Yes |
| `/api/s3/upload` | POST | Get upload URL | Yes |

## 🔧 Development Tips

1. **Use the API test page** at `/api-test` for quick testing
2. **Check browser cookies** to see JWT token status
3. **Monitor network tab** for API request/response debugging
4. **Use TypeScript** - all API calls are fully typed
5. **Check middleware.ts** for route protection logic

## 📁 Key Files

- `lib/api-client.ts` - Centralized API client
- `lib/auth-context.tsx` - Authentication state management
- `middleware.ts` - Route protection
- `app/api/` - All API route handlers
- `docs/` - Complete documentation

## 🐛 Common Issues

**401 Unauthorized**: Check if user is logged in  
**Validation Error**: Check request data format  
**CORS Error**: Ensure proper origin configuration  
**Cookie Issues**: Verify HTTPS in production  

## 🎯 Next Steps

Ready for AWS S3 integration:
1. Install `@aws-sdk/credential-providers`
2. Replace mock data with real AWS calls
3. Test with actual S3 buckets
