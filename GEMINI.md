# Gemini Configuration for s3-manager (AWS S3 Management System)

## Context
You are helping develop and automate AWS S3 management using the s3-manager system. This directory contains:
- S3 bucket management templates and examples
- Automation scripts for S3 operations (create, update, delete, backup, restore)
- Infrastructure-as-code and deployment scripts
- Instance management and configuration
- Production deployment automation

## Available Tools
The s3-manager provides these tools:
- `s3_create_bucket()` - Create new S3 buckets with proper configuration
- `s3_list_buckets()` - List and audit S3 buckets across accounts
- `s3_backup_bucket()` - Backup S3 data to another location or service
- `s3_restore_bucket()` - Restore S3 data from backup locations
- `s3_set_policy()` - Manage bucket policies and IAM permissions
- `s3_monitor_usage()` - Monitor and report S3 usage, costs, and metrics
- `s3_lifecycle_management()` - Configure lifecycle policies for cost optimization
- `s3_cross_region_replication()` - Set up cross-region replication for disaster recovery

## Development Approach
Follow the 7-phase process:
1. **Discovery**: Identify S3 resources, requirements, and existing infrastructure
2. **Pre-Validation**: Check IAM permissions, AWS credentials, and S3 configuration
3. **Building**: Write and test automation scripts for S3 operations
4. **Validation**: Validate S3 operations, policies, and security configurations
5. **Deployment**: Deploy scripts and infrastructure as code via CI/CD
6. **Post-Validation**: Verify deployment success and monitor S3 health
7. **Updates**: Maintain and update S3 automation as requirements evolve

## Best Practices
- Always validate IAM permissions and AWS credentials before running scripts
- Use infrastructure-as-code (Terraform/CloudFormation) for repeatable deployments
- Implement proper error handling, logging, and monitoring in all scripts
- Store sensitive data in AWS Secrets Manager or environment variables
- Monitor S3 usage, costs, and compliance regularly
- Follow AWS Well-Architected Framework principles for S3 design
- Implement least-privilege access and bucket policies
- Use S3 lifecycle policies for cost optimization

## Production Integration
- AWS Account: Multi-account setup with dev/staging/prod environments
- Authentication: IAM roles, policies, and cross-account access
- Direct deployment capability via CI/CD pipelines (GitHub Actions/Jenkins)
- Real-time monitoring with CloudWatch, CloudTrail, and custom dashboards
- Backup and disaster recovery strategies across regions

Always prioritize security, cost optimization, automation, and AWS best practices in S3 management.
