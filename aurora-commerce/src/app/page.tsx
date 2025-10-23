import React from 'react';
import { supabase } from '../lib/supabase/server';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

// Mock data for development/demo purposes
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and long battery life.',
    price: 299.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
    stock: 50,
    tags: ['wireless', 'audio', 'premium']
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    description: 'Track your fitness goals with this advanced smartwatch featuring heart rate monitoring.',
    price: 199.99,
    category: 'Wearables',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
    stock: 30,
    tags: ['fitness', 'smartwatch', 'health']
  },
  {
    id: '3',
    name: 'Ergonomic Office Chair',
    description: 'Comfortable office chair designed for long hours of work with lumbar support.',
    price: 449.99,
    category: 'Furniture',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    stock: 15,
    tags: ['office', 'chair', 'ergonomic']
  },
  {
    id: '4',
    name: 'Portable Bluetooth Speaker',
    description: 'Compact and powerful Bluetooth speaker perfect for outdoor adventures.',
    price: 89.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop',
    stock: 75,
    tags: ['bluetooth', 'speaker', 'portable']
  },
  {
    id: '5',
    name: 'Organic Cotton T-Shirt',
    description: 'Soft and sustainable organic cotton t-shirt available in multiple colors.',
    price: 29.99,
    category: 'Clothing',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
    stock: 100,
    tags: ['organic', 'cotton', 'sustainable']
  },
  {
    id: '6',
    name: 'Professional Camera Lens',
    description: 'High-quality camera lens for professional photography with excellent optical performance.',
    price: 799.99,
    category: 'Photography',
    imageUrl: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=300&fit=crop',
    stock: 8,
    tags: ['camera', 'lens', 'professional']
  }
];

async function getProducts(): Promise<Product[]> {
  try {
    // Try to fetch from Supabase first
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) {
      console.log('Supabase not configured or error occurred, using mock data:', error.message);
      return mockProducts;
    }

    // If we get data from Supabase, use it
    if (data && data.length > 0) {
      return data;
    }
    
    // Otherwise, fall back to mock data
    console.log('No products found in Supabase, using mock data');
    return mockProducts;
  } catch (error) {
    console.log('Failed to connect to Supabase, using mock data:', error);
    return mockProducts;
  }
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section - Fixed height to prevent CLS */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white" style={{ minHeight: '500px' }}>
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Welcome to Aurora Commerce
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Discover amazing products with smart pricing and fast delivery
            </p>
            <div className="flex justify-center gap-4">
              <a 
                href="#products" 
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Shop Now
              </a>
              <a 
                href="/cart" 
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                View Cart
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section - Fixed min-height to prevent CLS */}
      <section id="products" className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8" style={{ minHeight: '800px' }}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
          <p className="text-lg text-gray-600">
            Explore our collection of high-quality products with automatic discounts
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">No Products Available</h3>
              <p className="text-gray-600 mb-4">
                It looks like we don't have any products in our catalog yet.
              </p>
              <p className="text-sm text-gray-500">
                Check back soon or contact support if this seems like an error.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                priority={index < 4} // First 4 products get priority loading
              />
            ))}
          </div>
        )}
      </section>

      {/* Features Section - Fixed height to prevent CLS */}
      <section className="bg-white py-16" style={{ minHeight: '400px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Shop With Us?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏷️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Pricing</h3>
              <p className="text-gray-600">Automatic discounts and bulk pricing for better savings</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Free shipping on orders over $150 with multiple carrier options</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
              <p className="text-gray-600">Carefully curated selection of high-quality items</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}