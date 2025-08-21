'use client';

import { Suspense, useTransition, startTransition } from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { apiClient, type Bucket } from '@/lib/api-client';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SkeletonCard } from '@/components/ui/skeleton';
import Link from 'next/link';
import { RefreshCw, Folder, Calendar, HardDrive, FileText, Settings, Trash2, Plus, Lock } from 'lucide-react';

function BucketCardSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function EmptyBucketsState() {
  return (
    <Card className="border-dashed border-2 border-gray-200">
      <CardContent className="p-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
            <svg 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              className="w-full h-full"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No S3 buckets found</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Create your first S3 bucket to start storing and managing your files in the cloud.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Bucket
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UnauthenticatedState() {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="p-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-amber-500 mb-4">
            <Lock className="w-full h-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Please log in with your AWS credentials to access and manage your S3 buckets.
          </p>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Sign In to Continue
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function BucketCard({ bucket }: { bucket: Bucket }) {
  const [isHovered, setIsHovered] = useState(false);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Card 
      className={`transition-all duration-200 cursor-pointer ${
        isHovered ? 'shadow-lg scale-[1.02] border-blue-200' : 'shadow-sm hover:shadow-md'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Folder className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {bucket.Name}
              </CardTitle>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                {bucket.Region}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <FileText className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {bucket.Objects.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Objects</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <HardDrive className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {bucket.Size}
            </div>
            <div className="text-xs text-gray-500">Size</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Calendar className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {new Date(bucket.CreationDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-xs text-gray-500">Created</div>
          </div>
        </div>
        
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <Link href={`/buckets/${encodeURIComponent(bucket.Name)}`} className="flex-1">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Folder className="h-4 w-4 mr-2" />
              Browse Objects
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BucketListContent() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchBuckets();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  const fetchBuckets = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await apiClient.getBuckets();
      
      if (result.success && (result as any).buckets) {
        startTransition(() => {
          setBuckets((result as any).buckets);
        });
      } else {
        setError(result.error || 'Failed to fetch buckets');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    startTransition(() => {
      fetchBuckets();
    });
  };

  if (loading || authLoading) {
    return <BucketCardSkeleton />;
  }

  if (!user) {
    return <UnauthenticatedState />;
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <p className="font-medium">Failed to load buckets</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <Button 
              onClick={handleRefresh} 
              variant="outline"
              disabled={isPending}
              className="border-red-300 text-red-600 hover:bg-red-100"
            >
              {isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (buckets.length === 0) {
    return <EmptyBucketsState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">
          {buckets.length} bucket{buckets.length !== 1 ? 's' : ''} found
        </p>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          disabled={isPending}
          className="text-gray-500 hover:text-gray-700"
        >
          {isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className={`space-y-4 transition-opacity duration-200 ${isPending ? 'opacity-70' : ''}`}>
        {buckets.map((bucket) => (
          <BucketCard key={bucket.Name} bucket={bucket} />
        ))}
      </div>
    </div>
  );
}

export function BucketList() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<BucketCardSkeleton />}>
        <BucketListContent />
      </Suspense>
    </ErrorBoundary>
  );
}
