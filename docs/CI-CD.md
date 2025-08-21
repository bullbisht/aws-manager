# CI/CD Pipeline Guide
# AWS S3 Manager

## 🎯 Overview

This guide explains the complete CI/CD pipeline for the AWS S3 Manager application, designed for novices and professionals alike.

## 🔄 Pipeline Stages

### 1. **Code Commit** (Developer Action)
```bash
# Developer makes changes and pushes to Git
git add .
git commit -m "feat: add bucket creation functionality"
git push origin develop  # Triggers development pipeline
```

### 2. **Automated Testing** (CI Pipeline)
- **Unit Tests**: Tests individual components
- **Integration Tests**: Tests component interactions
- **Security Scans**: Checks for vulnerabilities
- **Code Quality**: Linting and formatting checks

### 3. **Build & Package** (CI Pipeline)
- **Docker Images**: Creates containerized applications
- **Security Scanning**: Scans Docker images for vulnerabilities
- **Image Registry**: Pushes images to container registry

### 4. **Deploy** (CD Pipeline)
- **Development**: Auto-deploy to dev environment
- **Staging**: Manual approval for staging deployment
- **Production**: Manual approval for production deployment

## 🛠️ Deployment Methods

### Method 1: Helm Charts (Recommended)

**What is Helm?**
Helm is like a "package manager" for Kubernetes—think of it like `npm` for Node.js or `pip` for Python, but for Kubernetes applications.

**Why use Helm?**
- ✅ Easy upgrades and rollbacks
- ✅ Environment-specific configurations
- ✅ Dependency management
- ✅ Templating for reusability

**How it works:**
```bash
# Install the app
helm install s3-manager ./helm/s3-manager

# Upgrade the app
helm upgrade s3-manager ./helm/s3-manager

# Rollback if something goes wrong
helm rollback s3-manager 1
```

### Method 2: Raw Kubernetes Manifests

**What are Manifests?**
YAML files that describe what you want to run on Kubernetes.

**When to use:**
- Learning Kubernetes basics
- Simple deployments
- Full control over configurations

**Example:**
```bash
# Apply all configuration files
kubectl apply -f k8s/
```

### Method 3: GitOps (Advanced)

**What is GitOps?**
Your Git repository becomes the "source of truth"—when you change code, the cluster automatically updates itself.

**Tools:**
- **ArgoCD**: Monitors Git and deploys changes
- **Flux**: Another GitOps tool option

## 🚀 Step-by-Step Deployment

### For Beginners (Local Development)

1. **Prerequisites:**
```bash
# Install required tools
brew install docker kubectl helm  # macOS
# or
apt-get install docker kubectl helm  # Linux
```

2. **Start local Kubernetes:**
```bash
# Using Docker Desktop (easiest)
# Enable Kubernetes in Docker Desktop settings

# Or using minikube
minikube start
```

3. **Deploy the application:**
```bash
# Clone and navigate to project
cd /Users/harendrasingh/infrastructure/ansible/scripts/s3-manager

# Run deployment script
docs/scripts/deploy-local.sh
```

### For Production

1. **Setup CI/CD Pipeline:**
   - Push code to GitHub
   - GitHub Actions automatically builds and tests
   - Manual approval required for production deployment

2. **Configure Secrets:**
```bash
# Set up Kubernetes secrets
kubectl create secret generic aws-credentials \
  --from-literal=access-key-id=YOUR_ACCESS_KEY \
  --from-literal=secret-access-key=YOUR_SECRET_KEY
```

3. **Deploy with Helm:**
```bash
helm install s3-manager ./helm/s3-manager \
  --set environment=production \
  --set image.tag=v1.0.0
```

## 🔧 Environment Configuration

### Development Environment
- **Purpose**: Testing new features
- **Auto-deployment**: Yes (on push to `develop` branch)
- **Data**: Test data, can be reset
- **Access**: Development team

### Staging Environment
- **Purpose**: Pre-production testing
- **Auto-deployment**: Manual approval required
- **Data**: Production-like data
- **Access**: QA team, stakeholders

### Production Environment
- **Purpose**: Live application
- **Auto-deployment**: Manual approval required
- **Data**: Real production data
- **Access**: End users

## 📊 Monitoring & Observability

### Health Checks
```bash
# Check if pods are running
kubectl get pods -n s3-manager

# Check service status
kubectl get services -n s3-manager

# View logs
kubectl logs -f deployment/s3-manager-backend -n s3-manager
```

### Metrics and Monitoring
- **Prometheus**: Collects metrics
- **Grafana**: Visualizes metrics
- **AlertManager**: Sends alerts

## 🔄 Rollback Strategy

### Using Helm
```bash
# View deployment history
helm history s3-manager

# Rollback to previous version
helm rollback s3-manager 1
```

### Using Kubernetes
```bash
# Rollback deployment
kubectl rollout undo deployment/s3-manager-backend -n s3-manager
```

## 🛡️ Security Best Practices

### Image Security
- ✅ Scan Docker images for vulnerabilities
- ✅ Use minimal base images (Alpine Linux)
- ✅ Don't run containers as root
- ✅ Regular security updates

### Secrets Management
- ✅ Use Kubernetes secrets (not environment variables)
- ✅ Encrypt secrets at rest
- ✅ Rotate secrets regularly
- ✅ Use service accounts for AWS access

### Network Security
- ✅ Use network policies to restrict traffic
- ✅ Enable TLS for all communications
- ✅ Use ingress controllers with SSL termination

## 🎯 Quick Commands Reference

```bash
# Development
docs/scripts/deploy-local.sh                    # Deploy locally
kubectl get all -n s3-manager-local         # Check status
kubectl logs -f deployment/s3-manager-backend  # View logs

# Production
helm upgrade s3-manager ./helm/s3-manager    # Upgrade
helm rollback s3-manager 1                  # Rollback
kubectl get pods -n s3-manager              # Check pods

# Debugging
kubectl describe pod POD_NAME -n s3-manager  # Pod details
kubectl exec -it POD_NAME -- /bin/bash      # Shell into pod
kubectl port-forward svc/s3-manager-frontend 8080:80  # Port forward
```  

## 🚨 Troubleshooting

### Common Issues

**Pods not starting:**
```bash
kubectl describe pod POD_NAME -n s3-manager
git logs POD_NAME -n s3-manager
```

**Service not accessible:**
```bash
kubectl get services -n s3-manager
kubectl describe service SERVICE_NAME -n s3-manager
```

**Image pull errors:**
```bash
# Check if image exists
docker images | grep s3-manager
# Rebuild if necessary
docker build -t s3-manager-frontend:latest ./frontend
```

## 📚 Learning Resources

- **Kubernetes Basics**: https://kubernetes.io/docs
- **Helm Documentation**: https://helm.sh/docs
- **Docker Guide**: https://docs.docker.com
- **GitHub Actions**: https://docs.github.com/actions

---

This pipeline ensures **reliable, secure, and automated** deployments from development to production! 🚀




📝 Summary for Novices
Think of it this way:

Helm = Easy Button 📦

Like installing an app from App Store
One command deploys everything
Easy updates and rollbacks
CI/CD Pipeline = Assembly Line 🏭

Code goes through automatic checks
Builds and tests everything
Deploys safely to different environments
Kubernetes = Data Center Manager 🏢

Manages where your app runs
Handles scaling and failures
Keeps everything organized