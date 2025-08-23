'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogHeaderProps {
  children: React.ReactNode;
}

interface DialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal Content */}
      <div className="relative z-50">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ className = '', children }: DialogContentProps) {
  return (
    <div className={`bg-white rounded-lg shadow-xl mx-4 ${className}`}>
      {children}
    </div>
  );
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-gray-200">
      {children}
    </div>
  );
}

export function DialogTitle({ className = '', children }: DialogTitleProps) {
  return (
    <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h2>
  );
}
