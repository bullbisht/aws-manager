'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Archive, 
  RotateCcw, 
  Lock, 
  FileText, 
  Settings, 
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface BucketInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  bucketName: string;
}

interface BucketConfiguration {
  // Bucket basic info
  name: string;
  region: string;
  creationDate: string;
  
  // Configuration settings
  versioning: {
    status: 'Enabled' | 'Suspended' | 'Disabled';
    mfaDelete?: 'Enabled' | 'Disabled';
  };
  
  // Access policies
  publicAccess: {
    blockPublicAcls: boolean;
    ignorePublicAcls: boolean;
    blockPublicPolicy: boolean;
    restrictPublicBuckets: boolean;
  };
  
  // Encryption settings
  encryption: {
    serverSideEncryption: 'AES256' | 'aws:kms' | 'None';
    kmsMasterKeyId?: string;
    bucketKeyEnabled?: boolean;
  };
  
  // Lifecycle rules
  lifecycleRules: Array<{
    id: string;
    status: 'Enabled' | 'Disabled';
    transitions: Array<{
      days: number;
      storageClass: string;
    }>;
    expiration?: {
      days: number;
    };
  }>;
  
  // Logging configuration
  logging: {
    enabled: boolean;
    targetBucket?: string;
    targetPrefix?: string;
  };
  
  // Additional settings
  website: {
    enabled: boolean;
    indexDocument?: string;
    errorDocument?: string;
  };
  
  cors: {
    enabled: boolean;
    rules: number;
  };
  
  notification: {
    enabled: boolean;
    configurations: number;
  };
}

