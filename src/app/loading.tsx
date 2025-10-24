import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        {/* Aurora Commerce Logo */}
        <div className="text-2xl font-bold text-blue-600 mb-8">
          Aurora Commerce
        </div>
        
        {/* Loading Animation */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        
        {/* Loading Text */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Loading your shopping experience...
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          We're preparing something amazing for you. This will just take a moment.
        </p>
        
        {/* Shopping Cart Animation */}
        <div className="mt-8 text-4xl animate-bounce">
          🛍️
        </div>
      </div>
    </div>
  );
}