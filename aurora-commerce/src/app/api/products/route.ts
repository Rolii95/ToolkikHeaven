import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { Product } from '@/types';

// Mock products data
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

export async function GET(request: Request) {
    try {
        // Try to fetch from Supabase first
        const { data, error } = await supabase
            .from('products')
            .select('*');

        if (error) {
            console.log('Supabase not configured or error occurred, using mock data:', error.message);
            return NextResponse.json(mockProducts);
        }

        // If no data from Supabase, use mock data
        if (!data || data.length === 0) {
            console.log('No products in Supabase, using mock data');
            return NextResponse.json(mockProducts);
        }

        return NextResponse.json(data);
    } catch (error) {
        console.log('Failed to connect to Supabase, using mock data:', error);
        return NextResponse.json(mockProducts);
    }
}