'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { UserInfo } from '@/components/ui/user-info';
import { 
  Home, 
  Database, 
  FolderOpen, 
  BarChart3, 
  Settings, 
  Upload,
  Shield,
  Zap
} from 'lucide-react';

// Import existing components
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { BucketList } from '@/components/buckets/bucket-list';
import { BucketDetail } from '@/components/buckets/bucket-detail';
import { CreateBucketButton } from '@/components/buckets/create-bucket-button';
import { BucketSearch } from '@/components/buckets/bucket-search';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SkeletonCard } from '@/components/ui/skeleton';

type TabType = 'dashboard' | 'buckets' | 'bucket-detail' | 'settings';

interface SPAState {
  activeTab: TabType;
  selectedBucket?: string;
}

export default function SPAManager() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [state, setState] = useState<SPAState>({
    activeTab: 'dashboard'
  });

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => window.location.href = '/'}
              title="Go to Home"
            >
              AWS Manager
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A comprehensive tool for managing AWS S3 buckets and objects with a modern web interface. 
              Upload, organize, and manage your cloud storage with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-4 text-lg" onClick={() => window.location.href = '/login'}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navigation = [
    {
      id: 'dashboard' as TabType,
      name: 'Dashboard',
      icon: Home,
      description: 'Overview and statistics'
    },
    {
      id: 'buckets' as TabType,
      name: 'Buckets',
      icon: Database,
      description: 'Manage S3 buckets'
    },
    {
      id: 'settings' as TabType,
      name: 'Settings',
      icon: Settings,
      description: 'Configuration and preferences'
    }
  ];

  const handleTabChange = (tabId: TabType) => {
    setState(prev => ({ ...prev, activeTab: tabId }));
  };

  const handleBucketSelect = (bucketName: string) => {
    console.log('Bucket selected:', bucketName);
    setState(prev => ({ 
      ...prev, 
      activeTab: 'bucket-detail', 
      selectedBucket: bucketName 
    }));
  };

  const handleBucketCreated = () => {
    // Navigate to buckets page after successful creation
    setState(prev => ({ ...prev, activeTab: 'buckets' }));
  };

  const handleQuickActionNavigate = (tab: string) => {
    // Convert string to TabType and navigate
    if (tab === 'buckets' || tab === 'dashboard' || tab === 'settings') {
      handleTabChange(tab as TabType);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your AWS S3 storage</p>
      </div>

      <ErrorBoundary>
        <DashboardStats />
      </ErrorBoundary>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <ErrorBoundary>
          <RecentActivity />
        </ErrorBoundary>
        <ErrorBoundary>
          <QuickActions onNavigate={handleQuickActionNavigate} />
        </ErrorBoundary>
      </div>
    </div>
  );

  const renderFeatureCards = () => {
    const features = [
      {
        icon: Upload,
        title: "Easy Upload",
        description: "Drag & drop files or use the upload button to add content to your buckets"
      },
      {
        icon: FolderOpen,
        title: "Organize Files",
        description: "Create folders and organize your objects with intuitive navigation"
      },
      {
        icon: Shield,
        title: "Secure Access",
        description: "Manage permissions and access controls for your S3 resources"
      },
      {
        icon: Zap,
        title: "Fast Performance",
        description: "Optimized interface for quick uploads and efficient file management"
      }
    ];

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <feature.icon className="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderBuckets = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">S3 Buckets</h1>
          <p className="text-gray-600">Manage your AWS S3 buckets and objects</p>
        </div>
        <CreateBucketButton onBucketCreated={handleBucketCreated} />
      </div>

      <BucketSearch />

      {renderFeatureCards()}

      <ErrorBoundary>
        <BucketList onBucketSelect={handleBucketSelect} />
      </ErrorBoundary>
    </div>
  );

  const renderBucketDetail = () => {
    if (!state.selectedBucket) {
      return (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">No bucket selected</h2>
          <Button 
            onClick={() => handleTabChange('buckets')} 
            className="mt-4"
          >
            Browse Buckets
          </Button>
        </div>
      );
    }

    return (
      <ErrorBoundary>
        <BucketDetail 
          bucketName={state.selectedBucket} 
          onBack={() => handleTabChange('buckets')}
        />
      </ErrorBoundary>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your AWS Manager preferences</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AWS Configuration</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="default-region" className="block text-sm font-medium text-gray-700 mb-1">
                  Default Region
                </label>
                <select 
                  id="default-region"
                  title="Select default AWS region"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  defaultValue="ap-south-1"
                >
                  <option value="ap-south-1">Asia Pacific (Mumbai) - ap-south-1</option>
                  <option value="us-east-1">US East (N. Virginia) - us-east-1</option>
                  <option value="us-west-2">US West (Oregon) - us-west-2</option>
                  <option value="eu-west-1">Europe (Ireland) - eu-west-1</option>
                  <option value="eu-central-1">Europe (Frankfurt) - eu-central-1</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore) - ap-southeast-1</option>
                  <option value="ap-northeast-1">Asia Pacific (Tokyo) - ap-northeast-1</option>
                  <option value="ca-central-1">Canada (Central) - ca-central-1</option>
                </select>
              </div>
              <div>
                <label htmlFor="chunk-size" className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Chunk Size
                </label>
                <select 
                  id="chunk-size"
                  title="Select upload chunk size"
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option>5 MB</option>
                  <option>10 MB</option>
                  <option>25 MB</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interface Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-gray-700">Show file size in human readable format</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm text-gray-700">Enable toast notifications</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-gray-700">Auto-refresh bucket contents</span>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (state.activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'buckets':
        return renderBuckets();
      case 'bucket-detail':
        return renderBucketDetail();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div 
              className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleTabChange('dashboard')}
              title="Go to Home"
            >
              <Database className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">AWS Manager</h1>
            </div>
            
            {/* Tab Navigation */}
            <nav className="flex space-x-1">
              {navigation.map((tab) => {
                const Icon = tab.icon;
                const isActive = state.activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    title={tab.description}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* User Profile Section */}
            <UserInfo />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}
