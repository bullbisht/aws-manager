'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';

interface LoginFormProps {
  className?: string;
}

export function LoginForm({ className }: LoginFormProps) {
  const [loginType, setLoginType] = useState<'credentials' | 'sso'>('credentials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Form submission handler triggered');
    setLoading(true);
    setError('');

    try {
      const formData = new FormData(e.currentTarget);
      let credentials;
      
      if (loginType === 'credentials') {
        credentials = {
          authType: 'credentials' as const,
          accessKeyId: formData.get('accessKey') as string,
          secretAccessKey: formData.get('secretKey') as string,
          region: formData.get('region') as string || 'ap-south-1',
        };
      } else {
        credentials = {
          authType: 'sso' as const,
          ssoStartUrl: formData.get('ssoUrl') as string,
          ssoRegion: formData.get('ssoRegion') as string || 'ap-south-1',
        };
      }

      console.log('Attempting login with credentials:', { ...credentials, secretAccessKey: '[HIDDEN]' });
      const result = await login(credentials);
      
      if (result.success) {
        console.log('Login successful, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('Login failed:', result.error);
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`w-full max-w-md ${className || ''}`}>
      <CardHeader>
        <CardTitle>Sign In to AWS S3 Manager</CardTitle>
        <CardDescription>
          Choose your authentication method
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-6">
          <Button
            type="button"
            onClick={() => setLoginType('credentials')}
            className={`flex-1 ${loginType === 'credentials' ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            AWS Credentials
          </Button>
          <Button
            type="button"
            onClick={() => setLoginType('sso')}
            className={`flex-1 ${loginType === 'sso' ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            AWS SSO
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {loginType === 'credentials' ? (
            <>
              <div>
                <label htmlFor="accessKey" className="block text-sm font-medium mb-1">
                  Access Key ID
                </label>
                <Input
                  id="accessKey"
                  name="accessKey"
                  type="text"
                  placeholder="AKIAI..."
                  required
                />
              </div>
              <div>
                <label htmlFor="secretKey" className="block text-sm font-medium mb-1">
                  Secret Access Key
                </label>
                <Input
                  id="secretKey"
                  name="secretKey"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label htmlFor="region" className="block text-sm font-medium mb-1">
                  Region
                </label>
                <select
                  id="region"
                  name="region"
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                  defaultValue="ap-south-1"
                  required
                >
                  <option value="ap-south-1">Asia Pacific (Mumbai) - ap-south-1</option>
                  <option value="us-east-1">US East (N. Virginia) - us-east-1</option>
                  <option value="us-west-2">US West (Oregon) - us-west-2</option>
                  <option value="eu-west-1">Europe (Ireland) - eu-west-1</option>
                  <option value="eu-central-1">Europe (Frankfurt) - eu-central-1</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore) - ap-southeast-1</option>
                  <option value="ap-northeast-1">Asia Pacific (Tokyo) - ap-northeast-1</option>
                  <option value="ca-central-1">Canada (Central) - ca-central-1</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="ssoUrl" className="block text-sm font-medium mb-1">
                  SSO Start URL
                </label>
                <Input
                  id="ssoUrl"
                  name="ssoUrl"
                  type="url"
                  placeholder="https://your-sso-portal.awsapps.com/start"
                  required
                />
              </div>
              <div>
                <label htmlFor="ssoRegion" className="block text-sm font-medium mb-1">
                  SSO Region
                </label>
                <select
                  id="ssoRegion"
                  name="ssoRegion"
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                  defaultValue="ap-south-1"
                  required
                >
                  <option value="ap-south-1">Asia Pacific (Mumbai) - ap-south-1</option>
                  <option value="us-east-1">US East (N. Virginia) - us-east-1</option>
                  <option value="us-west-2">US West (Oregon) - us-west-2</option>
                  <option value="eu-west-1">Europe (Ireland) - eu-west-1</option>
                  <option value="eu-central-1">Europe (Frankfurt) - eu-central-1</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore) - ap-southeast-1</option>
                  <option value="ap-northeast-1">Asia Pacific (Tokyo) - ap-northeast-1</option>
                  <option value="ca-central-1">Canada (Central) - ca-central-1</option>
                </select>
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
