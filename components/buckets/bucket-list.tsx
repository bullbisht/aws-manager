'use client';

import { Suspense, useTransition, startTransition } from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { apiClient, type Bucket } from '@/lib/api-client';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useToastHelpers, useToast } from '@/components/ui/toast';
import { BucketDeleteModal } from '@/components/ui/bucket-delete-modal';
import Link from 'next/link';
import { RefreshCw, Folder, Calendar, HardDrive, FileText, Settings, Trash2, Plus, Lock, Search, Filter, ArrowUpDown, ChevronDown } from 'lucide-react';

interface BucketListProps {
  onBucketSelect?: (bucketName: string) => void;
}

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

function BucketCard({ bucket, onBucketSelect, onDeleteBucket, countdownSeconds, onUndoDelete }: { 
  bucket: Bucket; 
  onBucketSelect?: (bucketName: string) => void;
  onDeleteBucket?: (bucketName: string) => void;
  countdownSeconds?: number;
  onUndoDelete?: (bucketName: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className={`transition-all duration-200 ${
        bucket.pendingDeletion 
          ? 'opacity-60 border-red-200 bg-red-50 cursor-not-allowed' 
          : 'cursor-pointer hover:shadow-md'
      } ${
        isHovered && !bucket.pendingDeletion 
          ? 'border-blue-200 shadow-md' 
          : 'border-gray-200'
      }`}
      onMouseEnter={() => !bucket.pendingDeletion && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (!bucket.pendingDeletion && onBucketSelect) {
          console.log('Card clicked for bucket:', bucket.Name);
          onBucketSelect(bucket.Name);
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left side - Bucket info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
              <Folder className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold text-base truncate ${
                  bucket.pendingDeletion 
                    ? 'text-red-500 line-through' 
                    : 'text-gray-900'
                }`}>
                  {bucket.Name}
                </h3>
                {bucket.pendingDeletion && (
                  <span className="flex-shrink-0 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    {countdownSeconds ? `Deleting in ${countdownSeconds}s` : 'Deleting...'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  {bucket.Region}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {bucket.Objects.toLocaleString()} objects
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  {bucket.Size}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(bucket.CreationDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: new Date(bucket.CreationDate).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {bucket.pendingDeletion ? (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onUndoDelete?.(bucket.Name);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Undo
                {countdownSeconds && (
                  <span className="ml-1 text-xs">({countdownSeconds}s)</span>
                )}
              </Button>
            ) : (
              <>
                {onBucketSelect ? (
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Browse button clicked for bucket:', bucket.Name);
                      onBucketSelect(bucket.Name);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <Folder className="h-4 w-4 mr-1" />
                    Browse
                  </Button>
                ) : (
                  <Link href={`/buckets/${encodeURIComponent(bucket.Name)}`}>
                    <Button 
                      onClick={(e) => e.stopPropagation()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <Folder className="h-4 w-4 mr-1" />
                      Browse
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="border-gray-300 text-gray-600 hover:bg-gray-50 px-2"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBucket?.(bucket.Name);
                  }}
                  className="border-red-300 text-red-600 hover:bg-red-50 px-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BucketListContent({ onBucketSelect }: BucketListProps) {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [filteredBuckets, setFilteredBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'region' | 'objects' | 'size' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    bucketName: string;
    loading: boolean;
  }>({
    isOpen: false,
    bucketName: '',
    loading: false
  });
  const [pendingDeletions, setPendingDeletions] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [deletionCountdowns, setDeletionCountdowns] = useState<Map<string, number>>(new Map());
  const { user, isLoading: authLoading } = useAuth();
  const { addToast, removeToast } = useToast();
  const { success, error: showError } = useToastHelpers();

  useEffect(() => {
    console.log('BucketList useEffect triggered - authLoading:', authLoading, 'user:', !!user);
    if (!authLoading) {
      if (user) {
        console.log('BucketList: User authenticated, fetching buckets...');
        fetchBuckets();
      } else {
        console.log('BucketList: No user authenticated');
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  // Cleanup effect for pending deletions
  useEffect(() => {
    return () => {
      // Clear all pending deletion timeouts when component unmounts
      pendingDeletions.forEach((timeoutId) => {
        clearInterval(timeoutId);
      });
    };
  }, [pendingDeletions]);

  const fetchBuckets = async () => {
    console.log('BucketList: fetchBuckets called');
    try {
      setLoading(true);
      setError('');
      
      console.log('BucketList: Calling apiClient.getBuckets()...');
      const result = await apiClient.getBuckets();
      console.log('BucketList: API result:', result);
      
      if (result.success && (result as any).buckets) {
        console.log('BucketList: Setting buckets:', (result as any).buckets.length, 'buckets');
        startTransition(() => {
          setBuckets((result as any).buckets);
        });
        success('Buckets loaded', 'Successfully loaded your S3 buckets');
      } else {
        const errorMsg = result.error || 'Failed to fetch buckets';
        console.log('BucketList: Error from API:', errorMsg);
        setError(errorMsg);
        showError('Failed to load buckets', errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Network error occurred';
      console.log('BucketList: Exception caught:', err);
      setError(errorMsg);
      showError('Network Error', errorMsg);
    } finally {
      console.log('BucketList: fetchBuckets completed, setting loading to false');
      setLoading(false);
    }
  };

  // Filter and sort buckets
  useEffect(() => {
    let filtered = buckets.filter(bucket => {
      const matchesSearch = bucket.Name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = regionFilter === 'all' || bucket.Region === regionFilter;
      return matchesSearch && matchesRegion;
    });

    // Sort buckets
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.Name.localeCompare(b.Name);
          break;
        case 'region':
          comparison = a.Region.localeCompare(b.Region);
          break;
        case 'objects':
          comparison = a.Objects - b.Objects;
          break;
        case 'size':
          // Parse size strings for comparison
          const parseSize = (sizeStr: string) => {
            const match = sizeStr.match(/^([\d.]+)\s*([KMGT]?B)$/i);
            if (!match) return 0;
            const value = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            const multipliers: { [key: string]: number } = {
              'B': 1,
              'KB': 1024,
              'MB': 1024 * 1024,
              'GB': 1024 * 1024 * 1024,
              'TB': 1024 * 1024 * 1024 * 1024
            };
            return value * (multipliers[unit] || 1);
          };
          comparison = parseSize(a.Size) - parseSize(b.Size);
          break;
        case 'created':
          comparison = new Date(a.CreationDate).getTime() - new Date(b.CreationDate).getTime();
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredBuckets(filtered);
  }, [buckets, searchQuery, regionFilter, sortBy, sortOrder]);

  const handleRefresh = () => {
    startTransition(() => {
      fetchBuckets();
    });
  };

  const handleDeleteBucket = async (bucketName: string) => {
    // Open the confirmation modal
    setDeleteModal({
      isOpen: true,
      bucketName,
      loading: false
    });
  };

  const confirmDeleteBucket = async () => {
    const bucketName = deleteModal.bucketName;
    
    // Close the modal immediately
    setDeleteModal({ isOpen: false, bucketName: '', loading: false });

    // Mark bucket as pending deletion in UI
    setBuckets(prev => prev.map(bucket => 
      bucket.Name === bucketName 
        ? { ...bucket, pendingDeletion: true }
        : bucket
    ));

    // Start countdown and show undo toast
    startDeletionCountdown(bucketName);
  };

  const startDeletionCountdown = (bucketName: string) => {
    const GRACE_PERIOD = 10; // 10 seconds
    let countdown = GRACE_PERIOD;
    
    // Initialize countdown in state
    setDeletionCountdowns(prev => new Map(prev).set(bucketName, countdown));

    // Start countdown timer
    const countdownInterval = setInterval(() => {
      countdown--;
      
      if (countdown > 0) {
        // Update the countdown display
        setDeletionCountdowns(prev => new Map(prev).set(bucketName, countdown));
      } else {
        // Grace period expired, actually delete the bucket
        clearInterval(countdownInterval);
        setDeletionCountdowns(prev => {
          const newMap = new Map(prev);
          newMap.delete(bucketName);
          return newMap;
        });
        actuallyDeleteBucket(bucketName);
      }
    }, 1000);

    // Store the interval ID for potential cancellation
    setPendingDeletions(prev => new Map(prev).set(bucketName, countdownInterval));
  };

  const undoDelete = (bucketName: string) => {
    // Cancel the deletion
    const timeoutId = pendingDeletions.get(bucketName);
    if (timeoutId) {
      clearInterval(timeoutId);
      setPendingDeletions(prev => {
        const newMap = new Map(prev);
        newMap.delete(bucketName);
        return newMap;
      });
    }

    // Clear countdown state
    setDeletionCountdowns(prev => {
      const newMap = new Map(prev);
      newMap.delete(bucketName);
      return newMap;
    });

    // Restore bucket in UI
    setBuckets(prev => prev.map(bucket => 
      bucket.Name === bucketName 
        ? { ...bucket, pendingDeletion: false }
        : bucket
    ));

    // Show success message
    success('Deletion cancelled', `Bucket "${bucketName}" has been restored`);
  };

  const actuallyDeleteBucket = async (bucketName: string) => {
    try {
      const result = await apiClient.deleteBucket(bucketName);
      
      if (result.success) {
        // Remove bucket from list
        setBuckets(prev => prev.filter(bucket => bucket.Name !== bucketName));
        
        // Remove from pending deletions
        setPendingDeletions(prev => {
          const newMap = new Map(prev);
          newMap.delete(bucketName);
          return newMap;
        });

        // Show final success
        success('Bucket deleted', `Bucket "${bucketName}" has been permanently deleted`);
      } else {
        // Restore bucket on failure
        setBuckets(prev => prev.map(bucket => 
          bucket.Name === bucketName 
            ? { ...bucket, pendingDeletion: false }
            : bucket
        ));
        
        showError('Delete failed', result.error || 'Failed to delete bucket');
      }
    } catch (err) {
      console.error('Delete bucket error:', err);
      
      // Restore bucket on error
      setBuckets(prev => prev.map(bucket => 
        bucket.Name === bucketName 
          ? { ...bucket, pendingDeletion: false }
          : bucket
      ));
      
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      showError('Network error', errorMessage);
    }
  };

  const closeDeleteModal = () => {
    if (!deleteModal.loading) {
      setDeleteModal({ isOpen: false, bucketName: '', loading: false });
    }
  };

  // Get unique regions for filter dropdown
  const uniqueRegions = Array.from(new Set(buckets.map(bucket => bucket.Region))).sort();

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
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search buckets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Region Filter */}
          <div className="relative">
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              aria-label="Filter by region"
              className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Regions</option>
              {uniqueRegions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort buckets by"
                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="region">Sort by Region</option>
                <option value="objects">Sort by Objects</option>
                <option value="size">Sort by Size</option>
                <option value="created">Sort by Created</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <Button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            variant="outline"
            size="sm"
            className="px-3"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === 'asc' ? 'Asc' : 'Desc'}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">
          {filteredBuckets.length} of {buckets.length} bucket{buckets.length !== 1 ? 's' : ''} 
          {searchQuery && ` matching "${searchQuery}"`}
          {regionFilter !== 'all' && ` in ${regionFilter}`}
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
        {filteredBuckets.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="p-8">
              <div className="text-center">
                <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No buckets match your filters</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <div className="flex justify-center gap-2">
                  <Button 
                    onClick={() => setSearchQuery('')}
                    variant="outline"
                    size="sm"
                  >
                    Clear Search
                  </Button>
                  <Button 
                    onClick={() => {
                      setSearchQuery('');
                      setRegionFilter('all');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredBuckets.map((bucket) => (
            <BucketCard 
              key={bucket.Name} 
              bucket={bucket} 
              onBucketSelect={onBucketSelect}
              onDeleteBucket={handleDeleteBucket}
              countdownSeconds={deletionCountdowns.get(bucket.Name)}
              onUndoDelete={undoDelete}
            />
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <BucketDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteBucket}
        bucketName={deleteModal.bucketName}
        loading={deleteModal.loading}
      />
    </div>
  );
}

export function BucketList({ onBucketSelect }: BucketListProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<BucketCardSkeleton />}>
        <BucketListContent onBucketSelect={onBucketSelect} />
      </Suspense>
    </ErrorBoundary>
  );
}
