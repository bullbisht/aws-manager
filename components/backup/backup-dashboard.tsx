'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  Clock, 
  Database, 
  Server, 
  HardDrive, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Plus,
  Eye
} from 'lucide-react';

// Mock data types
interface BackupVault {
  id: string;
  name: string;
  status: 'Active' | 'Creating' | 'Deleting';
  encryption: 'AWS_OWNED_KMS_KEY' | 'AWS_MANAGED_KMS_KEY' | 'CUSTOMER_MANAGED_KMS_KEY';
  createdAt: string;
  numberOfBackups: number;
  storageUsed: string;
  lockConfiguration?: {
    minRetentionDays: number;
    maxRetentionDays: number;
  };
}

interface BackupPlan {
  id: string;
  name: string;
  status: 'Active' | 'Creating' | 'Deleting';
  rulesCount: number;
  resourcesCount: number;
  lastExecutionTime?: string;
  nextExecutionTime?: string;
  createdAt: string;
  rules: BackupRule[];
}

interface BackupRule {
  id: string;
  name: string;
  targetVault: string;
  schedule: string;
  lifecycle?: {
    moveToColdStorageAfterDays?: number;
    deleteAfterDays?: number;
  };
  recoveryPointTags?: Record<string, string>;
}

interface BackupJob {
  id: string;
  planName: string;
  resourceArn: string;
  resourceType: 'EC2' | 'RDS' | 'DynamoDB' | 'EFS' | 'S3' | 'FSx';
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ABORTED' | 'EXPIRED';
  createdAt: string;
  completedAt?: string;
  backupSizeBytes?: number;
  percentDone?: number;
  errorMessage?: string;
}

interface RestoreJob {
  id: string;
  resourceType: 'EC2' | 'RDS' | 'DynamoDB' | 'EFS' | 'S3' | 'FSx';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ABORTED';
  createdAt: string;
  completedAt?: string;
  sourceBackupVault: string;
  targetResourceArn?: string;
  percentDone?: number;
  errorMessage?: string;
}

// Mock data
const mockBackupVaults: BackupVault[] = [
  {
    id: 'vault-1',
    name: 'production-backup-vault',
    status: 'Active',
    encryption: 'AWS_MANAGED_KMS_KEY',
    createdAt: '2024-01-15T10:00:00Z',
    numberOfBackups: 245,
    storageUsed: '2.4 TB',
    lockConfiguration: {
      minRetentionDays: 30,
      maxRetentionDays: 365
    }
  },
  {
    id: 'vault-2',
    name: 'development-backup-vault',
    status: 'Active',
    encryption: 'AWS_OWNED_KMS_KEY',
    createdAt: '2024-02-01T14:30:00Z',
    numberOfBackups: 89,
    storageUsed: '456 GB'
  },
  {
    id: 'vault-3',
    name: 'compliance-vault',
    status: 'Creating',
    encryption: 'CUSTOMER_MANAGED_KMS_KEY',
    createdAt: '2024-03-10T09:15:00Z',
    numberOfBackups: 0,
    storageUsed: '0 B',
    lockConfiguration: {
      minRetentionDays: 90,
      maxRetentionDays: 2555 // 7 years
    }
  }
];

const mockBackupPlans: BackupPlan[] = [
  {
    id: 'plan-1',
    name: 'production-daily-backup',
    status: 'Active',
    rulesCount: 3,
    resourcesCount: 12,
    lastExecutionTime: '2024-03-10T02:00:00Z',
    nextExecutionTime: '2024-03-11T02:00:00Z',
    createdAt: '2024-01-15T10:00:00Z',
    rules: [
      {
        id: 'rule-1',
        name: 'daily-backup-rule',
        targetVault: 'production-backup-vault',
        schedule: 'cron(0 2 * * ? *)', // Daily at 2 AM
        lifecycle: {
          moveToColdStorageAfterDays: 30,
          deleteAfterDays: 365
        },
        recoveryPointTags: {
          Environment: 'Production',
          BackupType: 'Daily'
        }
      },
      {
        id: 'rule-2',
        name: 'weekly-backup-rule',
        targetVault: 'production-backup-vault',
        schedule: 'cron(0 3 ? * SUN *)', // Weekly on Sunday at 3 AM
        lifecycle: {
          moveToColdStorageAfterDays: 7,
          deleteAfterDays: 1095 // 3 years
        }
      }
    ]
  },
  {
    id: 'plan-2',
    name: 'database-backup-plan',
    status: 'Active',
    rulesCount: 2,
    resourcesCount: 5,
    lastExecutionTime: '2024-03-10T03:30:00Z',
    nextExecutionTime: '2024-03-11T03:30:00Z',
    createdAt: '2024-02-01T14:30:00Z',
    rules: [
      {
        id: 'rule-3',
        name: 'db-hourly-backup',
        targetVault: 'production-backup-vault',
        schedule: 'cron(0 * * * ? *)', // Hourly
        lifecycle: {
          deleteAfterDays: 7
        }
      }
    ]
  }
];

