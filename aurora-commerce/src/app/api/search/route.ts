import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { Product } from '@/types';

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
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }

    // Try Supabase first with full-text search or LIKE query
    try {
      // First, try to use Supabase's full-text search (if available)
      const { data: ftsData, error: ftsError } = await supabase
        .from('products')
        .select('*')
        .textSearch('name', query)
        .limit(limit);

      if (!ftsError && ftsData && ftsData.length > 0) {
        return NextResponse.json(ftsData);
      }

      // Fallback to LIKE queries for broader compatibility
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        console.log('Supabase search error, using mock data:', error.message);
        return NextResponse.json(searchMockProducts(query, limit));
      }

      return NextResponse.json(data || []);
    } catch (supabaseError) {
      console.log('Supabase not available, using mock search:', supabaseError);
      return NextResponse.json(searchMockProducts(query, limit));
    }
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}