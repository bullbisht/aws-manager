'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Eye
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToastHelpers } from '@/components/ui/toast';

interface GlacierVault {
  vaultName: string;
  vaultARN: string;
  creationDate: string;
  lastInventoryDate?: string;
  numberOfArchives: number;
  sizeInBytes: number;
  sizeFormatted: string;
}

interface GlacierArchive {
  archiveId: string;
  description: string;
  creationDate: string;
  size: number;
  sizeFormatted: string;
  sha256TreeHash: string;
}

interface RetrievalJob {
  jobId: string;
  jobDescription: string;
  action: 'ArchiveRetrieval' | 'InventoryRetrieval';
  archiveId?: string;
  statusCode: 'InProgress' | 'Succeeded' | 'Failed';
  statusMessage: string;
  creationDate: string;
  completionDate?: string;
  tier: 'Expedited' | 'Standard' | 'Bulk';
}

export function GlacierManagement() {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToastHelpers();
  
  const [vaults, setVaults] = useState<GlacierVault[]>([]);
  const [selectedVault, setSelectedVault] = useState<string>('');
  const [archives, setArchives] = useState<GlacierArchive[]>([]);
  const [retrievalJobs, setRetrievalJobs] = useState<RetrievalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newVaultName, setNewVaultName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchVaults();
    }
  }, [user]);

  useEffect(() => {
    if (selectedVault) {
      fetchArchives(selectedVault);
      fetchRetrievalJobs(selectedVault);
    }
  }, [selectedVault]);

  const fetchVaults = async () => {
    try {
      setLoading(true);
      // Mock data for now - will be replaced with real API calls
      const mockVaults: GlacierVault[] = [
        {
          vaultName: 'backup-vault-2024',
          vaultARN: 'arn:aws:glacier:us-east-1:123456789012:vaults/backup-vault-2024',
          creationDate: '2024-01-15T10:30:00Z',
          lastInventoryDate: '2024-08-20T02:00:00Z',
          numberOfArchives: 156,
          sizeInBytes: 2147483648,
          sizeFormatted: '2.0 GB'
        },
        {
          vaultName: 'long-term-storage',
          vaultARN: 'arn:aws:glacier:us-east-1:123456789012:vaults/long-term-storage',
          creationDate: '2023-12-01T14:20:00Z',
          lastInventoryDate: '2024-08-19T02:00:00Z',
          numberOfArchives: 89,
          sizeInBytes: 5368709120,
          sizeFormatted: '5.0 GB'
        }
      ];
      setVaults(mockVaults);
    } catch (error) {
      showError('Failed to fetch vaults', 'Unable to load Glacier vaults');
    } finally {
      setLoading(false);
    }
  };

  const fetchArchives = async (vaultName: string) => {
    try {
      // Mock data for now - will be replaced with real API calls
      const mockArchives: GlacierArchive[] = [
        {
          archiveId: 'archive-001-2024',
          description: 'Database backup - January 2024',
          creationDate: '2024-01-15T10:35:00Z',
          size: 1073741824,
          sizeFormatted: '1.0 GB',
          sha256TreeHash: 'abc123def456...'
        },
        {
          archiveId: 'archive-002-2024',
          description: 'Application logs - Q1 2024',
          creationDate: '2024-03-31T23:59:00Z',
          size: 536870912,
          sizeFormatted: '512 MB',
          sha256TreeHash: 'def456ghi789...'
        }
      ];
      setArchives(mockArchives);
    } catch (error) {
      showError('Failed to fetch archives', 'Unable to load vault archives');
    }
  };

  const fetchRetrievalJobs = async (vaultName: string) => {
    try {
      // Mock data for now - will be replaced with real API calls
      const mockJobs: RetrievalJob[] = [
        {
          jobId: 'job-001-retrieval',
          jobDescription: 'Retrieve database backup',
          action: 'ArchiveRetrieval',
          archiveId: 'archive-001-2024',
          statusCode: 'Succeeded',
          statusMessage: 'Retrieval completed successfully',
          creationDate: '2024-08-20T10:00:00Z',
          completionDate: '2024-08-20T14:30:00Z',
          tier: 'Standard'
        },
        {
          jobId: 'job-002-inventory',
          jobDescription: 'Vault inventory update',
          action: 'InventoryRetrieval',
          statusCode: 'InProgress',
          statusMessage: 'Inventory retrieval in progress',
          creationDate: '2024-08-23T08:00:00Z',
          tier: 'Standard'
        }
      ];
      setRetrievalJobs(mockJobs);
    } catch (error) {
      showError('Failed to fetch jobs', 'Unable to load retrieval jobs');
    }
  };

  const createVault = async () => {
    if (!newVaultName.trim()) {
      showError('Vault name required', 'Please enter a vault name');
      return;
    }

    try {
      setCreating(true);
      // Mock vault creation - will be replaced with real API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newVault: GlacierVault = {
        vaultName: newVaultName,
        vaultARN: `arn:aws:glacier:us-east-1:123456789012:vaults/${newVaultName}`,
        creationDate: new Date().toISOString(),
        numberOfArchives: 0,
        sizeInBytes: 0,
        sizeFormatted: '0 B'
      };
      
      setVaults(prev => [...prev, newVault]);
      setNewVaultName('');
      setShowCreateForm(false);
      showSuccess('Vault created', `Vault "${newVaultName}" created successfully`);
    } catch (error) {
      showError('Failed to create vault', 'Unable to create Glacier vault');
    } finally {
      setCreating(false);
    }
  };

  const initiateRetrieval = async (archiveId: string, tier: 'Expedited' | 'Standard' | 'Bulk') => {
    try {
      // Mock retrieval initiation - will be replaced with real API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newJob: RetrievalJob = {
        jobId: `job-${Date.now()}`,
        jobDescription: `Retrieve archive ${archiveId}`,
        action: 'ArchiveRetrieval',
        archiveId,
        statusCode: 'InProgress',
        statusMessage: 'Retrieval job initiated',
        creationDate: new Date().toISOString(),
        tier
      };
      
      setRetrievalJobs(prev => [...prev, newJob]);
      showSuccess('Retrieval initiated', `${tier} retrieval job started for archive`);
    } catch (error) {
      showError('Failed to initiate retrieval', 'Unable to start archive retrieval');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Succeeded': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'InProgress': return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRetrievalCost = (tier: string, sizeGB: number) => {
    const costs = {
      'Expedited': sizeGB * 0.03,
      'Standard': sizeGB * 0.01,
      'Bulk': sizeGB * 0.0025
    };
    return costs[tier as keyof typeof costs] || 0;
  };

  const getRetrievalTime = (tier: string) => {
    const times = {
      'Expedited': '1-5 minutes',
      'Standard': '3-5 hours',
      'Bulk': '5-12 hours'
    };
    return times[tier as keyof typeof times] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading Glacier vaults...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">S3 Glacier Management</h1>
          <p className="text-gray-600">Long-term archival storage with flexible retrieval options</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Vault</span>
        </Button>
      </div>

      {/* Create Vault Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Glacier Vault</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Vault name"
                value={newVaultName}
                onChange={(e) => setNewVaultName(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md"
                disabled={creating}
              />
              <Button onClick={createVault} disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vaults Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vaults.map((vault) => (
          <Card 
            key={vault.vaultName} 
            className={`cursor-pointer transition-all ${
              selectedVault === vault.vaultName ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedVault(vault.vaultName)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{vault.vaultName}</CardTitle>
                <Archive className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Archives:</span>
                  <span className="font-medium">{vault.numberOfArchives}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{vault.sizeFormatted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {new Date(vault.creationDate).toLocaleDateString()}
                  </span>
                </div>
                {vault.lastInventoryDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Inventory:</span>
                    <span className="font-medium">
                      {new Date(vault.lastInventoryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Vault Details */}
      {selectedVault && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Archives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5" />
                <span>Archives in {selectedVault}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {archives.map((archive) => (
                  <div key={archive.archiveId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{archive.description}</h4>
                        <p className="text-sm text-gray-600">
                          {archive.sizeFormatted} • {new Date(archive.creationDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => initiateRetrieval(archive.archiveId, 'Standard')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Retrieve
                        </Button>
                      </div>
                    </div>
                    
                    {/* Retrieval Options */}
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <h5 className="text-sm font-medium mb-2">Retrieval Options:</h5>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {['Expedited', 'Standard', 'Bulk'].map((tier) => (
                          <div key={tier} className="text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mb-1"
                              onClick={() => initiateRetrieval(archive.archiveId, tier as any)}
                            >
                              {tier}
                            </Button>
                            <div className="text-gray-600">
                              <div>{getRetrievalTime(tier)}</div>
                              <div>${getRetrievalCost(tier, parseFloat(archive.sizeFormatted)).toFixed(3)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Retrieval Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Retrieval Jobs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {retrievalJobs.map((job) => (
                  <div key={job.jobId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{job.jobDescription}</h4>
                        <p className="text-sm text-gray-600">
                          {job.action} • {job.tier} • {new Date(job.creationDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(job.statusCode)}
                        <Badge variant={
                          job.statusCode === 'Succeeded' ? 'default' :
                          job.statusCode === 'Failed' ? 'destructive' : 'secondary'
                        }>
                          {job.statusCode}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{job.statusMessage}</p>
                    {job.completionDate && (
                      <p className="text-sm text-green-600 mt-1">
                        Completed: {new Date(job.completionDate).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cost Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Glacier Pricing Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2">Storage Costs</h4>
              <div className="text-sm space-y-1">
                <div>S3 Glacier: $0.004/GB/month</div>
                <div>Glacier Deep Archive: $0.00099/GB/month</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Retrieval Costs</h4>
              <div className="text-sm space-y-1">
                <div>Expedited: $0.03/GB</div>
                <div>Standard: $0.01/GB</div>
                <div>Bulk: $0.0025/GB</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Retrieval Times</h4>
              <div className="text-sm space-y-1">
                <div>Expedited: 1-5 minutes</div>
                <div>Standard: 3-5 hours</div>
                <div>Bulk: 5-12 hours</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
