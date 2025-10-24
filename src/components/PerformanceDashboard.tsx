'use client';

import React, { useState, useEffect } from 'react';
import { onCLS, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  thresholds: { good: number; poor: number };
  unit: string;
  description: string;
}

interface PerformanceData {
  metrics: PerformanceMetric[];
  lastUpdated: number;
  pageUrl: string;
}

const METRIC_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FCP: { good: 1800, poor: 3000 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
};

const METRIC_INFO = {
  LCP: {
    name: 'Largest Contentful Paint',
    unit: 'ms',
    description: 'Time until the largest content element is rendered',
  },
  FCP: {
    name: 'First Contentful Paint',
    unit: 'ms',
    description: 'Time until the first content is painted',
  },
  CLS: {
    name: 'Cumulative Layout Shift',
    unit: '',
    description: 'Visual stability - unexpected layout shifts',
  },
  TTFB: {
    name: 'Time to First Byte',
    unit: 'ms',
    description: 'Time until the first byte is received from the server',
  },
};

function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = METRIC_THRESHOLDS[metricName as keyof typeof METRIC_THRESHOLDS];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

function getRatingColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'needs-improvement':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'poor':
      return 'text-red-600 bg-red-50 border-red-200';
  }
}

function formatValue(value: number, unit: string): string {
  if (unit === 'ms') {
    return `${Math.round(value)}ms`;
  }
  if (unit === '') {
    return value.toFixed(3);
  }
  return `${value}${unit}`;
}

export default function PerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const metricsCollected: Record<string, PerformanceMetric> = {};

    const updateMetric = (metric: Metric, metricName: string) => {
      const info = METRIC_INFO[metricName as keyof typeof METRIC_INFO];
      const thresholds = METRIC_THRESHOLDS[metricName as keyof typeof METRIC_THRESHOLDS];
      
      metricsCollected[metricName] = {
        name: info.name,
        value: metric.value,
        rating: getRating(metricName, metric.value),
        thresholds,
        unit: info.unit,
        description: info.description,
      };

      setPerformanceData({
        metrics: Object.values(metricsCollected),
        lastUpdated: Date.now(),
        pageUrl: window.location.pathname,
      });
    };

    // Set up Web Vitals monitoring
    onCLS((metric) => updateMetric(metric, 'CLS'));
    onFCP((metric) => updateMetric(metric, 'FCP'));
    onLCP((metric) => updateMetric(metric, 'LCP'));
    onTTFB((metric) => updateMetric(metric, 'TTFB'));

    // Show dashboard on Ctrl+Shift+P (or Cmd+Shift+P on Mac)
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        setIsVisible(!isVisible);
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  if (!isVisible || !performanceData) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Show Performance Dashboard (Ctrl+Shift+P)"
        >
          📊
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
              <p className="text-gray-600">Core Web Vitals for {performanceData.pageUrl}</p>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {performanceData.metrics.map((metric) => (
              <div
                key={metric.name}
                className={`border rounded-lg p-4 ${getRatingColor(metric.rating)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{metric.name}</h3>
                  <span className="text-sm font-medium capitalize">{metric.rating}</span>
                </div>
                <div className="text-2xl font-bold mb-2">
                  {formatValue(metric.value, metric.unit)}
                </div>
                <p className="text-sm mb-3">{metric.description}</p>
                <div className="flex justify-between text-xs">
                  <span>Good: ≤{formatValue(metric.thresholds.good, metric.unit)}</span>
                  <span>Poor: {'>'}{formatValue(metric.thresholds.poor, metric.unit)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Performance Recommendations</h3>
            <div className="space-y-3">
              {performanceData.metrics
                .filter(metric => metric.rating !== 'good')
                .map((metric) => (
                  <div key={metric.name} className="bg-gray-50 rounded p-3">
                    <h4 className="font-medium text-gray-900">{metric.name}</h4>
                    <ul className="text-sm text-gray-600 mt-2 space-y-1">
                      {getRecommendations(metric.name).map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </div>

          <div className="border-t pt-4 mt-4 text-center text-sm text-gray-500">
            Last updated: {new Date(performanceData.lastUpdated).toLocaleTimeString()}
            <br />
            Press Ctrl+Shift+P to toggle this dashboard
          </div>
        </div>
      </div>
    </div>
  );
}

function getRecommendations(metricName: string): string[] {
  const recommendations: Record<string, string[]> = {
    'Largest Contentful Paint': [
      'Optimize images with Next.js Image component',
      'Implement preloading for critical resources',
      'Reduce server response times',
      'Use CDN for static assets',
      'Minimize render-blocking resources',
    ],
    'First Contentful Paint': [
      'Optimize critical rendering path',
      'Minimize render-blocking CSS',
      'Inline critical CSS',
      'Optimize web fonts loading',
      'Use service workers for caching',
    ],
    'Cumulative Layout Shift': [
      'Set explicit dimensions for images and videos',
      'Reserve space for dynamic content',
      'Avoid inserting content above existing content',
      'Use CSS aspect-ratio for responsive elements',
      'Preload web fonts',
    ],
    'Time to First Byte': [
      'Optimize server response time',
      'Use CDN for static content',
      'Implement caching strategies',
      'Optimize database queries',
      'Use edge computing',
    ],
  };

  return recommendations[metricName] || [];
}