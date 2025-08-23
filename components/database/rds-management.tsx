'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Play, 
  Square, 
  RotateCcw, 
  Settings, 
  Activity, 
  DollarSign,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Gauge,
  Archive,
  Upload,
  Download,
  Eye
} from 'lucide-react';

interface RDSInstance {
  dbInstanceIdentifier: string;
  dbName: string;
  engine: string;
  engineVersion: string;
  dbInstanceClass: string;
  allocatedStorage: number;
  storageType: string;
  multiAZ: boolean;
  publiclyAccessible: boolean;
  vpcSecurityGroups: string[];
  dbSubnetGroup: string;
  availabilityZone: string;
  backupRetentionPeriod: number;
  preferredBackupWindow: string;
  preferredMaintenanceWindow: string;
  latestRestorableTime: string;
  autoMinorVersionUpgrade: boolean;
  readReplicaSourceDBInstanceIdentifier?: string;
  readReplicaDBInstanceIdentifiers: string[];
  dbInstanceStatus: 'available' | 'creating' | 'modifying' | 'starting' | 'stopping' | 'stopped' | 'maintenance' | 'failed';
  endpoint: {
    address: string;
    port: number;
  };
  created: string;
  cost: {
    monthly: number;
    storage: number;
    compute: number;
    backup: number;
  };
  performance: {
    cpuUtilization: number;
    connectionCount: number;
    readLatency: number;
    writeLatency: number;
    readThroughput: number;
    writeThroughput: number;
    freeStorageSpace: number;
  };
  security: {
    encryptionAtRest: boolean;
    encryptionInTransit: boolean;
    monitoringInterval: number;
    performanceInsightsEnabled: boolean;
  };
}

