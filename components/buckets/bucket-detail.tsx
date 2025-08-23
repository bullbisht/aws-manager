'use client';

import { useState, useEffect, useTransition, useOptimistic, Suspense, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SkeletonObjectRow } from '@/components/ui/skeleton';
import { useToastHelpers } from '@/components/ui/toast';
import styles from './resizable-table.module.css';
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  Upload, 
  Search, 
  Folder, 
  File, 
  X, 
  Eye, 
  Edit, 
  FolderPlus, 
  FolderOpen,
  RefreshCw,
  ChevronRight,
  Home,
  Filter,
  GripVertical,
  ArrowUpDown,
  ChevronDown,
  Calendar,
  HardDrive,
  Database,
  Settings
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StorageClassSelector } from '@/components/storage/storage-class-selector';

interface S3Object {
  Key: string;
  LastModified: Date;
  Size: number;
  StorageClass: string;
  ETag: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface OptimisticObject extends S3Object {
  _isOptimistic?: boolean;
  _action?: 'create' | 'delete' | 'rename' | 'updateStorageClass';
}

interface BucketDetailProps {
  bucketName: string;
  onBack: () => void;
}

export function BucketDetail({ bucketName, onBack }: BucketDetailProps) {
  const { user } = useAuth();
  const { success, error: showError } = useToastHelpers();
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'lastModified' | 'storageClass'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [storageClassFilter, setStorageClassFilter] = useState<string>('all');
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [createFolderName, setCreateFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameObjectKey, setRenameObjectKey] = useState('');
  const [newObjectName, setNewObjectName] = useState('');
  const [isPending, startTransition] = useTransition();
  
  // Column resizing state
  const [columnWidths, setColumnWidths] = useState({
    name: 30,
    size: 10,
    lastModified: 15,
    storageClass: 12,
    etag: 15,
    actions: 10,
    download: 8
  });
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);
  
  // Optimistic updates for smooth UX
  const [optimisticObjects, setOptimisticObjects] = useOptimistic(
    objects,
    (state: S3Object[], { action, payload }: { action: string; payload: any }) => {
      switch (action) {
        case 'delete':
          return state.filter(obj => obj.Key !== payload.Key);
        case 'create':
          return [...state, payload as S3Object];
        case 'updateStorageClass':
          const { keys, newStorageClass } = payload;
          return state.map(obj => {
            const shouldUpdate = keys.some((key: string) => 
              key.endsWith('/') ? obj.Key.startsWith(key) : obj.Key === key
            );
            if (shouldUpdate) {
              return { ...obj, StorageClass: newStorageClass, _isOptimistic: true };
            }
            return obj;
          });
        default:
          return state;
      }
    }
  );

  useEffect(() => {
    if (user && bucketName) {
      fetchObjects();
    }
  }, [user, bucketName, currentPrefix]);

