/**
 * Frontend Application Configuration
 * Environment-based configuration for the S3 Manager frontend
 */

export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  auth: {
    tokenKey: string;
    refreshThreshold: number;
    ssoProviders: string[];
  };
  ui: {
    theme: 'light' | 'dark';
    itemsPerPage: number;
    maxFileSize: number;
    supportedFormats: string[];
  };
  features: {
    multipartUpload: boolean;
    bulkOperations: boolean;
    advancedSearch: boolean;
    realTimeUpdates: boolean;
  };
}

export const config: AppConfig = {
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    timeout: 30000,
    retryAttempts: 3
  },
  auth: {
    tokenKey: 's3manager_token',
    refreshThreshold: 300000, // 5 minutes
    ssoProviders: ['aws']
  },
  ui: {
    theme: (process.env.REACT_APP_THEME as 'light' | 'dark') || 'light',
    itemsPerPage: 50,
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
    supportedFormats: ['*/*']
  },
  features: {
    multipartUpload: true,
    bulkOperations: true,
    advancedSearch: true,
    realTimeUpdates: true
  }
};

export default config;
