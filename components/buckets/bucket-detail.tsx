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
  GripVertical
} from 'lucide-react';

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
  _action?: 'create' | 'delete' | 'rename';
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
  const [optimisticObjects, addOptimisticObject] = useOptimistic(
    objects,
    (state: S3Object[], optimisticObject: OptimisticObject) => {
      if (optimisticObject._action === 'delete') {
        return state.filter(obj => obj.Key !== optimisticObject.Key);
      }
      if (optimisticObject._action === 'create') {
        return [...state, optimisticObject as S3Object];
      }
      return state;
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
    
    // Optimistic update
    addOptimisticObject({
      Key: key,
      LastModified: new Date(),
      Size: 0,
      StorageClass: '',
      ETag: '',
      _action: 'delete',
      _isOptimistic: true
    });
    
    try {
      const result = await apiClient.deleteObject(bucketName, key);
      if (result.success) {
        success('Object deleted', `${key} has been deleted successfully`);
        startTransition(() => {
          fetchObjects(); // Refresh the list
        });
      } else {
        // Revert optimistic update on error
        setObjects(prev => prev.filter(obj => obj.Key !== key));
        showError('Delete failed', result.error || 'Failed to delete object');
      }
    } catch (err) {
      // Revert optimistic update on error
      setObjects(prev => prev.filter(obj => obj.Key !== key));
      showError('Delete failed', 'Network error occurred');
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

  const breadcrumbParts = currentPrefix ? currentPrefix.split('/').filter(Boolean) : [];

  const filteredObjects = optimisticObjects.filter(obj =>
    obj.Key.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Objects List */}
      <Card>
        <CardContent className="p-0">
          {filteredObjects.length === 0 ? (
            <div className="p-8 text-center">
              <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No objects found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'No objects match your search criteria.' : 'This bucket is empty.'}
              </p>
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
                      } ${isDeleting ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                        {object.StorageClass}
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
