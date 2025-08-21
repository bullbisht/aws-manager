'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  User, 
  LogOut, 
  ChevronDown, 
  Shield, 
  MapPin, 
  CreditCard 
} from 'lucide-react';

interface UserInfoProps {
  showFullCard?: boolean;
  showDropdown?: boolean;
  className?: string;
}

export function UserInfo({ 
  showFullCard = true, 
  showDropdown = true, 
  className = '' 
}: UserInfoProps) {
  const { user, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  if (!user) return null;

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* User Info Card - Hidden on mobile if showFullCard is false */}
      {showFullCard && (
        <div className="hidden md:flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-medium">
            {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-900">{user?.name || 'User'}</div>
            <div className="text-gray-500 truncate max-w-32">{user?.email}</div>
          </div>
          {user?.awsRegion && (
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {user.awsRegion}
            </div>
          )}
        </div>
      )}

      {/* User Dropdown */}
      {showDropdown && (
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center space-x-1 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="User menu"
          >
            {!showFullCard && (
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-medium mr-2">
                {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <User className="w-5 h-5" />
            <ChevronDown className="w-4 h-4" />
          </button>

          {showUserDropdown && (
            <>
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 border">
                {/* User Info in Dropdown */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full text-lg font-medium">
                      {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{user?.name || 'User'}</div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                      {user?.authType && (
                        <div className="flex items-center space-x-1 text-xs text-gray-400 mt-1">
                          <Shield className="w-3 h-3" />
                          <span className="capitalize">{user.authType} Authentication</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* AWS Details */}
                  {(user?.awsRegion || user?.awsAccountId) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md space-y-2">
                      <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                        AWS Account Details
                      </div>
                      {user?.awsRegion && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>Region:</span>
                          </div>
                          <span className="text-gray-900 font-medium">{user.awsRegion}</span>
                        </div>
                      )}
                      {user?.awsAccountId && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <CreditCard className="w-4 h-4" />
                            <span>Account:</span>
                          </div>
                          <span className="text-gray-900 font-medium font-mono text-xs">
                            {user.awsAccountId}
                          </span>
                        </div>
                      )}
                      {user?.permissions && user.permissions.length > 0 && (
                        <div className="text-sm">
                          <div className="flex items-center space-x-2 text-gray-600 mb-1">
                            <Shield className="w-4 h-4" />
                            <span>Permissions:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.map((permission, index) => (
                              <span 
                                key={index}
                                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                              >
                                {permission}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dropdown Actions */}
                <button
                  onClick={() => {
                    logout();
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Backdrop to close dropdown */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowUserDropdown(false)}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function UserInfoCompact({ className = '' }: { className?: string }) {
  return (
    <UserInfo 
      showFullCard={false} 
      showDropdown={true} 
      className={className}
    />
  );
}

// Card only version (no dropdown)
export function UserInfoCard({ className = '' }: { className?: string }) {
  return (
    <UserInfo 
      showFullCard={true} 
      showDropdown={false} 
      className={className}
    />
  );
}
