'use client';

import React, { useState } from 'react';
import ErrorBoundary from '../../components/ErrorBoundary';

function ErrorTrigger() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('This is a test error to demonstrate error boundary functionality');
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Error Boundary Test</h3>
      <p className="text-gray-600 mb-4">
        Click the button below to trigger an error and see how our error boundary handles it.
      </p>
      <button
        onClick={() => setShouldError(true)}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
      >
        Trigger Error
      </button>
    </div>
  );
}

export default function ErrorTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Error Handling Test Page
          </h1>
          <p className="text-lg text-gray-600">
            This page demonstrates our error handling capabilities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Error Boundary Test */}
          <ErrorBoundary>
            <ErrorTrigger />
          </ErrorBoundary>

          {/* 404 Test Link */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">404 Error Test</h3>
            <p className="text-gray-600 mb-4">
              Click the link below to see our custom 404 error page.
            </p>
            <a
              href="/this-page-does-not-exist"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Go to Non-existent Page
            </a>
          </div>

          {/* Server Error Simulation */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Server Error Test</h3>
            <p className="text-gray-600 mb-4">
              Server errors are handled by our global error boundary automatically.
            </p>
            <div className="text-sm text-gray-500">
              Note: Server errors are caught by global-error.tsx
            </div>
          </div>

          {/* Network Error Simulation */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Network Error Test</h3>
            <p className="text-gray-600 mb-4">
              Try accessing the site with no internet connection to see offline handling.
            </p>
            <div className="text-sm text-gray-500">
              Note: Network errors are handled gracefully by our APIs
            </div>
          </div>
        </div>

        {/* Error Information */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Our Error Handling Strategy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">404 Errors</h3>
              <p className="text-gray-600 text-sm">
                Custom branded page with helpful navigation options and search functionality.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">500 Errors</h3>
              <p className="text-gray-600 text-sm">
                Global error boundary with automatic error logging and recovery options.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Component Errors</h3>
              <p className="text-gray-600 text-sm">
                Error boundaries isolate failures and provide graceful fallbacks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}