const mockBackupJobs: BackupJob[] = [
  {
    id: 'job-1',
    planName: 'production-daily-backup',
    resourceArn: 'arn:aws:ec2:us-east-1:123456789012:instance/i-1234567890abcdef0',
    resourceType: 'EC2',
    status: 'COMPLETED',
    createdAt: '2024-03-10T02:00:00Z',
    completedAt: '2024-03-10T02:45:00Z',
    backupSizeBytes: 53687091200, // 50 GB
    percentDone: 100
  },
  {
    id: 'job-2',
    planName: 'database-backup-plan',
    resourceArn: 'arn:aws:rds:us-east-1:123456789012:db:production-db',
    resourceType: 'RDS',
    status: 'RUNNING',
    createdAt: '2024-03-10T03:30:00Z',
    backupSizeBytes: 107374182400, // 100 GB
    percentDone: 65
  },
  {
    id: 'job-3',
    planName: 'production-daily-backup',
    resourceArn: 'arn:aws:dynamodb:us-east-1:123456789012:table/UserProfiles',
    resourceType: 'DynamoDB',
    status: 'FAILED',
    createdAt: '2024-03-10T02:15:00Z',
    completedAt: '2024-03-10T02:16:00Z',
    errorMessage: 'Insufficient permissions to access DynamoDB table'
  }
];

const mockRestoreJobs: RestoreJob[] = [
  {
    id: 'restore-1',
    resourceType: 'RDS',
    status: 'COMPLETED',
    createdAt: '2024-03-09T14:00:00Z',
    completedAt: '2024-03-09T16:30:00Z',
    sourceBackupVault: 'production-backup-vault',
    targetResourceArn: 'arn:aws:rds:us-east-1:123456789012:db:restored-db',
    percentDone: 100
  },
  {
    id: 'restore-2',
    resourceType: 'EC2',
    status: 'RUNNING',
    createdAt: '2024-03-10T10:00:00Z',
    sourceBackupVault: 'production-backup-vault',
    percentDone: 45
  }
];

