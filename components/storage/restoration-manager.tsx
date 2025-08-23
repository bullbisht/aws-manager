'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { Clock, Download, Loader2, CheckCircle, AlertCircle, Archive, Timer, Hourglass } from 'lucide-react';

// Toast function placeholder - replace with your toast implementation
const toast = {
  success: (message: string) => console.log('SUCCESS:', message),
  error: (message: string) => console.error('ERROR:', message),
};

interface S3Object {
  Key: string;
  StorageClass: string;
  Size: number;
  LastModified: Date;
  ETag: string;
  restore?: {
    isRestoreInProgress: boolean;
    restoreExpiryDate?: string;
    expectedCompletionTime?: string;
  };
}

interface RestorationManagerProps {
  bucketName: string;
  objects: S3Object[];
  selectedObjects: string[];
  onRestoreComplete?: () => void;
}

interface RestoreRequest {
  days: number;
  tier: 'Expedited' | 'Standard' | 'Bulk';
  description?: string;
}

interface CountdownState {
  [key: string]: {
    timeRemaining: number;
    isCompleted: boolean;
  };
}

const TIER_INFO = {
  Expedited: { duration: '1-5 minutes', cost: 'Highest', hours: 0.083 }, // 5 minutes max
  Standard: { duration: '3-5 hours', cost: 'Medium', hours: 4 }, // 4 hours average
  Bulk: { duration: '5-12 hours', cost: 'Lowest', hours: 8.5 }, // 8.5 hours average
};

const formatTimeRemaining = (milliseconds: number): string => {
  if (milliseconds <= 0) return 'Ready for download';
  
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

const CountdownTimer: React.FC<{ 
  targetTime: string; 
  onComplete: () => void;
  objectKey: string;
}> = ({ targetTime, onComplete, objectKey }) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const target = new Date(targetTime).getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const remaining = target - now;
      
      if (remaining <= 0) {
        setTimeRemaining(0);
        if (!isCompleted) {
          setIsCompleted(true);
          onComplete();
        }
      } else {
        setTimeRemaining(remaining);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete, isCompleted]);

  if (isCompleted || timeRemaining <= 0) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle size={16} />
        <span className="font-medium">Ready for download</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-blue-600">
      <Timer size={16} className="animate-pulse" />
      <span className="font-mono">{formatTimeRemaining(timeRemaining)}</span>
    </div>
  );
};

