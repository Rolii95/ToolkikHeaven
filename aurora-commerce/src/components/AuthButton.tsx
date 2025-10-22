'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentUser, signInDemo, signOutDemo } from '../lib/auth';

interface AuthButtonProps {
  className?: string;
}

export default function AuthButton({ className = '' }: AuthButtonProps) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for current user on mount
    setUser(getCurrentUser());

    // Listen for auth changes
    const handleAuthChange = (event: CustomEvent) => {
      setUser(event.detail);
    };

    window.addEventListener('authChange', handleAuthChange as EventListener);
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange as EventListener);
    };
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInDemo();
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOutDemo();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user.name?.charAt(0) || 'U'}
            </span>
          </div>
          <span className="text-sm text-gray-700 hidden sm:block">
            {user.name || user.email}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isLoading}
          className="text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className={`bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 ${className}`}
    >
      {isLoading ? 'Signing in...' : 'Demo Sign In'}
    </button>
  );
}