# AWS S3 Manager - Production Deployment Guide

## 🎯 Overview

This guide covers deploying the AWS S3 Manager application to production environments with complete real AWS integration. The application requires AWS credentials and proper IAM permissions for full functionality.

## 📋 Prerequisites

### AWS Requirements
- AWS Account with programmatic access
- IAM user with S3 and Cost Explorer permissions
- AWS CLI configured locally

### Infrastructure Requirements
- Kubernetes cluster (v1.21+) OR Docker environment
- LoadBalancer/Ingress controller (for K8s)
- SSL/TLS certificates (recommended)

## 🔐 AWS IAM Setup

### 1. Create IAM Policies

Create the required IAM policies for S3 and Cost Explorer access:

**S3 Access Policy (`s3-manager-s3-policy.json`):**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListAllMyBuckets",
                "s3:GetBucketLocation",
                "s3:ListBucket",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:GetBucketAcl"
            ],
            "Resource": [
                "arn:aws:s3:::*",
                "arn:aws:s3:::*/*"
            ]
        }
    ]
}
```

**Cost Explorer Policy (`s3-manager-cost-policy.json`):**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ce:GetCostAndUsage",
                "ce:GetDimensionValues",
                "ce:GetUsageReport",
                "ce:DescribeCostCategoryDefinition",
                "ce:GetRightsizingRecommendation"
            ],
            "Resource": "*"
        }
    ]
}
```

### 2. Create and Attach Policies

```bash
# Create policies
aws iam create-policy \
  --policy-name S3ManagerS3Policy \
  --policy-document file://s3-manager-s3-policy.json

aws iam create-policy \
  --policy-name S3ManagerCostExplorerPolicy \
  --policy-document file://s3-manager-cost-policy.json

# Attach to user (replace YOUR_USERNAME and YOUR_ACCOUNT_ID)
aws iam attach-user-policy \
  --user-name YOUR_USERNAME \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/S3ManagerS3Policy

aws iam attach-user-policy \
  --user-name YOUR_USERNAME \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/S3ManagerCostExplorerPolicy
```

### 3. Verify Permissions

```bash
# Test S3 access
aws s3 ls

# Test Cost Explorer access (requires billing permissions)
aws ce get-cost-and-usage \
  --time-period Start=2025-08-01,End=2025-08-18 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

## 🚀 Kubernetes Deployment

### 1. Create AWS Credentials Secret

```bash
# Create secret with your AWS credentials
kubectl create secret generic aws-credentials \
  --from-literal=access-key-id=YOUR_ACCESS_KEY_ID \
  --from-literal=secret-access-key=YOUR_SECRET_ACCESS_KEY \
  --from-literal=region=us-east-1 \
  --namespace default
```

### 2. Create Kubernetes Manifests

**Deployment (`k8s/deployment.yaml`):**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: s3-manager
  labels:
    app: s3-manager
spec:
  replicas: 2
  selector:
    matchLabels:
      app: s3-manager
  template:
    metadata:
      labels:
        app: s3-manager
    spec:
      containers:
      - name: s3-manager
        image: s3-manager:latest
        ports:
        - containerPort: 3000
        env:
        - name: AWS_ACCESS_KEY_ID
          valueFrom:
            secretKeyRef:
              name: aws-credentials
              key: access-key-id
        - name: AWS_SECRET_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: aws-credentials
              key: secret-access-key
        - name: AWS_REGION
          valueFrom:
            secretKeyRef:
              name: aws-credentials
              key: region
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          value: "your-production-jwt-secret"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Service (`k8s/service.yaml`):**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: s3-manager-service
  labels:
    app: s3-manager
spec:
  selector:
    app: s3-manager
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

**Ingress (`k8s/ingress.yaml`):**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: s3-manager-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - s3-manager.yourdomain.com
    secretName: s3-manager-tls
  rules:
  - host: s3-manager.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: s3-manager-service
            port:
              number: 80
```

### 3. Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/

# Verify deployment
kubectl get pods -l app=s3-manager
kubectl get svc s3-manager-service
kubectl get ingress s3-manager-ingress

