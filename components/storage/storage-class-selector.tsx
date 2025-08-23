'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Database, 
  Snowflake, 
  Archive, 
  Zap, 
  Shield, 
  Clock, 
  DollarSign,
  Info,
  X,
  Check
} from 'lucide-react';

interface StorageClass {
  value: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  cost: string;
  costPerGB: string;
  retrieval: string;
  useCase: string;
}

const STORAGE_CLASSES: StorageClass[] = [
  {
    value: 'STANDARD',
    name: 'Standard',
    description: 'General-purpose storage for frequently accessed data',
    icon: <Database className="h-4 w-4" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    cost: 'Higher',
    costPerGB: '$0.023/month',
    retrieval: 'Instant',
    useCase: 'Frequently accessed data'
  },
  {
    value: 'STANDARD_IA',
    name: 'Standard-IA',
    description: 'Infrequently accessed data with rapid access when needed',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    cost: 'Lower',
    costPerGB: '$0.0125/month',
    retrieval: 'Instant',
    useCase: 'Backup, disaster recovery'
  },
  {
    value: 'ONEZONE_IA',
    name: 'One Zone-IA',
    description: 'Lower-cost option for infrequently accessed data in single AZ',
    icon: <Shield className="h-4 w-4" />,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    cost: 'Lower',
    costPerGB: '$0.01/month',
    retrieval: 'Instant',
    useCase: 'Secondary backup copies'
  },
  {
    value: 'INTELLIGENT_TIERING',
    name: 'Intelligent Tiering',
    description: 'Automatically moves data between access tiers to optimize costs',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    cost: 'Optimized',
    costPerGB: '$0.023-0.004/month',
    retrieval: 'Variable',
    useCase: 'Unknown access patterns'
  },
  {
    value: 'GLACIER',
    name: 'Glacier Flexible',
    description: 'Long-term archive with retrieval times from minutes to hours',
    icon: <Snowflake className="h-4 w-4" />,
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    cost: 'Very Low',
    costPerGB: '$0.004/month',
    retrieval: '1-5 minutes',
    useCase: 'Long-term archives'
  },
  {
    value: 'GLACIER_IR',
    name: 'Glacier Instant',
    description: 'Archive storage with instant retrieval for rarely accessed data',
    icon: <Archive className="h-4 w-4" />,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    cost: 'Very Low',
    costPerGB: '$0.004/month',
    retrieval: 'Instant',
    useCase: 'Rarely accessed archives'
  },
  {
    value: 'DEEP_ARCHIVE',
    name: 'Deep Archive',
    description: 'Lowest-cost storage for long-term retention and digital preservation',
    icon: <Archive className="h-4 w-4" />,
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    cost: 'Lowest',
    costPerGB: '$0.00099/month',
    retrieval: '12+ hours',
    useCase: 'Long-term digital preservation'
  },
  {
    value: 'REDUCED_REDUNDANCY',
    name: 'Reduced Redundancy',
    description: 'Legacy storage class for non-critical data (not recommended)',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    cost: 'Variable',
    costPerGB: '$0.024/month',
    retrieval: 'Instant',
    useCase: 'Not recommended for new data'
  }
];

interface StorageClassSelectorProps {
  currentStorageClass: string;
  onStorageClassChange: (newStorageClass: string) => void;
  disabled?: boolean;
  objectKey: string;
  isDirectory?: boolean;
  bucketName?: string;
}

export function StorageClassSelector({ 
  currentStorageClass, 
  onStorageClassChange, 
  disabled = false,
  objectKey 
}: StorageClassSelectorProps) {
  const [showSelector, setShowSelector] = useState(false);
  
  const currentClass = STORAGE_CLASSES.find(sc => sc.value === currentStorageClass);
  
  if (disabled) {
    return (
      <Badge 
        variant="secondary" 
        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border-gray-200 opacity-60"
      >
        {currentClass?.name || currentStorageClass}
      </Badge>
    );
  }

  const handleSelect = (storageClass: StorageClass) => {
    if (storageClass.value !== currentStorageClass) {
      onStorageClassChange(storageClass.value);
    }
    setShowSelector(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowSelector(true)}
        className={`h-auto p-1 text-xs border ${currentClass?.borderColor} ${currentClass?.bgColor} ${currentClass?.color} hover:opacity-80 transition-all`}
      >
        <div className="flex items-center gap-1.5">
          {currentClass?.icon}
          <span className="font-medium">{currentClass?.name || currentStorageClass}</span>
        </div>
      </Button>

      {showSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Select Storage Class</CardTitle>
                  <CardDescription>
                    Choose the optimal storage class for <span className="font-mono text-sm">{objectKey}</span>
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSelector(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {STORAGE_CLASSES.map((storageClass) => (
                  <div
                    key={storageClass.value}
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                      storageClass.value === currentStorageClass
                        ? `${storageClass.borderColor} ${storageClass.bgColor} shadow-md`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSelect(storageClass)}
                  >
                    {storageClass.value === currentStorageClass && (
                      <div className="absolute top-2 right-2">
                        <div className={`rounded-full p-1 ${storageClass.bgColor} ${storageClass.borderColor} border`}>
                          <Check className={`h-3 w-3 ${storageClass.color}`} />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-md ${storageClass.bgColor} ${storageClass.color}`}>
                        {storageClass.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {storageClass.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {storageClass.description}
                        </p>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Cost:</span>
                            <span className="font-medium">{storageClass.cost}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Price:</span>
                            <span className="font-medium text-green-600">{storageClass.costPerGB}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Retrieval:</span>
                            <span className="font-medium">{storageClass.retrieval}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Best for:</span>
                            <span className="font-medium text-right">{storageClass.useCase}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Important Notes:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Storage class changes may incur additional costs</li>
                      <li>Some transitions have minimum storage duration requirements</li>
                      <li>Retrieval costs apply for archived storage classes</li>
                      <li>Changes take effect immediately but billing reflects new class</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