export const RestorationManager: React.FC<RestorationManagerProps> = ({
  bucketName,
  objects,
  selectedObjects,
  onRestoreComplete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [restoreRequest, setRestoreRequest] = useState<RestoreRequest>({
    days: 1,
    tier: 'Standard',
    description: '',
  });
  const [activeRestorations, setActiveRestorations] = useState<CountdownState>({});

  // Filter objects to show only DEEP_ARCHIVE and GLACIER objects
  const archiveObjects = objects.filter(obj => 
    obj.StorageClass === 'DEEP_ARCHIVE' || obj.StorageClass === 'GLACIER'
  );

  const selectedArchiveObjects = archiveObjects.filter(obj => 
    selectedObjects.includes(obj.Key)
  );

  // Check restoration status for objects
  useEffect(() => {
    const checkRestorationStatus = async () => {
      for (const obj of archiveObjects) {
        if (obj.restore?.isRestoreInProgress && obj.restore?.expectedCompletionTime) {
          setActiveRestorations(prev => ({
            ...prev,
            [obj.Key]: {
              timeRemaining: new Date(obj.restore!.expectedCompletionTime!).getTime() - new Date().getTime(),
              isCompleted: false,
            }
          }));
        }
      }
    };

    if (archiveObjects.length > 0) {
      checkRestorationStatus();
    }
  }, [archiveObjects]);

  const handleSingleRestore = async (objectKey: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.restoreObject(
        bucketName,
        objectKey,
        restoreRequest.days,
        restoreRequest.tier,
        restoreRequest.description
      );

      if (response.success) {
        toast.success(`Restoration initiated for ${objectKey}`);
        
        // Add to active restorations with countdown
        if (response.data?.expectedCompletionTime) {
          setActiveRestorations(prev => ({
            ...prev,
            [objectKey]: {
              timeRemaining: new Date(response.data!.expectedCompletionTime!).getTime() - new Date().getTime(),
              isCompleted: false,
            }
          }));
        }
        
        onRestoreComplete?.();
      } else {
        toast.error(`Failed to restore ${objectKey}: ${response.error}`);
      }
    } catch (error) {
      toast.error(`Error restoring ${objectKey}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedArchiveObjects.length === 0) {
      toast.error('No archive objects selected for restoration');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.bulkRestoreObjects(bucketName, {
        objects: selectedArchiveObjects.map(obj => obj.Key),
        days: restoreRequest.days,
        tier: restoreRequest.tier,
        description: restoreRequest.description,
      });

      if (response.success) {
        const { summary, results } = response.data!;
        
        toast.success(
          `Bulk restoration initiated: ${summary.successful} successful, ${summary.failed} failed, ${summary.skipped} skipped, ${summary.alreadyInProgress} already in progress`
        );

        // Add successful restorations to countdown
        results.forEach(result => {
          if (result.status === 'success' && result.expectedCompletionTime) {
            setActiveRestorations(prev => ({
              ...prev,
              [result.key]: {
                timeRemaining: new Date(result.expectedCompletionTime!).getTime() - new Date().getTime(),
                isCompleted: false,
              }
            }));
          }
        });
        
        onRestoreComplete?.();
        setIsOpen(false);
      } else {
        toast.error(`Bulk restoration failed: ${response.error}`);
      }
    } catch (error) {
      toast.error(`Error in bulk restoration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorationComplete = (objectKey: string) => {
    setActiveRestorations(prev => ({
      ...prev,
      [objectKey]: {
        ...prev[objectKey],
        isCompleted: true,
      }
    }));
    
    toast.success(`${objectKey} restoration completed and ready for download!`);
    onRestoreComplete?.();
  };

  if (archiveObjects.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Active Restorations Display */}
      {Object.keys(activeRestorations).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hourglass size={20} />
              Active Restorations
            </CardTitle>
            <CardDescription>
              Objects currently being restored from archive storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(activeRestorations).map(([objectKey, restoration]) => {
                const obj = archiveObjects.find(o => o.Key === objectKey);
                if (!obj?.restore?.expectedCompletionTime) return null;

                return (
                  <div key={objectKey} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Archive size={16} />
                      <span className="font-medium truncate max-w-xs">{objectKey}</span>
                      <Badge variant="outline">{obj.StorageClass}</Badge>
                    </div>
                    <CountdownTimer
                      targetTime={obj.restore.expectedCompletionTime}
                      onComplete={() => handleRestorationComplete(objectKey)}
                      objectKey={objectKey}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Restoration Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Download size={16} />
            Restore Archive Objects
            {selectedArchiveObjects.length > 0 && (
              <Badge variant="secondary">{selectedArchiveObjects.length} selected</Badge>
            )}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Restore Objects from Archive Storage</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Restoration Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="days">Restoration Duration (Days)</Label>
                <Input
                  id="days"
                  type="number"
                  min="1"
                  max="365"
                  value={restoreRequest.days}
                  onChange={(e) => setRestoreRequest(prev => ({ 
                    ...prev, 
                    days: parseInt(e.target.value) || 1 
                  }))}
                />
                <p className="text-sm text-muted-foreground">
                  How long the restored objects will be available for download
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tier">Restoration Tier</Label>
                <Select
                  value={restoreRequest.tier}
                  onValueChange={(value: string) => 
                    setRestoreRequest(prev => ({ ...prev, tier: value as 'Expedited' | 'Standard' | 'Bulk' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIER_INFO).map(([tier, info]) => (
                      <SelectItem key={tier} value={tier}>
                        <div className="flex flex-col">
                          <span>{tier}</span>
                          <span className="text-xs text-muted-foreground">
                            {info.duration} • {info.cost} cost
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter a description for this restoration request..."
                value={restoreRequest.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRestoreRequest(prev => ({ 
                  ...prev, 
                  description: e.target.value 
                }))}
              />
            </div>

            {/* Tier Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Selected Tier: {restoreRequest.tier}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p><strong>Duration:</strong> {TIER_INFO[restoreRequest.tier].duration}</p>
                  <p><strong>Cost:</strong> {TIER_INFO[restoreRequest.tier].cost}</p>
                  <p className="text-muted-foreground">
                    Restoration will begin immediately and you'll be notified when objects are ready for download.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Objects to Restore */}
            <div className="space-y-3">
              <h4 className="font-medium">Objects to Restore</h4>
              
              {selectedArchiveObjects.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedArchiveObjects.map(obj => (
                    <div key={obj.Key} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Archive size={14} />
                        <span className="text-sm truncate max-w-xs">{obj.Key}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{obj.StorageClass}</Badge>
                        {obj.restore?.isRestoreInProgress && (
                          <Badge variant="secondary" className="text-xs">Restoring</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 border-2 border-dashed rounded-lg">
                  <Archive className="mx-auto mb-2 opacity-50" size={24} />
                  <p className="text-sm text-muted-foreground">
                    No archive objects selected. Select objects from the list above to restore them.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkRestore}
                disabled={isLoading || selectedArchiveObjects.length === 0}
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Restore {selectedArchiveObjects.length} Object{selectedArchiveObjects.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};