# Check logs
kubectl logs -l app=s3-manager -f
```

## 🐳 Docker Deployment

### 1. Build Production Image

```dockerfile
# Multi-stage Dockerfile for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 2. Build and Deploy

```bash
# Build production image
docker build -t s3-manager:latest .

# Run with AWS credentials
docker run -d \
  --name s3-manager \
  --restart unless-stopped \
  -p 3000:3000 \
  -e AWS_ACCESS_KEY_ID=your_access_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret_key \
  -e AWS_REGION=us-east-1 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your_production_jwt_secret \
  s3-manager:latest

# Verify deployment
docker logs s3-manager
curl http://localhost:3000/api/health
```

## 🔒 Security Configuration

### Environment Variables

**Production Environment Variables:**
```env
# Application
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secure-random-string-64-chars-minimum

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Optional: Application URLs
NEXTAUTH_URL=https://s3-manager.yourdomain.com
```

### SSL/TLS Configuration

For production deployments, always use HTTPS:

1. **Kubernetes with cert-manager:**
   - Install cert-manager
   - Configure Let's Encrypt issuer
   - Add TLS section to Ingress

2. **Docker with reverse proxy:**
   - Use nginx or Traefik as reverse proxy
   - Configure SSL certificates
   - Redirect HTTP to HTTPS

## 📊 Monitoring and Health Checks

### Health Check Endpoint

The application provides a health check endpoint:

```bash
# Health check
GET /api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-08-18T17:30:00Z",
  "version": "1.0.0",
  "aws": {
    "connected": true,
    "region": "us-east-1"
  }
}
```

### Kubernetes Monitoring

```yaml
# Add to deployment.yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

## 🔧 Troubleshooting

### Common Issues

1. **AWS Authentication Errors:**
   ```bash
   # Verify credentials
   kubectl exec -it s3-manager-pod -- env | grep AWS
   
   # Test AWS connectivity
   kubectl exec -it s3-manager-pod -- aws sts get-caller-identity
   ```

2. **Cost Explorer Access Denied:**
   - Ensure Cost Explorer permissions are attached
   - Cost Explorer API is only available in us-east-1
   - Billing permissions may require account admin access

3. **Connection Issues:**
   ```bash
   # Check pod status
   kubectl describe pod s3-manager-pod
   
   # Check service endpoints
   kubectl get endpoints s3-manager-service
   
   # Test internal connectivity
   kubectl exec -it test-pod -- curl http://s3-manager-service/api/health
   ```

### Log Analysis

```bash
# Application logs
kubectl logs -l app=s3-manager --tail=100 -f

# Filter AWS-related logs
kubectl logs -l app=s3-manager | grep -i aws

# Monitor real-time logs
kubectl logs -l app=s3-manager -f | grep -E "(ERROR|WARN|AWS)"
```

## 🚀 Production Validation

### Deployment Checklist

- [ ] AWS IAM policies created and attached
- [ ] AWS credentials configured as secrets
- [ ] Application deployed and pods running
- [ ] Health checks passing
- [ ] Ingress/LoadBalancer configured
- [ ] SSL/TLS certificates active
- [ ] DNS records pointing to application
- [ ] Monitoring and logging configured

### Functional Testing

```bash
# Test endpoints
curl https://s3-manager.yourdomain.com/api/health
curl https://s3-manager.yourdomain.com/api/auth/login -X POST
curl https://s3-manager.yourdomain.com/api/s3/buckets -H "Authorization: Bearer token"

# Test AWS integration
# Login with credentials and verify:
# - Real bucket counts displayed
# - Live object statistics shown
# - Billing data from Cost Explorer
# - Download functionality working
```

## 📈 Scaling and Performance

### Horizontal Scaling

```yaml
# Update deployment replicas
spec:
  replicas: 5

# Add HorizontalPodAutoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: s3-manager-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: s3-manager
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Performance Optimization

- Use read replicas for high traffic
- Implement caching for AWS API responses
- Configure CDN for static assets
- Monitor AWS API rate limits

---

**Deployment Complete!** Your AWS S3 Manager is now running in production with complete real AWS integration.