export function BucketInfoModal({ isOpen, onClose, bucketName }: BucketInfoModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bucketConfig, setBucketConfig] = useState<BucketConfiguration | null>(null);

  useEffect(() => {
    if (isOpen && bucketName) {
      fetchBucketConfiguration();
    }
  }, [isOpen, bucketName]);

  const fetchBucketConfiguration = async () => {
    setLoading(true);
    setError('');
    
    try {
      // For now, we'll simulate the bucket configuration data
      // In a real implementation, you would call multiple AWS APIs:
      // - GetBucketVersioning
      // - GetPublicAccessBlock
      // - GetBucketEncryption
      // - GetBucketLifecycleConfiguration
      // - GetBucketLogging
      // - GetBucketWebsite
      // - GetBucketCors
      // - GetBucketNotificationConfiguration
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in real implementation, this would come from AWS APIs
      const mockConfig: BucketConfiguration = {
        name: bucketName,
        region: 'us-east-1',
        creationDate: new Date().toISOString(),
        versioning: {
          status: 'Enabled',
          mfaDelete: 'Disabled'
        },
        publicAccess: {
          blockPublicAcls: true,
          ignorePublicAcls: true,
          blockPublicPolicy: true,
          restrictPublicBuckets: true
        },
        encryption: {
          serverSideEncryption: 'AES256',
          bucketKeyEnabled: true
        },
        lifecycleRules: [
          {
            id: 'delete-old-versions',
            status: 'Enabled',
            transitions: [
              { days: 30, storageClass: 'STANDARD_IA' },
              { days: 90, storageClass: 'GLACIER' }
            ],
            expiration: { days: 365 }
          }
        ],
        logging: {
          enabled: false
        },
        website: {
          enabled: false
        },
        cors: {
          enabled: false,
          rules: 0
        },
        notification: {
          enabled: false,
          configurations: 0
        }
      };
      
      setBucketConfig(mockConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bucket configuration');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean | string) => {
    if (typeof status === 'boolean') {
      return status ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      );
    }
    
    switch (status) {
      case 'Enabled':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Disabled':
      case 'Suspended':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: boolean | string, trueLabel = 'Enabled', falseLabel = 'Disabled') => {
    if (typeof status === 'boolean') {
      return (
        <Badge variant={status ? 'default' : 'secondary'}>
          {status ? trueLabel : falseLabel}
        </Badge>
      );
    }
    
    const variant = status === 'Enabled' ? 'default' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Bucket Configuration - {bucketName}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading bucket configuration...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load configuration</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <Button onClick={fetchBucketConfiguration} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          ) : bucketConfig ? (
            <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Bucket Name</label>
                    <p className="text-sm text-gray-900">{bucketConfig.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Region</label>
                    <p className="text-sm text-gray-900">{bucketConfig.region}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700">Creation Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(bucketConfig.creationDate).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Access Policies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Access Policies & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Public Access Block Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Block public ACLs</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(bucketConfig.publicAccess.blockPublicAcls)}
                        {getStatusBadge(bucketConfig.publicAccess.blockPublicAcls, 'Blocked', 'Allowed')}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Ignore public ACLs</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(bucketConfig.publicAccess.ignorePublicAcls)}
                        {getStatusBadge(bucketConfig.publicAccess.ignorePublicAcls, 'Ignored', 'Considered')}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Block public policy</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(bucketConfig.publicAccess.blockPublicPolicy)}
                        {getStatusBadge(bucketConfig.publicAccess.blockPublicPolicy, 'Blocked', 'Allowed')}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Restrict public buckets</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(bucketConfig.publicAccess.restrictPublicBuckets)}
                        {getStatusBadge(bucketConfig.publicAccess.restrictPublicBuckets, 'Restricted', 'Unrestricted')}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Versioning Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Versioning Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Versioning Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(bucketConfig.versioning.status)}
                      {getStatusBadge(bucketConfig.versioning.status)}
                    </div>
                  </div>
                  {bucketConfig.versioning.mfaDelete && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">MFA Delete</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(bucketConfig.versioning.mfaDelete)}
                        {getStatusBadge(bucketConfig.versioning.mfaDelete)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Encryption Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Encryption Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Server-side Encryption</span>
                    <Badge variant={bucketConfig.encryption.serverSideEncryption !== 'None' ? 'default' : 'secondary'}>
                      {bucketConfig.encryption.serverSideEncryption}
                    </Badge>
                  </div>
                  {bucketConfig.encryption.kmsMasterKeyId && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">KMS Master Key ID</label>
                      <p className="text-sm text-gray-900 font-mono">{bucketConfig.encryption.kmsMasterKeyId}</p>
                    </div>
                  )}
                  {bucketConfig.encryption.bucketKeyEnabled !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Bucket Key</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(bucketConfig.encryption.bucketKeyEnabled)}
                        {getStatusBadge(bucketConfig.encryption.bucketKeyEnabled)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lifecycle Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5" />
                  Lifecycle Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bucketConfig.lifecycleRules.length > 0 ? (
                  <div className="space-y-4">
                    {bucketConfig.lifecycleRules.map((rule, index) => (
                      <div key={rule.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{rule.id}</h4>
                          {getStatusBadge(rule.status)}
                        </div>
                        <div className="space-y-2">
                          {rule.transitions.map((transition, idx) => (
                            <div key={idx} className="text-sm text-gray-600">
                              <span className="font-medium">Transition to {transition.storageClass}</span> after {transition.days} days
                            </div>
                          ))}
                          {rule.expiration && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Expiration</span> after {rule.expiration.days} days
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No lifecycle rules configured</p>
                )}
              </CardContent>
            </Card>

            {/* Logging Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Logging Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Access Logging</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(bucketConfig.logging.enabled)}
                      {getStatusBadge(bucketConfig.logging.enabled)}
                    </div>
                  </div>
                  {bucketConfig.logging.enabled && bucketConfig.logging.targetBucket && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Target Bucket</label>
                        <p className="text-sm text-gray-900">{bucketConfig.logging.targetBucket}</p>
                      </div>
                      {bucketConfig.logging.targetPrefix && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Target Prefix</label>
                          <p className="text-sm text-gray-900">{bucketConfig.logging.targetPrefix}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Additional Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Static Website Hosting</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(bucketConfig.website.enabled)}
                      {getStatusBadge(bucketConfig.website.enabled)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">CORS Configuration</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(bucketConfig.cors.enabled)}
                      {getStatusBadge(bucketConfig.cors.enabled)}
                      {bucketConfig.cors.rules > 0 && (
                        <span className="text-xs text-gray-500">({bucketConfig.cors.rules} rules)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Event Notifications</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(bucketConfig.notification.enabled)}
                      {getStatusBadge(bucketConfig.notification.enabled)}
                      {bucketConfig.notification.configurations > 0 && (
                        <span className="text-xs text-gray-500">({bucketConfig.notification.configurations} configs)</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-200">
          <Button onClick={onClose} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
