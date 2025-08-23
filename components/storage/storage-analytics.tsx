'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  Database, 
  Archive,
  HardDrive,
  Snowflake,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

interface StorageCostMetrics {
  service: string;
  currentCost: number;
  projectedCost: number;
  storageUsed: number;
  storageClass: string;
  optimizationPotential: number;
  recommendation: string;
}

interface StorageUsageData {
  month: string;
  s3Standard: number;
  glacierIR: number;
  glacierFlexible: number;
  glacierDeepArchive: number;
  totalCost: number;
}

interface LifecyclePolicyAnalysis {
  bucketName: string;
  objectsCount: number;
  hasLifecyclePolicy: boolean;
  potentialSavings: number;
  recommendedTransitions: string[];
  status: 'optimized' | 'needs-review' | 'critical';
}

export function StorageAnalytics() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data for cost metrics
  const costMetrics: StorageCostMetrics[] = [
    {
      service: 'S3 Standard',
      currentCost: 45.67,
      projectedCost: 52.30,
      storageUsed: 1980,
      storageClass: 'STANDARD',
      optimizationPotential: 15.2,
      recommendation: 'Consider transitioning old objects to Glacier Instant Retrieval'
    },
    {
      service: 'S3 Glacier Instant Retrieval',
      currentCost: 12.45,
      projectedCost: 14.20,
      storageUsed: 3110,
      storageClass: 'GLACIER_IR',
      optimizationPotential: 0,
      recommendation: 'Well optimized for current access patterns'
    },
    {
      service: 'S3 Glacier Flexible Retrieval',
      currentCost: 8.90,
      projectedCost: 9.15,
      storageUsed: 2225,
      storageClass: 'GLACIER',
      optimizationPotential: 0,
      recommendation: 'Consider Deep Archive for data older than 2 years'
    },
    {
      service: 'S3 Glacier Deep Archive',
      currentCost: 3.25,
      projectedCost: 4.10,
      storageUsed: 3280,
      storageClass: 'DEEP_ARCHIVE',
      optimizationPotential: 0,
      recommendation: 'Optimal for long-term archival'
    }
  ];

  // Mock data for usage over time
  const usageData: StorageUsageData[] = [
    { month: 'Aug 2024', s3Standard: 1850, glacierIR: 2950, glacierFlexible: 2100, glacierDeepArchive: 3100, totalCost: 68.2 },
    { month: 'Sep 2024', s3Standard: 1920, glacierIR: 3050, glacierFlexible: 2150, glacierDeepArchive: 3200, totalCost: 71.5 },
    { month: 'Oct 2024', s3Standard: 1950, glacierIR: 3100, glacierFlexible: 2200, glacierDeepArchive: 3250, totalCost: 72.8 },
    { month: 'Nov 2024', s3Standard: 1980, glacierIR: 3110, glacierFlexible: 2225, glacierDeepArchive: 3280, totalCost: 74.3 }
  ];

  // Mock data for lifecycle policy analysis
  const lifecyclePolicies: LifecyclePolicyAnalysis[] = [
    {
      bucketName: 'production-data',
      objectsCount: 15420,
      hasLifecyclePolicy: true,
      potentialSavings: 0,
      recommendedTransitions: [],
      status: 'optimized'
    },
    {
      bucketName: 'backup-archives',
      objectsCount: 8930,
      hasLifecyclePolicy: false,
      potentialSavings: 125.60,
      recommendedTransitions: ['30 days → Glacier IR', '90 days → Glacier', '365 days → Deep Archive'],
      status: 'critical'
    },
    {
      bucketName: 'media-assets',
      objectsCount: 23100,
      hasLifecyclePolicy: true,
      potentialSavings: 45.20,
      recommendedTransitions: ['180 days → Deep Archive'],
      status: 'needs-review'
    },
    {
      bucketName: 'log-data',
      objectsCount: 45600,
      hasLifecyclePolicy: false,
      potentialSavings: 89.40,
      recommendedTransitions: ['7 days → Glacier IR', '30 days → Glacier', '90 days → Deep Archive'],
      status: 'critical'
    }
  ];

  const totalCurrentCost = costMetrics.reduce((sum, metric) => sum + metric.currentCost, 0);
  const totalOptimizationPotential = costMetrics.reduce((sum, metric) => sum + metric.optimizationPotential, 0);
  const totalStorageUsed = costMetrics.reduce((sum, metric) => sum + metric.storageUsed, 0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimized': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'needs-review': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimized': return 'bg-green-100 text-green-800';
      case 'needs-review': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Storage Analytics</h1>
          <p className="text-gray-600">Cost optimization and usage insights across AWS storage services</p>
        </div>
        <div className="flex space-x-2">
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            title="Select time range for analytics"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
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
                <p className="text-sm font-medium text-gray-600">Total Storage Cost</p>
                <p className="text-2xl font-bold text-gray-900">${totalCurrentCost.toFixed(2)}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -12% from last month
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">{(totalStorageUsed / 1000).toFixed(1)} TB</p>
                <p className="text-xs text-blue-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5% from last month
                </p>
              </div>
              <Database className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Optimization Potential</p>
                <p className="text-2xl font-bold text-gray-900">${totalOptimizationPotential.toFixed(2)}</p>
                <p className="text-xs text-orange-600">
                  {((totalOptimizationPotential / totalCurrentCost) * 100).toFixed(1)}% potential savings
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Storage Classes</p>
                <p className="text-2xl font-bold text-gray-900">4</p>
                <p className="text-xs text-gray-600">
                  Across {costMetrics.length} services
                </p>
              </div>
              <Archive className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Cost Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage Trends</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Storage Cost Breakdown by Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {metric.storageClass === 'STANDARD' && <HardDrive className="w-5 h-5 text-blue-600" />}
                        {metric.storageClass === 'GLACIER_IR' && <Snowflake className="w-5 h-5 text-cyan-600" />}
                        {metric.storageClass === 'GLACIER' && <Archive className="w-5 h-5 text-indigo-600" />}
                        {metric.storageClass === 'DEEP_ARCHIVE' && <Database className="w-5 h-5 text-purple-600" />}
                        <div>
                          <h4 className="font-medium">{metric.service}</h4>
                          <p className="text-sm text-gray-600">{metric.storageUsed.toLocaleString()} GB</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${metric.currentCost.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">
                          Projected: ${metric.projectedCost.toFixed(2)}
                        </p>
                        {metric.optimizationPotential > 0 && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Save ${metric.optimizationPotential.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Storage Usage Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-600 border-b pb-2">
                  <div>Month</div>
                  <div>S3 Standard</div>
                  <div>Glacier IR</div>
                  <div>Glacier</div>
                  <div>Deep Archive</div>
                </div>
                {usageData.map((data, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 text-sm">
                    <div className="font-medium">{data.month}</div>
                    <div>{data.s3Standard.toLocaleString()} GB</div>
                    <div>{data.glacierIR.toLocaleString()} GB</div>
                    <div>{data.glacierFlexible.toLocaleString()} GB</div>
                    <div>{data.glacierDeepArchive.toLocaleString()} GB</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Usage Pattern Analysis</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Steady growth in Glacier storage classes indicates good archival strategy</li>
                  <li>• S3 Standard usage is stable, suggesting active data management</li>
                  <li>• Deep Archive shows consistent growth for long-term retention</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingDown className="w-5 h-5 mr-2" />
                Cost Optimization Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costMetrics
                  .filter(metric => metric.optimizationPotential > 0)
                  .map((metric, index) => (
                    <div key={index} className="p-4 border-l-4 border-orange-500 bg-orange-50 rounded-r-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-orange-900">{metric.service}</h4>
                          <p className="text-sm text-orange-800 mt-1">{metric.recommendation}</p>
                          <p className="text-xs text-orange-700 mt-2">
                            Current: {metric.storageUsed.toLocaleString()} GB • ${metric.currentCost.toFixed(2)}/month
                          </p>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800">
                          ${metric.optimizationPotential.toFixed(2)} savings
                        </Badge>
                      </div>
                    </div>
                  ))}
                
                {costMetrics.filter(metric => metric.optimizationPotential === 0).length > 0 && (
                  <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
                    <h4 className="font-semibold text-green-900">Well Optimized Services</h4>
                    <div className="mt-2 space-y-1">
                      {costMetrics
                        .filter(metric => metric.optimizationPotential === 0)
                        .map((metric, index) => (
                          <p key={index} className="text-sm text-green-800">
                            • {metric.service}: {metric.recommendation}
                          </p>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lifecycle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Lifecycle Policy Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lifecyclePolicies.map((policy, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(policy.status)}
                      <div>
                        <h4 className="font-medium">{policy.bucketName}</h4>
                        <p className="text-sm text-gray-600">
                          {policy.objectsCount.toLocaleString()} objects
                        </p>
                        {policy.recommendedTransitions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Recommended transitions:</p>
                            <div className="space-y-1">
                              {policy.recommendedTransitions.map((transition, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs mr-1">
                                  {transition}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(policy.status)}>
                        {policy.status.replace('-', ' ')}
                      </Badge>
                      {policy.potentialSavings > 0 && (
                        <p className="text-sm text-orange-600 mt-1">
                          ${policy.potentialSavings.toFixed(2)} potential savings
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-medium text-amber-900 mb-2">Lifecycle Policy Recommendations</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-amber-800 mb-1">Critical Actions Needed:</h5>
                    <ul className="text-amber-700 space-y-1">
                      <li>• backup-archives: No lifecycle policy set</li>
                      <li>• log-data: Missing automated transitions</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-amber-800 mb-1">Total Potential Savings:</h5>
                    <p className="text-amber-700 font-semibold">
                      ${lifecyclePolicies.reduce((sum, policy) => sum + policy.potentialSavings, 0).toFixed(2)}/month
                    </p>
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