export default function BackupDashboard() {
  const [backupVaults, setBackupVaults] = useState<BackupVault[]>(mockBackupVaults);
  const [backupPlans, setBackupPlans] = useState<BackupPlan[]>(mockBackupPlans);
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>(mockBackupJobs);
  const [restoreJobs, setRestoreJobs] = useState<RestoreJob[]>(mockRestoreJobs);
  
  // Create vault dialog state
  const [isCreateVaultOpen, setIsCreateVaultOpen] = useState(false);
  const [newVaultName, setNewVaultName] = useState('');
  const [newVaultEncryption, setNewVaultEncryption] = useState<string>('AWS_MANAGED_KMS_KEY');

  // Create backup plan dialog state
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [selectedVault, setSelectedVault] = useState<string>('');

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const formatSchedule = (cronExpression: string): string => {
    const scheduleMap: Record<string, string> = {
      'cron(0 2 * * ? *)': 'Daily at 2:00 AM',
      'cron(0 3 ? * SUN *)': 'Weekly on Sunday at 3:00 AM',
      'cron(0 * * * ? *)': 'Hourly',
    };
    return scheduleMap[cronExpression] || cronExpression;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'Active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'RUNNING':
      case 'PENDING':
      case 'Creating':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'FAILED':
      case 'ABORTED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'EXPIRED':
      case 'Deleting':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getResourceTypeIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'EC2':
        return <Server className="h-4 w-4" />;
      case 'RDS':
        return <Database className="h-4 w-4" />;
      case 'DynamoDB':
        return <Database className="h-4 w-4" />;
      case 'EFS':
      case 'S3':
      case 'FSx':
        return <HardDrive className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const handleCreateVault = () => {
    if (!newVaultName.trim()) return;

    const newVault: BackupVault = {
      id: `vault-${Date.now()}`,
      name: newVaultName,
      status: 'Creating',
      encryption: newVaultEncryption as any,
      createdAt: new Date().toISOString(),
      numberOfBackups: 0,
      storageUsed: '0 B'
    };

    setBackupVaults([...backupVaults, newVault]);
    setNewVaultName('');
    setIsCreateVaultOpen(false);

    // Simulate vault creation completion
    setTimeout(() => {
      setBackupVaults(prev => 
        prev.map(vault => 
          vault.id === newVault.id 
            ? { ...vault, status: 'Active' as const }
            : vault
        )
      );
    }, 3000);
  };

  const handleCreateBackupPlan = () => {
    if (!newPlanName.trim() || !selectedVault) return;

    const newPlan: BackupPlan = {
      id: `plan-${Date.now()}`,
      name: newPlanName,
      status: 'Creating',
      rulesCount: 0,
      resourcesCount: 0,
      createdAt: new Date().toISOString(),
      rules: []
    };

    setBackupPlans([...backupPlans, newPlan]);
    setNewPlanName('');
    setSelectedVault('');
    setIsCreatePlanOpen(false);

    // Simulate plan creation completion
    setTimeout(() => {
      setBackupPlans(prev => 
        prev.map(plan => 
          plan.id === newPlan.id 
            ? { ...plan, status: 'Active' as const }
            : plan
        )
      );
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AWS Backup Dashboard</h1>
          <p className="text-muted-foreground">
            Centralized backup management across AWS services
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isCreateVaultOpen} onOpenChange={setIsCreateVaultOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Vault
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Backup Vault</DialogTitle>
                <DialogDescription>
                  Create a new backup vault to store your backup recovery points.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="vault-name">Vault Name</Label>
                  <Input
                    id="vault-name"
                    value={newVaultName}
                    onChange={(e) => setNewVaultName(e.target.value)}
                    placeholder="Enter vault name"
                  />
                </div>
                <div>
                  <Label htmlFor="vault-encryption">Encryption</Label>
                  <Select value={newVaultEncryption} onValueChange={setNewVaultEncryption}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AWS_OWNED_KMS_KEY">AWS Owned KMS Key</SelectItem>
                      <SelectItem value="AWS_MANAGED_KMS_KEY">AWS Managed KMS Key</SelectItem>
                      <SelectItem value="CUSTOMER_MANAGED_KMS_KEY">Customer Managed KMS Key</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateVaultOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateVault} disabled={!newVaultName.trim()}>
                    Create Vault
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Backup Plan</DialogTitle>
                <DialogDescription>
                  Create a new backup plan to define backup rules and schedules.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="plan-name">Plan Name</Label>
                  <Input
                    id="plan-name"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="Enter plan name"
                  />
                </div>
                <div>
                  <Label htmlFor="target-vault">Target Vault</Label>
                  <Select value={selectedVault} onValueChange={setSelectedVault}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vault" />
                    </SelectTrigger>
                    <SelectContent>
                      {backupVaults.filter(vault => vault.status === 'Active').map((vault) => (
                        <SelectItem key={vault.id} value={vault.name}>
                          {vault.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreatePlanOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBackupPlan} disabled={!newPlanName.trim() || !selectedVault}>
                    Create Plan
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vaults</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backupVaults.length}</div>
            <p className="text-xs text-muted-foreground">
              {backupVaults.filter(v => v.status === 'Active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backup Plans</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backupPlans.length}</div>
            <p className="text-xs text-muted-foreground">
              {backupPlans.filter(p => p.status === 'Active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Jobs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backupJobs.filter(j => j.status === 'RUNNING').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {backupJobs.filter(j => j.status === 'COMPLETED').length} completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.9 TB</div>
            <p className="text-xs text-muted-foreground">
              Across all vaults
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="vaults" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vaults">Backup Vaults</TabsTrigger>
          <TabsTrigger value="plans">Backup Plans</TabsTrigger>
          <TabsTrigger value="jobs">Backup Jobs</TabsTrigger>
          <TabsTrigger value="restores">Restore Jobs</TabsTrigger>
        </TabsList>

        {/* Backup Vaults Tab */}
        <TabsContent value="vaults">
          <div className="grid gap-4">
            {backupVaults.map((vault) => (
              <Card key={vault.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{vault.name}</CardTitle>
                      <Badge variant={vault.status === 'Active' ? 'default' : 'secondary'}>
                        {vault.status}
                      </Badge>
                      {vault.lockConfiguration && (
                        <Badge variant="outline">
                          <Shield className="h-3 w-3 mr-1" />
                          Vault Lock
                        </Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Encryption</p>
                      <p className="font-medium">{vault.encryption.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Backups</p>
                      <p className="font-medium">{vault.numberOfBackups}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Storage Used</p>
                      <p className="font-medium">{vault.storageUsed}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">{formatDateTime(vault.createdAt)}</p>
                    </div>
                  </div>
                  {vault.lockConfiguration && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Vault Lock Configuration</p>
                      <p className="text-sm text-muted-foreground">
                        Min retention: {vault.lockConfiguration.minRetentionDays} days, 
                        Max retention: {vault.lockConfiguration.maxRetentionDays} days
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Backup Plans Tab */}
        <TabsContent value="plans">
          <div className="grid gap-4">
            {backupPlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <Badge variant={plan.status === 'Active' ? 'default' : 'secondary'}>
                        {plan.status}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Rules
                      </Button>
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Run Now
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-muted-foreground">Rules</p>
                      <p className="font-medium">{plan.rulesCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Resources</p>
                      <p className="font-medium">{plan.resourcesCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Execution</p>
                      <p className="font-medium">
                        {plan.lastExecutionTime ? formatDateTime(plan.lastExecutionTime) : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Next Execution</p>
                      <p className="font-medium">
                        {plan.nextExecutionTime ? formatDateTime(plan.nextExecutionTime) : 'Not scheduled'}
                      </p>
                    </div>
                  </div>
                  
                  {plan.rules.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Backup Rules</p>
                      {plan.rules.map((rule) => (
                        <div key={rule.id} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{rule.name}</p>
                            <Badge variant="outline">{formatSchedule(rule.schedule)}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Target Vault</p>
                              <p>{rule.targetVault}</p>
                            </div>
                            {rule.lifecycle && (
                              <div>
                                <p className="text-muted-foreground">Lifecycle</p>
                                <p>
                                  {rule.lifecycle.moveToColdStorageAfterDays && 
                                    `Cold: ${rule.lifecycle.moveToColdStorageAfterDays}d, `}
                                  Delete: {rule.lifecycle.deleteAfterDays}d
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Backup Jobs Tab */}
        <TabsContent value="jobs">
          <div className="grid gap-4">
            {backupJobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getResourceTypeIcon(job.resourceType)}
                      <CardTitle className="text-lg">{job.resourceType} Backup</CardTitle>
                      <Badge 
                        variant={
                          job.status === 'COMPLETED' ? 'default' : 
                          job.status === 'RUNNING' ? 'secondary' : 
                          'destructive'
                        }
                      >
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(job.status)}
                          <span>{job.status}</span>
                        </div>
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {job.planName}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Resource ARN</p>
                      <p className="text-sm font-mono break-all">{job.resourceArn}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Started</p>
                        <p className="font-medium">{formatDateTime(job.createdAt)}</p>
                      </div>
                      {job.completedAt && (
                        <div>
                          <p className="text-muted-foreground">Completed</p>
                          <p className="font-medium">{formatDateTime(job.completedAt)}</p>
                        </div>
                      )}
                      {job.backupSizeBytes && (
                        <div>
                          <p className="text-muted-foreground">Backup Size</p>
                          <p className="font-medium">{formatBytes(job.backupSizeBytes)}</p>
                        </div>
                      )}
                    </div>

                    {job.status === 'RUNNING' && job.percentDone && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{job.percentDone}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${job.percentDone}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {job.errorMessage && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{job.errorMessage}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Restore Jobs Tab */}
        <TabsContent value="restores">
          <div className="grid gap-4">
            {restoreJobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getResourceTypeIcon(job.resourceType)}
                      <CardTitle className="text-lg">{job.resourceType} Restore</CardTitle>
                      <Badge 
                        variant={
                          job.status === 'COMPLETED' ? 'default' : 
                          job.status === 'RUNNING' || job.status === 'PENDING' ? 'secondary' : 
                          'destructive'
                        }
                      >
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(job.status)}
                          <span>{job.status}</span>
                        </div>
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Source Vault</p>
                        <p className="font-medium">{job.sourceBackupVault}</p>
                      </div>
                      {job.targetResourceArn && (
                        <div>
                          <p className="text-muted-foreground">Target Resource</p>
                          <p className="font-mono text-xs break-all">{job.targetResourceArn}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Started</p>
                        <p className="font-medium">{formatDateTime(job.createdAt)}</p>
                      </div>
                      {job.completedAt && (
                        <div>
                          <p className="text-muted-foreground">Completed</p>
                          <p className="font-medium">{formatDateTime(job.completedAt)}</p>
                        </div>
                      )}
                    </div>

                    {job.status === 'RUNNING' && job.percentDone && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{job.percentDone}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${job.percentDone}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {job.errorMessage && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{job.errorMessage}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
