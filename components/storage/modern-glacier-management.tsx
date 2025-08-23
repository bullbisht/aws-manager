'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Archive, 
  Download, 
  Upload, 
  Clock, 
  DollarSign, 
  HardDrive,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  Eye,
  Zap,
  Snowflake,
  Settings,
  BarChart3,
  ArrowRight,
  Timer,
  Database
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToastHelpers } from '@/components/ui/toast';

interface S3StorageClass {
  type: 'STANDARD' | 'GLACIER_IR' | 'GLACIER' | 'DEEP_ARCHIVE';
  name: string;
  description: string;
  retrievalTime: string;
  costPerGB: number;
  icon: React.ComponentType<any>;
  color: string;
  restoreOptions: RestoreOption[];
}

interface RestoreOption {
  tier: 'Expedited' | 'Standard' | 'Bulk';
  time: string;
  costPerGB: number;
  available: boolean;
}

interface S3Object {
  key: string;
  size: number;
  sizeFormatted: string;
  lastModified: string;
  storageClass: string;
  etag: string;
  isRestored?: boolean;
  restoreExpiryDate?: string;
}

interface LifecycleRule {
  id: string;
  status: 'Enabled' | 'Disabled';
  filter: {
    prefix?: string;
    tags?: Record<string, string>;
  };
  transitions: Transition[];
  expiration?: {
    days?: number;
    deleteMarkerExpiration?: boolean;
  };
}

interface Transition {
  days: number;
  storageClass: string;
}

interface RestoreJob {
  objectKey: string;
  tier: string;
  status: 'InProgress' | 'Completed' | 'Failed';
  requestDate: string;
  expiryDate?: string;
  estimatedCompletionTime?: string;
}

