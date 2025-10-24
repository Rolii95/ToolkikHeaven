import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { Product } from '@/types';
import { createApiLogger } from '@/lib/logger';

// Mock products data (same as products API for consistency)
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'Experience crystal-clear audio with our premium wireless headphones. Featuring advanced noise cancellation technology, these headphones deliver exceptional sound quality whether you\'re listening to music, taking calls, or watching movies.',
    price: 299.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
    stock: 50,
    tags: ['wireless', 'audio', 'premium', 'noise-cancellation']
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    description: 'Track your fitness goals with this advanced smartwatch featuring comprehensive health monitoring. Built-in GPS, heart rate sensor, sleep tracking, and over 100 workout modes help you stay motivated and reach your fitness goals.',
    price: 199.99,
    category: 'Wearables',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
    stock: 30,
    tags: ['fitness', 'smartwatch', 'health', 'gps']
  },
  {
    id: '3',
    name: 'Ergonomic Office Chair',
    description: 'Transform your workspace with this premium ergonomic office chair designed for maximum comfort and productivity. Features adjustable lumbar support, breathable mesh back, memory foam seat cushion, and multiple adjustment points.',
    price: 449.99,
    category: 'Furniture',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop',
    stock: 15,
    tags: ['office', 'chair', 'ergonomic', 'comfort']
  },
  {
    id: '4',
    name: 'Portable Bluetooth Speaker',
    description: 'Take your music anywhere with this powerful portable Bluetooth speaker. Delivers rich, room-filling sound with deep bass and clear highs. Waterproof design makes it perfect for beach trips, pool parties, and outdoor adventures.',
    price: 89.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop',
    stock: 75,
    tags: ['bluetooth', 'speaker', 'portable', 'waterproof']
  },
  {
    id: '5',
    name: 'Organic Cotton T-Shirt',
    description: 'Feel good about what you wear with this premium organic cotton t-shirt. Made from 100% certified organic cotton, this shirt is soft, breathable, and environmentally friendly. Available in multiple colors and sizes.',
    price: 29.99,
    category: 'Clothing',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop',
    stock: 100,
    tags: ['organic', 'cotton', 'sustainable', 'eco-friendly']
  },
  {
    id: '6',
    name: 'Professional Camera Lens',
    description: 'Capture stunning photos with this professional-grade camera lens. Features advanced optical design with multiple coatings to reduce flare and increase contrast. Perfect for portrait, landscape, and street photography.',
    price: 799.99,
    category: 'Photography',
    imageUrl: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=600&h=600&fit=crop',
    stock: 8,
    tags: ['camera', 'lens', 'professional', 'photography']
  }
];

function searchMockProducts(query: string, limit: number = 10): Product[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();
  
  return mockProducts
    .filter(product => {
      // Search in name, description, category, and tags
      const searchableText = [
        product.name,
        product.description,
        product.category,
        ...(product.tags || [])
      ].join(' ').toLowerCase();
      
      return searchableText.includes(searchTerm);
    })
    .slice(0, limit);
}

export async function GET(request: Request) {
  const logger = createApiLogger(request);
  
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    logger.info('search_request_start', 'Starting product search request', {
      query: query || 'empty',
      limit,
      endpoint: '/api/search'
    });

    if (!query || query.trim().length === 0) {
      logger.info('search_empty_query', 'Search request with empty query', {
        resultCount: 0
      });
      return NextResponse.json([]);
    }

    logger.debug('search_parameters_validated', 'Search parameters validated', {
      query: query.trim(),
      limit,
      queryLength: query.trim().length
    });

    // Try Supabase first with full-text search or LIKE query
    try {
      logger.debug('search_supabase_fts_attempt', 'Attempting Supabase full-text search');
      
      // First, try to use Supabase's full-text search (if available)
      const { data: ftsData, error: ftsError } = await supabase
        .from('products')
        .select('*')
        .textSearch('name', query)
        .limit(limit);

      if (!ftsError && ftsData && ftsData.length > 0) {
        logger.info('search_success', 'Search completed successfully via full-text search', {
          query,
          resultCount: ftsData.length,
          source: 'supabase_fts'
        });
        return NextResponse.json(ftsData);
      }

      logger.debug('search_supabase_like_attempt', 'Full-text search failed, trying LIKE queries');

      // Fallback to LIKE queries for broader compatibility
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        logger.warn('search_supabase_failed', 'Supabase search failed, using mock data', {
          error: error.message,
          query,
          fallbackReason: 'supabase_error'
        });
        const mockResults = searchMockProducts(query, limit);
        logger.info('search_success', 'Search completed successfully via mock data', {
          query,
          resultCount: mockResults.length,
          source: 'mock'
        });
        return NextResponse.json(mockResults);
      }

      logger.info('search_success', 'Search completed successfully via LIKE queries', {
        query,
        resultCount: data?.length || 0,
        source: 'supabase_like'
      });
      return NextResponse.json(data || []);
    } catch (supabaseError) {
      logger.warn('search_supabase_exception', 'Supabase not available, using mock search', {
        error: supabaseError instanceof Error ? supabaseError.message : 'Unknown error',
        query,
        fallbackReason: 'supabase_unavailable'
      });
      const mockResults = searchMockProducts(query, limit);
      logger.info('search_success', 'Search completed successfully via mock data', {
        query,
        resultCount: mockResults.length,
        source: 'mock'
      });
      return NextResponse.json(mockResults);
    }
  } catch (error) {
    logger.error('search_failed', 'Search API request failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, error instanceof Error ? error : undefined);
    
    return NextResponse.json({ 
      error: 'Search failed',
      traceId: logger.getTraceId()
    }, { status: 500 });
  }
}