const mockRDSInstances: RDSInstance[] = [
  {
    dbInstanceIdentifier: 'prod-app-db',
    dbName: 'production_app',
    engine: 'mysql',
    engineVersion: '8.0.35',
    dbInstanceClass: 'db.r6g.large',
    allocatedStorage: 100,
    storageType: 'gp3',
    multiAZ: true,
    publiclyAccessible: false,
    vpcSecurityGroups: ['sg-0123456789abcdef0'],
    dbSubnetGroup: 'prod-db-subnet-group',
    availabilityZone: 'us-east-1a',
    backupRetentionPeriod: 7,
    preferredBackupWindow: '03:00-04:00',
    preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
    latestRestorableTime: '2025-01-23T10:30:00Z',
    autoMinorVersionUpgrade: true,
    readReplicaDBInstanceIdentifiers: ['prod-app-db-read-replica'],
    dbInstanceStatus: 'available',
    endpoint: {
      address: 'prod-app-db.cluster-xyz.us-east-1.rds.amazonaws.com',
      port: 3306
    },
    created: '2025-01-15T08:00:00Z',
    cost: {
      monthly: 245.50,
      storage: 45.00,
      compute: 180.50,
      backup: 20.00
    },
    performance: {
      cpuUtilization: 45.2,
      connectionCount: 23,
      readLatency: 2.1,
      writeLatency: 3.4,
      readThroughput: 1250.5,
      writeThroughput: 890.2,
      freeStorageSpace: 65.8
    },
    security: {
      encryptionAtRest: true,
      encryptionInTransit: true,
      monitoringInterval: 60,
      performanceInsightsEnabled: true
    }
  },
  {
    dbInstanceIdentifier: 'staging-app-db',
    dbName: 'staging_app',
    engine: 'postgresql',
    engineVersion: '15.4',
    dbInstanceClass: 'db.t3.medium',
    allocatedStorage: 50,
    storageType: 'gp2',
    multiAZ: false,
    publiclyAccessible: true,
    vpcSecurityGroups: ['sg-staging123456789'],
    dbSubnetGroup: 'staging-db-subnet-group',
    availabilityZone: 'us-east-1b',
    backupRetentionPeriod: 3,
    preferredBackupWindow: '02:00-03:00',
    preferredMaintenanceWindow: 'sat:03:00-sat:04:00',
    latestRestorableTime: '2025-01-23T09:45:00Z',
    autoMinorVersionUpgrade: false,
    readReplicaDBInstanceIdentifiers: [],
    dbInstanceStatus: 'available',
    endpoint: {
      address: 'staging-app-db.cluster-abc.us-east-1.rds.amazonaws.com',
      port: 5432
    },
    created: '2025-01-20T14:30:00Z',
    cost: {
      monthly: 89.20,
      storage: 15.50,
      compute: 68.70,
      backup: 5.00
    },
    performance: {
      cpuUtilization: 28.7,
      connectionCount: 8,
      readLatency: 1.8,
      writeLatency: 2.9,
      readThroughput: 420.3,
      writeThroughput: 290.8,
      freeStorageSpace: 78.5
    },
    security: {
      encryptionAtRest: false,
      encryptionInTransit: false,
      monitoringInterval: 0,
      performanceInsightsEnabled: false
    }
  },
  {
    dbInstanceIdentifier: 'analytics-warehouse',
    dbName: 'data_warehouse',
    engine: 'aurora-mysql',
    engineVersion: '8.0.mysql_aurora.3.02.0',
    dbInstanceClass: 'db.r6g.xlarge',
    allocatedStorage: 0, // Aurora storage is automatic
    storageType: 'aurora',
    multiAZ: true,
    publiclyAccessible: false,
    vpcSecurityGroups: ['sg-analytics789012345'],
    dbSubnetGroup: 'analytics-db-subnet-group',
    availabilityZone: 'us-east-1c',
    backupRetentionPeriod: 14,
    preferredBackupWindow: '01:00-02:00',
    preferredMaintenanceWindow: 'mon:02:00-mon:03:00',
    latestRestorableTime: '2025-01-23T11:00:00Z',
    autoMinorVersionUpgrade: true,
    readReplicaDBInstanceIdentifiers: ['analytics-warehouse-reader-1', 'analytics-warehouse-reader-2'],
    dbInstanceStatus: 'available',
    endpoint: {
      address: 'analytics-warehouse.cluster-def.us-east-1.rds.amazonaws.com',
      port: 3306
    },
    created: '2025-01-10T12:00:00Z',
    cost: {
      monthly: 445.75,
      storage: 120.25,
      compute: 295.50,
      backup: 30.00
    },
    performance: {
      cpuUtilization: 62.8,
      connectionCount: 45,
      readLatency: 1.2,
      writeLatency: 2.1,
      readThroughput: 2890.7,
      writeThroughput: 1450.3,
      freeStorageSpace: 0 // Aurora auto-scaling
    },
    security: {
      encryptionAtRest: true,
      encryptionInTransit: true,
      monitoringInterval: 15,
      performanceInsightsEnabled: true
    }
  },
  {
    dbInstanceIdentifier: 'dev-test-db',
    dbName: 'development',
    engine: 'mariadb',
    engineVersion: '10.11.4',
    dbInstanceClass: 'db.t3.micro',
    allocatedStorage: 20,
    storageType: 'gp2',
    multiAZ: false,
    publiclyAccessible: true,
    vpcSecurityGroups: ['sg-dev456789012345'],
    dbSubnetGroup: 'dev-db-subnet-group',
    availabilityZone: 'us-east-1a',
    backupRetentionPeriod: 1,
    preferredBackupWindow: '05:00-06:00',
    preferredMaintenanceWindow: 'tue:06:00-tue:07:00',
    latestRestorableTime: '2025-01-23T08:15:00Z',
    autoMinorVersionUpgrade: true,
    readReplicaDBInstanceIdentifiers: [],
    dbInstanceStatus: 'stopped',
    endpoint: {
      address: 'dev-test-db.cluster-ghi.us-east-1.rds.amazonaws.com',
      port: 3306
    },
    created: '2025-01-22T16:45:00Z',
    cost: {
      monthly: 15.30,
      storage: 5.20,
      compute: 8.10,
      backup: 2.00
    },
    performance: {
      cpuUtilization: 0,
      connectionCount: 0,
      readLatency: 0,
      writeLatency: 0,
      readThroughput: 0,
      writeThroughput: 0,
      freeStorageSpace: 85.5
    },
    security: {
      encryptionAtRest: false,
      encryptionInTransit: false,
      monitoringInterval: 0,
      performanceInsightsEnabled: false
    }
  }
];

interface RDSManagementProps {}

