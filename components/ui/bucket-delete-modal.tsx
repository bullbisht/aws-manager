'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertTriangle, X } from 'lucide-react';

interface BucketDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bucketName: string;
  loading?: boolean;
}

export function BucketDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  bucketName,
  loading = false
}: BucketDeleteModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const isConfirmDisabled = confirmationText !== bucketName || loading;

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (confirmationText === bucketName) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <Card className="relative z-50 w-full max-w-md mx-4 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <CardTitle className="text-red-800">Delete Bucket</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-gray-600">
              <p className="mb-3">
                This action <strong>cannot be undone</strong>. This will permanently delete the bucket <strong>{bucketName}</strong> and all its contents.
              </p>
              <p className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                ⚠️ Make sure the bucket is empty before deletion. AWS will reject deletion of non-empty buckets.
              </p>
            </div>

            <div>
              <label htmlFor="bucket-name-confirm" className="block text-sm font-medium text-gray-700 mb-2">
                Type <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{bucketName}</code> to confirm:
              </label>
              <Input
                id="bucket-name-confirm"
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Enter bucket name"
                disabled={loading}
                className="w-full"
                autoComplete="off"
                autoFocus
              />
            </div>
          </div>
          
          <div className="flex gap-3 justify-end mt-6">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete Bucket'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