export function ModernGlacierManagement() {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToastHelpers();
  
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [buckets, setBuckets] = useState<string[]>([]);
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [lifecycleRules, setLifecycleRules] = useState<LifecycleRule[]>([]);
  const [restoreJobs, setRestoreJobs] = useState<RestoreJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('objects');
  const [newRuleForm, setNewRuleForm] = useState(false);

  const storageClasses: S3StorageClass[] = [
    {
      type: 'STANDARD',
      name: 'S3 Standard',
      description: 'General purpose storage with high durability and availability',
      retrievalTime: 'Immediate',
      costPerGB: 0.023,
      icon: Database,
      color: 'bg-blue-100 text-blue-800',
      restoreOptions: []
    },
    {
      type: 'GLACIER_IR',
      name: 'Glacier Instant Retrieval',
      description: 'Archive storage with millisecond retrieval for frequently accessed data',
      retrievalTime: 'Milliseconds',
      costPerGB: 0.004,
      icon: Zap,
      color: 'bg-green-100 text-green-800',
      restoreOptions: [
        { tier: 'Standard', time: 'Milliseconds', costPerGB: 0.0004, available: true }
      ]
    },
    {
      type: 'GLACIER',
      name: 'Glacier Flexible Retrieval',
      description: 'Archive storage with configurable retrieval times from minutes to hours',
      retrievalTime: 'Minutes to 12 hours',
      costPerGB: 0.004,
      icon: Archive,
      color: 'bg-blue-100 text-blue-800',
      restoreOptions: [
        { tier: 'Expedited', time: '1-5 minutes', costPerGB: 0.03, available: true },
        { tier: 'Standard', time: '3-5 hours', costPerGB: 0.01, available: true },
        { tier: 'Bulk', time: '5-12 hours', costPerGB: 0.0025, available: true }
      ]
    },
    {
      type: 'DEEP_ARCHIVE',
      name: 'Glacier Deep Archive',
      description: 'Lowest-cost storage for long-term data retention and digital preservation',
      retrievalTime: '9 to 48 hours',
      costPerGB: 0.00099,
      icon: Snowflake,
      color: 'bg-purple-100 text-purple-800',
      restoreOptions: [
        { tier: 'Standard', time: '12 hours', costPerGB: 0.02, available: true },
        { tier: 'Bulk', time: '48 hours', costPerGB: 0.0025, available: true }
      ]
    }
  ];

  useEffect(() => {
    if (user) {
      fetchBuckets();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBucket) {
      fetchObjects();
      fetchLifecycleRules();
      fetchRestoreJobs();
    }
  }, [selectedBucket]);

  const fetchBuckets = async () => {
    try {
      setLoading(true);
      // Mock data - replace with real API call
      const mockBuckets = [
        'backup-storage-2024',
        'archive-data-vault',
        'compliance-documents',
        'long-term-backups'
      ];
      setBuckets(mockBuckets);
    } catch (error) {
      showError('Failed to fetch buckets', 'Unable to load S3 buckets');
    } finally {
      setLoading(false);
    }
  };

  const fetchObjects = async () => {
    try {
      // Mock data - replace with real API call
      const mockObjects: S3Object[] = [
        {
          key: 'database-backup-2024-01.sql.gz',
          size: 1073741824,
          sizeFormatted: '1.0 GB',
          lastModified: '2024-01-15T10:35:00Z',
          storageClass: 'GLACIER',
          etag: '"abc123def456"',
          isRestored: true,
          restoreExpiryDate: '2024-08-25T10:35:00Z'
        },
        {
          key: 'application-logs-q1-2024.tar.gz',
          size: 536870912,
          sizeFormatted: '512 MB',
          lastModified: '2024-03-31T23:59:00Z',
          storageClass: 'DEEP_ARCHIVE',
          etag: '"def456ghi789"'
        },
        {
          key: 'media-files-archive-2023.zip',
          size: 5368709120,
          sizeFormatted: '5.0 GB',
          lastModified: '2023-12-31T23:59:00Z',
          storageClass: 'GLACIER_IR',
          etag: '"ghi789jkl012"'
        }
      ];
      setObjects(mockObjects);
    } catch (error) {
      showError('Failed to fetch objects', 'Unable to load bucket objects');
    }
  };

  const fetchLifecycleRules = async () => {
    try {
      // Mock data - replace with real API call
      const mockRules: LifecycleRule[] = [
        {
          id: 'backup-lifecycle-rule',
          status: 'Enabled',
          filter: { prefix: 'backups/' },
          transitions: [
            { days: 30, storageClass: 'GLACIER' },
            { days: 365, storageClass: 'DEEP_ARCHIVE' }
          ],
          expiration: { days: 2555 } // 7 years
        },
        {
          id: 'logs-archive-rule',
          status: 'Enabled',
          filter: { prefix: 'logs/' },
          transitions: [
            { days: 1, storageClass: 'GLACIER_IR' },
            { days: 90, storageClass: 'DEEP_ARCHIVE' }
          ]
        }
      ];
      setLifecycleRules(mockRules);
    } catch (error) {
      showError('Failed to fetch lifecycle rules', 'Unable to load lifecycle configuration');
    }
  };

  const fetchRestoreJobs = async () => {
    try {
      // Mock data - replace with real API call
      const mockJobs: RestoreJob[] = [
        {
          objectKey: 'database-backup-2024-01.sql.gz',
          tier: 'Standard',
          status: 'Completed',
          requestDate: '2024-08-20T10:00:00Z',
          expiryDate: '2024-08-25T10:35:00Z'
        },
        {
          objectKey: 'application-logs-q1-2024.tar.gz',
          tier: 'Bulk',
          status: 'InProgress',
          requestDate: '2024-08-23T08:00:00Z',
          estimatedCompletionTime: '2024-08-24T08:00:00Z'
        }
      ];
      setRestoreJobs(mockJobs);
    } catch (error) {
      showError('Failed to fetch restore jobs', 'Unable to load restore operations');
    }
  };

  const initiateRestore = async (objectKey: string, tier: string, days: number = 7) => {
    try {
      // Mock restore initiation - replace with real API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newJob: RestoreJob = {
        objectKey,
        tier,
        status: 'InProgress',
        requestDate: new Date().toISOString(),
        estimatedCompletionTime: new Date(Date.now() + (tier === 'Expedited' ? 5 * 60 * 1000 : 
                                                       tier === 'Standard' ? 4 * 60 * 60 * 1000 : 
                                                       12 * 60 * 60 * 1000)).toISOString()
      };
      
      setRestoreJobs(prev => [...prev, newJob]);
      showSuccess('Restore initiated', `${tier} restore started for ${objectKey}`);
    } catch (error) {
      showError('Failed to initiate restore', 'Unable to start object restoration');
    }
  };

  const createLifecycleRule = async (rule: Partial<LifecycleRule>) => {
    try {
      // Mock rule creation - replace with real API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newRule: LifecycleRule = {
        id: `rule-${Date.now()}`,
        status: 'Enabled',
        filter: rule.filter || {},
        transitions: rule.transitions || [],
        expiration: rule.expiration
      };
      
      setLifecycleRules(prev => [...prev, newRule]);
      showSuccess('Lifecycle rule created', 'New lifecycle policy has been applied');
      setNewRuleForm(false);
    } catch (error) {
      showError('Failed to create rule', 'Unable to create lifecycle policy');
    }
  };

  const getStorageClassInfo = (storageClass: string) => {
    return storageClasses.find(sc => sc.type === storageClass) || storageClasses[0];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'InProgress': return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const calculateMonthlyCost = (objects: S3Object[]) => {
    return objects.reduce((total, obj) => {
      const storageClass = getStorageClassInfo(obj.storageClass);
      return total + (obj.size / (1024 * 1024 * 1024)) * storageClass.costPerGB;
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading storage management...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modern S3 Glacier Management</h1>
          <p className="text-gray-600">S3-integrated storage classes for intelligent archival and lifecycle management</p>
        </div>
        <div className="flex space-x-3">
          <Select value={selectedBucket} onValueChange={setSelectedBucket}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select S3 bucket" />
            </SelectTrigger>
            <SelectContent>
              {buckets.map((bucket) => (
                <SelectItem key={bucket} value={bucket}>
                  {bucket}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Storage Classes Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {storageClasses.map((storageClass) => {
          const Icon = storageClass.icon;
          return (
            <Card key={storageClass.type} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className="w-6 h-6 text-blue-600" />
                  <Badge className={storageClass.color}>
                    ${storageClass.costPerGB}/GB
                  </Badge>
                </div>
                <CardTitle className="text-lg">{storageClass.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">{storageClass.description}</p>
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Retrieval:</span>
                    <span className="font-medium">{storageClass.retrievalTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Cost:</span>
                    <span className="font-medium">${storageClass.costPerGB}/GB</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedBucket && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="objects">Objects</TabsTrigger>
            <TabsTrigger value="lifecycle">Lifecycle Rules</TabsTrigger>
            <TabsTrigger value="restore">Restore Jobs</TabsTrigger>
            <TabsTrigger value="analytics">Cost Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="objects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HardDrive className="w-5 h-5" />
                  <span>Objects in {selectedBucket}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {objects.map((obj) => {
                    const storageClassInfo = getStorageClassInfo(obj.storageClass);
                    const Icon = storageClassInfo.icon;
                    
                    return (
                      <div key={obj.key} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium flex items-center space-x-2">
                              <Icon className="w-4 h-4" />
                              <span>{obj.key}</span>
                            </h4>
                            <p className="text-sm text-gray-600">
                              {obj.sizeFormatted} • {new Date(obj.lastModified).toLocaleDateString()}
                            </p>
                            <Badge className={storageClassInfo.color} variant="outline">
                              {storageClassInfo.name}
                            </Badge>
                          </div>
                          
                          <div className="flex space-x-2">
                            {obj.isRestored ? (
                              <Badge className="bg-green-100 text-green-800">
                                Restored until {new Date(obj.restoreExpiryDate!).toLocaleDateString()}
                              </Badge>
                            ) : (
                              storageClassInfo.restoreOptions.length > 0 && (
                                <Select onValueChange={(tier) => initiateRestore(obj.key, tier)}>
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Restore" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {storageClassInfo.restoreOptions.map((option) => (
                                      <SelectItem key={option.tier} value={option.tier}>
                                        {option.tier} ({option.time})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )
                            )}
                          </div>
                        </div>
                        
                        {storageClassInfo.restoreOptions.length > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <h5 className="text-sm font-medium mb-2">Retrieval Options:</h5>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              {storageClassInfo.restoreOptions.map((option) => (
                                <div key={option.tier} className="text-center p-2 border rounded">
                                  <div className="font-medium">{option.tier}</div>
                                  <div className="text-gray-600">{option.time}</div>
                                  <div className="text-gray-600">${option.costPerGB}/GB</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lifecycle" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Lifecycle Rules</h3>
              <Button onClick={() => setNewRuleForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Rule
              </Button>
            </div>

            {newRuleForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Create Lifecycle Rule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Rule Name</Label>
                      <input 
                        type="text" 
                        placeholder="Enter rule name"
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <Label>Object Prefix Filter</Label>
                      <input 
                        type="text" 
                        placeholder="e.g., backups/"
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>Transition Rules</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm">Days</Label>
                          <input type="number" placeholder="30" className="w-full p-2 border rounded" />
                        </div>
                        <div>
                          <Label className="text-sm">To Storage Class</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GLACIER_IR">Glacier Instant Retrieval</SelectItem>
                              <SelectItem value="GLACIER">Glacier Flexible Retrieval</SelectItem>
                              <SelectItem value="DEEP_ARCHIVE">Glacier Deep Archive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <Button variant="outline" size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={() => createLifecycleRule({})}>
                        Create Rule
                      </Button>
                      <Button variant="outline" onClick={() => setNewRuleForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {lifecycleRules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{rule.id}</CardTitle>
                      <Badge variant={rule.status === 'Enabled' ? 'default' : 'secondary'}>
                        {rule.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Filter: </span>
                        <span className="font-medium">
                          {rule.filter.prefix ? `Prefix: ${rule.filter.prefix}` : 'All objects'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Transitions:</span>
                        <div className="mt-2 flex space-x-4">
                          {rule.transitions.map((transition, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Badge variant="outline">{transition.days} days</Badge>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                              <Badge className="bg-blue-100 text-blue-800">
                                {transition.storageClass}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      {rule.expiration && (
                        <div>
                          <span className="text-sm text-gray-600">Expiration: </span>
                          <Badge variant="destructive">{rule.expiration.days} days</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="restore" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>Active Restore Jobs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {restoreJobs.map((job, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{job.objectKey}</h4>
                          <p className="text-sm text-gray-600">
                            {job.tier} retrieval • Requested {new Date(job.requestDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(job.status)}
                          <Badge variant={
                            job.status === 'Completed' ? 'default' :
                            job.status === 'Failed' ? 'destructive' : 'secondary'
                          }>
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {job.status === 'InProgress' && job.estimatedCompletionTime && (
                        <p className="text-sm text-blue-600">
                          Estimated completion: {new Date(job.estimatedCompletionTime).toLocaleString()}
                        </p>
                      )}
                      
                      {job.status === 'Completed' && job.expiryDate && (
                        <p className="text-sm text-green-600">
                          Available until: {new Date(job.expiryDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Monthly Cost</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${calculateMonthlyCost(objects).toFixed(2)}</div>
                  <p className="text-sm text-gray-600">Current month estimate</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Total Objects</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{objects.length}</div>
                  <p className="text-sm text-gray-600">Across all storage classes</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <HardDrive className="w-5 h-5" />
                    <span>Total Size</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(objects.reduce((total, obj) => total + obj.size, 0) / (1024 * 1024 * 1024)).toFixed(1)} GB
                  </div>
                  <p className="text-sm text-gray-600">Total storage used</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Storage Class Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {storageClasses.map((storageClass) => {
                    const classObjects = objects.filter(obj => obj.storageClass === storageClass.type);
                    const totalSize = classObjects.reduce((total, obj) => total + obj.size, 0);
                    const sizeGB = totalSize / (1024 * 1024 * 1024);
                    const monthlyCost = sizeGB * storageClass.costPerGB;
                    
                    return (
                      <div key={storageClass.type} className="flex justify-between items-center p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <storageClass.icon className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium">{storageClass.name}</div>
                            <div className="text-sm text-gray-600">{classObjects.length} objects</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{sizeGB.toFixed(2)} GB</div>
                          <div className="text-sm text-gray-600">${monthlyCost.toFixed(2)}/month</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Migration Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-yellow-800">
            <AlertCircle className="w-5 h-5" />
            <span>Modern S3 Glacier Model</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-yellow-700 space-y-2">
            <p>This interface uses the modern S3 storage classes instead of legacy Glacier vaults.</p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="font-semibold mb-2">✅ Benefits</h4>
                <ul className="text-sm space-y-1">
                  <li>• Unified S3 API and IAM policies</li>
                  <li>• Automated lifecycle transitions</li>
                  <li>• Simplified restore operations</li>
                  <li>• Better tooling integration</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🔄 Migration Path</h4>
                <ul className="text-sm space-y-1">
                  <li>• Create lifecycle policies</li>
                  <li>• Set up automated transitions</li>
                  <li>• Migrate existing vault data</li>
                  <li>• Enable cost optimization</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
