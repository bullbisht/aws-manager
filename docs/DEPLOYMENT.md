# Deployment Guide
# AWS S3 Manager Web Interface

**Document Version**: 1.0  
**Date**: August 11, 2025  
**Author**: DevOps Team  

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development](#2-local-development)
3. [Docker Deployment](#3-docker-deployment)
4. [Kubernetes Deployment](#4-kubernetes-deployment)
5. [Production Deployment](#5-production-deployment)
6. [Monitoring Setup](#6-monitoring-setup)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites

### 1.1 System Requirements

#### Development Environment
- **CPU**: 2+ cores
- **Memory**: 8GB+ RAM
- **Storage**: 10GB+ available space
- **OS**: macOS 10.15+, Ubuntu 18.04+, Windows 10+

#### Production Environment
- **CPU**: 4+ cores
- **Memory**: 16GB+ RAM
- **Storage**: 50GB+ available space
- **Network**: High-speed internet connection

### 1.2 Required Software

```bash
# Core tools
node --version     # v18.0.0+
npm --version      # v9.0.0+
docker --version   # v20.10.0+
kubectl version    # v1.20.0+
helm version       # v3.8.0+

# Optional tools
git --version
aws --version
terraform --version
```

### 1.3 Network Requirements

#### Ports
- **3000**: Frontend (React.js)
- **3001**: Backend API (Express.js)
- **5432**: PostgreSQL database
- **6379**: Redis cache
- **9090**: Prometheus metrics
- **3002**: Grafana dashboard

#### External Access
- AWS S3 API endpoints
- AWS SSO endpoints (if using SSO)
- Container registries
- Package repositories

---

## 2. Local Development

### 2.1 Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/s3-manager.git
cd s3-manager

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit configuration
nano .env

# Start services
npm run dev
```

### 2.2 Development Services

```bash
# Start all services
npm run dev

# Or start individually
npm run dev:frontend    # React development server
npm run dev:backend     # Express API server
npm run dev:database    # Database with migrations
npm run dev:cache       # Redis cache server
```

### 2.3 Development URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **API Docs**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/v1/health

---

## 3. Docker Deployment

### 3.1 Development with Docker

```bash
# Start all services
docker-compose up

# Start with rebuild
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3.2 Production Docker Build

```bash
# Build production images
docker build -f Dockerfile.frontend -t s3-manager-frontend:v1.0.0 .
docker build -f Dockerfile.backend -t s3-manager-backend:v1.0.0 .

# Tag for registry
docker tag s3-manager-frontend:v1.0.0 your-registry/s3-manager-frontend:v1.0.0
docker tag s3-manager-backend:v1.0.0 your-registry/s3-manager-backend:v1.0.0

# Push to registry
docker push your-registry/s3-manager-frontend:v1.0.0
docker push your-registry/s3-manager-backend:v1.0.0
```

### 3.3 Docker Compose Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  frontend:
    image: your-registry/s3-manager-frontend:v1.0.0
    ports:
      - "80:3000"
    environment:
      - REACT_APP_API_URL=https://api.s3-manager.yourdomain.com
    restart: unless-stopped

  backend:
    image: your-registry/s3-manager-backend:v1.0.0
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

```bash
# Deploy production stack
docker-compose -f docker-compose.prod.yml up -d
```

---

## 4. Kubernetes Deployment

### 4.1 Prerequisites

```bash
# Verify cluster access
kubectl cluster-info

# Create namespace
kubectl create namespace s3-manager

# Set context
kubectl config set-context --current --namespace=s3-manager
```

### 4.2 Manual Deployment

```bash
# Deploy all components
kubectl apply -f k8s/

# Or deploy step by step
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/ingress.yaml
```

### 4.3 Helm Deployment

#### Install with Default Values
```bash
# Add Helm repository (if published)
helm repo add s3-manager https://charts.s3-manager.io
helm repo update

# Install
helm install s3-manager s3-manager/s3-manager

# Or install from local chart
helm install s3-manager ./helm/s3-manager
```

#### Install with Custom Values
```bash
# Create custom values file
cat > values.production.yaml << EOF
global:
  imageRegistry: "your-registry.com"
  imageTag: "v1.0.0"

frontend:
  replicaCount: 3
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 1Gi

backend:
  replicaCount: 3
  resources:
    requests:
      cpu: 500m
      memory: 512Mi
    limits:
      cpu: 2000m
      memory: 2Gi

postgresql:
  enabled: true
  auth:
    database: s3manager
    username: s3manager
    password: "your-secure-password"
  primary:
    persistence:
      enabled: true
      size: 20Gi
      storageClass: "fast-ssd"

redis:
  enabled: true
  auth:
    enabled: true
    password: "your-redis-password"
  master:
    persistence:
      enabled: true
      size: 5Gi

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: s3-manager.yourdomain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: s3-manager-tls
      hosts:
        - s3-manager.yourdomain.com
EOF

# Install with custom values
helm install s3-manager ./helm/s3-manager -f values.production.yaml
```

### 4.4 Verify Deployment

```bash
# Check pod status
kubectl get pods

# Check services
kubectl get services

# Check ingress
kubectl get ingress

# View logs
kubectl logs -l app=s3-manager -f

# Port forward for testing
kubectl port-forward svc/s3-manager-frontend 3000:80
kubectl port-forward svc/s3-manager-backend 3001:3001
```

---

## 5. Production Deployment

### 5.1 Infrastructure Setup

#### Using Terraform
```hcl
# infrastructure/main.tf
provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 3.0"
  
  name = "s3-manager-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  enable_dns_hostnames = true
  enable_dns_support = true
}

module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "~> 18.0"
  
  cluster_name    = "s3-manager-cluster"
  cluster_version = "1.24"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  node_groups = {
    main = {
      desired_capacity = 3
      max_capacity     = 6
      min_capacity     = 3
      
      instance_types = ["t3.large"]
      
      k8s_labels = {
        Environment = "production"
        Application = "s3-manager"
      }
    }
  }
}

module "rds" {
  source = "terraform-aws-modules/rds/aws"
  version = "~> 5.0"
  
  identifier = "s3-manager-db"
  
  engine            = "postgres"
  engine_version    = "14.9"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_encrypted = true
  
  db_name  = "s3manager"
  username = "s3manager"
  password = var.db_password
  port     = "5432"
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  deletion_protection = true
}

module "elasticache" {
  source = "terraform-aws-modules/elasticache/aws"
  version = "~> 1.0"
  
  cluster_id           = "s3-manager-redis"
  description          = "Redis cluster for S3 Manager"
  
  node_type            = "cache.t3.micro"
  port                 = 6379
  parameter_group_name = "default.redis7"
  
  num_cache_nodes = 1
  
  subnet_group_name = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]
}
```

#### Deploy Infrastructure
```bash
# Initialize Terraform
cd infrastructure
terraform init

# Plan deployment
terraform plan -var-file="production.tfvars"

# Apply configuration
terraform apply -var-file="production.tfvars"

# Get outputs
terraform output
```

### 5.2 Application Deployment

#### Update Kubernetes Configuration
```bash
# Update image tags in values.yaml
helm upgrade s3-manager ./helm/s3-manager \
  --set global.imageTag=v1.0.0 \
  --set postgresql.auth.password=production-password \
  --set redis.auth.password=production-redis-password
```

#### Database Migration
```bash
# Run database migrations
kubectl create job --from=cronjob/db-migrate db-migrate-$(date +%s)

# Or run manually
kubectl run db-migrate --image=s3-manager-backend:v1.0.0 \
  --env="DATABASE_URL=postgresql://..." \
  --command -- npm run db:migrate
```

### 5.3 SSL/TLS Setup

#### Using cert-manager
```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml

# Create ClusterIssuer
cat << EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

#### Update Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: s3-manager-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
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
            name: s3-manager-frontend
            port:
              number: 80
```

### 5.4 Production Configuration

#### Environment Variables
```bash
# Create production secrets
kubectl create secret generic s3-manager-secrets \
  --from-literal=DATABASE_URL="postgresql://user:pass@host:5432/db" \
  --from-literal=REDIS_URL="redis://:pass@host:6379/0" \
  --from-literal=JWT_SECRET="your-production-jwt-secret" \
  --from-literal=AWS_ACCESS_KEY_ID="your-access-key" \
  --from-literal=AWS_SECRET_ACCESS_KEY="your-secret-key"
```

#### Update ConfigMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: s3-manager-config
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  AWS_REGION: "us-west-2"
  RATE_LIMIT_MAX_REQUESTS: "1000"
```

---

## 6. Monitoring Setup

### 6.1 Prometheus and Grafana

#### Install Monitoring Stack
```bash
# Add Prometheus community Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=admin
```

#### Access Monitoring
```bash
# Port forward Grafana
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80

# Port forward Prometheus
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090
```

### 6.2 Application Metrics

#### Enable Metrics in Application
```typescript
// metrics.ts
import promClient from 'prom-client';

export const register = new promClient.Registry();

export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
```

#### ServiceMonitor for Prometheus
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: s3-manager-metrics
  labels:
    app: s3-manager
spec:
  selector:
    matchLabels:
      app: s3-manager
  endpoints:
  - port: http
    path: /api/v1/metrics
    interval: 30s
```

### 6.3 Alerting

#### AlertManager Rules
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: s3-manager-alerts
spec:
  groups:
  - name: s3-manager
    rules:
    - alert: S3ManagerDown
      expr: up{job="s3-manager-backend"} == 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "S3 Manager is down"
        description: "S3 Manager has been down for more than 1 minute"
    
    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High error rate detected"
        description: "Error rate is {{ $value }} errors per second"
```

---

## 7. Troubleshooting

### 7.1 Common Issues

#### Pods Not Starting
```bash
# Check pod status
kubectl get pods -o wide

# Describe problematic pod
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name> --previous

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp
```

#### Database Connection Issues
```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:15-alpine --restart=Never -- \
  psql -h postgres -U s3manager -d s3manager

# Check database logs
kubectl logs -l app=postgres

# Verify secrets
kubectl get secret s3-manager-secrets -o yaml
```

#### Application Errors
```bash
# Check application logs
kubectl logs -l app=s3-manager --tail=100

# Stream logs
kubectl logs -l app=s3-manager -f

# Check resource usage
kubectl top pods

# Check service endpoints
kubectl get endpoints
```

### 7.2 Performance Issues

#### Scale Applications
```bash
# Scale backend
kubectl scale deployment s3-manager-backend --replicas=5

# Scale frontend
kubectl scale deployment s3-manager-frontend --replicas=3

# Check HPA status
kubectl get hpa
```

#### Database Performance
```bash
# Connect to database
kubectl exec -it deployment/postgres -- psql -U s3manager -d s3manager

# Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

# Check connections
SELECT count(*) FROM pg_stat_activity;
```

### 7.3 Rollback Procedures

#### Helm Rollback
```bash
# Check release history
helm history s3-manager

# Rollback to previous version
helm rollback s3-manager

# Rollback to specific revision
helm rollback s3-manager 2
```

#### Kubernetes Rollback
```bash
# Check rollout history
kubectl rollout history deployment/s3-manager-backend

# Rollback deployment
kubectl rollout undo deployment/s3-manager-backend

# Rollback to specific revision
kubectl rollout undo deployment/s3-manager-backend --to-revision=2
```

### 7.4 Backup and Recovery

#### Database Backup
```bash
# Create backup job
kubectl create job db-backup-$(date +%s) --from=cronjob/db-backup

# Manual backup
kubectl exec deployment/postgres -- pg_dump -U s3manager s3manager > backup.sql
```

#### Application Data Backup
```bash
# Backup configurations
kubectl get configmap s3-manager-config -o yaml > config-backup.yaml

# Backup secrets (encrypted)
kubectl get secret s3-manager-secrets -o yaml > secrets-backup.yaml
```

---

## Appendices

### Appendix A: Production Checklist

- [ ] Infrastructure provisioned
- [ ] SSL certificates configured
- [ ] Database secured and backed up
- [ ] Monitoring and alerting setup
- [ ] Load testing completed
- [ ] Security scan passed
- [ ] Disaster recovery tested
- [ ] Documentation updated

### Appendix B: Scaling Guidelines

- [ ] Horizontal Pod Autoscaler configured
- [ ] Resource limits properly set
- [ ] Database connection pooling optimized
- [ ] CDN configured for static assets
- [ ] Caching strategy implemented

### Appendix C: Security Checklist

- [ ] Network policies applied
- [ ] RBAC configured
- [ ] Secrets properly managed
- [ ] Container images scanned
- [ ] Ingress properly secured
- [ ] Audit logging enabled

---

**Document Control**
- **Last Modified**: August 11, 2025
- **Version**: 1.0
- **Next Review**: September 11, 2025
- **Deployment Support**: devops@yourcompany.com
