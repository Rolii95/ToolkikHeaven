'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Search, ShoppingBag, ArrowLeft, MessageCircle, RefreshCw } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo/Brand Section */}
        <div className="mb-8">
          <Link href="/" className="inline-block">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              Aurora Commerce
            </div>
            <div className="text-sm text-gray-600">Your Premium Shopping Experience</div>
          </Link>
        </div>

        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-blue-200 mb-4">404</div>
          <div className="text-6xl mb-4">🛍️</div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Oops! Page Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            The page you're looking for seems to have wandered off.
          </p>
          <p className="text-gray-500">
            Don't worry, even the best shoppers sometimes take a wrong turn!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Go Home */}
          <Link
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 group"
          >
            <Home className="h-5 w-5 group-hover:scale-110 transition-transform" />
            Go Home
          </Link>

          {/* Browse Products */}
          <Link
            href="/products"
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 group"
          >
            <ShoppingBag className="h-5 w-5 group-hover:scale-110 transition-transform" />
            Shop Now
          </Link>

          {/* Search */}
          <button
            onClick={() => {
              // Trigger search modal (Cmd+K functionality)
              window.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'k',
                metaKey: true,
                bubbles: true
              }));
            }}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 group"
          >
            <Search className="h-5 w-5 group-hover:scale-110 transition-transform" />
            Search
          </button>

          {/* Go Back */}
          <button
            onClick={handleGoBack}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:scale-110 transition-transform" />
            Go Back
          </button>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Popular Destinations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/cart"
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
            >
              Shopping Cart
            </Link>
            <Link
              href="/checkout"
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
            >
              Checkout
            </Link>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
            >
              Featured Products
            </Link>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Still can't find what you're looking for?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </button>
            <a
              href="mailto:support@auroracommerce.com"
              className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Contact Support
            </a>
          </div>
        </div>

        {/* Footer Message */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Error Code: 404 | Page Not Found</p>
          <p className="mt-1">
            If this problem persists, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}