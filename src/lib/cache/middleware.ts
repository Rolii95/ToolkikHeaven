import { NextRequest, NextResponse } from 'next/server';
import { cache, CacheKeys } from './redis';

interface CacheOptions {
  ttl?: number;
  skipCache?: boolean;
  generateKey?: (req: NextRequest) => string;
}

// Cache middleware for API routes
export function withCache(options: CacheOptions = {}) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function cachedHandler(req: NextRequest): Promise<NextResponse> {
      const {
        ttl = 300, // 5 minutes default
        skipCache = false,
        generateKey
      } = options;

      // Skip caching for non-GET requests
      if (req.method !== 'GET' || skipCache) {
        return handler(req);
      }

      try {
        // Generate cache key
        const defaultKey = `${req.nextUrl.pathname}:${req.nextUrl.search}`;
        const cacheKey = generateKey ? generateKey(req) : defaultKey;

        // Try to get from cache
        const cached = await cache.get(cacheKey);
        if (cached) {
          console.log(`🎯 Cache HIT: ${cacheKey}`);
          return new NextResponse(JSON.stringify(cached), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': 'HIT',
              'Cache-Control': `public, max-age=${ttl}`,
            },
          });
        }

        console.log(`⚡ Cache MISS: ${cacheKey}`);
        
        // Execute handler
        const response = await handler(req);
        
        // Cache successful responses
        if (response.status === 200) {
          const responseData = await response.json();
          await cache.set(cacheKey, responseData, ttl);
          
          return new NextResponse(JSON.stringify(responseData), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': 'MISS',
              'Cache-Control': `public, max-age=${ttl}`,
            },
          });
        }

        return response;
      } catch (error) {
        console.error('Cache middleware error:', error);
        return handler(req);
      }
    };
  };
}

// Cache invalidation helper
export async function invalidateCache(patterns: string[]) {
  try {
    let totalCleared = 0;
    
    for (const pattern of patterns) {
      const cleared = await cache.clearByPattern(pattern);
      totalCleared += cleared;
      console.log(`🗑️ Cleared ${cleared} keys matching pattern: ${pattern}`);
    }
    
    return totalCleared;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

// Preload cache for common queries
export async function preloadCache() {
  try {
    console.log('🚀 Starting cache preload...');
    
    // Preload products
    const productsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`);
    if (productsResponse.ok) {
      const products = await productsResponse.json();
      await cache.set(CacheKeys.PRODUCTS, products, 600); // 10 minutes
      console.log('✅ Preloaded products cache');
    }

    // Preload categories
    const categoriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json();
      await cache.set(CacheKeys.CATEGORIES, categories, 3600); // 1 hour
      console.log('✅ Preloaded categories cache');
    }

    console.log('🎯 Cache preload completed');
  } catch (error) {
    console.error('Cache preload error:', error);
  }
}

// Cache warming for individual products
export async function warmProductCache(productIds: string[]) {
  try {
    const promises = productIds.map(async (id) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`);
      if (response.ok) {
        const product = await response.json();
        await cache.set(CacheKeys.PRODUCT_BY_ID(id), product, 600);
        return id;
      }
      return null;
    });

    const results = await Promise.allSettled(promises);
    const warmed = results.filter(result => 
      result.status === 'fulfilled' && result.value !== null
    ).length;

    console.log(`🔥 Warmed cache for ${warmed}/${productIds.length} products`);
    return warmed;
  } catch (error) {
    console.error('Product cache warming error:', error);
    return 0;
  }
}

// Smart cache refresh based on user behavior
export async function smartCacheRefresh(userBehaviorData: {
  viewedProducts: string[];
  searchQueries: string[];
  categories: string[];
}) {
  try {
    const { viewedProducts, searchQueries, categories } = userBehaviorData;

    // Refresh frequently viewed products
    if (viewedProducts.length > 0) {
      await warmProductCache(viewedProducts);
    }

    // Refresh popular search queries
    const searchPromises = searchQueries.map(async (query) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/search?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const results = await response.json();
        await cache.set(CacheKeys.PRODUCT_SEARCH(query), results, 300);
      }
    });

    await Promise.allSettled(searchPromises);
    console.log('🧠 Smart cache refresh completed');
  } catch (error) {
    console.error('Smart cache refresh error:', error);
  }
}

// Cache statistics and monitoring
export async function getCacheMetrics() {
  try {
    const stats = await cache.getStats();
    
    // Get hit/miss ratios (simplified tracking)
    const hitCount = Number(await cache.get('cache:stats:hits')) || 0;
    const missCount = Number(await cache.get('cache:stats:misses')) || 0;
    const total = hitCount + missCount;
    const hitRatio = total > 0 ? (hitCount / total) * 100 : 0;

    return {
      ...stats,
      hitCount,
      missCount,
      hitRatio: parseFloat(hitRatio.toFixed(2)),
      totalRequests: total,
    };
  } catch (error) {
    console.error('Cache metrics error:', error);
    return {
      connected: false,
      memory: '0',
      keyspace: {},
      uptime: 0,
      hitCount: 0,
      missCount: 0,
      hitRatio: 0,
      totalRequests: 0,
    };
  }
}

// Increment cache stats
export async function incrementCacheStats(type: 'hit' | 'miss') {
  try {
    await cache.increment(`cache:stats:${type}s`);
  } catch (error) {
    console.error(`Failed to increment ${type} stats:`, error);
  }
}

// Cache health check
export async function checkCacheHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  details: string;
}> {
  const startTime = Date.now();
  
  try {
    const isConnected = await cache.ping();
    const latency = Date.now() - startTime;
    
    if (!isConnected) {
      return {
        status: 'down',
        latency,
        details: 'Redis connection failed',
      };
    }

    if (latency > 100) {
      return {
        status: 'degraded',
        latency,
        details: `High latency: ${latency}ms`,
      };
    }

    return {
      status: 'healthy',
      latency,
      details: 'All systems operational',
    };
  } catch (error) {
    return {
      status: 'down',
      latency: Date.now() - startTime,
      details: `Error: ${error}`,
    };
  }
}