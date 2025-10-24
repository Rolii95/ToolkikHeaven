import { createUserLogger } from './logger';

interface ImageOptimizationOptions {
  priority?: boolean;
  preload?: boolean;
  quality?: number;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
}

interface ResourcePreloadOptions {
  as: 'image' | 'font' | 'style' | 'script';
  href: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  type?: string;
}

/**
 * Performance optimization utilities for Aurora Commerce
 * Focuses on improving Core Web Vitals, especially LCP and CLS
 */
class PerformanceOptimizer {
  private logger = createUserLogger('performance-system', undefined, 'performance-optimizer');

  /**
   * Preload critical resources to improve LCP
   */
  preloadCriticalResources(resources: ResourcePreloadOptions[]) {
    if (typeof document === 'undefined') return;

    resources.forEach((resource) => {
      try {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = resource.as;
        link.href = resource.href;
        
        if (resource.crossOrigin) {
          link.crossOrigin = resource.crossOrigin;
        }
        
        if (resource.type) {
          link.type = resource.type;
        }

        document.head.appendChild(link);

        this.logger.info('resource_preloaded', `Preloaded critical resource: ${resource.href}`, {
          resourceType: resource.as,
          href: resource.href,
        });
      } catch (error) {
        this.logger.error('resource_preload_failed', `Failed to preload resource: ${resource.href}`, {
          resourceType: resource.as,
          href: resource.href,
          error: (error as Error).message,
        }, error as Error);
      }
    });
  }

  /**
   * Optimize image loading for better LCP
   */
  getImageOptimizationProps(
    src: string,
    alt: string,
    options: ImageOptimizationOptions = {}
  ) {
    const {
      priority = false,
      quality = 85,
      sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
      placeholder = 'blur',
    } = options;

    // Don't process empty or invalid src
    if (!src || typeof src !== 'string' || src.trim() === '') {
      this.logger.warn('invalid_image_src', 'Invalid image src provided', {
        src,
        alt,
      });
      return {
        src: '/placeholder-image.jpg', // fallback image
        alt,
        priority: false,
        quality,
        sizes,
      };
    }

    // Log critical image loading
    if (priority) {
      this.logger.info('critical_image_loaded', `Critical image loading: ${src}`, {
        src,
        alt,
        priority,
        quality,
      });
    }

    return {
      src,
      alt,
      priority,
      quality,
      sizes,
      placeholder,
      blurDataURL: placeholder === 'blur' ? this.generateBlurDataURL() : undefined,
    };
  }

  /**
   * Generate a simple blur placeholder for images
   */
  private generateBlurDataURL(): string {
    // Simple 1x1 blur placeholder
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';
  }

  /**
   * Measure and log layout shifts for CLS optimization
   */
  measureLayoutShifts() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            const layoutShiftEntry = entry as any;
            
            this.logger.warn('layout_shift_detected', 'Unexpected layout shift detected', {
              value: layoutShiftEntry.value,
              sources: layoutShiftEntry.sources?.map((source: any) => ({
                node: source.node?.tagName || 'unknown',
                currentRect: source.currentRect,
                previousRect: source.previousRect,
              })),
              timestamp: entry.startTime,
            });
          }
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });

      // Return cleanup function
      return () => observer.disconnect();
    } catch (error) {
      this.logger.error('layout_shift_observer_failed', 'Failed to set up layout shift observer', {
        error: (error as Error).message,
      }, error as Error);
    }
  }

  /**
   * Optimize font loading to reduce CLS
   */
  optimizeFontLoading() {
    if (typeof document === 'undefined') return;

    // Preload critical fonts
    const criticalFonts = [
      '/fonts/inter-var.woff2',
      '/fonts/inter-latin-ext.woff2',
    ];

    criticalFonts.forEach((fontUrl) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = fontUrl;
      document.head.appendChild(link);
    });

    this.logger.info('fonts_preloaded', 'Critical fonts preloaded for better CLS', {
      fonts: criticalFonts,
    });
  }

  /**
   * Lazy load non-critical resources
   */
  lazyLoadResource(
    element: HTMLElement,
    resourceUrl: string,
    options: IntersectionObserverInit = {}
  ) {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Fallback for older browsers
      this.loadResource(element, resourceUrl);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadResource(element, resourceUrl);
            observer.unobserve(element);
          }
        });
      },
      {
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);
  }

  private loadResource(element: HTMLElement, resourceUrl: string) {
    if (element.tagName === 'IMG') {
      (element as HTMLImageElement).src = resourceUrl;
    } else if (element.tagName === 'SOURCE') {
      (element as HTMLSourceElement).srcset = resourceUrl;
    }

    this.logger.info('resource_lazy_loaded', `Lazy loaded resource: ${resourceUrl}`, {
      elementType: element.tagName,
      resourceUrl,
    });
  }

  /**
   * Initialize performance monitoring for a page
   */
  initializePagePerformance(pageType: string) {
    this.logger.info('page_performance_init', `Initializing performance monitoring for ${pageType}`, {
      pageType,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    });

    // Set up layout shift monitoring
    const cleanupLayoutShifts = this.measureLayoutShifts();

    // Optimize font loading
    this.optimizeFontLoading();

    // Return cleanup function
    return cleanupLayoutShifts;
  }

  /**
   * Report custom performance metrics
   */
  reportCustomTiming(name: string, startTime: number, endTime?: number) {
    const duration = (endTime || performance.now()) - startTime;
    
    this.logger.info('custom_timing_reported', `Custom timing: ${name}`, {
      name,
      duration,
      startTime,
      endTime: endTime || performance.now(),
    });

    // Mark performance measure
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      } catch (error) {
        // Ignore performance API errors
      }
    }

    return duration;
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// Export utility functions
export function preloadCriticalImages(imageSources: string[]) {
  // Filter out empty or invalid sources
  const validSources = imageSources.filter(src => src && typeof src === 'string' && src.trim() !== '');
  
  const resources: ResourcePreloadOptions[] = validSources.map(src => ({
    as: 'image',
    href: src,
  }));
  
  performanceOptimizer.preloadCriticalResources(resources);
}

export function getOptimizedImageProps(
  src: string,
  alt: string,
  options?: ImageOptimizationOptions
) {
  return performanceOptimizer.getImageOptimizationProps(src, alt, options);
}

export function measurePageLoad(pageType: string) {
  return performanceOptimizer.initializePagePerformance(pageType);
}

export function reportTiming(name: string, startTime: number, endTime?: number) {
  return performanceOptimizer.reportCustomTiming(name, startTime, endTime);
}