export function RDSManagement({}: RDSManagementProps) {
  const [instances, setInstances] = useState<RDSInstance[]>(mockRDSInstances);
  const [selectedInstance, setSelectedInstance] = useState<RDSInstance | null>(instances[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all');

  const filteredInstances = instances.filter(instance => {
    if (filter === 'running') return ['available', 'modifying', 'starting'].includes(instance.dbInstanceStatus);
    if (filter === 'stopped') return instance.dbInstanceStatus === 'stopped';
    return true;
  });

  const handleInstanceAction = async (instanceId: string, action: 'start' | 'stop' | 'restart' | 'backup') => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    setInstances(prev => prev.map(instance => {
      if (instance.dbInstanceIdentifier === instanceId) {
        let newStatus = instance.dbInstanceStatus;
        
        switch (action) {
          case 'start':
            newStatus = 'starting';
            break;
          case 'stop':
            newStatus = 'stopping';
            break;
          case 'restart':
            newStatus = 'modifying';
            break;
          case 'backup':
            // Backup doesn't change status
            break;
        }

        return { ...instance, dbInstanceStatus: newStatus };
      }
      return instance;
    }));

    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'stopped': return 'bg-red-100 text-red-800';
      case 'starting': case 'stopping': case 'modifying': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'stopped': return <XCircle className="w-4 h-4" />;
      case 'starting': case 'stopping': case 'modifying': return <Clock className="w-4 h-4" />;
      case 'maintenance': return <Settings className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatBytes = (bytes: number) => `${bytes.toFixed(1)} GB`;
  const formatLatency = (ms: number) => `${ms.toFixed(1)}ms`;
  const formatThroughput = (ops: number) => `${ops.toFixed(1)} ops/sec`;

  const totalMonthlyCost = instances.reduce((sum, instance) => sum + instance.cost.monthly, 0);
  const activeInstances = instances.filter(i => ['available', 'modifying'].includes(i.dbInstanceStatus)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">RDS Database Management</h2>
          <p className="text-gray-600">Manage your Amazon RDS database instances and clusters</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Monthly Cost</div>
            <div className="text-lg font-semibold text-green-600">{formatCurrency(totalMonthlyCost)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Active Instances</div>
            <div className="text-lg font-semibold text-blue-600">{activeInstances} / {instances.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Instances List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Database Instances</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant={filter === 'all' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All
                  </Button>
                  <Button 
                    variant={filter === 'running' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setFilter('running')}
                  >
                    Running
                  </Button>
                  <Button 
                    variant={filter === 'stopped' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setFilter('stopped')}
                  >
                    Stopped
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredInstances.map((instance) => (
                <div 
                  key={instance.dbInstanceIdentifier}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedInstance?.dbInstanceIdentifier === instance.dbInstanceIdentifier 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedInstance(instance)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{instance.dbInstanceIdentifier}</div>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(instance.dbInstanceStatus)}
                      <Badge className={getStatusColor(instance.dbInstanceStatus)}>
                        {instance.dbInstanceStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>{instance.engine} {instance.engineVersion}</div>
                    <div>{instance.dbInstanceClass} • {formatCurrency(instance.cost.monthly)}/mo</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Instance Details */}
        <div className="lg:col-span-2">
          {selectedInstance ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedInstance.dbInstanceIdentifier}</CardTitle>
                    <p className="text-gray-600">{selectedInstance.dbName}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInstanceAction(selectedInstance.dbInstanceIdentifier, 'backup')}
                      disabled={isLoading || selectedInstance.dbInstanceStatus !== 'available'}
                    >
                      <Archive className="w-4 h-4 mr-1" />
                      Backup
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInstanceAction(selectedInstance.dbInstanceIdentifier, 'restart')}
                      disabled={isLoading || selectedInstance.dbInstanceStatus !== 'available'}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Restart
                    </Button>
                    {selectedInstance.dbInstanceStatus === 'available' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInstanceAction(selectedInstance.dbInstanceIdentifier, 'stop')}
                        disabled={isLoading}
                      >
                        <Square className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInstanceAction(selectedInstance.dbInstanceIdentifier, 'start')}
                        disabled={isLoading}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="configuration">Configuration</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Cost Breakdown
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Compute:</span>
                              <span className="font-medium">{formatCurrency(selectedInstance.cost.compute)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Storage:</span>
                              <span className="font-medium">{formatCurrency(selectedInstance.cost.storage)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Backup:</span>
                              <span className="font-medium">{formatCurrency(selectedInstance.cost.backup)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="font-medium">Total Monthly:</span>
                              <span className="font-bold text-green-600">{formatCurrency(selectedInstance.cost.monthly)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center">
                            <Database className="w-4 h-4 mr-2" />
                            Instance Info
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Engine:</span>
                              <span className="font-medium">{selectedInstance.engine} {selectedInstance.engineVersion}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Instance Class:</span>
                              <span className="font-medium">{selectedInstance.dbInstanceClass}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Storage:</span>
                              <span className="font-medium">
                                {selectedInstance.allocatedStorage > 0 ? `${selectedInstance.allocatedStorage} GB` : 'Auto-scaling'} ({selectedInstance.storageType})
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Multi-AZ:</span>
                              <span className="font-medium">{selectedInstance.multiAZ ? 'Yes' : 'No'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center">
                          <Activity className="w-4 h-4 mr-2" />
                          Connection Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Endpoint:</div>
                            <div className="font-mono text-xs bg-gray-50 p-2 rounded mt-1">
                              {selectedInstance.endpoint.address}:{selectedInstance.endpoint.port}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Availability Zone:</div>
                            <div className="font-medium">{selectedInstance.availabilityZone}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="performance" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center">
                            <Gauge className="w-4 h-4 mr-2" />
                            CPU Utilization
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{selectedInstance.performance.cpuUtilization}%</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${selectedInstance.performance.cpuUtilization}%` }}
                            ></div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center">
                            <Activity className="w-4 h-4 mr-2" />
                            Connections
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{selectedInstance.performance.connectionCount}</div>
                          <div className="text-sm text-gray-600">Active connections</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Latency
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Read:</span>
                              <span className="font-medium">{formatLatency(selectedInstance.performance.readLatency)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Write:</span>
                              <span className="font-medium">{formatLatency(selectedInstance.performance.writeLatency)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center">
                            <Download className="w-4 h-4 mr-2" />
                            Read Throughput
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{formatThroughput(selectedInstance.performance.readThroughput)}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center">
                            <Upload className="w-4 h-4 mr-2" />
                            Write Throughput
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{formatThroughput(selectedInstance.performance.writeThroughput)}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center">
                            <Database className="w-4 h-4 mr-2" />
                            Free Storage
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {selectedInstance.performance.freeStorageSpace > 0 
                              ? `${selectedInstance.performance.freeStorageSpace}%` 
                              : 'Auto-scaling'
                            }
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="configuration" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Backup Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Retention Period:</span>
                            <span className="font-medium">{selectedInstance.backupRetentionPeriod} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Backup Window:</span>
                            <span className="font-medium">{selectedInstance.preferredBackupWindow}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Latest Restorable:</span>
                            <span className="font-medium">{new Date(selectedInstance.latestRestorableTime).toLocaleString()}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Maintenance Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Maintenance Window:</span>
                            <span className="font-medium">{selectedInstance.preferredMaintenanceWindow}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Auto Minor Version Upgrade:</span>
                            <span className="font-medium">{selectedInstance.autoMinorVersionUpgrade ? 'Enabled' : 'Disabled'}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Read Replicas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedInstance.readReplicaDBInstanceIdentifiers.length > 0 ? (
                          <div className="space-y-2">
                            {selectedInstance.readReplicaDBInstanceIdentifiers.map((replica) => (
                              <div key={replica} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="font-medium">{replica}</span>
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No read replicas configured</div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="security" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            Encryption
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Encryption at Rest:</span>
                            <span className={`font-medium ${selectedInstance.security.encryptionAtRest ? 'text-green-600' : 'text-red-600'}`}>
                              {selectedInstance.security.encryptionAtRest ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Encryption in Transit:</span>
                            <span className={`font-medium ${selectedInstance.security.encryptionInTransit ? 'text-green-600' : 'text-red-600'}`}>
                              {selectedInstance.security.encryptionInTransit ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center">
                            <Eye className="w-4 h-4 mr-2" />
                            Monitoring
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Monitoring Interval:</span>
                            <span className="font-medium">
                              {selectedInstance.security.monitoringInterval > 0 ? `${selectedInstance.security.monitoringInterval}s` : 'Disabled'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Performance Insights:</span>
                            <span className={`font-medium ${selectedInstance.security.performanceInsightsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                              {selectedInstance.security.performanceInsightsEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Network Security</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Publicly Accessible:</span>
                          <span className={`font-medium ${selectedInstance.publiclyAccessible ? 'text-yellow-600' : 'text-green-600'}`}>
                            {selectedInstance.publiclyAccessible ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">DB Subnet Group:</span>
                          <span className="font-medium">{selectedInstance.dbSubnetGroup}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Security Groups:</span>
                          <div className="mt-1 space-y-1">
                            {selectedInstance.vpcSecurityGroups.map((sg) => (
                              <div key={sg} className="font-mono text-xs bg-gray-50 p-1 rounded">{sg}</div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a database instance to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
