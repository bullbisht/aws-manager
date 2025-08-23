'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient, type LoginCredentials, type User } from './api-client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ 
    success: boolean; 
    error?: string; 
    deviceAuth?: any;
    needsDeviceAuthorization?: boolean;
  }>;
  completeSSOLogin: (user: User) => Promise<{ success: boolean }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const result = await apiClient.getProfile();
      if (result.success && (result as any).user) {
        setUser((result as any).user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const result = await apiClient.login(credentials);
      
      if (result.success) {
        // Check if this is SSO with device authorization
        if ((result as any).deviceAuth) {
          // Return the device authorization data for SSO flow
          return { 
            success: true, 
            deviceAuth: (result as any).deviceAuth,
            needsDeviceAuthorization: true 
          };
        }
        
        // Regular login with user data
        if ((result as any).user) {
          setUser((result as any).user);
          return { success: true };
        }
      }
      
      return { success: false, error: result.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  const completeSSOLogin = async (user: User) => {
    setUser(user);
    return { success: true };
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, completeSSOLogin, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
