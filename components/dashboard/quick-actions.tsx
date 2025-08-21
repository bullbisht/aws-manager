'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface QuickActionsProps {
  className?: string
  onNavigate?: (tab: string) => void
}

export function QuickActions({ className, onNavigate }: QuickActionsProps) {
  const actions = [
    {
      title: 'Create Bucket',
      description: 'Create a new S3 bucket',
      action: 'buckets',
      icon: '🪣',
      variant: 'default' as const
    },
    {
      title: 'Upload Files',
      description: 'Upload files to existing bucket',
      action: 'buckets',
      icon: '⬆️',
      variant: 'secondary' as const
    },
    {
      title: 'View Analytics',
      description: 'Check storage usage and costs',
      action: 'dashboard',
      icon: '📊',
      variant: 'outline' as const
    },
    {
      title: 'Settings',
      description: 'Manage AWS credentials',
      action: 'settings',
      icon: '⚙️',
      variant: 'outline' as const
    }
  ]

  const handleActionClick = (action: string) => {
    if (onNavigate) {
      onNavigate(action);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks to get you started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action, index) => (
            <div key={index} className="w-full">
              <Button
                onClick={() => handleActionClick(action.action)}
                className="w-full h-auto p-4 flex flex-col items-center space-y-2"
              >
                <span className="text-2xl">{action.icon}</span>
                <div className="text-center">
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-xs opacity-70">{action.description}</div>
                </div>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
