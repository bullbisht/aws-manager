# Installation Guide
# AWS S3 Manager Web Interface

**Document Version**: 1.0  
**Date**: August 11, 2025  
**Author**: DevOps Team  

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development Setup](#2-local-development-setup)
3. [Docker Setup](#3-docker-setup)
4. [Kubernetes Deployment](#4-kubernetes-deployment)
5. [Configuration](#5-configuration)
6. [Verification](#6-verification)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites

### 1.1 System Requirements

#### Development Environment
- **Operating System**: macOS 10.15+, Ubuntu 18.04+, Windows 10+
- **Memory**: 8GB RAM (minimum), 16GB RAM (recommended)
- **Storage**: 10GB free space
- **Network**: Internet connection for dependencies

#### Production Environment
- **Kubernetes Cluster**: Version 1.20+
- **CPU**: 4 cores (minimum), 8 cores (recommended)
- **Memory**: 8GB RAM (minimum), 16GB RAM (recommended)
- **Storage**: 20GB persistent storage

### 1.2 Software Dependencies

#### Required Tools
```bash
# Node.js (LTS version)
node --version  # v18.17.0 or higher
npm --version   # v9.6.7 or higher

# Docker
docker --version  # 20.10.0 or higher
docker-compose --version  # 2.0.0 or higher

# Kubernetes tools
kubectl version --client  # v1.20.0 or higher
helm version             # v3.8.0 or higher
```

#### Optional Tools
```bash
# Development tools
git --version
code --version  # VS Code (recommended)
curl --version

# Monitoring tools
prometheus --version
grafana-server --version
```

### 1.3 AWS Prerequisites

#### AWS Account Setup
- AWS account with appropriate permissions
- AWS CLI configured or AWS SSO access
- S3 service access permissions

#### Required AWS Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketVersioning",
        "s3:GetBucketPolicy",
        "s3:GetBucketAcl",
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:GetObjectAcl",
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:DeleteObject",
        "s3:DeleteObjectVersion",
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:PutBucketVersioning",
        "s3:PutBucketPolicy",
        "s3:PutBucketAcl"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 2. Local Development Setup

### 2.1 Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/s3-manager.git
cd s3-manager
```

### 2.2 Backend Setup

```bash
# Install backend dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit configuration file
nano .env
```

**Backend Environment Variables** (`.env`):
```bash
# Application Configuration
NODE_ENV=development
PORT=3001
API_PREFIX=/api/v1

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/s3manager
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Cache Configuration
REDIS_URL=redis://localhost:6379
REDIS_DB=0
REDIS_PASSWORD=

# AWS Configuration
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Security Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
SESSION_SECRET=your_session_secret_key

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 2.3 Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Copy frontend environment template
cp .env.example .env

# Edit frontend configuration
nano .env
```

**Frontend Environment Variables** (`frontend/.env`):
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:3001
REACT_APP_API_TIMEOUT=30000

# UI Configuration
REACT_APP_THEME=light
REACT_APP_ITEMS_PER_PAGE=50

# Feature Flags
REACT_APP_ENABLE_SSO=true
REACT_APP_ENABLE_ANALYTICS=true
```

### 2.4 Database Setup

#### PostgreSQL Installation
```bash
# macOS (using Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Ubuntu
sudo apt update
sudo apt install postgresql-14 postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE s3manager;
CREATE USER s3manager_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE s3manager TO s3manager_user;
\q
```

#### Database Migration
```bash
# Install Prisma CLI globally (from backend directory)
npm install -g prisma

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed database (optional)
npx prisma db seed
```

### 2.5 Redis Setup

#### Redis Installation
```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Ubuntu
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### 2.6 Start Development Servers

```bash
# Terminal 1: Start backend server (from project root)
npm run dev

# Terminal 2: Start frontend development server
cd frontend && npm start

# Or use Docker for services only
docker-compose up -d postgres redis
```

**Development URLs**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/v1
- API Documentation: http://localhost:3001/api/docs

### 2.7 Verify Installation

```bash
# Check backend health
curl http://localhost:3001/api/health

# Check frontend
curl http://localhost:3000

# Test API endpoint
curl http://localhost:3001/api/v1/buckets
```

---

## 3. Docker Setup

### 3.1 Docker Compose Development

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3.2 Docker Compose Configuration

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:3001
    volumes:
      - ./src:/app/src
      - ./public:/app/public
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://s3manager:password@postgres:5432/s3manager
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./src:/app/src
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=s3manager
      - POSTGRES_USER=s3manager
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  redis_data:
```

### 3.3 Production Docker Build

```bash
# Build production images
docker build -f Dockerfile.frontend -t s3-manager-frontend:latest .
docker build -f Dockerfile.backend -t s3-manager-backend:latest .

# Tag for registry
docker tag s3-manager-frontend:latest your-registry/s3-manager-frontend:v1.0.0
docker tag s3-manager-backend:latest your-registry/s3-manager-backend:v1.0.0

# Push to registry
docker push your-registry/s3-manager-frontend:v1.0.0
docker push your-registry/s3-manager-backend:v1.0.0
```

---

## 4. Kubernetes Deployment

### 4.1 Prerequisites

```bash
# Verify Kubernetes cluster access
kubectl cluster-info

# Create namespace
kubectl create namespace s3-manager

# Set default namespace
kubectl config set-context --current --namespace=s3-manager
```

### 4.2 Using Kubectl

```bash
# Apply all Kubernetes manifests
kubectl apply -f k8s/

# Or apply individual components
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml

# Verify deployment
kubectl get pods
kubectl get services
kubectl get ingress
```

### 4.3 Using Helm

```bash
# Install Helm chart
helm install s3-manager ./helm/s3-manager

# Install with custom values
helm install s3-manager ./helm/s3-manager -f values.production.yaml

# Upgrade deployment
helm upgrade s3-manager ./helm/s3-manager

# Uninstall
helm uninstall s3-manager
```

### 4.4 Helm Values Configuration

**values.yaml**:
```yaml
# Global configuration
global:
  imageRegistry: "your-registry.com"
  imageTag: "v1.0.0"
  namespace: "s3-manager"

# Frontend configuration
frontend:
  replicaCount: 3
  image:
    repository: s3-manager-frontend
    tag: "v1.0.0"
  service:
    type: ClusterIP
    port: 80
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi

# Backend configuration
backend:
  replicaCount: 3
  image:
    repository: s3-manager-backend
    tag: "v1.0.0"
  service:
    type: ClusterIP
    port: 3001
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 1Gi
  env:
    NODE_ENV: production
    LOG_LEVEL: info

# Database configuration
postgresql:
  enabled: true
  auth:
    database: s3manager
    username: s3manager
  primary:
    persistence:
      enabled: true
      size: 10Gi

# Redis configuration
redis:
  enabled: true
  auth:
    enabled: false
  master:
    persistence:
      enabled: true
      size: 1Gi

# Ingress configuration
ingress:
  enabled: true
  className: nginx
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: s3-manager.local
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: s3-manager-tls
      hosts:
        - s3-manager.local

# Monitoring
monitoring:
  enabled: true
  serviceMonitor:
    enabled: true
```

---

## 5. Configuration

### 5.1 Application Configuration

#### Backend Configuration
**config/default.json**:
```json
{
  "server": {
    "port": 3001,
    "host": "0.0.0.0",
    "cors": {
      "origin": ["http://localhost:3000"],
      "credentials": true
    }
  },
  "database": {
    "type": "postgresql",
    "pool": {
      "min": 2,
      "max": 10,
      "acquireTimeoutMillis": 30000,
      "idleTimeoutMillis": 30000
    }
  },
  "cache": {
    "type": "redis",
    "ttl": {
      "default": 300,
      "sessions": 86400,
      "metadata": 600
    }
  },
  "aws": {
    "defaultRegion": "us-west-2",
    "maxRetries": 3,
    "timeout": 30000
  },
  "security": {
    "jwt": {
      "algorithm": "HS256",
      "expiresIn": "24h"
    },
    "rateLimit": {
      "windowMs": 60000,
      "max": 100
    }
  },
  "upload": {
    "maxFileSize": "5GB",
    "multipartThreshold": "100MB",
    "allowedTypes": ["*/*"],
    "virusScan": false
  },
  "logging": {
    "level": "info",
    "format": "json",
    "destinations": ["console", "file"]
  }
}
```

#### Frontend Configuration
**src/config/config.ts**:
```typescript
export const config = {
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    timeout: 30000,
    retryAttempts: 3
  },
  auth: {
    tokenKey: 's3manager_token',
    refreshThreshold: 300000, // 5 minutes
    ssoProviders: ['aws']
  },
  ui: {
    theme: 'light',
    itemsPerPage: 50,
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
    supportedFormats: ['*/*']
  },
  features: {
    multipartUpload: true,
    bulkOperations: true,
    advancedSearch: true,
    realTimeUpdates: true
  }
};
```

### 5.2 AWS Configuration

#### AWS Credentials Setup
```bash
# Option 1: AWS CLI configuration
aws configure
# AWS Access Key ID: AKIAIOSFODNN7EXAMPLE
# AWS Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
# Default region name: us-west-2
# Default output format: json

# Option 2: Environment variables
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
export AWS_DEFAULT_REGION=us-west-2

# Option 3: AWS SSO
aws sso configure
aws sso login --profile my-profile
```

#### Kubernetes AWS Credentials
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: aws-credentials
type: Opaque
stringData:
  AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE"
  AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  AWS_DEFAULT_REGION: "us-west-2"
```

---

## 6. Verification

### 6.1 Health Checks

```bash
# Application health
curl http://localhost:3001/api/v1/health

# Database connection
kubectl exec -it deployment/postgres -- psql -U s3manager -d s3manager -c "SELECT 1;"

# Redis connection
kubectl exec -it deployment/redis -- redis-cli ping

# AWS connectivity
kubectl logs deployment/backend | grep "AWS connection successful"
```

### 6.2 Functional Testing

```bash
# Run application tests
npm test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run security tests
npm run test:security
```

### 6.3 Performance Testing

```bash
# Load testing with k6
k6 run tests/load/api-load-test.js

# Frontend performance testing
npm run test:lighthouse

# Database performance
kubectl exec -it deployment/postgres -- pg_bench -c 10 -j 2 -t 1000 s3manager
```

---

## 7. Troubleshooting

### 7.1 Common Issues

#### Application Won't Start
```bash
# Check logs
kubectl logs deployment/backend
kubectl logs deployment/frontend

# Common fixes
kubectl delete pod -l app=backend  # Restart backend
kubectl delete pod -l app=frontend # Restart frontend

# Check resource limits
kubectl describe pod <pod-name>
```

#### Database Connection Issues
```bash
# Check database status
kubectl get pods -l app=postgres

# Test connection
kubectl exec -it deployment/postgres -- psql -U s3manager -d s3manager

# Reset password
kubectl exec -it deployment/postgres -- psql -U postgres -c "ALTER USER s3manager PASSWORD 'newpassword';"
```

#### AWS Authentication Issues
```bash
# Verify credentials
aws sts get-caller-identity

# Check IAM permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::123456789012:user/s3manager \
  --action-names s3:ListBucket \
  --resource-arns arn:aws:s3:::my-bucket

# Update credentials in Kubernetes
kubectl create secret generic aws-credentials \
  --from-literal=AWS_ACCESS_KEY_ID=new_key \
  --from-literal=AWS_SECRET_ACCESS_KEY=new_secret \
  --dry-run=client -o yaml | kubectl apply -f -
```

### 7.2 Performance Issues

#### High Memory Usage
```bash
# Check memory usage
kubectl top pods

# Increase memory limits
kubectl patch deployment backend -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","resources":{"limits":{"memory":"2Gi"}}}]}}}}'

# Enable memory profiling
kubectl set env deployment/backend NODE_OPTIONS="--max-old-space-size=2048"
```

#### Slow API Responses
```bash
# Check database performance
kubectl exec -it deployment/postgres -- psql -U s3manager -d s3manager -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;"

# Enable query optimization
kubectl set env deployment/backend DATABASE_POOL_MAX=20

# Scale backend replicas
kubectl scale deployment backend --replicas=5
```

### 7.3 Security Issues

#### SSL/TLS Configuration
```bash
# Generate self-signed certificate for development
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt \
  -subj "/CN=s3-manager.local"

# Create TLS secret
kubectl create secret tls s3-manager-tls \
  --cert=tls.crt --key=tls.key

# Verify certificate
openssl x509 -in tls.crt -text -noout
```

#### Access Control Issues
```bash
# Check user permissions
kubectl exec -it deployment/backend -- npm run check-permissions

# Reset admin user
kubectl exec -it deployment/backend -- npm run create-admin-user

# Audit security logs
kubectl logs deployment/backend | grep "SECURITY"
```

### 7.4 Backup and Recovery

#### Database Backup
```bash
# Create backup
kubectl exec deployment/postgres -- pg_dump -U s3manager s3manager > backup.sql

# Restore backup
kubectl exec -i deployment/postgres -- psql -U s3manager s3manager < backup.sql
```

#### Application Data Backup
```bash
# Export configuration
kubectl get configmap app-config -o yaml > config-backup.yaml

# Export secrets (be careful with this)
kubectl get secret aws-credentials -o yaml > secrets-backup.yaml
```

---

## Appendices

### Appendix A: Environment Variables Reference

Complete list of all supported environment variables and their descriptions.

### Appendix B: Kubernetes Resources Reference

Detailed explanation of all Kubernetes resources used in the deployment.

### Appendix C: AWS IAM Policy Examples

Sample IAM policies for different deployment scenarios.

---

**Document Control**
- **Last Modified**: August 11, 2025
- **Version**: 1.0
- **Next Review**: September 11, 2025
- **Support Contact**: devops@yourcompany.com
