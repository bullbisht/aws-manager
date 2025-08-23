'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Key, 
  Lock,
  User,
  Settings,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  UserCheck,
  UserX,
  FileText,
  Globe,
  UserPlus
} from 'lucide-react';

interface IAMUser {
  username: string;
  userId: string;
  arn: string;
  createDate: string;
  lastActivity: string;
  mfaEnabled: boolean;
  accessKeys: number;
  attachedPolicies: string[];
  groups: string[];
  status: 'active' | 'inactive' | 'suspended';
  tags: { [key: string]: string };
}

interface IAMRole {
  roleName: string;
  roleId: string;
  arn: string;
  createDate: string;
  lastUsed: string;
  trustPolicy: string;
  attachedPolicies: string[];
  maxSessionDuration: number;
  assumedBy: string[];
  status: 'active' | 'unused' | 'critical';
}

interface IAMPolicy {
  policyName: string;
  policyId: string;
  arn: string;
  type: 'AWS Managed' | 'Customer Managed' | 'Inline';
  createDate: string;
  updateDate: string;
  version: string;
  attachmentCount: number;
  permissions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  compliance: boolean;
}

interface AccessAnalysis {
  resourceType: 'user' | 'role' | 'policy';
  resourceName: string;
  lastAccessed: string;
  permissions: string[];
  riskScore: number;
  recommendations: string[];
  complianceStatus: 'compliant' | 'needs-review' | 'violation';
}

