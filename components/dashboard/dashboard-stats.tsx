'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { apiClient } from '@/lib/api-client'
import { useToastHelpers } from '@/components/ui/toast'

interface DashboardStatsProps {
  className?: string
}

interface StatsData {
  totalBuckets: number
  totalObjects: number
  totalSizeBytes: number
  totalSizeFormatted: string
  monthlyCost: string
  s3Cost: string
}

export function DashboardStats({ className }: DashboardStatsProps) {
  const { user } = useAuth()
  const { error: showError } = useToastHelpers()
  const [stats, setStats] = useState<StatsData>({
    totalBuckets: 0,
    totalObjects: 0,
    totalSizeBytes: 0,
    totalSizeFormatted: '0 B',
    monthlyCost: '0.00',
    s3Cost: '0.00'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      fetchRealStats()
    } else {
      setLoading(false)
    }
  }, [user])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const fetchRealStats = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch buckets data and billing data in parallel
      const [bucketsResult, billingResult] = await Promise.all([
        apiClient.getBuckets(),
        apiClient.getBillingData(undefined, 'MONTHLY').catch(() => ({ success: false, error: 'Billing access denied' }))
      ])
      
      let newStats = {
        totalBuckets: 0,
        totalObjects: 0,
        totalSizeBytes: 0,
        totalSizeFormatted: '0 B',
        monthlyCost: '0.00',
        s3Cost: '0.00'
      }

      // Process buckets data
      if (bucketsResult.success && (bucketsResult as any).buckets) {
        const buckets = (bucketsResult as any).buckets
        const totalBuckets = buckets.length
        
        // Calculate totals from bucket data
        let totalObjects = 0
        let totalSizeBytes = 0
        
        buckets.forEach((bucket: any) => {
          totalObjects += bucket.Objects || 0
          // Convert size back to bytes for calculation (approximate)
          if (bucket.Size && bucket.Size !== 'Empty' && bucket.Size !== 'Unknown' && bucket.Size !== 'Access Denied') {
            const sizeStr = bucket.Size.toString()
            const sizeMatch = sizeStr.match(/^([\d.]+)\s*([A-Z]+)$/)
            if (sizeMatch) {
              const value = parseFloat(sizeMatch[1])
              const unit = sizeMatch[2]
              const multipliers = { 'B': 1, 'KB': 1024, 'MB': 1024**2, 'GB': 1024**3, 'TB': 1024**4 }
              totalSizeBytes += value * (multipliers[unit as keyof typeof multipliers] || 1)
            }
          }
        })
        
        newStats.totalBuckets = totalBuckets
        newStats.totalObjects = totalObjects
        newStats.totalSizeBytes = totalSizeBytes
        newStats.totalSizeFormatted = formatBytes(totalSizeBytes)
      }

      // Process billing data
      if (billingResult.success && (billingResult as any).data) {
        const billing = (billingResult as any).data
        newStats.monthlyCost = billing.totalCost || '0.00'
        newStats.s3Cost = billing.s3Cost || '0.00'
      }

      setStats(newStats)
        
      if (!bucketsResult.success) {
        const errorMsg = 'Failed to fetch bucket stats';
        setError(errorMsg);
        showError('Data fetch error', bucketsResult.error || errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Network error occurred';
      setError(errorMsg);
      showError('Network error', errorMsg);
    } finally {
      setLoading(false);
    }
  }

  const statsDisplay = [
    {
      title: 'Total Buckets',
      value: loading ? '...' : error ? 'Error' : stats.totalBuckets.toString(),
      description: 'Active S3 buckets',
      icon: '🪣'
    },
    {
      title: 'Total Objects',
      value: loading ? '...' : error ? 'Error' : stats.totalObjects.toLocaleString(),
      description: 'Files stored',
      icon: '📄'
    },
    {
      title: 'Storage Used',
      value: loading ? '...' : error ? 'Error' : stats.totalSizeFormatted,
      description: 'Total storage',
      icon: '💾'
    },
    {
      title: 'Monthly Cost',
      value: loading ? '...' : error ? 'Error' : `$${stats.s3Cost}`,
      description: stats.s3Cost === '0.00' ? 'No S3 charges this month' : 'S3 costs this month',
      icon: '💰'
    }
  ]

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className || ''}`}>
      {statsDisplay.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <span className="text-2xl">{stat.icon}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
