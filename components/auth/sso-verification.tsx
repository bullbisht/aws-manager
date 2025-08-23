'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface SSOVerificationProps {
  deviceAuth: {
    userCode: string;
    verificationUri: string;
    verificationUriComplete: string;
    expiresIn: number;
    interval: number;
  };
  deviceCode: string;
  ssoStartUrl: string;
  ssoRegion: string;
  onSuccess: (user: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export function SSOVerification({
  deviceAuth,
  deviceCode,
  ssoStartUrl,
  ssoRegion,
  onSuccess,
  onError,
  onCancel
}: SSOVerificationProps) {
  const [timeLeft, setTimeLeft] = useState(deviceAuth.expiresIn);
  const [polling, setPolling] = useState(true);
  const [status, setStatus] = useState<'waiting' | 'expired' | 'denied' | 'error'>('waiting');
  const [copied, setCopied] = useState(false);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus('expired');
          setPolling(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Polling for authorization completion
  useEffect(() => {
    if (!polling) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/auth/sso-poll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deviceCode,
            ssoStartUrl,
            ssoRegion,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setPolling(false);
          onSuccess(result.user);
        } else if (result.expired) {
          setStatus('expired');
          setPolling(false);
          onError('Device authorization has expired. Please try again.');
        } else if (result.denied) {
          setStatus('denied');
          setPolling(false);
          onError('Access was denied. Please try again.');
        } else if (!result.pending) {
          setStatus('error');
          setPolling(false);
          onError(result.error || 'Authentication failed');
        }
      } catch (error) {
        console.error('Polling error:', error);
        setStatus('error');
        setPolling(false);
        onError('Network error during authentication');
      }
    }, deviceAuth.interval * 1000);

    return () => clearInterval(pollInterval);
  }, [polling, deviceCode, ssoStartUrl, ssoRegion, deviceAuth.interval, onSuccess, onError]);

  const copyUserCode = async () => {
    try {
      await navigator.clipboard.writeText(deviceAuth.userCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const openVerificationUrl = () => {
    window.open(deviceAuth.verificationUriComplete, '_blank', 'noopener,noreferrer');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'waiting':
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'denied':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'waiting':
        return 'Waiting for authorization...';
      case 'expired':
        return 'Authorization has expired';
      case 'denied':
        return 'Authorization was denied';
      case 'error':
        return 'An error occurred';
      default:
        return 'Waiting for authorization...';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          {getStatusIcon()}
          AWS SSO Authentication
        </CardTitle>
        <CardDescription>
          Complete the authorization in your browser
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Code Display */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Enter this code:</p>
          <div className="bg-gray-100 rounded-lg p-4 font-mono text-xl tracking-wider flex items-center justify-between">
            <span className="font-bold">{deviceAuth.userCode}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyUserCode}
              className="ml-2"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Verification URL */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">At this URL:</p>
          <p className="text-sm text-blue-600 bg-blue-50 rounded p-2 break-all">
            {deviceAuth.verificationUri}
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={openVerificationUrl}
          className="w-full"
          disabled={status !== 'waiting'}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Authorization Page
        </Button>

        {/* Status and Timer */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">{getStatusMessage()}</p>
          {status === 'waiting' && (
            <p className="text-sm font-mono">
              Time remaining: {formatTime(timeLeft)}
            </p>
          )}
        </div>

        {/* Instructions */}
        {status === 'waiting' && (
          <div className="bg-blue-50 rounded-lg p-4 text-sm">
            <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Click "Open Authorization Page" above</li>
              <li>Enter the user code: <strong>{deviceAuth.userCode}</strong></li>
              <li>Complete the authorization in your AWS SSO portal</li>
              <li>Return to this page - you'll be automatically signed in</li>
            </ol>
          </div>
        )}

        {/* Error state actions */}
        {(status === 'expired' || status === 'denied' || status === 'error') && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Try Again
            </Button>
          </div>
        )}

        {/* Cancel button for waiting state */}
        {status === 'waiting' && (
          <Button variant="outline" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
