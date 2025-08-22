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
import { RefreshCw, Folder, Calendar, HardDrive, FileText, Settings, Trash2, Plus, Lock } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
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
          <BucketCard 
            key={bucket.Name} 
            bucket={bucket} 
            onBucketSelect={onBucketSelect}
            onDeleteBucket={handleDeleteBucket}
            countdownSeconds={deletionCountdowns.get(bucket.Name)}
            onUndoDelete={undoDelete}
          />
        ))}
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