export function IAMManagement() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  // Mock data for IAM users
  const iamUsers: IAMUser[] = [
    {
      username: 'john.developer',
      userId: 'AIDACKCEVSQ6C2EXAMPLE',
      arn: 'arn:aws:iam::123456789012:user/john.developer',
      createDate: '2024-01-15',
      lastActivity: '2024-08-22',
      mfaEnabled: true,
      accessKeys: 1,
      attachedPolicies: ['DeveloperAccess', 'S3ReadOnlyAccess'],
      groups: ['Developers', 'S3Users'],
      status: 'active',
      tags: { Department: 'Engineering', Project: 'WebApp' }
    },
    {
      username: 'sarah.admin',
      userId: 'AIDACKCEVSQ6C2EXAMPLE2',
      arn: 'arn:aws:iam::123456789012:user/sarah.admin',
      createDate: '2023-12-01',
      lastActivity: '2024-08-23',
      mfaEnabled: true,
      accessKeys: 2,
      attachedPolicies: ['PowerUserAccess', 'IAMReadOnlyAccess'],
      groups: ['Administrators'],
      status: 'active',
      tags: { Department: 'IT', Role: 'Administrator' }
    },
    {
      username: 'legacy.service',
      userId: 'AIDACKCEVSQ6C2EXAMPLE3',
      arn: 'arn:aws:iam::123456789012:user/legacy.service',
      createDate: '2023-06-10',
      lastActivity: '2024-03-15',
      mfaEnabled: false,
      accessKeys: 1,
      attachedPolicies: ['EC2FullAccess'],
      groups: [],
      status: 'inactive',
      tags: { Type: 'Service', Status: 'Deprecated' }
    },
    {
      username: 'temp.contractor',
      userId: 'AIDACKCEVSQ6C2EXAMPLE4',
      arn: 'arn:aws:iam::123456789012:user/temp.contractor',
      createDate: '2024-06-01',
      lastActivity: '2024-06-30',
      mfaEnabled: false,
      accessKeys: 0,
      attachedPolicies: ['ReadOnlyAccess'],
      groups: ['Contractors'],
      status: 'suspended',
      tags: { ContractEnd: '2024-06-30', Access: 'Temporary' }
    }
  ];

  // Mock data for IAM roles
  const iamRoles: IAMRole[] = [
    {
      roleName: 'EC2-S3-Access-Role',
      roleId: 'AROA2EXAMPLE',
      arn: 'arn:aws:iam::123456789012:role/EC2-S3-Access-Role',
      createDate: '2024-02-10',
      lastUsed: '2024-08-23',
      trustPolicy: 'ec2.amazonaws.com',
      attachedPolicies: ['AmazonS3FullAccess', 'CloudWatchAgentServerPolicy'],
      maxSessionDuration: 3600,
      assumedBy: ['EC2 Instance i-1234567890abcdef0'],
      status: 'active'
    },
    {
      roleName: 'Lambda-Execution-Role',
      roleId: 'AROA3EXAMPLE',
      arn: 'arn:aws:iam::123456789012:role/Lambda-Execution-Role',
      createDate: '2024-01-20',
      lastUsed: '2024-08-22',
      trustPolicy: 'lambda.amazonaws.com',
      attachedPolicies: ['AWSLambdaBasicExecutionRole', 'AmazonDynamoDBFullAccess'],
      maxSessionDuration: 900,
      assumedBy: ['Lambda Function: data-processor'],
      status: 'active'
    },
    {
      roleName: 'CrossAccount-ReadOnly',
      roleId: 'AROA4EXAMPLE',
      arn: 'arn:aws:iam::123456789012:role/CrossAccount-ReadOnly',
      createDate: '2023-11-15',
      lastUsed: '2024-01-10',
      trustPolicy: 'arn:aws:iam::987654321098:root',
      attachedPolicies: ['ReadOnlyAccess'],
      maxSessionDuration: 7200,
      assumedBy: ['External Account: 987654321098'],
      status: 'unused'
    },
    {
      roleName: 'Emergency-Access-Role',
      roleId: 'AROA5EXAMPLE',
      arn: 'arn:aws:iam::123456789012:role/Emergency-Access-Role',
      createDate: '2023-08-01',
      lastUsed: '2024-08-20',
      trustPolicy: 'Root Account',
      attachedPolicies: ['PowerUserAccess', 'IAMFullAccess'],
      maxSessionDuration: 1800,
      assumedBy: ['Root User'],
      status: 'critical'
    }
  ];

  // Mock data for IAM policies
  const iamPolicies: IAMPolicy[] = [
    {
      policyName: 'DeveloperAccess',
      policyId: 'ANPA2EXAMPLE',
      arn: 'arn:aws:iam::123456789012:policy/DeveloperAccess',
      type: 'Customer Managed',
      createDate: '2024-01-10',
      updateDate: '2024-07-15',
      version: 'v3',
      attachmentCount: 8,
      permissions: ['s3:GetObject', 'ec2:DescribeInstances', 'lambda:InvokeFunction'],
      riskLevel: 'medium',
      compliance: true
    },
    {
      policyName: 'PowerUserAccess',
      policyId: 'ANPAI23HZ27SI6FQMGNQ2',
      arn: 'arn:aws:iam::aws:policy/PowerUserAccess',
      type: 'AWS Managed',
      createDate: '2010-05-08',
      updateDate: '2024-06-10',
      version: 'v17',
      attachmentCount: 3,
      permissions: ['*', '!iam:*', '!organizations:*'],
      riskLevel: 'high',
      compliance: true
    },
    {
      policyName: 'S3-Legacy-Access',
      policyId: 'ANPA3EXAMPLE',
      arn: 'arn:aws:iam::123456789012:policy/S3-Legacy-Access',
      type: 'Customer Managed',
      createDate: '2022-03-20',
      updateDate: '2022-03-20',
      version: 'v1',
      attachmentCount: 1,
      permissions: ['s3:*'],
      riskLevel: 'high',
      compliance: false
    },
    {
      policyName: 'ReadOnlyAccess',
      policyId: 'ANPAI2CXYZ3DX6EXAMPLE',
      arn: 'arn:aws:iam::aws:policy/ReadOnlyAccess',
      type: 'AWS Managed',
      createDate: '2012-10-17',
      updateDate: '2024-05-01',
      version: 'v12',
      attachmentCount: 12,
      permissions: ['*:Describe*', '*:List*', '*:Get*'],
      riskLevel: 'low',
      compliance: true
    }
  ];

  // Mock data for access analysis
  const accessAnalysis: AccessAnalysis[] = [
    {
      resourceType: 'user',
      resourceName: 'legacy.service',
      lastAccessed: '2024-03-15',
      permissions: ['ec2:*', 's3:GetObject'],
      riskScore: 85,
      recommendations: ['Remove unused permissions', 'Enable MFA', 'Consider role-based access'],
      complianceStatus: 'violation'
    },
    {
      resourceType: 'role',
      resourceName: 'CrossAccount-ReadOnly',
      lastAccessed: '2024-01-10',
      permissions: ['*:Describe*', '*:List*', '*:Get*'],
      riskScore: 65,
      recommendations: ['Review cross-account trust relationship', 'Verify usage patterns'],
      complianceStatus: 'needs-review'
    },
    {
      resourceType: 'policy',
      resourceName: 'S3-Legacy-Access',
      lastAccessed: '2024-08-20',
      permissions: ['s3:*'],
      riskScore: 90,
      recommendations: ['Replace with least privilege policy', 'Audit attached entities'],
      complianceStatus: 'violation'
    }
  ];

  const totalUsers = iamUsers.length;
  const activeUsers = iamUsers.filter(user => user.status === 'active').length;
  const mfaEnabledUsers = iamUsers.filter(user => user.mfaEnabled).length;
  const totalRoles = iamRoles.length;
  const activeRoles = iamRoles.filter(role => role.status === 'active').length;
  const totalPolicies = iamPolicies.length;
  const customPolicies = iamPolicies.filter(policy => policy.type === 'Customer Managed').length;
  const highRiskItems = [...iamPolicies.filter(p => p.riskLevel === 'high'), ...accessAnalysis.filter(a => a.riskScore >= 80)].length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': 
      case 'compliant': 
      case 'low': 
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'needs-review': 
      case 'unused': 
      case 'medium': 
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'violation': 
      case 'critical': 
      case 'inactive': 
      case 'suspended': 
      case 'high': 
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: 
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': 
      case 'compliant': 
      case 'low': 
        return 'bg-green-100 text-green-800';
      case 'needs-review': 
      case 'unused': 
      case 'medium': 
        return 'bg-yellow-100 text-yellow-800';
      case 'violation': 
      case 'critical': 
      case 'inactive': 
      case 'suspended': 
      case 'high': 
        return 'bg-red-100 text-red-800';
      default: 
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IAM Management</h1>
          <p className="text-gray-600">Identity and access management for AWS resources</p>
        </div>
        <div className="flex space-x-2">
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            title="Select time range for analysis"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button 
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            size="sm"
            variant="outline"
          >
            {showSensitiveData ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showSensitiveData ? 'Hide' : 'Show'} Sensitive
          </Button>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                <p className="text-xs text-blue-600">
                  {activeUsers} active • {mfaEnabledUsers} with MFA
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">IAM Roles</p>
                <p className="text-2xl font-bold text-gray-900">{totalRoles}</p>
                <p className="text-xs text-green-600">
                  {activeRoles} active roles
                </p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">IAM Policies</p>
                <p className="text-2xl font-bold text-gray-900">{totalPolicies}</p>
                <p className="text-xs text-purple-600">
                  {customPolicies} custom policies
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Risk</p>
                <p className="text-2xl font-bold text-gray-900">{highRiskItems}</p>
                <p className="text-xs text-red-600">
                  High-risk items requiring attention
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main IAM Management Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="access-analyzer">Access Analyzer</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">IAM Users</h2>
              <p className="text-sm text-gray-600">Manage user accounts and permissions</p>
            </div>
            <Button size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {iamUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {user.status === 'active' ? 
                        <UserCheck className="w-5 h-5 text-green-600" /> : 
                        <UserX className="w-5 h-5 text-red-600" />
                      }
                      <div>
                        <h4 className="font-medium">{user.username}</h4>
                        <p className="text-sm text-gray-600">
                          {showSensitiveData ? user.arn : `arn:aws:iam::***:user/${user.username}`}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {user.mfaEnabled ? '🔐 MFA' : '❌ No MFA'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {user.accessKeys} key{user.accessKeys !== 1 ? 's' : ''}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Last: {user.lastActivity}
                          </Badge>
                        </div>
                        <div className="mt-2 space-x-1">
                          {user.attachedPolicies.map((policy, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {policy}
                            </Badge>
                          ))}
                        </div>
                        {user.groups.length > 0 && (
                          <div className="mt-1 space-x-1">
                            <span className="text-xs text-gray-500">Groups: </span>
                            {user.groups.map((group, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                {group}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">IAM Roles</h2>
              <p className="text-sm text-gray-600">Manage service roles and cross-account access</p>
            </div>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Role Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {iamRoles.map((role, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(role.status)}
                      <div>
                        <h4 className="font-medium">{role.roleName}</h4>
                        <p className="text-sm text-gray-600">
                          {showSensitiveData ? role.arn : `arn:aws:iam::***:role/${role.roleName}`}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            Trust: {role.trustPolicy}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Session: {role.maxSessionDuration / 60}min
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Last used: {role.lastUsed}
                          </Badge>
                        </div>
                        <div className="mt-2 space-x-1">
                          {role.attachedPolicies.map((policy, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {policy}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-1">
                          <span className="text-xs text-gray-500">Assumed by: </span>
                          {role.assumedBy.map((entity, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-purple-50 text-purple-700 ml-1">
                              {entity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(role.status)}>
                        {role.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">IAM Policies</h2>
              <p className="text-sm text-gray-600">Manage permissions and access control</p>
            </div>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Policy
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Policy Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {iamPolicies.map((policy, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(policy.riskLevel)}
                      <div>
                        <h4 className="font-medium">{policy.policyName}</h4>
                        <p className="text-sm text-gray-600">
                          {showSensitiveData ? policy.arn : `arn:aws:iam::***:policy/${policy.policyName}`}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {policy.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Version: {policy.version}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {policy.attachmentCount} attachment{policy.attachmentCount !== 1 ? 's' : ''}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Updated: {policy.updateDate}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Key permissions: </span>
                          {policy.permissions.slice(0, 3).map((permission, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs ml-1">
                              {permission}
                            </Badge>
                          ))}
                          {policy.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs ml-1">
                              +{policy.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <Badge className={getStatusColor(policy.riskLevel)}>
                          {policy.riskLevel} risk
                        </Badge>
                        <p className="text-xs text-gray-600 mt-1">
                          {policy.compliance ? '✅ Compliant' : '❌ Non-compliant'}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access-analyzer" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Access Analyzer</h2>
            <p className="text-sm text-gray-600">Security analysis and recommendations</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Security Analysis & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accessAnalysis.map((analysis, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(analysis.complianceStatus)}
                        <div>
                          <h4 className="font-medium">{analysis.resourceName}</h4>
                          <p className="text-sm text-gray-600 capitalize">
                            {analysis.resourceType} • Last accessed: {analysis.lastAccessed}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getRiskScoreColor(analysis.riskScore)}`}>
                          {analysis.riskScore}/100
                        </div>
                        <p className="text-xs text-gray-600">Risk Score</p>
                        <Badge className={getStatusColor(analysis.complianceStatus)}>
                          {analysis.complianceStatus.replace('-', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Permissions:</h5>
                        <div className="space-x-1">
                          {analysis.permissions.map((permission, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Recommendations:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {analysis.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <span className="text-orange-500 mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">IAM Security Best Practices</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-blue-800 mb-1">User Security:</h5>
                    <ul className="text-blue-700 space-y-1">
                      <li>• Enable MFA for all users</li>
                      <li>• Rotate access keys regularly</li>
                      <li>• Use groups for permission assignment</li>
                      <li>• Follow least privilege principle</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-800 mb-1">Role & Policy Management:</h5>
                    <ul className="text-blue-700 space-y-1">
                      <li>• Regular policy audits and cleanup</li>
                      <li>• Use service-specific roles</li>
                      <li>• Implement time-based access</li>
                      <li>• Monitor cross-account access</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
