# AWS S3 Storage Class Management - Troubleshooting Guide

## Overview

This document provides comprehensive troubleshooting guidance for AWS S3 storage class management in the AWS Manager application, based on critical learnings from resolving authentication and storage class transition issues.

## Table of Contents

1. [Common Issues and Solutions](#common-issues-and-solutions)
2. [AWS Authentication Issues](#aws-authentication-issues)
3. [Storage Class Transition Rules](#storage-class-transition-rules)
4. [Implementation Details](#implementation-details)
5. [Best Practices](#best-practices)
6. [Testing Guidelines](#testing-guidelines)

## Common Issues and Solutions

### Issue 1: "Resolved credential object is not valid"

**Symptoms:**
- 500 Internal Server Error when changing storage classes
- Console error: "Resolved credential object is not valid"
- Operations fail despite valid AWS credentials being available

**Root Cause:**
Server-side API routes using hardcoded environment variable authentication (`fromEnv()`) while user is authenticated via AWS SSO.

**Solution:**
Update S3 client configuration to use AWS default credential chain instead of forcing environment variables.

**Files Modified:**
- `lib/s3-client.ts` - Updated to support AWS SSO authentication
- `app/api/s3/objects/[bucketName]/[objectKey]/storage-class/route.ts` - Fixed individual file operations
- `app/api/s3/objects/[bucketName]/bulk-storage-class/route.ts` - Fixed bulk operations

### Issue 2: "InvalidObjectState - Operation is not valid for the source object's storage class"

**Symptoms:**
- 403 Forbidden error from AWS
- Error message about invalid operation for storage class
- Specific failure when transitioning from GLACIER/DEEP_ARCHIVE to other classes

**Root Cause:**
AWS has strict rules about storage class transitions. Objects in GLACIER or DEEP_ARCHIVE cannot be directly transitioned to other storage classes without first being restored.

**Solution:**
Implement pre-validation of storage class transitions before attempting the operation.

## AWS Authentication Issues

### Problem: Hardcoded Environment Variables

**Before (Problematic):**
```typescript
// lib/s3-client.ts
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: fromEnv(), // Forces environment variables
});
```

**After (Fixed):**
```typescript
// lib/s3-client.ts
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  // No credentials specified - uses AWS default credential chain
});
```

### AWS Credential Chain Priority

The AWS SDK uses this credential resolution order:
1. **AWS SSO** (if configured)
2. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
3. Shared credentials file (`~/.aws/credentials`)
4. IAM roles (for EC2/ECS/Lambda)

### Solution Implementation

1. **Remove hardcoded `fromEnv()`** from S3 client configuration
2. **Use user-based authentication** in API routes
3. **Let AWS SDK handle credential resolution** automatically

## Storage Class Transition Rules

### AWS Storage Class Hierarchy

```
STANDARD
├── STANDARD_IA
├── ONEZONE_IA
├── INTELLIGENT_TIERING
├── GLACIER_IR (Instant Retrieval)
├── GLACIER (Flexible Retrieval)
└── DEEP_ARCHIVE
```

### Allowed Transitions

| From → To | Status | Requirements |
|-----------|--------|--------------|
| STANDARD → Any | ✅ Allowed | None |
| STANDARD_IA → Any | ✅ Allowed | None |
| ONEZONE_IA → Any | ✅ Allowed | None |
| INTELLIGENT_TIERING → Any | ✅ Allowed | None |
| GLACIER_IR → STANDARD/IA/INTELLIGENT | ✅ Allowed | None |
| GLACIER_IR → GLACIER/DEEP_ARCHIVE | ❌ Blocked | Use lifecycle policies |
| GLACIER → Any other | ❌ Blocked | Must restore first |
| DEEP_ARCHIVE → Any other | ❌ Blocked | Must restore first |

### Validation Logic Implementation

```typescript
function validateStorageClassTransition(currentStorageClass: string, newStorageClass: string): {
  isValid: boolean;
  errorMessage?: string;
  requiresRestore?: boolean;
} {
  const current = currentStorageClass?.toUpperCase() || 'STANDARD';
  const target = newStorageClass?.toUpperCase();

  // Objects in GLACIER or DEEP_ARCHIVE cannot be directly transitioned
  if (current === 'GLACIER' || current === 'DEEP_ARCHIVE') {
    if (target !== current) {
      return {
        isValid: false,
        requiresRestore: true,
        errorMessage: `Objects in ${current} storage class must be restored before changing to ${target}. Please restore the object first, then change its storage class.`
      };
    }
  }

  // Objects in GLACIER_IR can transition to most classes except GLACIER/DEEP_ARCHIVE
  if (current === 'GLACIER_IR') {
    if (target === 'GLACIER' || target === 'DEEP_ARCHIVE') {
      return {
        isValid: false,
        errorMessage: `Cannot transition from ${current} to ${target}. Use lifecycle policies for such transitions.`
      };
    }
  }

  return { isValid: true };
}
```

## Implementation Details

### Individual File Storage Class Change

**API Route:** `PUT /api/s3/objects/[bucketName]/[objectKey]/storage-class`

**Key Features:**
- Pre-validates transition using `HeadObjectCommand`
- Returns detailed error messages for blocked transitions
- Provides guidance for required restore operations

### Bulk Directory Storage Class Change

**API Route:** `POST /api/s3/objects/[bucketName]/bulk-storage-class`

**Key Features:**
- Validates each file individually
- Provides detailed results summary:
  - `successful`: Files successfully transitioned
  - `skipped`: Files already in target storage class
  - `blocked`: Files that require restore or use lifecycle policies
  - `errors`: Files that failed due to other errors

### Error Response Format

```typescript
// Individual file blocked transition
{
  error: "Objects in DEEP_ARCHIVE storage class must be restored before changing to STANDARD. Please restore the object first, then change its storage class.",
  requiresRestore: true,
  currentStorageClass: "DEEP_ARCHIVE",
  requestedStorageClass: "STANDARD"
}

// Bulk operation result
{
  success: true,
  data: {
    message: "Bulk storage class update completed",
    summary: {
      total: 10,
      successful: 5,
      errors: 0,
      skipped: 2,
      blocked: 3
    },
    details: [
      { key: "file1.pdf", status: "success", previousStorageClass: "STANDARD" },
      { key: "archive.zip", status: "blocked", reason: "Objects in DEEP_ARCHIVE...", requiresRestore: true }
    ]
  }
}
```

## Best Practices

### 1. Authentication

- **Use AWS default credential chain** instead of hardcoded environment variables
- **Support multiple authentication methods** (SSO, environment variables, IAM roles)
- **Implement consistent authentication patterns** across all S3 API routes

### 2. Storage Class Management

- **Always validate transitions** before attempting operations
- **Provide clear error messages** explaining why transitions are blocked
- **Guide users toward solutions** (restore operations, lifecycle policies)
- **Batch operations efficiently** with concurrency limits

### 3. Error Handling

- **Distinguish between different error types** (authentication, validation, AWS errors)
- **Provide actionable error messages** instead of raw AWS error codes
- **Log detailed information** for debugging while keeping user messages clear

### 4. User Experience

- **Show validation results immediately** rather than failing silently
- **Provide progress indicators** for bulk operations
- **Explain AWS storage class concepts** in user-friendly terms

## Testing Guidelines

### 1. Authentication Testing

```bash
# Test with AWS SSO
aws sso login --profile your-profile

# Test with environment variables
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret

# Test with shared credentials file
aws configure
```

### 2. Storage Class Transition Testing

Create test objects in different storage classes:

```bash
# Create test objects
aws s3 cp test.txt s3://your-bucket/standard-test.txt
aws s3 cp test.txt s3://your-bucket/ia-test.txt --storage-class STANDARD_IA
aws s3 cp test.txt s3://your-bucket/glacier-test.txt --storage-class GLACIER
aws s3 cp test.txt s3://your-bucket/deep-archive-test.txt --storage-class DEEP_ARCHIVE
```

### 3. Validation Testing Scenarios

| Test Case | Expected Result |
|-----------|----------------|
| STANDARD → GLACIER | ✅ Success |
| STANDARD_IA → DEEP_ARCHIVE | ✅ Success |
| DEEP_ARCHIVE → STANDARD | ❌ Blocked with restore message |
| GLACIER → STANDARD_IA | ❌ Blocked with restore message |
| GLACIER_IR → GLACIER | ❌ Blocked with lifecycle message |

## Troubleshooting Checklist

### When Storage Class Changes Fail:

1. **Check Authentication:**
   - [ ] Verify AWS credentials are properly configured
   - [ ] Test AWS CLI access: `aws s3 ls`
   - [ ] Check browser console for auth-related errors

2. **Verify Storage Class Transition:**
   - [ ] Check current storage class of the object
   - [ ] Verify the transition is allowed per AWS rules
   - [ ] Look for validation error messages in the response

3. **Review API Responses:**
   - [ ] Check HTTP status codes (400 = validation, 401 = auth, 500 = server error)
   - [ ] Review detailed error messages
   - [ ] Check for `requiresRestore` flag in error responses

4. **For GLACIER/DEEP_ARCHIVE Objects:**
   - [ ] Initiate restore operation first
   - [ ] Wait for restore completion (1-5 minutes for GLACIER, 12+ hours for DEEP_ARCHIVE)
   - [ ] Then attempt storage class change

## Related Documentation

- [AWS S3 Storage Classes](https://aws.amazon.com/s3/storage-classes/)
- [AWS SDK Credential Provider Chain](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html)
- [AWS S3 Object Restore](https://docs.aws.amazon.com/AmazonS3/latest/userguide/restoring-objects.html)
