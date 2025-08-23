'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Zap, 
  Play, 
  Pause, 
  RotateCcw, 
  Activity, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Eye,
  Settings,
  Code,
  DollarSign,
  BarChart3,
  Filter,
  Search,
  Calendar,
  FileText,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';

interface LambdaFunction {
  functionName: string;
  description: string;
  runtime: string;
  handler: string;
  codeSize: number;
  timeout: number;
  memorySize: number;
  lastModified: string;
  state: 'Active' | 'Inactive' | 'Failed' | 'Pending';
  version: string;
  region: string;
  cost: {
    monthly: number;
    invocations: number;
    duration: number;
  };
  metrics: {
    invocations: number;
    errors: number;
    duration: number;
    throttles: number;
    successRate: number;
  };
  environment: Record<string, string>;
  triggers: string[];
  layers: string[];
}

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';
  message: string;
  requestId: string;
}

export function LambdaManagement() {
  const [functions, setFunctions] = useState<LambdaFunction[]>([
    {
      functionName: 'user-authentication-api',
      description: 'Handles user authentication and JWT token generation',
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      codeSize: 15.7,
      timeout: 30,
      memorySize: 512,
      lastModified: '2025-01-15T14:30:00Z',
      state: 'Active',
      version: '$LATEST',
      region: 'us-east-1',
      cost: {
        monthly: 12.45,
        invocations: 25680,
        duration: 145.2
      },
      metrics: {
        invocations: 25680,
        errors: 23,
        duration: 145.2,
        throttles: 2,
        successRate: 99.1
      },
      environment: {
        'NODE_ENV': 'production',
        'JWT_SECRET': '***masked***',
        'DB_HOST': 'prod-db.amazonaws.com'
      },
      triggers: ['API Gateway', 'CloudWatch Events'],
      layers: ['nodejs-common-libs', 'monitoring-layer']
    },
    {
      functionName: 'image-processing-worker',
      description: 'Processes uploaded images for thumbnails and optimization',
      runtime: 'python3.9',
      handler: 'lambda_function.lambda_handler',
      codeSize: 45.3,
      timeout: 300,
      memorySize: 1024,
      lastModified: '2025-01-12T09:15:00Z',
      state: 'Active',
      version: 'v1.2.3',
      region: 'us-west-2',
      cost: {
        monthly: 28.75,
        invocations: 8420,
        duration: 890.5
      },
      metrics: {
        invocations: 8420,
        errors: 45,
        duration: 890.5,
        throttles: 0,
        successRate: 94.7
      },
      environment: {
        'BUCKET_NAME': 'processed-images',
        'THUMBNAIL_SIZE': '200x200',
        'QUALITY': '85'
      },
      triggers: ['S3 Bucket'],
      layers: ['pillow-image-processing']
    },
    {
      functionName: 'backup-scheduler',
      description: 'Automated backup scheduling and monitoring for RDS instances',
      runtime: 'python3.11',
      handler: 'backup.schedule_handler',
      codeSize: 8.2,
      timeout: 900,
      memorySize: 256,
      lastModified: '2025-01-10T22:45:00Z',
      state: 'Failed',
      version: '$LATEST',
      region: 'eu-west-1',
      cost: {
        monthly: 5.20,
        invocations: 1440,
        duration: 125.8
      },
      metrics: {
        invocations: 1440,
        errors: 156,
        duration: 125.8,
        throttles: 0,
        successRate: 89.2
      },
      environment: {
        'RDS_INSTANCES': 'prod-mysql,dev-postgres',
        'BACKUP_RETENTION': '30',
        'NOTIFICATION_TOPIC': 'backup-alerts'
      },
      triggers: ['CloudWatch Events'],
      layers: ['boto3-rds-utils']
    },
    {
      functionName: 'data-analytics-etl',
      description: 'ETL pipeline for processing analytics data from S3 to Redshift',
      runtime: 'python3.10',
      handler: 'etl.process_data',
      codeSize: 67.8,
      timeout: 900,
      memorySize: 3008,
      lastModified: '2025-01-08T16:20:00Z',
      state: 'Inactive',
      version: 'v2.1.0',
      region: 'us-east-1',
      cost: {
        monthly: 156.30,
        invocations: 720,
        duration: 2450.7
      },
      metrics: {
        invocations: 720,
        errors: 12,
        duration: 2450.7,
        throttles: 5,
        successRate: 98.3
      },
      environment: {
        'REDSHIFT_CLUSTER': 'analytics-cluster',
        'S3_DATA_BUCKET': 'raw-analytics-data',
        'BATCH_SIZE': '10000'
      },
      triggers: ['S3 Bucket', 'CloudWatch Events'],
      layers: ['pandas-numpy', 'redshift-connector']
    }
  ]);

  const [selectedFunction, setSelectedFunction] = useState<LambdaFunction | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock log entries for the selected function
  const mockLogs: LogEntry[] = [
    {
      timestamp: '2025-01-15T14:35:22.123Z',
      level: 'INFO',
      message: 'Authentication request processed successfully',
      requestId: 'req-123abc'
    },
    {
      timestamp: '2025-01-15T14:35:15.456Z',
      level: 'ERROR',
      message: 'Invalid JWT token provided',
      requestId: 'req-456def'
    },
    {
      timestamp: '2025-01-15T14:35:10.789Z',
      level: 'INFO',
      message: 'Database connection established',
      requestId: 'req-789ghi'
    },
    {
      timestamp: '2025-01-15T14:35:05.012Z',
      level: 'WARN',
      message: 'Rate limit threshold approaching for IP 192.168.1.100',
      requestId: 'req-012jkl'
    }
  ];

  const filteredFunctions = functions.filter(func => {
    const matchesSearch = func.functionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         func.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || func.state.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getStateColor = (state: string) => {
    switch (state) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-600';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'Active': return CheckCircle;
      case 'Inactive': return Pause;
      case 'Failed': return XCircle;
      case 'Pending': return Clock;
      default: return AlertCircle;
    }
  };

  const formatBytes = (bytes: number) => {
    return `${bytes.toFixed(1)} MB`;
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const handleInvoke = (functionName: string) => {
    console.log(`Invoking function: ${functionName}`);
    // Mock function invocation
  };

  const handleUpdate = (functionName: string) => {
    console.log(`Updating function: ${functionName}`);
    // Mock function update
  };

  const handleToggleState = (functionName: string) => {
    setFunctions(prevFunctions =>
      prevFunctions.map(func =>
        func.functionName === functionName
          ? { ...func, state: func.state === 'Active' ? 'Inactive' : 'Active' as const }
          : func
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lambda Functions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage serverless functions, monitor performance, and view execution logs
          </p>
        </div>
        <Button className="flex items-center space-x-2">
          <Upload className="w-4 h-4" />
          <span>Deploy Function</span>
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search functions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All States</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Functions</p>
                <p className="text-2xl font-bold">{functions.length}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Functions</p>
                <p className="text-2xl font-bold text-green-600">
                  {functions.filter(f => f.state === 'Active').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Cost</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(functions.reduce((sum, f) => sum + f.cost.monthly, 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invocations</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatNumber(functions.reduce((sum, f) => sum + f.metrics.invocations, 0))}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Functions List */}
      <div className="grid gap-4">
        {filteredFunctions.map((func) => {
          const StateIcon = getStateIcon(func.state);
          return (
            <Card key={func.functionName} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <StateIcon className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">{func.functionName}</h3>
                      <Badge className={getStateColor(func.state)}>
                        {func.state}
                      </Badge>
                      <Badge variant="outline">{func.runtime}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{func.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Memory:</span>
                        <p className="font-medium">{func.memorySize} MB</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Timeout:</span>
                        <p className="font-medium">{func.timeout}s</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Code Size:</span>
                        <p className="font-medium">{formatBytes(func.codeSize)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Monthly Cost:</span>
                        <p className="font-medium text-blue-600">{formatCurrency(func.cost.monthly)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Invocations:</span>
                        <p className="font-medium">{formatNumber(func.metrics.invocations)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Success Rate:</span>
                        <p className={`font-medium ${func.metrics.successRate > 95 ? 'text-green-600' : 'text-orange-600'}`}>
                          {func.metrics.successRate}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInvoke(func.functionName)}
                      disabled={func.state !== 'Active'}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Invoke
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleState(func.functionName)}
                    >
                      {func.state === 'Active' ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Enable
                        </>
                      )}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFunction(func)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            <Zap className="w-5 h-5" />
                            <span>{func.functionName}</span>
                          </DialogTitle>
                          <DialogDescription>
                            Function details, metrics, and configuration
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedFunction && (
                          <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                              <TabsTrigger value="overview">Overview</TabsTrigger>
                              <TabsTrigger value="metrics">Metrics</TabsTrigger>
                              <TabsTrigger value="configuration">Configuration</TabsTrigger>
                              <TabsTrigger value="logs">Logs</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="overview" className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Function Name</Label>
                                  <p className="text-sm">{selectedFunction.functionName}</p>
                                </div>
                                <div>
                                  <Label>Runtime</Label>
                                  <p className="text-sm">{selectedFunction.runtime}</p>
                                </div>
                                <div>
                                  <Label>Handler</Label>
                                  <p className="text-sm">{selectedFunction.handler}</p>
                                </div>
                                <div>
                                  <Label>Version</Label>
                                  <p className="text-sm">{selectedFunction.version}</p>
                                </div>
                                <div>
                                  <Label>Region</Label>
                                  <p className="text-sm">{selectedFunction.region}</p>
                                </div>
                                <div>
                                  <Label>Last Modified</Label>
                                  <p className="text-sm">{new Date(selectedFunction.lastModified).toLocaleString()}</p>
                                </div>
                              </div>
                              <div>
                                <Label>Description</Label>
                                <p className="text-sm">{selectedFunction.description}</p>
                              </div>
                              <div>
                                <Label>Triggers</Label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {selectedFunction.triggers.map((trigger, index) => (
                                    <Badge key={index} variant="outline">{trigger}</Badge>
                                  ))}
                                </div>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="metrics" className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-center">
                                      <p className="text-sm text-gray-600">Invocations</p>
                                      <p className="text-2xl font-bold">{formatNumber(selectedFunction.metrics.invocations)}</p>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-center">
                                      <p className="text-sm text-gray-600">Errors</p>
                                      <p className="text-2xl font-bold text-red-600">{selectedFunction.metrics.errors}</p>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-center">
                                      <p className="text-sm text-gray-600">Success Rate</p>
                                      <p className={`text-2xl font-bold ${selectedFunction.metrics.successRate > 95 ? 'text-green-600' : 'text-orange-600'}`}>
                                        {selectedFunction.metrics.successRate}%
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-center">
                                      <p className="text-sm text-gray-600">Avg Duration</p>
                                      <p className="text-2xl font-bold">{selectedFunction.metrics.duration}ms</p>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-center">
                                      <p className="text-sm text-gray-600">Throttles</p>
                                      <p className="text-2xl font-bold text-yellow-600">{selectedFunction.metrics.throttles}</p>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-center">
                                      <p className="text-sm text-gray-600">Monthly Cost</p>
                                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedFunction.cost.monthly)}</p>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="configuration" className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Memory Size</Label>
                                  <p className="text-sm">{selectedFunction.memorySize} MB</p>
                                </div>
                                <div>
                                  <Label>Timeout</Label>
                                  <p className="text-sm">{selectedFunction.timeout} seconds</p>
                                </div>
                                <div>
                                  <Label>Code Size</Label>
                                  <p className="text-sm">{formatBytes(selectedFunction.codeSize)}</p>
                                </div>
                              </div>
                              
                              <div>
                                <Label>Environment Variables</Label>
                                <div className="mt-2 space-y-2">
                                  {Object.entries(selectedFunction.environment).map(([key, value]) => (
                                    <div key={key} className="flex justify-between py-2 px-3 bg-gray-50 rounded">
                                      <span className="font-medium">{key}</span>
                                      <span className="text-gray-600">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <Label>Layers</Label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {selectedFunction.layers.map((layer, index) => (
                                    <Badge key={index} variant="outline">{layer}</Badge>
                                  ))}
                                </div>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="logs" className="space-y-4">
                              <div className="flex justify-between items-center">
                                <Label>Recent Logs</Label>
                                <Button variant="outline" size="sm">
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Refresh
                                </Button>
                              </div>
                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                {mockLogs.map((log, index) => (
                                  <div key={index} className="p-3 border rounded-md bg-gray-50">
                                    <div className="flex items-center justify-between mb-1">
                                      <Badge variant={log.level === 'ERROR' ? 'destructive' : log.level === 'WARN' ? 'secondary' : 'outline'}>
                                        {log.level}
                                      </Badge>
                                      <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm">{log.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">Request ID: {log.requestId}</p>
                                  </div>
                                ))}
                              </div>
                            </TabsContent>
                          </Tabs>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredFunctions.length === 0 && (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No Lambda functions found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
