'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  HardDrive, 
  Camera, 
  Clock, 
  Shield, 
  Search, 
  Filter,
  Download,
  Trash2,
  Copy,
  AlertCircle,
  CheckCircle,
  Calendar,
  Database,
  DollarSign
} from 'lucide-react';

// Type Definitions for EBS Snapshots Planning
interface EBSSnapshot {
  id: string;
  volumeId: string;
  description: string;
  status: 'pending' | 'completed' | 'error' | 'in-progress';
  startTime: string;
  progress: number;
  encrypted: boolean;
  size: number; // in GB
  cost: number; // monthly cost in USD
  tags: { [key: string]: string };
  volumeType: 'gp3' | 'gp2' | 'io1' | 'io2' | 'st1' | 'sc1';
  region: string;
  accountId: string;
}

interface EBSVolume {
  id: string;
  name: string;
  type: 'gp3' | 'gp2' | 'io1' | 'io2' | 'st1' | 'sc1';
  size: number;
  encrypted: boolean;
  attachedInstance?: string;
  lastSnapshotDate?: string;
  snapshotCount: number;
  status: 'available' | 'in-use' | 'creating' | 'deleting';
  region: string;
}

interface SnapshotPolicy {
  id: string;
  name: string;
  description: string;
  volumeIds: string[];
  schedule: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  enabled: boolean;
  tags: { [key: string]: string };
}

// Mock Data for Planning Phase
const mockSnapshots: EBSSnapshot[] = [
  {
    id: 'snap-0123456789abcdef0',
    volumeId: 'vol-0123456789abcdef0',
    description: 'Daily backup of production database volume',
    status: 'completed',
    startTime: '2025-08-23T10:30:00Z',
    progress: 100,
    encrypted: true,
    size: 500,
    cost: 2.50,
    tags: { Environment: 'Production', Application: 'Database', Schedule: 'Daily' },
    volumeType: 'gp3',
    region: 'us-east-1',
    accountId: '123456789012'
  },
  {
    id: 'snap-0987654321fedcba1',
    volumeId: 'vol-0987654321fedcba1',
    description: 'Web server root volume backup',
    status: 'in-progress',
    startTime: '2025-08-23T11:00:00Z',
    progress: 65,
    encrypted: false,
    size: 100,
    cost: 0.50,
    tags: { Environment: 'Production', Application: 'WebServer', Schedule: 'Weekly' },
    volumeType: 'gp2',
    region: 'us-east-1',
    accountId: '123456789012'
  },
  {
    id: 'snap-0abcdef123456789',
    volumeId: 'vol-0abcdef123456789',
    description: 'Development environment snapshot',
    status: 'completed',
    startTime: '2025-08-22T18:00:00Z',
    progress: 100,
    encrypted: true,
    size: 50,
    cost: 0.25,
    tags: { Environment: 'Development', Application: 'Testing', Schedule: 'Manual' },
    volumeType: 'gp3',
    region: 'us-west-2',
    accountId: '123456789012'
  }
];

const mockVolumes: EBSVolume[] = [
  {
    id: 'vol-0123456789abcdef0',
    name: 'Production Database',
    type: 'gp3',
    size: 500,
    encrypted: true,
    attachedInstance: 'i-0123456789abcdef0',
    lastSnapshotDate: '2025-08-23T10:30:00Z',
    snapshotCount: 30,
    status: 'in-use',
    region: 'us-east-1'
  },
  {
    id: 'vol-0987654321fedcba1',
    name: 'Web Server Root',
    type: 'gp2',
    size: 100,
    encrypted: false,
    attachedInstance: 'i-0987654321fedcba1',
    lastSnapshotDate: '2025-08-20T11:00:00Z',
    snapshotCount: 12,
    status: 'in-use',
    region: 'us-east-1'
  },
  {
    id: 'vol-0abcdef123456789',
    name: 'Development Volume',
    type: 'gp3',
    size: 50,
    encrypted: true,
    attachedInstance: 'i-0abcdef123456789',
    lastSnapshotDate: '2025-08-22T18:00:00Z',
    snapshotCount: 5,
    status: 'in-use',
    region: 'us-west-2'
  }
];

const mockPolicies: SnapshotPolicy[] = [
  {
    id: 'policy-daily-prod',
    name: 'Production Daily Backups',
    description: 'Daily snapshots for all production volumes with 30-day retention',
    volumeIds: ['vol-0123456789abcdef0', 'vol-0987654321fedcba1'],
    schedule: 'daily',
    retentionDays: 30,
    enabled: true,
    tags: { Environment: 'Production', BackupType: 'Automated' }
  },
  {
    id: 'policy-weekly-dev',
    name: 'Development Weekly Backups',
    description: 'Weekly snapshots for development volumes with 7-day retention',
    volumeIds: ['vol-0abcdef123456789'],
    schedule: 'weekly',
    retentionDays: 7,
    enabled: true,
    tags: { Environment: 'Development', BackupType: 'Automated' }
  }
];

