'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  Archive, 
  Shield, 
  Server, 
  Zap, 
  Network, 
  Eye, 
  HardDrive,
  Cloud,
  Timer,
  Snowflake,
  RotateCcw,
  BarChart3,
  Lock,
  Globe,
  Cpu,
  FileText,
  Settings
} from 'lucide-react';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'active' | 'coming-soon' | 'planned';
  category: string;
  stats?: string;
  onManage?: () => void;
  priority: 'high' | 'medium' | 'low';
}

function ServiceCard({ title, description, icon: Icon, status, category, stats, onManage, priority }: ServiceCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'coming-soon': return 'bg-yellow-100 text-yellow-800';
      case 'planned': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-blue-500';
      case 'medium': return 'border-l-4 border-l-orange-500';
      case 'low': return 'border-l-4 border-l-gray-400';
      default: return '';
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${getPriorityColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className="w-6 h-6 text-blue-600" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge className={getStatusColor()}>
            {status === 'active' ? 'Active' : status === 'coming-soon' ? 'Soon' : 'Planned'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        <div className="text-xs text-gray-500 mb-3">Category: {category}</div>
        {stats && (
          <div className="text-sm font-medium text-blue-600 mb-3">{stats}</div>
        )}
        <div className="flex justify-between items-center">
          <Button 
            variant={status === 'active' ? 'default' : 'outline'} 
            size="sm"
            onClick={onManage}
            disabled={status !== 'active'}
          >
            {status === 'active' ? 'Manage' : status === 'coming-soon' ? 'Coming Soon' : 'Planned'}
          </Button>
          <span className="text-xs text-gray-400">
            {priority === 'high' ? 'High Priority' : priority === 'medium' ? 'Medium' : 'Future'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface ServiceGridProps {
  onServiceSelect: (serviceId: string) => void;
}

export function ServiceGrid({ onServiceSelect }: ServiceGridProps) {
  const services = [
    // Tier 1 - Storage & Backup (High Priority)
    {
      id: 's3',
      title: 'S3 Storage',
      description: 'Object storage with lifecycle management and versioning',
      icon: Database,
      status: 'active' as const,
      category: 'Storage & Backup',
      stats: 'Currently Active',
      priority: 'high' as const
    },
    {
      id: 'glacier',
      title: 'S3 Glacier',
      description: 'Long-term archival storage with flexible retrieval options',
      icon: Archive,
      status: 'active' as const,
      category: 'Storage & Backup',
      stats: 'Recently Added',
      priority: 'high' as const
    },
    {
      id: 'glacier-deep-archive',
      title: 'Glacier Deep Archive',
      description: 'Lowest-cost storage for long-term data retention',
      icon: Snowflake,
      status: 'coming-soon' as const,
      category: 'Storage & Backup',
      priority: 'high' as const
    },
    {
      id: 'aws-backup',
      title: 'AWS Backup',
      description: 'Centralized backup across AWS services with compliance reporting',
      icon: Shield,
      status: 'active' as const,
      category: 'Storage & Backup',
      stats: 'Just Added',
      priority: 'high' as const
    },
    {
      id: 'ebs-snapshots',
      title: 'EBS Snapshots',
      description: 'EC2 volume backup and snapshot management',
      icon: HardDrive,
      status: 'coming-soon' as const,
      category: 'Storage & Backup',
      priority: 'high' as const
    },
    {
      id: 'storage-gateway',
      title: 'Storage Gateway',
      description: 'Hybrid cloud storage integration and data transfer',
      icon: Cloud,
      status: 'planned' as const,
      category: 'Storage & Backup',
      priority: 'medium' as const
    },

    // Tier 2 - Compute & Database (High Priority)
    {
      id: 'ec2',
      title: 'EC2 Instances',
      description: 'Virtual server management with backup integration',
      icon: Server,
      status: 'coming-soon' as const,
      category: 'Compute & Database',
      priority: 'high' as const
    },
    {
      id: 'lambda',
      title: 'Lambda Functions',
      description: 'Serverless function management and monitoring',
      icon: Zap,
      status: 'coming-soon' as const,
      category: 'Compute & Database',
      priority: 'high' as const
    },
    {
      id: 'rds',
      title: 'RDS Databases',
      description: 'Relational database management with automated backups',
      icon: Database,
      status: 'coming-soon' as const,
      category: 'Compute & Database',
      priority: 'high' as const
    },
    {
      id: 'dynamodb',
      title: 'DynamoDB',
      description: 'NoSQL database with point-in-time recovery',
      icon: FileText,
      status: 'coming-soon' as const,
      category: 'Compute & Database',
      priority: 'medium' as const
    },

    // Tier 3 - Networking & Security (Medium Priority)
    {
      id: 'vpc',
      title: 'VPC Networks',
      description: 'Virtual private cloud and network configuration',
      icon: Network,
      status: 'planned' as const,
      category: 'Networking & Security',
      priority: 'medium' as const
    },
    {
      id: 'cloudfront',
      title: 'CloudFront CDN',
      description: 'Content delivery network and edge locations',
      icon: Globe,
      status: 'planned' as const,
      category: 'Networking & Security',
      priority: 'medium' as const
    },
    {
      id: 'iam',
      title: 'IAM Management',
      description: 'Identity and access management for AWS resources',
      icon: Lock,
      status: 'planned' as const,
      category: 'Networking & Security',
      priority: 'medium' as const
    },
    {
      id: 'cloudwatch',
      title: 'CloudWatch',
      description: 'Monitoring, metrics, and alerting for AWS services',
      icon: Eye,
      status: 'planned' as const,
      category: 'Networking & Security',
      priority: 'medium' as const
    },

    // Tier 4 - Advanced & Specialized (Future)
    {
      id: 'eks',
      title: 'EKS Clusters',
      description: 'Kubernetes cluster management and container orchestration',
      icon: Cpu,
      status: 'planned' as const,
      category: 'Advanced Services',
      priority: 'low' as const
    },
    {
      id: 'datasync',
      title: 'DataSync',
      description: 'Data transfer service for moving large amounts of data',
      icon: RotateCcw,
      status: 'planned' as const,
      category: 'Advanced Services',
      priority: 'low' as const
    },
    {
      id: 'storage-analytics',
      title: 'Storage Analytics',
      description: 'Cost optimization and usage analytics across storage services',
      icon: BarChart3,
      status: 'coming-soon' as const,
      category: 'Storage & Backup',
      priority: 'medium' as const
    },
    {
      id: 'disaster-recovery',
      title: 'Disaster Recovery',
      description: 'Cross-region backup strategies and recovery planning',
      icon: Timer,
      status: 'planned' as const,
      category: 'Storage & Backup',
      priority: 'low' as const
    },

    // Additional Services for comprehensive coverage
    {
      id: 'route53',
      title: 'Route 53',
      description: 'Scalable domain name system (DNS) web service',
      icon: Globe,
      status: 'planned' as const,
      category: 'Networking & Security',
      priority: 'medium' as const
    },
    {
      id: 'certificate-manager',
      title: 'Certificate Manager',
      description: 'Provision and manage SSL/TLS certificates',
      icon: Shield,
      status: 'planned' as const,
      category: 'Networking & Security',
      priority: 'medium' as const
    },
    {
      id: 'api-gateway',
      title: 'API Gateway',
      description: 'Create, publish, maintain, monitor, and secure APIs',
      icon: Network,
      status: 'planned' as const,
      category: 'Advanced Services',
      priority: 'medium' as const
    },
    {
      id: 'sqs',
      title: 'SQS',
      description: 'Simple Queue Service for message queuing',
      icon: RotateCcw,
      status: 'planned' as const,
      category: 'Advanced Services',
      priority: 'low' as const
    },
    {
      id: 'sns',
      title: 'SNS',
      description: 'Simple Notification Service for messaging',
      icon: Settings,
      status: 'planned' as const,
      category: 'Advanced Services',
      priority: 'low' as const
    },
    {
      id: 'codepipeline',
      title: 'CodePipeline',
      description: 'Continuous integration and continuous delivery service',
      icon: Settings,
      status: 'planned' as const,
      category: 'Advanced Services',
      priority: 'low' as const
    }
  ];

  const categories = [
    'Storage & Backup',
    'Compute & Database', 
    'Networking & Security',
    'Advanced Services'
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Storage & Backup': return Archive;
      case 'Compute & Database': return Server;
      case 'Networking & Security': return Shield;
      case 'Advanced Services': return Settings;
      default: return Database;
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'Storage & Backup': return 'Data storage, archival, and backup solutions';
      case 'Compute & Database': return 'Virtual machines, serverless, and database services';
      case 'Networking & Security': return 'Network infrastructure and security management';
      case 'Advanced Services': return 'Specialized and enterprise-grade services';
      default: return '';
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">AWS Services Management</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Comprehensive management platform for AWS services with focus on storage, backup, and infrastructure management.
        </p>
      </div>

      {categories.map((category) => {
        const categoryServices = services.filter(service => service.category === category);
        const CategoryIcon = getCategoryIcon(category);
        
        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center space-x-3 mb-6">
              <CategoryIcon className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{category}</h3>
                <p className="text-sm text-gray-600">{getCategoryDescription(category)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoryServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  title={service.title}
                  description={service.description}
                  icon={service.icon}
                  status={service.status}
                  category={service.category}
                  stats={service.stats}
                  priority={service.priority}
                  onManage={() => onServiceSelect(service.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h4 className="text-lg font-semibold text-blue-900 mb-2">Development Roadmap</h4>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Phase 4A (Weeks 1-2):</span>
            <p className="text-blue-700">Glacier, Storage Analytics, Lifecycle Management</p>
          </div>
          <div>
            <span className="font-medium text-blue-800">Phase 4B (Weeks 3-4):</span>
            <p className="text-blue-700">AWS Backup, EC2 Management, RDS Integration</p>
          </div>
          <div>
            <span className="font-medium text-blue-800">Phase 4C (Weeks 5-6):</span>
            <p className="text-blue-700">Advanced Features, Monitoring, Security</p>
          </div>
        </div>
      </div>
    </div>
  );
}
