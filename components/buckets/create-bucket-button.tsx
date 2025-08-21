'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import { useToastHelpers } from '@/components/ui/toast';

interface CreateBucketButtonProps {
  onBucketCreated?: () => void;
}

export function CreateBucketButton({ onBucketCreated }: CreateBucketButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { success, error: showError } = useToastHelpers();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const bucketName = (formData.get('bucketName') as string).toLowerCase(); // Convert to lowercase
    const region = formData.get('region') as string || 'ap-south-1';

    try {
      const result = await apiClient.createBucket(bucketName, region);

      if (result.success) {
        success('Bucket created', `Bucket "${bucketName}" has been created successfully in ${region}`);
        setShowForm(false);
        // Navigate to buckets page or refresh bucket list
        if (onBucketCreated) {
          onBucketCreated();
        } else {
          // Fallback to reload if no callback provided
          window.location.reload();
        }
      } else {
        let errorMessage = result.error || 'Failed to create bucket';
        
        // If there are validation details, show them
        if (result.details && Array.isArray(result.details)) {
          const validationErrors = result.details.map((detail: any) => detail.message).join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        }
        
        showError('Creation failed', errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Create bucket error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      showError('Network error', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <Button 
        onClick={() => setShowForm(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        Create Bucket
      </Button>
    );
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Create New Bucket</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="bucketName" className="block text-sm font-medium mb-1">
              Bucket Name
            </label>
            <Input
              id="bucketName"
              name="bucketName"
              type="text"
              placeholder="my-bucket-name"
              pattern="^[a-z0-9][a-z0-9\-]*[a-z0-9]$"
              minLength={3}
              maxLength={63}
              required
              onInput={(e) => {
                // Convert to lowercase as user types
                const target = e.target as HTMLInputElement;
                target.value = target.value.toLowerCase();
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              3-63 characters, must start and end with lowercase letter or number, can contain hyphens
            </p>
          </div>
          
          <div>
            <label htmlFor="region" className="block text-sm font-medium mb-1">
              Region
            </label>
            <Input
              id="region"
              name="region"
              type="text"
              placeholder="ap-south-1"
              defaultValue="ap-south-1"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'Creating...' : 'Create Bucket'}
            </Button>
            <Button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="border border-gray-300"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