export function EBSSnapshotsManagement() {
  const [selectedTab, setSelectedTab] = useState('snapshots');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  // Filter functions for planning phase
  const filteredSnapshots = mockSnapshots.filter(snapshot => {
    const matchesSearch = snapshot.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snapshot.volumeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || snapshot.status === statusFilter;
    const matchesRegion = regionFilter === 'all' || snapshot.region === regionFilter;
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const totalSnapshotCost = mockSnapshots.reduce((sum, snapshot) => sum + snapshot.cost, 0);
  const totalSnapshots = mockSnapshots.length;
  const completedSnapshots = mockSnapshots.filter(s => s.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <HardDrive className="w-8 h-8 text-blue-600" />
            EBS Snapshots Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage EBS volume snapshots, automated backup policies, and cost optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Create Snapshot
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Snapshots</p>
                <p className="text-2xl font-bold text-gray-900">{totalSnapshots}</p>
              </div>
              <Database className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedSnapshots}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Cost</p>
                <p className="text-2xl font-bold text-gray-900">${totalSnapshotCost.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Protected Volumes</p>
                <p className="text-2xl font-bold text-blue-600">{mockVolumes.length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
          <TabsTrigger value="volumes">Volumes</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Snapshots Tab */}
        <TabsContent value="snapshots" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search snapshots..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="us-east-1">US East 1</SelectItem>
                    <SelectItem value="us-west-2">US West 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Snapshots List */}
          <div className="space-y-4">
            {filteredSnapshots.map((snapshot) => (
              <Card key={snapshot.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Camera className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{snapshot.description}</h3>
                        <p className="text-sm text-gray-600">{snapshot.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(snapshot.status)}>
                        {getStatusIcon(snapshot.status)}
                        <span className="ml-1 capitalize">{snapshot.status.replace('-', ' ')}</span>
                      </Badge>
                      {snapshot.encrypted && (
                        <Badge variant="outline" className="text-green-600">
                          <Shield className="w-3 h-3 mr-1" />
                          Encrypted
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Volume ID:</span>
                      <p className="text-gray-600">{snapshot.volumeId}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Size:</span>
                      <p className="text-gray-600">{snapshot.size} GB</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>
                      <p className="text-gray-600">{formatDate(snapshot.startTime)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Monthly Cost:</span>
                      <p className="text-gray-600">${snapshot.cost.toFixed(2)}</p>
                    </div>
                  </div>

                  {snapshot.status === 'in-progress' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-blue-600">{snapshot.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${snapshot.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-2">
                      {Object.entries(snapshot.tags).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}: {value}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Volumes Tab */}
        <TabsContent value="volumes" className="space-y-4">
          <div className="space-y-4">
            {mockVolumes.map((volume) => (
              <Card key={volume.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{volume.name}</h3>
                        <p className="text-sm text-gray-600">{volume.id}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        {volume.type.toUpperCase()}
                      </Badge>
                      <Badge className="bg-green-100 text-green-800">
                        {volume.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="font-medium text-gray-700">Size:</span>
                      <p className="text-gray-600">{volume.size} GB</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Snapshots:</span>
                      <p className="text-gray-600">{volume.snapshotCount}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Snapshot:</span>
                      <p className="text-gray-600">
                        {volume.lastSnapshotDate ? formatDate(volume.lastSnapshotDate) : 'Never'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Instance:</span>
                      <p className="text-gray-600">{volume.attachedInstance || 'Unattached'}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Camera className="w-4 h-4 mr-1" />
                      Create Snapshot
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <div className="space-y-4">
            {mockPolicies.map((policy) => (
              <Card key={policy.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{policy.name}</h3>
                      <p className="text-sm text-gray-600">{policy.description}</p>
                    </div>
                    <Badge className={policy.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                      {policy.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Schedule:</span>
                      <p className="text-gray-600 capitalize">{policy.schedule}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Retention:</span>
                      <p className="text-gray-600">{policy.retentionDays} days</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Volumes:</span>
                      <p className="text-gray-600">{policy.volumeIds.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Cost analytics and optimization recommendations would be displayed here.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Snapshot Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Snapshot creation and deletion trends over time would be shown here.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
