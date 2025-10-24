'use client';

import { useEffect } from 'react';
import { onCLS, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { createUserLogger } from '../lib/logger';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

interface PerformanceThresholds {
  LCP: { good: number; poor: number };
  FID: { good: number; poor: number };
  CLS: { good: number; poor: number };
  FCP: { good: number; poor: number };
  TTFB: { good: number; poor: number };
}

const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = PERFORMANCE_THRESHOLDS[name as keyof PerformanceThresholds];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

function sendToAnalytics(metric: WebVitalMetric) {
  const logger = createUserLogger('performance-user', undefined, 'web-vitals');
  
  logger.info('web_vital_measured', `Web Vital metric captured: ${metric.name}`, {
    metricName: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    metricId: metric.id,
    navigationType: metric.navigationType,
    url: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    timestamp: Date.now(),
    deviceType: getDeviceType(),
    connectionType: getConnectionType(),
  });

  // Send to Vercel Analytics if available
  if (typeof window !== 'undefined' && (window as any).va) {
    (window as any).va('track', 'WebVital', {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      page: window.location.pathname,
    });
  }

  // Log performance issues
  if (metric.rating === 'poor') {
    logger.warn('web_vital_poor_performance', `Poor performance detected for ${metric.name}`, {
      metricName: metric.name,
      value: metric.value,
      threshold: PERFORMANCE_THRESHOLDS[metric.name as keyof PerformanceThresholds]?.poor,
      recommendedActions: getPerformanceRecommendations(metric.name, metric.value),
    });
  }
}

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getConnectionType(): string {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) return 'unknown';
  
  const connection = (navigator as any).connection;
  return connection?.effectiveType || 'unknown';
}

function getPerformanceRecommendations(metricName: string, value: number): string[] {
  const recommendations: Record<string, string[]> = {
    LCP: [
      'Optimize images with Next.js Image component',
      'Implement preloading for critical resources',
      'Reduce server response times',
      'Use CDN for static assets',
      'Minimize render-blocking resources',
    ],
    FID: [
      'Reduce JavaScript execution time',
      'Code-split large bundles',
      'Use web workers for heavy computations',
      'Optimize third-party scripts',
      'Implement request idle callback',
    ],
    CLS: [
      'Set explicit dimensions for images and videos',
      'Reserve space for dynamic content',
      'Avoid inserting content above existing content',
      'Use CSS aspect-ratio for responsive elements',
      'Preload web fonts',
    ],
    FCP: [
      'Optimize critical rendering path',
      'Minimize render-blocking CSS',
      'Inline critical CSS',
      'Optimize web fonts loading',
      'Use service workers for caching',
    ],
    TTFB: [
      'Optimize server response time',
      'Use CDN for static content',
      'Implement caching strategies',
      'Optimize database queries',
      'Use edge computing',
    ],
  };

  return recommendations[metricName] || [];
}

export default function WebVitalsReporter() {
  useEffect(() => {
    const logger = createUserLogger('performance-user', undefined, 'web-vitals-init');
    logger.info('web_vitals_init', 'Web Vitals monitoring initialized');

    // Set up Web Vitals monitoring
    onCLS((metric: Metric) => {
      sendToAnalytics({
        name: 'CLS',
        value: metric.value,
        rating: getRating('CLS', metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: (metric as any).navigationType || 'unknown',
      });
    });

    onFCP((metric: Metric) => {
      sendToAnalytics({
        name: 'FCP',
        value: metric.value,
        rating: getRating('FCP', metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: (metric as any).navigationType || 'unknown',
      });
    });

    onLCP((metric: Metric) => {
      sendToAnalytics({
        name: 'LCP',
        value: metric.value,
        rating: getRating('LCP', metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: (metric as any).navigationType || 'unknown',
      });
    });

    onTTFB((metric: Metric) => {
      sendToAnalytics({
        name: 'TTFB',
        value: metric.value,
        rating: getRating('TTFB', metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: (metric as any).navigationType || 'unknown',
      });
    });

    // Log initial page load performance
    logger.info('page_load_start', 'Page load performance monitoring started', {
      url: window.location.pathname,
      referrer: document.referrer,
      deviceType: getDeviceType(),
      connectionType: getConnectionType(),
    });

    // Monitor resource timing
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Log slow resources
            if (resourceEntry.duration > 1000) {
              logger.warn('slow_resource_detected', 'Slow loading resource detected', {
                resourceName: resourceEntry.name,
                duration: resourceEntry.duration,
                size: resourceEntry.transferSize || 0,
                type: resourceEntry.initiatorType,
              });
            }
          }
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });

      // Clean up observer on unmount
      return () => {
        resourceObserver.disconnect();
      };
    }
  }, []);

  return null; // This component doesn't render anything
}

// Export performance utility functions
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const logger = createUserLogger('performance-user', undefined, 'performance-measure');
  const startTime = performance.now();

  const result = fn();

  if (result instanceof Promise) {
    return result.then((value) => {
      const duration = performance.now() - startTime;
      logger.info('async_operation_measured', `Async operation completed: ${name}`, {
        operationName: name,
        duration,
        timestamp: Date.now(),
      });
      return value;
    }).catch((error) => {
      const duration = performance.now() - startTime;
      logger.error('async_operation_failed', `Async operation failed: ${name}`, {
        operationName: name,
        duration,
        error: error.message,
      }, error);
      throw error;
    });
  } else {
    const duration = performance.now() - startTime;
    logger.info('sync_operation_measured', `Sync operation completed: ${name}`, {
      operationName: name,
      duration,
      timestamp: Date.now(),
    });
    return result;
  }
}

export function reportCustomMetric(name: string, value: number, context?: Record<string, any>) {
  const logger = createUserLogger('performance-user', undefined, 'custom-metric');
  logger.info('custom_metric_reported', `Custom performance metric: ${name}`, {
    metricName: name,
    value,
    timestamp: Date.now(),
    ...context,
  });
}