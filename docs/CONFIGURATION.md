# Configuration Guide
# AWS S3 Manager Web Interface

**Document Version**: 1.0  
**Date**: August 11, 2025  
**Author**: DevOps Team  

---

## Table of Contents

1. [Environment Variables](#1-environment-variables)
2. [Application Configuration](#2-application-configuration)
3. [Database Configuration](#3-database-configuration)
4. [AWS Configuration](#4-aws-configuration)
5. [Security Configuration](#5-security-configuration)
6. [Monitoring Configuration](#6-monitoring-configuration)
7. [Advanced Configuration](#7-advanced-configuration)

---

## 1. Environment Variables

### 1.1 Core Application Settings

```bash
# Application Environment
NODE_ENV=production                    # Environment: development, production, test
PORT=3001                             # Server port
API_PREFIX=/api/v1                    # API route prefix
```

### 1.2 Database Settings

```bash
# PostgreSQL Configuration
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DATABASE_POOL_MIN=2                   # Minimum pool connections
DATABASE_POOL_MAX=10                  # Maximum pool connections
DATABASE_TIMEOUT=30000                # Connection timeout (ms)
DATABASE_SSL=true                     # Enable SSL for production
```

### 1.3 Cache Settings

```bash
# Redis Configuration
REDIS_URL=redis://user:pass@host:6379/0
REDIS_DB=0                           # Redis database number
REDIS_PASSWORD=your_redis_password    # Redis authentication
REDIS_TTL_DEFAULT=300                # Default TTL in seconds
REDIS_TTL_SESSIONS=86400             # Session TTL in seconds
```

### 1.4 AWS Settings

```bash
# AWS Configuration
AWS_REGION=us-west-2                 # Default AWS region
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# AWS SSO Configuration (alternative to credentials)
AWS_SSO_START_URL=https://my-sso-portal.awsapps.com/start
AWS_SSO_REGION=us-west-2
AWS_SSO_ACCOUNT_ID=123456789012
AWS_SSO_ROLE_NAME=S3Manager
```

### 1.5 Security Settings

```bash
# JWT Configuration
JWT_SECRET=your_very_long_and_random_jwt_secret_minimum_32_chars
JWT_EXPIRES_IN=24h                   # Token expiration
JWT_ALGORITHM=HS256                  # Signing algorithm

# Session Configuration
SESSION_SECRET=your_very_long_and_random_session_secret_minimum_32_chars
SESSION_COOKIE_SECURE=true           # HTTPS only cookies
SESSION_COOKIE_MAX_AGE=86400000      # Cookie expiration (ms)

# CORS Configuration
CORS_ORIGIN=https://s3-manager.local # Allowed origins
CORS_CREDENTIALS=true                # Allow credentials
```

### 1.6 Upload Settings

```bash
# File Upload Configuration
MAX_FILE_SIZE=5368709120             # 5GB in bytes
MULTIPART_THRESHOLD=104857600        # 100MB in bytes
ALLOWED_FILE_TYPES=*/*               # Allowed MIME types
UPLOAD_TEMP_DIR=/tmp/uploads         # Temporary upload directory
```

### 1.7 Logging Settings

```bash
# Logging Configuration
LOG_LEVEL=info                       # Levels: error, warn, info, debug
LOG_FORMAT=json                      # Formats: json, simple
LOG_FILE_ENABLED=true                # Enable file logging
LOG_FILE_PATH=./logs/app.log         # Log file path
LOG_ROTATION_SIZE=10M                # Log rotation size
LOG_ROTATION_FILES=5                 # Number of rotated files
```

### 1.8 Rate Limiting Settings

```bash
# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=60000           # Rate limit window (ms)
RATE_LIMIT_MAX_REQUESTS=100          # Max requests per window
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
RATE_LIMIT_SKIP_FAILED_REQUESTS=false
```

### 1.9 Monitoring Settings

```bash
# Monitoring Configuration
PROMETHEUS_ENABLED=true              # Enable Prometheus metrics
METRICS_PORT=9090                    # Metrics endpoint port
HEALTH_CHECK_ENABLED=true            # Enable health checks
PERFORMANCE_MONITORING=true          # Enable performance monitoring
```

---

## 2. Application Configuration

### 2.1 Server Configuration

Create `config/default.json`:

```json
{
  "server": {
    "port": 3001,
    "host": "0.0.0.0",
    "keepAliveTimeout": 5000,
    "headersTimeout": 6000,
    "bodyLimit": "5gb",
    "cors": {
      "origin": ["http://localhost:3000", "https://s3-manager.local"],
      "credentials": true,
      "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      "allowedHeaders": ["Content-Type", "Authorization", "X-Requested-With"]
    },
    "compression": {
      "enabled": true,
      "level": 6,
      "threshold": 1024
    }
  },
  "api": {
    "prefix": "/api/v1",
    "version": "1.0.0",
    "timeout": 30000,
    "documentation": {
      "enabled": true,
      "path": "/api/docs"
    }
  }
}
```

### 2.2 Security Configuration

Create `config/security.json`:

```json
{
  "security": {
    "jwt": {
      "algorithm": "HS256",
      "expiresIn": "24h",
      "issuer": "s3-manager",
      "audience": "s3-manager-users"
    },
    "session": {
      "name": "s3manager_session",
      "resave": false,
      "saveUninitialized": false,
      "cookie": {
        "secure": true,
        "httpOnly": true,
        "maxAge": 86400000,
        "sameSite": "strict"
      }
    },
    "helmet": {
      "contentSecurityPolicy": {
        "enabled": true,
        "directives": {
          "defaultSrc": ["'self'"],
          "styleSrc": ["'self'", "'unsafe-inline'"],
          "scriptSrc": ["'self'"],
          "imgSrc": ["'self'", "data:", "https:"],
          "connectSrc": ["'self'", "wss:", "https:"]
        }
      },
      "hsts": {
        "maxAge": 31536000,
        "includeSubDomains": true,
        "preload": true
      }
    },
    "rateLimit": {
      "windowMs": 60000,
      "max": 100,
      "message": "Too many requests from this IP",
      "standardHeaders": true,
      "legacyHeaders": false
    }
  }
}
```

### 2.3 Upload Configuration

Create `config/upload.json`:

```json
{
  "upload": {
    "maxFileSize": 5368709120,
    "maxFiles": 10,
    "allowedMimeTypes": ["*/*"],
    "deniedMimeTypes": [
      "application/x-executable",
      "application/x-msdownload"
    ],
    "multipart": {
      "threshold": 104857600,
      "partSize": 16777216,
      "queueSize": 4
    },
    "tempDir": "/tmp/uploads",
    "cleanupInterval": 3600000,
    "virusScan": {
      "enabled": false,
      "provider": "clamav"
    }
  }
}
```

---

## 3. Database Configuration

### 3.1 PostgreSQL Configuration

Create `config/database.json`:

```json
{
  "database": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "s3manager",
    "username": "s3manager",
    "password": "s3manager_password",
    "ssl": {
      "enabled": true,
      "rejectUnauthorized": false
    },
    "pool": {
      "min": 2,
      "max": 10,
      "acquireTimeoutMillis": 30000,
      "idleTimeoutMillis": 30000,
      "createTimeoutMillis": 30000,
      "destroyTimeoutMillis": 5000,
      "reapIntervalMillis": 1000,
      "createRetryIntervalMillis": 200
    },
    "migrations": {
      "directory": "./prisma/migrations",
      "tableName": "_prisma_migrations"
    },
    "logging": {
      "enabled": true,
      "level": "info"
    }
  }
}
```

### 3.2 Prisma Configuration

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String         @id @default(uuid())
  email             String         @unique
  name              String
  role              UserRole       @default(READ_ONLY)
  awsAccessKeyId    String?        @map("aws_access_key_id")
  awsRegion         String?        @map("aws_region")
  lastLogin         DateTime?      @map("last_login")
  createdAt         DateTime       @default(now()) @map("created_at")
  updatedAt         DateTime       @updatedAt @map("updated_at")
  
  sessions          UserSession[]
  bucketMetadata    BucketMetadata[]
  objectMetadata    ObjectMetadata[]
  auditLogs         AuditLog[]

  @@map("users")
}

model UserSession {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  tokenHash String   @map("token_hash")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_sessions")
}

model BucketMetadata {
  id            String   @id @default(uuid())
  bucketName    String   @unique @map("bucket_name")
  region        String
  createdBy     String   @map("created_by")
  lastAccessed  DateTime? @map("last_accessed")
  objectCount   BigInt   @default(0) @map("object_count")
  totalSize     BigInt   @default(0) @map("total_size")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  user          User     @relation(fields: [createdBy], references: [id])
  objects       ObjectMetadata[]

  @@map("bucket_metadata")
}

model ObjectMetadata {
  id           String   @id @default(uuid())
  bucketName   String   @map("bucket_name")
  objectKey    String   @map("object_key")
  size         BigInt
  contentType  String?  @map("content_type")
  etag         String?
  lastModified DateTime? @map("last_modified")
  createdBy    String   @map("created_by")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  user         User     @relation(fields: [createdBy], references: [id])
  bucket       BucketMetadata @relation(fields: [bucketName], references: [bucketName])

  @@unique([bucketName, objectKey])
  @@map("object_metadata")
}

model AuditLog {
  id        String      @id @default(uuid())
  userId    String      @map("user_id")
  action    AuditAction
  resource  String
  details   Json?
  ipAddress String?     @map("ip_address")
  userAgent String?     @map("user_agent")
  createdAt DateTime    @default(now()) @map("created_at")
  
  user      User        @relation(fields: [userId], references: [id])

  @@map("audit_logs")
}

enum UserRole {
  ADMIN
  DEVELOPER
  READ_ONLY
  AUDITOR
}

enum AuditAction {
  CREATE_BUCKET
  DELETE_BUCKET
  UPLOAD_OBJECT
  DOWNLOAD_OBJECT
  DELETE_OBJECT
  COPY_OBJECT
  MOVE_OBJECT
  LOGIN
  LOGOUT
  ACCESS_DENIED
}
```

---

## 4. AWS Configuration

### 4.1 Credentials Configuration

#### Option 1: Environment Variables
```bash
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
export AWS_DEFAULT_REGION=us-west-2
```

#### Option 2: AWS CLI Profile
```bash
aws configure --profile s3manager
# AWS Access Key ID: AKIAIOSFODNN7EXAMPLE
# AWS Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
# Default region name: us-west-2
# Default output format: json

export AWS_PROFILE=s3manager
```

#### Option 3: AWS SSO
```bash
aws sso configure
# SSO start URL: https://my-sso-portal.awsapps.com/start
# SSO region: us-west-2
# Account ID: 123456789012
# Role name: S3Manager

aws sso login --profile s3manager
export AWS_PROFILE=s3manager
```

### 4.2 IAM Policy for S3 Manager

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ManagerBucketOperations",
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets",
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketVersioning",
        "s3:PutBucketVersioning",
        "s3:GetBucketPolicy",
        "s3:PutBucketPolicy",
        "s3:DeleteBucketPolicy",
        "s3:GetBucketAcl",
        "s3:PutBucketAcl",
        "s3:GetBucketCors",
        "s3:PutBucketCors",
        "s3:DeleteBucketCors",
        "s3:GetBucketLifecycleConfiguration",
        "s3:PutBucketLifecycleConfiguration",
        "s3:DeleteBucketLifecycle"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3ManagerObjectOperations",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:GetObjectAcl",
        "s3:GetObjectVersionAcl",
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:DeleteObject",
        "s3:DeleteObjectVersion",
        "s3:RestoreObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts",
        "s3:ListBucketMultipartUploads"
      ],
      "Resource": [
        "arn:aws:s3:::*",
        "arn:aws:s3:::*/*"
      ]
    }
  ]
}
```

### 4.3 AWS SDK Configuration

Create `config/aws.json`:

```json
{
  "aws": {
    "region": "us-west-2",
    "apiVersion": "2006-03-01",
    "maxRetries": 3,
    "retryDelayOptions": {
      "customBackoff": "exponential"
    },
    "httpOptions": {
      "timeout": 30000,
      "connectTimeout": 5000
    },
    "s3": {
      "signatureVersion": "v4",
      "s3ForcePathStyle": false,
      "s3BucketEndpoint": false,
      "s3DisableBodySigning": false,
      "computeChecksums": true,
      "s3UsEast1RegionalEndpoint": "regional"
    },
    "sso": {
      "startUrl": "https://my-sso-portal.awsapps.com/start",
      "region": "us-west-2",
      "accountId": "123456789012",
      "roleName": "S3Manager"
    }
  }
}
```

---

## 5. Security Configuration

### 5.1 HTTPS Configuration

#### Nginx SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name s3-manager.local;

    ssl_certificate /etc/ssl/certs/s3-manager.crt;
    ssl_certificate_key /etc/ssl/private/s3-manager.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5.2 Authentication Configuration

Create `config/auth.json`:

```json
{
  "authentication": {
    "strategies": ["aws-credentials", "aws-sso"],
    "defaultStrategy": "aws-credentials",
    "sessionTimeout": 86400000,
    "refreshTokenThreshold": 300000,
    "maxLoginAttempts": 5,
    "lockoutDuration": 900000,
    "passwordPolicy": {
      "minLength": 12,
      "requireUppercase": true,
      "requireLowercase": true,
      "requireNumbers": true,
      "requireSpecialChars": true
    }
  },
  "authorization": {
    "rbac": {
      "enabled": true,
      "roles": {
        "admin": {
          "permissions": ["*"]
        },
        "developer": {
          "permissions": [
            "s3:ListBucket",
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject"
          ]
        },
        "read_only": {
          "permissions": [
            "s3:ListBucket",
            "s3:GetObject"
          ]
        }
      }
    }
  }
}
```

---

## 6. Monitoring Configuration

### 6.1 Prometheus Configuration

Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 's3-manager-backend'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/api/v1/metrics'
    scrape_interval: 30s

  - job_name: 's3-manager-frontend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### 6.2 Grafana Configuration

Create `monitoring/grafana/provisioning/datasources/prometheus.yml`:

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
```

---

## 7. Advanced Configuration

### 7.1 Performance Tuning

#### Node.js Performance
```bash
# Environment variables for performance
NODE_OPTIONS="--max-old-space-size=4096 --max-http-header-size=32768"
UV_THREADPOOL_SIZE=16
```

#### Database Performance
```sql
-- PostgreSQL optimization
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
SELECT pg_reload_conf();
```

### 7.2 High Availability Configuration

#### Load Balancer Configuration
```yaml
apiVersion: v1
kind: Service
metadata:
  name: s3-manager-lb
spec:
  type: LoadBalancer
  selector:
    app: s3-manager
  ports:
  - port: 80
    targetPort: 3000
  sessionAffinity: ClientIP
```

#### Database Replication
```yaml
# Master-Slave PostgreSQL setup
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-cluster
spec:
  instances: 3
  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "256MB"
      effective_cache_size: "1GB"
```

---

**Document Control**
- **Last Modified**: August 11, 2025
- **Version**: 1.0
- **Next Review**: September 11, 2025
- **Configuration Support**: config@yourcompany.com
