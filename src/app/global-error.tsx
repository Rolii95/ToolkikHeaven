'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, MessageCircle, AlertTriangle, Bug, ArrowLeft } from 'lucide-react';
import { createUserLogger } from '../lib/logger';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error for debugging purposes
    const logger = createUserLogger('anonymous', undefined, 'error-session');
    logger.error('global_error_occurred', 'Global application error encountered', {
      errorMessage: error.message,
      errorName: error.name,
      errorDigest: error.digest,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      timestamp: new Date().toISOString()
    }, error);
  }, [error]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleContactSupport = () => {
    const subject = `Error Report - ${error.name || 'Application Error'}`;
    const body = `Hello Aurora Commerce Support,

I encountered an error while using your website:

Error Details:
- Error: ${error.message}
- Page: ${typeof window !== 'undefined' ? window.location.href : 'Unknown'}
- Time: ${new Date().toLocaleString()}
- Error ID: ${error.digest || 'Not available'}

Please help me resolve this issue.

Thank you!`;

    window.location.href = `mailto:support@auroracommerce.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full text-center">
            {/* Logo/Brand Section */}
            <div className="mb-8">
              <div className="text-3xl font-bold text-red-600 mb-2">
                Aurora Commerce
              </div>
              <div className="text-sm text-gray-600">Your Premium Shopping Experience</div>
            </div>

            {/* Error Illustration */}
            <div className="mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 p-6 rounded-full">
                  <AlertTriangle className="h-16 w-16 text-red-600" />
                </div>
              </div>
              <div className="text-6xl font-bold text-red-200 mb-4">500</div>
            </div>

            {/* Error Message */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Oops! Something Went Wrong
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                We're experiencing some technical difficulties on our end.
              </p>
              <p className="text-gray-500 mb-4">
                Don't worry - our team has been notified and is working to fix this issue.
              </p>
              
              {/* Error Details (for development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
                  <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                    <Bug className="h-4 w-4" />
                    Development Error Details
                  </div>
                  <div className="text-sm text-red-700">
                    <p><strong>Error:</strong> {error.message}</p>
                    {error.digest && <p><strong>Error ID:</strong> {error.digest}</p>}
                    <p><strong>Name:</strong> {error.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {/* Try Again */}
              <button
                onClick={reset}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 group"
              >
                <RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-300" />
                Try Again
              </button>

              {/* Go Home */}
              <button
                onClick={handleGoHome}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 group"
              >
                <Home className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Go Home
              </button>

              {/* Contact Support */}
              <button
                onClick={handleContactSupport}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 group"
              >
                <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Get Help
              </button>
            </div>

            {/* Troubleshooting Tips */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Quick Troubleshooting
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-1 rounded">
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Refresh the page</h3>
                      <p className="text-sm text-gray-600">Sometimes a simple refresh fixes temporary issues.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-1 rounded">
                      <ArrowLeft className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Try a different page</h3>
                      <p className="text-sm text-gray-600">The issue might be specific to this page.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-100 p-1 rounded">
                      <MessageCircle className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Contact support</h3>
                      <p className="text-sm text-gray-600">Our team is here to help 24/7.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 p-1 rounded">
                      <Home className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Visit our homepage</h3>
                      <p className="text-sm text-gray-600">Start fresh from our main page.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Need Immediate Assistance?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-1">Email Support</h3>
                  <p className="text-sm text-gray-600 mb-2">Usually responds within 2 hours</p>
                  <a
                    href="mailto:support@auroracommerce.com"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    support@auroracommerce.com
                  </a>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-1">Live Chat</h3>
                  <p className="text-sm text-gray-600 mb-2">Available 24/7</p>
                  <button
                    onClick={() => {
                      // In a real app, this would open a chat widget
                      alert('Live chat would open here in a real implementation');
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Start Chat
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Message */}
            <div className="mt-8 text-sm text-gray-500">
              <p>Error Code: 500 | Internal Server Error</p>
              {error.digest && <p>Error ID: {error.digest}</p>}
              <p className="mt-1">
                We apologize for the inconvenience. Our team has been automatically notified.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}