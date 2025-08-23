'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Server, 
  Play, 
  Square, 
  RotateCcw, 
  Monitor, 
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface EC2Instance {
  instanceId: string;
  name: string;
  instanceType: string;
  state: 'running' | 'stopped' | 'stopping' | 'starting' | 'pending' | 'terminated';
  region: string;
  launchTime: string;
  publicIp?: string;
  privateIp: string;
  keyName?: string;
  securityGroups: string[];
  cost: {
    hourly: number;
    monthly: number;
  };
  specs: {
    vcpus: number;
    memory: string;
    storage: string;
    network: string;
  };
  monitoring: {
    cpuUtilization: number;
    networkIn: string;
    networkOut: string;
    statusChecks: 'passed' | 'failed' | 'pending';
  };
}

export function EC2Management() {
  const [instances, setInstances] = useState<EC2Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all');

  // Mock data for demonstration - in production, this would come from AWS API
  useEffect(() => {
    const mockInstances: EC2Instance[] = [
      {
        instanceId: 'i-0123456789abcdef0',
        name: 'Web Server',
        instanceType: 't3.medium',
        state: 'running',
        region: 'ap-south-1',
        launchTime: '2025-01-15T10:30:00Z',
        publicIp: '203.0.113.42',
        privateIp: '10.0.1.15',
        keyName: 'my-web-key',
        securityGroups: ['sg-web-servers', 'sg-ssh-access'],
        cost: {
          hourly: 0.0416,
          monthly: 30.37
        },
        specs: {
          vcpus: 2,
          memory: '4 GiB',
          storage: '20 GiB EBS',
          network: 'Up to 5 Gbps'
        },
        monitoring: {
          cpuUtilization: 45.2,
          networkIn: '1.2 MB/s',
          networkOut: '0.8 MB/s',
          statusChecks: 'passed'
        }
      },
      {
        instanceId: 'i-0987654321fedcba0',
        name: 'Database Server',
        instanceType: 'm5.large',
        state: 'running',
        region: 'ap-south-1',
        launchTime: '2025-01-10T08:15:00Z',
        publicIp: undefined,
        privateIp: '10.0.2.25',
        keyName: 'my-db-key',
        securityGroups: ['sg-database', 'sg-internal'],
        cost: {
          hourly: 0.096,
          monthly: 70.08
        },
        specs: {
          vcpus: 2,
          memory: '8 GiB',
          storage: '100 GiB EBS',
          network: 'Up to 10 Gbps'
        },
        monitoring: {
          cpuUtilization: 25.8,
          networkIn: '0.5 MB/s',
          networkOut: '0.3 MB/s',
          statusChecks: 'passed'
        }
      },
      {
        instanceId: 'i-0abcdef123456789',
        name: 'Development Environment',
        instanceType: 't3.small',
        state: 'stopped',
        region: 'ap-south-1',
        launchTime: '2025-01-20T14:45:00Z',
        publicIp: undefined,
        privateIp: '10.0.3.35',
        keyName: 'dev-key',
        securityGroups: ['sg-development'],
        cost: {
          hourly: 0.0208,
          monthly: 15.18
        },
        specs: {
          vcpus: 1,
          memory: '2 GiB',
          storage: '20 GiB EBS',
          network: 'Up to 5 Gbps'
        },
        monitoring: {
          cpuUtilization: 0,
          networkIn: '0 MB/s',
          networkOut: '0 MB/s',
          statusChecks: 'pending'
        }
      }
    ];

    // Simulate API call delay
    setTimeout(() => {
      setInstances(mockInstances);
      setLoading(false);
    }, 1000);
  }, []);

  const getStateColor = (state: EC2Instance['state']) => {
    switch (state) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'stopped': return 'bg-red-100 text-red-800';
      case 'stopping': return 'bg-yellow-100 text-yellow-800';
      case 'starting': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'terminated': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStateIcon = (state: EC2Instance['state']) => {
    switch (state) {
      case 'running': return <CheckCircle className="w-4 h-4" />;
      case 'stopped': return <XCircle className="w-4 h-4" />;
      case 'stopping': return <Clock className="w-4 h-4" />;
      case 'starting': return <Play className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'terminated': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const handleInstanceAction = async (instanceId: string, action: 'start' | 'stop' | 'reboot') => {
    setActionLoading(instanceId);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update instance state
    setInstances(prev => prev.map(instance => {
      if (instance.instanceId === instanceId) {
        let newState: EC2Instance['state'];
        switch (action) {
          case 'start':
            newState = 'starting';
            break;
          case 'stop':
            newState = 'stopping';
            break;
          case 'reboot':
            newState = 'starting';
            break;
          default:
            newState = instance.state;
        }
        return { ...instance, state: newState };
      }
      return instance;
    }));

    setActionLoading(null);

    // Simulate final state change after action completes
    setTimeout(() => {
      setInstances(prev => prev.map(instance => {
        if (instance.instanceId === instanceId) {
          let finalState: EC2Instance['state'];
          switch (action) {
            case 'start':
            case 'reboot':
              finalState = 'running';
              break;
            case 'stop':
              finalState = 'stopped';
              break;
            default:
              finalState = instance.state;
          }
          return { ...instance, state: finalState };
        }
        return instance;
      }));
    }, 3000);
  };

  const filteredInstances = instances.filter(instance => {
    if (filter === 'all') return true;
    return instance.state === filter;
  });

  const totalCost = instances
    .filter(i => i.state === 'running')
    .reduce((sum, instance) => sum + instance.cost.monthly, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">EC2 Instance Management</h1>
        <p className="text-gray-600">Manage your Amazon EC2 virtual servers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Server className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Instances</p>
                <p className="text-2xl font-bold text-gray-900">{instances.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Running</p>
                <p className="text-2xl font-bold text-gray-900">
                  {instances.filter(i => i.state === 'running').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stopped</p>
                <p className="text-2xl font-bold text-gray-900">
                  {instances.filter(i => i.state === 'stopped').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Cost</p>
                <p className="text-2xl font-bold text-gray-900">${totalCost.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All Instances
        </Button>
        <Button
          variant={filter === 'running' ? 'default' : 'outline'}
          onClick={() => setFilter('running')}
          size="sm"
        >
          Running
        </Button>
        <Button
          variant={filter === 'stopped' ? 'default' : 'outline'}
          onClick={() => setFilter('stopped')}
          size="sm"
        >
          Stopped
        </Button>
      </div>

      {/* Instances Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredInstances.map((instance) => (
          <Card key={instance.instanceId} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{instance.name}</CardTitle>
                <Badge className={getStateColor(instance.state)}>
                  <div className="flex items-center space-x-1">
                    {getStateIcon(instance.state)}
                    <span className="capitalize">{instance.state}</span>
                  </div>
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{instance.instanceId}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Instance Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-gray-500" />
                  <span>{instance.instanceType}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MemoryStick className="w-4 h-4 text-gray-500" />
                  <span>{instance.specs.memory}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-gray-500" />
                  <span>{instance.specs.storage}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Network className="w-4 h-4 text-gray-500" />
                  <span>{instance.privateIp}</span>
                </div>
              </div>

              {/* Monitoring Data */}
              {instance.state === 'running' && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Current Metrics</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">CPU Utilization:</span>
                      <span className="font-medium">{instance.monitoring.cpuUtilization}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Network In:</span>
                      <span className="font-medium">{instance.monitoring.networkIn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status Checks:</span>
                      <span className={`font-medium ${
                        instance.monitoring.statusChecks === 'passed' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {instance.monitoring.statusChecks}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cost Information */}
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-800">Monthly Cost:</span>
                  <span className="font-semibold text-blue-900">${instance.cost.monthly}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-600">Hourly Rate:</span>
                  <span className="text-xs text-blue-700">${instance.cost.hourly}/hour</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                {instance.state === 'stopped' && (
                  <Button
                    onClick={() => handleInstanceAction(instance.instanceId, 'start')}
                    disabled={actionLoading === instance.instanceId}
                    size="sm"
                    className="flex-1"
                  >
                    {actionLoading === instance.instanceId ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        <span>Starting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <Play className="w-3 h-3" />
                        <span>Start</span>
                      </div>
                    )}
                  </Button>
                )}
                
                {instance.state === 'running' && (
                  <>
                    <Button
                      onClick={() => handleInstanceAction(instance.instanceId, 'stop')}
                      disabled={actionLoading === instance.instanceId}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {actionLoading === instance.instanceId ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                          <span>Stopping...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <Square className="w-3 h-3" />
                          <span>Stop</span>
                        </div>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => handleInstanceAction(instance.instanceId, 'reboot')}
                      disabled={actionLoading === instance.instanceId}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {actionLoading === instance.instanceId ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                          <span>Rebooting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <RotateCcw className="w-3 h-3" />
                          <span>Reboot</span>
                        </div>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInstances.length === 0 && (
        <div className="text-center py-12">
          <Server className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No instances found</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'You have no EC2 instances in this region'
              : `No ${filter} instances found`
            }
          </p>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-blue-50 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">EC2 Management Features</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Instance Operations</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• Start, stop, and reboot instances</li>
              <li>• Real-time monitoring and metrics</li>
              <li>• Cost tracking and optimization</li>
              <li>• Status health checks</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Coming Soon</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• Launch new instances</li>
              <li>• Modify instance types</li>
              <li>• Security group management</li>
              <li>• Backup and snapshot integration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
