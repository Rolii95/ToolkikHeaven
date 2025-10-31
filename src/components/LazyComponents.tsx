'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Loading component for admin pages
const AdminLoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        
        {/* Chart/Table Skeleton */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Dynamically import admin components with loading states
export const AdminAnalytics = dynamic(
  () => import('../app/admin/analytics/page'),
  {
    loading: () => <AdminLoadingSkeleton />,
    ssr: false,
  }
);

export const AdminOrders = dynamic(
  () => import('../app/admin/orders/page'),
  {
    loading: () => <AdminLoadingSkeleton />,
    ssr: false,
  }
);

export const AdminInventory = dynamic(
  () => import('../app/admin/inventory/page'),
  {
    loading: () => <AdminLoadingSkeleton />,
    ssr: false,
  }
);

export const AdminEmail = dynamic(
  () => import('../app/admin/email/page'),
  {
    loading: () => <AdminLoadingSkeleton />,
    ssr: false,
  }
);

// Performance Dashboard - load only when needed
export const PerformanceDashboard = dynamic(
  () => import('./PerformanceDashboard'),
  {
    loading: () => (
      <div className="fixed bottom-4 right-4 bg-white p-2 rounded shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    ),
    ssr: false,
  }
);

// Web Vitals Reporter - load only in production
export const WebVitalsReporter = dynamic(
  () => import('./WebVitalsReporter'),
  {
    ssr: false,
  }
);

export default {
  AdminAnalytics,
  AdminOrders,
  AdminInventory,
  AdminEmail,
  PerformanceDashboard,
  WebVitalsReporter,
};