  // Column resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, column: string) => {
    e.preventDefault();
    setIsResizing(column);
    setStartX(e.clientX);
    setStartWidth(columnWidths[column as keyof typeof columnWidths]);
  }, [columnWidths]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !tableRef.current) return;
    
    const tableWidth = tableRef.current.offsetWidth;
    const deltaX = e.clientX - startX;
    const deltaPercent = (deltaX / tableWidth) * 100;
    const newWidth = Math.max(5, Math.min(50, startWidth + deltaPercent));
    
    setColumnWidths(prev => ({
      ...prev,
      [isResizing]: newWidth
    }));
  }, [isResizing, startX, startWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Generate grid template for dynamic column widths
  const gridTemplate = `${columnWidths.name}% ${columnWidths.size}% ${columnWidths.lastModified}% ${columnWidths.storageClass}% ${columnWidths.etag}% ${columnWidths.actions}% ${columnWidths.download}%`;

  const fetchObjects = async () => {
    if (!bucketName) return;
    
    try {
      setLoading(true);
      setError('');
      
      const result = await apiClient.getObjects(
        bucketName,
        currentPrefix || undefined,
        100
      );

      if (result.success && (result as any).objects) {
        setObjects((result as any).objects || []);
      } else {
        const errorMsg = result.error || 'Failed to fetch objects';
        setError(errorMsg);
        showError('Fetch failed', errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Network error occurred';
      setError(errorMsg);
      showError('Network error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to delete ${key}?`)) return;

    startTransition(() => {
      setOptimisticObjects({
        action: 'delete',
        payload: { Key: key },
      });
    });

    try {
      const result = await apiClient.deleteObject(bucketName, key);
      if (result.success) {
        success('Object deleted', `${key} has been deleted successfully`);
      } else {
        showError('Delete failed', result.error || 'Failed to delete object');
      }
    } catch (err) {
      showError('Delete failed', 'Network error occurred');
    } finally {
      startTransition(() => {
        fetchObjects();
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (key: string) => {
    try {
      const result = await apiClient.downloadObject(bucketName, key);
      if (result.success && result.data?.downloadUrl) {
        window.open(result.data.downloadUrl, '_blank');
        success('Download started', `${key} download has been initiated`);
      } else {
        showError('Download failed', result.error || 'Failed to generate download URL');
      }
    } catch (err) {
      showError('Download failed', 'Network error occurred');
    }
  };

  const handleView = async (key: string) => {
    try {
      const result = await apiClient.viewObject(bucketName, key);
      if (result.success && result.data?.viewUrl) {
        window.open(result.data.viewUrl, '_blank');
        success('View opened', `${key} opened in new tab`);
      } else {
        showError('View failed', result.error || 'Failed to generate view URL');
      }
    } catch (err) {
      showError('View failed', 'Network error occurred');
    }
  };

  const handleRename = async (key: string) => {
    setRenameObjectKey(key);
    setNewObjectName(key);
    setShowRenameDialog(true);
  };

  const executeRename = async () => {
    if (!newObjectName || newObjectName === renameObjectKey) {
      setShowRenameDialog(false);
      setRenameObjectKey('');
      setNewObjectName('');
      return;
    }
    
    try {
      const result = await apiClient.renameObject(bucketName, renameObjectKey, newObjectName);
      if (result.success) {
        success('Object renamed', `${renameObjectKey} has been renamed to ${newObjectName}`);
        setShowRenameDialog(false);
        setRenameObjectKey('');
        setNewObjectName('');
        startTransition(() => {
          fetchObjects(); // Refresh the list
        });
      } else {
        showError('Rename failed', result.error || 'Failed to rename object');
      }
    } catch (err) {
      showError('Rename failed', 'Network error occurred');
    }
  };

  const handleStorageClassChange = async (objectKey: string, newStorageClass: string) => {
    console.log('🔄 Storage class change initiated:', {
      objectKey,
      currentStorageClass: objects.find(obj => obj.Key === objectKey)?.StorageClass,
      newStorageClass,
      bucketName,
      timestamp: new Date().toISOString()
    });

    const isDirectory = objectKey.endsWith('/');
    const keysToUpdate = [objectKey];
    const originalStorageClass = objects.find(obj => obj.Key === objectKey)?.StorageClass || 'STANDARD';

    const confirmationMessage = isDirectory
      ? `Are you sure you want to change the storage class of ALL files in the directory ${objectKey} to ${newStorageClass}? This operation cannot be undone.`
      : `Are you sure you want to change the storage class of ${objectKey} to ${newStorageClass}?`;

    if (!confirm(confirmationMessage)) {
      console.log('❌ Storage class change cancelled by user');
      return;
    }

    console.log('✅ User confirmed storage class change');

    // Optimistic update
    startTransition(() => {
      console.log('🔄 Applying optimistic update for UI');
      setOptimisticObjects({
        action: 'updateStorageClass',
        payload: { keys: keysToUpdate, newStorageClass },
      });
    });

    try {
      console.log('📡 Making API call...', {
        isDirectory,
        apiMethod: isDirectory ? 'changeBulkStorageClass' : 'changeStorageClass'
      });

      const result = isDirectory
        ? await apiClient.changeBulkStorageClass(bucketName, objectKey, newStorageClass)
        : await apiClient.changeStorageClass(bucketName, objectKey, newStorageClass);

      console.log('📡 API Response received:', {
        success: result?.success,
        data: result?.data,
        error: result?.error,
        fullResult: result
      });

      if (result && result.success) {
        if (isDirectory) {
          const { summary } = (result.data as { summary?: { successful?: number; errors?: number; skipped?: number } }) || {};
          const successfulCount = summary?.successful || 0;
          const errorCount = summary?.errors || 0;
          const skippedCount = summary?.skipped || 0;
          console.log('✅ Bulk storage class change successful:', { successfulCount, errorCount, skippedCount });
          success(
            'Bulk storage class change completed',
            `Successfully changed ${successfulCount} files. ${errorCount} errors, ${skippedCount} skipped.`
          );
        } else {
          console.log('✅ Individual storage class change successful');
          success('Storage class changed', `${objectKey} storage class has been changed to ${newStorageClass}`);
        }

        // Always refetch the actual data from S3 to confirm the changes
        console.log('🔄 Refetching bucket data to confirm changes...');
        await fetchObjects();
        
      } else {
        // Revert optimistic update on error
        console.log('🔄 Reverting optimistic update due to API error');
        startTransition(() => {
          setOptimisticObjects({
            action: 'updateStorageClass',
            payload: { keys: keysToUpdate, newStorageClass: originalStorageClass },
          });
        });

        const errorMessage = result?.error || result?.details || 'Failed to change storage class';
        console.error('❌ Storage class change failed:', { result, errorMessage });
        showError('Storage class change failed', typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }
    } catch (err) {
      // Revert optimistic update on error
      console.log('🔄 Reverting optimistic update due to exception');
      startTransition(() => {
        setOptimisticObjects({
          action: 'updateStorageClass',
          payload: { keys: keysToUpdate, newStorageClass: originalStorageClass },
        });
      });

      console.error('❌ Storage class change exception:', err);
      showError('Storage class change failed', err instanceof Error ? err.message : 'Network error occurred');
    }
  };

  const breadcrumbParts = currentPrefix ? currentPrefix.split('/').filter(Boolean) : [];

  // Get unique storage classes for filter dropdown
  const uniqueStorageClasses = Array.from(new Set(optimisticObjects.map(obj => obj.StorageClass))).sort();

  // Enhanced filtering and sorting
  const filteredObjects = optimisticObjects
    .filter(obj => {
      const matchesSearch = obj.Key.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStorageClass = storageClassFilter === 'all' || obj.StorageClass === storageClassFilter;
      return matchesSearch && matchesStorageClass;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.Key.localeCompare(b.Key);
          break;
        case 'size':
          comparison = a.Size - b.Size;
          break;
        case 'lastModified':
          comparison = new Date(a.LastModified).getTime() - new Date(b.LastModified).getTime();
          break;
        case 'storageClass':
          comparison = a.StorageClass.localeCompare(b.StorageClass);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (loading && objects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Buckets
          </Button>
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonObjectRow key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Buckets
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{bucketName}</h1>
            <p className="text-gray-600">
              {filteredObjects.length} objects
              {currentPrefix && ` in ${currentPrefix}`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowCreateFolder(!showCreateFolder)}
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowUploadArea(!showUploadArea)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
          <Button
            variant="outline"
            onClick={() => startTransition(fetchObjects)}
            disabled={isPending}
          >
            {isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {breadcrumbParts.length > 0 && (
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <button
            onClick={() => setCurrentPrefix('')}
            className="hover:text-blue-600 transition-colors"
            title="Go to root"
            aria-label="Go to root directory"
          >
            <Home className="w-4 h-4" />
          </button>
          {breadcrumbParts.map((part, index) => {
            const path = breadcrumbParts.slice(0, index + 1).join('/') + '/';
            return (
              <div key={index} className="flex items-center space-x-2">
                <ChevronRight className="w-4 h-4" />
                <button
                  onClick={() => setCurrentPrefix(path)}
                  className="hover:text-blue-600 transition-colors"
                >
                  {part}
                </button>
              </div>
            );
          })}
        </nav>
      )}

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search objects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Upload Area */}
      {showUploadArea && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Upload Files
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUploadArea(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Drag and drop files here or click to select</p>
              <p className="text-sm text-gray-500">Multiple files supported</p>
            </div>
            
            {uploadProgress.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadProgress.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <File className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{item.file.name}</span>
                    </div>
                    
                    {item.status === 'uploading' && (
                      <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden max-w-32">
                        <div 
                          className={`bg-blue-600 h-2 rounded-full transition-all duration-300 ${
                            item.progress >= 100 ? 'w-full' :
                            item.progress >= 90 ? 'w-11/12' :
                            item.progress >= 80 ? 'w-4/5' :
                            item.progress >= 75 ? 'w-3/4' :
                            item.progress >= 66 ? 'w-2/3' :
                            item.progress >= 50 ? 'w-1/2' :
                            item.progress >= 33 ? 'w-1/3' :
                            item.progress >= 25 ? 'w-1/4' :
                            item.progress >= 20 ? 'w-1/5' :
                            item.progress >= 10 ? 'w-1/12' :
                            'w-0'
                          }`}
                        />
                      </div>
                    )}
                    
                    {item.status === 'completed' && (
                      <div className="text-green-600 text-sm">✓ Upload completed</div>
                    )}
                    
                    {item.status === 'error' && (
                      <div className="text-red-600 text-sm">✗ {item.error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search objects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Storage Class Filter */}
          <div className="relative">
            <select
              value={storageClassFilter}
              onChange={(e) => setStorageClassFilter(e.target.value)}
              aria-label="Filter by storage class"
              className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Storage Classes</option>
              {uniqueStorageClasses.map(storageClass => (
                <option key={storageClass} value={storageClass}>{storageClass}</option>
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
                aria-label="Sort objects by"
                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
                <option value="lastModified">Sort by Modified</option>
                <option value="storageClass">Sort by Storage Class</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
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
          
          {/* Clear Filters */}
          {(searchTerm || storageClassFilter !== 'all') && (
            <Button
              onClick={() => {
                setSearchTerm('');
                setStorageClassFilter('all');
              }}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        
        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {filteredObjects.length} of {optimisticObjects.length} objects
            {searchTerm && ` matching "${searchTerm}"`}
            {storageClassFilter !== 'all' && ` in ${storageClassFilter}`}
          </span>
          <span>
            Sorted by {sortBy} ({sortOrder === 'asc' ? 'ascending' : 'descending'})
          </span>
        </div>
      </div>

      {/* Objects List */}
      <Card>
        <CardContent className="p-0">
          {filteredObjects.length === 0 ? (
            <div className="p-8 text-center">
              {searchTerm || storageClassFilter !== 'all' ? (
                <>
                  <Filter className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No objects match your filters</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search terms or filters to find what you're looking for.
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button 
                      onClick={() => setSearchTerm('')}
                      variant="outline"
                      size="sm"
                    >
                      Clear Search
                    </Button>
                    <Button 
                      onClick={() => {
                        setSearchTerm('');
                        setStorageClassFilter('all');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No objects found</h3>
                  <p className="text-gray-600">
                    This {currentPrefix ? 'folder' : 'bucket'} is empty.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <style>
                {`.dynamic-grid-${bucketName?.replace(/[^a-zA-Z0-9]/g, '')} { grid-template-columns: ${gridTemplate}; }`}
              </style>
              <div 
                ref={tableRef}
                className={`min-w-full divide-y divide-gray-200 ${styles.resizableTable} dynamic-grid-${bucketName?.replace(/[^a-zA-Z0-9]/g, '')}`}
              >
                {/* Header */}
                <div className="contents">
                  <div className={`p-4 bg-gray-50 font-medium text-sm text-gray-700 border-r border-gray-200 ${styles.columnHeader}`}>
                    Name
                    <div
                      className={styles.resizeHandle}
                      onMouseDown={(e) => handleMouseDown(e, 'name')}
                    >
                      <GripVertical className={styles.resizeIcon} />
                    </div>
                  </div>
                  <div className={`p-4 bg-gray-50 font-medium text-sm text-gray-700 border-r border-gray-200 ${styles.columnHeader}`}>
                    Size
                    <div
                      className={styles.resizeHandle}
                      onMouseDown={(e) => handleMouseDown(e, 'size')}
                    >
                      <GripVertical className={styles.resizeIcon} />
                    </div>
                  </div>
                  <div className={`p-4 bg-gray-50 font-medium text-sm text-gray-700 border-r border-gray-200 ${styles.columnHeader}`}>
                    Last Modified
                    <div
                      className={styles.resizeHandle}
                      onMouseDown={(e) => handleMouseDown(e, 'lastModified')}
                    >
                      <GripVertical className={styles.resizeIcon} />
                    </div>
                  </div>
                  <div className={`p-4 bg-gray-50 font-medium text-sm text-gray-700 border-r border-gray-200 ${styles.columnHeader}`}>
                    Storage Class
                    <div
                      className={styles.resizeHandle}
                      onMouseDown={(e) => handleMouseDown(e, 'storageClass')}
                    >
                      <GripVertical className={styles.resizeIcon} />
                    </div>
                  </div>
                  <div className={`p-4 bg-gray-50 font-medium text-sm text-gray-700 border-r border-gray-200 ${styles.columnHeader}`}>
                    ETag
                    <div
                      className={styles.resizeHandle}
                      onMouseDown={(e) => handleMouseDown(e, 'etag')}
                    >
                      <GripVertical className={styles.resizeIcon} />
                    </div>
                  </div>
                  <div className={`p-4 bg-gray-50 font-medium text-sm text-gray-700 border-r border-gray-200 ${styles.columnHeader}`}>
                    Actions
                    <div
                      className={styles.resizeHandle}
                      onMouseDown={(e) => handleMouseDown(e, 'actions')}
                    >
                      <GripVertical className={styles.resizeIcon} />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 font-medium text-sm text-gray-700">
                    Download
                  </div>
                </div>

                {/* Objects */}
                {filteredObjects.map((object, index) => {
                  const isOptimistic = (object as OptimisticObject)._isOptimistic;
                  const isDeleting = (object as OptimisticObject)._action === 'delete';
                  const isUpdating = (object as OptimisticObject)._action === 'updateStorageClass';
                  
                  return (
                    <div key={`${object.Key}-${index}`} className="contents">
                      {/* Name */}
                      <div className={`p-4 border-r border-gray-100 transition-all duration-200 ${
                        isOptimistic ? 'opacity-60' : ''
                      } ${isDeleting ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center space-x-2">
                          {object.Key.endsWith('/') ? (
                            <Folder className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          ) : (
                            <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          )}
                          <span className="truncate">{object.Key}</span>
                        </div>
                      </div>

                      {/* Size */}
                      <div className={`p-4 border-r border-gray-100 text-sm text-gray-600 transition-all duration-200 ${
                        isOptimistic ? 'opacity-60' : ''
                      } ${isDeleting ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                        {object.Key.endsWith('/') ? '-' : formatFileSize(object.Size)}
                      </div>

                      {/* Last Modified */}
                      <div className={`p-4 border-r border-gray-100 text-sm text-gray-600 transition-all duration-200 ${
                        isOptimistic ? 'opacity-60' : ''
                      } ${isDeleting ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                        {new Date(object.LastModified).toLocaleDateString()}
                      </div>

                      {/* Storage Class */}
                      <div className={`p-4 border-r border-gray-100 text-sm text-gray-600 transition-all duration-200 ${
                        isOptimistic ? 'opacity-60' : ''
                      } ${isDeleting ? 'bg-red-50' : ''} ${isUpdating ? 'bg-blue-50' : ''} hover:bg-gray-50`}>
                        {object.StorageClass ? (
                          <div
                            style={{
                              pointerEvents: 'auto',
                              userSelect: 'none',
                              WebkitUserSelect: 'none'
                            }}
                            onMouseEnter={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onMouseLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <StorageClassSelector
                              currentStorageClass={object.StorageClass}
                              onStorageClassChange={(newStorageClass) => handleStorageClassChange(object.Key, newStorageClass)}
                              disabled={isOptimistic || isDeleting}
                              objectKey={object.Key}
                              isDirectory={object.Key.endsWith('/')}
                              bucketName={bucketName}
                            />
                          </div>
                        ) : null}
                      </div>

                      {/* ETag */}
                      <div className={`p-4 border-r border-gray-100 text-sm text-gray-600 font-mono truncate transition-all duration-200 ${
                        isOptimistic ? 'opacity-60' : ''
                      } ${isDeleting ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                        {object.ETag.replace(/"/g, '')}
                      </div>

                      {/* Actions */}
                      <div className={`p-4 border-r border-gray-100 transition-all duration-200 ${
                        isOptimistic ? 'opacity-60' : ''
                      } ${isDeleting ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleView(object.Key)}
                            disabled={object.Key.endsWith('/')}
                            title="View object"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRename(object.Key)}
                            title="Rename object"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(object.Key)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete object"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Download */}
                      <div className={`p-4 transition-all duration-200 ${
                        isOptimistic ? 'opacity-60' : ''
                      } ${isDeleting ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                        {!object.Key.endsWith('/') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(object.Key)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rename Object Dialog */}
      {showRenameDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rename Object
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="objectName" className="block text-sm font-medium text-gray-700 mb-2">
                  New object name
                </label>
                <Input
                  id="objectName"
                  type="text"
                  value={newObjectName}
                  onChange={(e) => setNewObjectName(e.target.value)}
                  placeholder="Enter new object name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      executeRename();
                    } else if (e.key === 'Escape') {
                      setShowRenameDialog(false);
                      setRenameObjectKey('');
                      setNewObjectName('');
                    }
                  }}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRenameDialog(false);
                    setRenameObjectKey('');
                    setNewObjectName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={executeRename}
                  disabled={!newObjectName || newObjectName === renameObjectKey}
                >
                  Rename
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
