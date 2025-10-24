import { NextRequest, NextResponse } from 'next/server';
import { cache } from '../../../lib/cache/redis';
import { 
  invalidateCache, 
  preloadCache, 
  warmProductCache,
  getCacheMetrics 
} from '../../../lib/cache/middleware';
import { CDNManager } from '../../../lib/performance/optimization';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'stats':
        return await getCacheStats();
      
      case 'health':
        return await getCacheHealth();
      
      case 'keys':
        return await getCacheKeys(searchParams);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Cache management API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const body = await request.json();

    switch (action) {
      case 'invalidate':
        return await invalidateCachePatterns(body);
      
      case 'preload':
        return await preloadCacheData(body);
      
      case 'warm':
        return await warmCache(body);
      
      case 'purge-cdn':
        return await purgeCDNCache(body);
      
      case 'set':
        return await setCacheValue(body);
      
      case 'delete':
        return await deleteCacheKey(body);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Cache management POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getCacheStats() {
  const metrics = await getCacheMetrics();
  
  return NextResponse.json({
    success: true,
    data: {
      ...metrics,
      timestamp: new Date().toISOString(),
    },
  });
}

async function getCacheHealth() {
  try {
    const isHealthy = await cache.ping();
    const stats = await cache.getStats();
    
    return NextResponse.json({
      success: true,
      data: {
        healthy: isHealthy,
        connected: stats.connected || false,
        memory: stats.memory || '0',
        uptime: stats.uptime || 0,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      data: {
        healthy: false,
        connected: false,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

async function getCacheKeys(searchParams: URLSearchParams) {
  const pattern = searchParams.get('pattern') || '*';
  const limit = parseInt(searchParams.get('limit') || '100');
  
  try {
    const keys = await cache.getKeysByPattern(pattern);
    const limitedKeys = keys.slice(0, limit);
    
    // Get details for each key
    const keyDetails = await Promise.all(
      limitedKeys.map(async (key: string) => {
        const value = await cache.get(key);
        const ttl = -1; // TTL not implemented in our basic cache
        
        return {
          key,
          type: typeof value,
          size: JSON.stringify(value).length,
          ttl,
          preview: typeof value === 'string' 
            ? value.substring(0, 100) + (value.length > 100 ? '...' : '')
            : JSON.stringify(value).substring(0, 100) + '...',
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      data: {
        keys: keyDetails,
        total: keys.length,
        pattern,
        limit,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get cache keys',
    }, { status: 500 });
  }
}

async function invalidateCachePatterns(body: { patterns: string[] }) {
  const { patterns } = body;
  
  if (!patterns || !Array.isArray(patterns)) {
    return NextResponse.json(
      { success: false, error: 'Patterns array is required' },
      { status: 400 }
    );
  }
  
  try {
    const totalCleared = await invalidateCache(patterns);
    
    return NextResponse.json({
      success: true,
      data: {
        clearedKeys: totalCleared,
        patterns,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Cache invalidation failed',
    }, { status: 500 });
  }
}

async function preloadCacheData(body: { 
  includeProducts?: boolean;
  includeCategories?: boolean;
  customUrls?: string[];
}) {
  const { includeProducts = true, includeCategories = true, customUrls = [] } = body;
  
  try {
    const results = [];
    
    if (includeProducts || includeCategories) {
      await preloadCache();
      results.push('Standard preload completed');
    }
    
    // Handle custom URLs if provided
    if (customUrls.length > 0) {
      for (const url of customUrls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            const cacheKey = `custom:${url}`;
            await cache.set(cacheKey, data, 300); // 5 minutes TTL
            results.push(`Cached custom URL: ${url}`);
          }
        } catch (error) {
          results.push(`Failed to cache URL: ${url}`);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        results,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Cache preload failed',
    }, { status: 500 });
  }
}

async function warmCache(body: { productIds?: string[]; searchQueries?: string[] }) {
  const { productIds = [], searchQueries = [] } = body;
  
  try {
    const results = [];
    
    if (productIds.length > 0) {
      const warmed = await warmProductCache(productIds);
      results.push(`Warmed ${warmed}/${productIds.length} products`);
    }
    
    if (searchQueries.length > 0) {
      let warmedQueries = 0;
      for (const query of searchQueries) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/products/search?q=${encodeURIComponent(query)}`
          );
          if (response.ok) {
            const searchResults = await response.json();
            await cache.set(`search:${query}`, searchResults, 300);
            warmedQueries++;
          }
        } catch (error) {
          console.error(`Failed to warm search query: ${query}`, error);
        }
      }
      results.push(`Warmed ${warmedQueries}/${searchQueries.length} search queries`);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        results,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Cache warming failed',
    }, { status: 500 });
  }
}

async function purgeCDNCache(body: { patterns: string[] }) {
  const { patterns } = body;
  
  if (!patterns || !Array.isArray(patterns)) {
    return NextResponse.json(
      { success: false, error: 'Patterns array is required' },
      { status: 400 }
    );
  }
  
  try {
    await CDNManager.purgeCache(patterns);
    
    return NextResponse.json({
      success: true,
      data: {
        purgedPatterns: patterns,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'CDN cache purge failed',
    }, { status: 500 });
  }
}

async function setCacheValue(body: { 
  key: string; 
  value: any; 
  ttl?: number;
}) {
  const { key, value, ttl = 300 } = body;
  
  if (!key) {
    return NextResponse.json(
      { success: false, error: 'Key is required' },
      { status: 400 }
    );
  }
  
  try {
    await cache.set(key, value, ttl);
    
    return NextResponse.json({
      success: true,
      data: {
        key,
        ttl,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to set cache value',
    }, { status: 500 });
  }
}

async function deleteCacheKey(body: { key: string }) {
  const { key } = body;
  
  if (!key) {
    return NextResponse.json(
      { success: false, error: 'Key is required' },
      { status: 400 }
    );
  }
  
  try {
    const deleted = await cache.del(key);
    
    return NextResponse.json({
      success: true,
      data: {
        key,
        deleted: deleted === true,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to delete cache key',
    }, { status: 500 });
  }
}