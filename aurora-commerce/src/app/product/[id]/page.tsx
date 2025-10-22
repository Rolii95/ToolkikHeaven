import React from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase/server';
import { Product } from '../../../types';
import AddToCartButton from '../../../components/AddToCartButton';
import ProductImage from '../../../components/ProductImage';
import ReviewDisplay from '../../../components/ReviewDisplay';
import ReviewSection from '../../../components/ReviewSection';
import ProductStarRating from '../../../components/ProductStarRating';

// Mock data for development
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'Experience crystal-clear audio with our premium wireless headphones. Featuring advanced noise cancellation technology, these headphones deliver exceptional sound quality whether you\'re listening to music, taking calls, or watching movies. The comfortable over-ear design ensures all-day wearability, while the long-lasting battery provides up to 30 hours of playback time.',
    price: 299.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
    stock: 50,
    tags: ['wireless', 'audio', 'premium', 'noise-cancellation']
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    description: 'Track your fitness goals with this advanced smartwatch featuring comprehensive health monitoring. Built-in GPS, heart rate sensor, sleep tracking, and over 100 workout modes help you stay motivated and reach your fitness goals. Water-resistant design makes it perfect for swimming and all-weather activities.',
    price: 199.99,
    category: 'Wearables',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
    stock: 30,
    tags: ['fitness', 'smartwatch', 'health', 'gps']
  },
  {
    id: '3',
    name: 'Ergonomic Office Chair',
    description: 'Transform your workspace with this premium ergonomic office chair designed for maximum comfort and productivity. Features adjustable lumbar support, breathable mesh back, memory foam seat cushion, and multiple adjustment points to customize your perfect sitting position. Built to last with a 10-year warranty.',
    price: 449.99,
    category: 'Furniture',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop',
    stock: 15,
    tags: ['office', 'chair', 'ergonomic', 'comfort']
  },
  {
    id: '4',
    name: 'Portable Bluetooth Speaker',
    description: 'Take your music anywhere with this powerful portable Bluetooth speaker. Delivers rich, room-filling sound with deep bass and clear highs. Waterproof design makes it perfect for beach trips, pool parties, and outdoor adventures. 24-hour battery life keeps the music playing all day long.',
    price: 89.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop',
    stock: 75,
    tags: ['bluetooth', 'speaker', 'portable', 'waterproof']
  },
  {
    id: '5',
    name: 'Organic Cotton T-Shirt',
    description: 'Feel good about what you wear with this premium organic cotton t-shirt. Made from 100% certified organic cotton, this shirt is soft, breathable, and environmentally friendly. Available in multiple colors and sizes. Pre-shrunk and machine washable for easy care.',
    price: 29.99,
    category: 'Clothing',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop',
    stock: 100,
    tags: ['organic', 'cotton', 'sustainable', 'eco-friendly']
  },
  {
    id: '6',
    name: 'Professional Camera Lens',
    description: 'Capture stunning photos with this professional-grade camera lens. Features advanced optical design with multiple coatings to reduce flare and increase contrast. Perfect for portrait, landscape, and street photography. Compatible with most DSLR and mirrorless camera systems.',
    price: 799.99,
    category: 'Photography',
    imageUrl: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=600&h=600&fit=crop',
    stock: 8,
    tags: ['camera', 'lens', 'professional', 'photography']
  }
];

async function getProduct(id: string): Promise<Product | null> {
  try {
    // Try to fetch from Supabase first
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.log('Supabase not configured or error occurred, using mock data:', error.message);
      return mockProducts.find(p => p.id === id) || null;
    }

    return data;
  } catch (error) {
    console.log('Failed to connect to Supabase, using mock data:', error);
    return mockProducts.find(p => p.id === id) || null;
  }
}

async function getRelatedProducts(category: string, excludeId: string): Promise<Product[]> {
  try {
    // Try to fetch from Supabase first
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .neq('id', excludeId)
      .limit(3);

    if (error) {
      console.log('Using mock data for related products');
      return mockProducts
        .filter(p => p.category === category && p.id !== excludeId)
        .slice(0, 3);
    }

    return data || mockProducts
      .filter(p => p.category === category && p.id !== excludeId)
      .slice(0, 3);
  } catch (error) {
    console.log('Failed to fetch related products, using mock data');
    return mockProducts
      .filter(p => p.category === category && p.id !== excludeId)
      .slice(0, 3);
  }
}

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.category, product.id);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <a href="/" className="hover:text-gray-700">Home</a>
            </li>
            <li>/</li>
            <li>
              <a href="/" className="hover:text-gray-700">Products</a>
            </li>
            <li>/</li>
            <li className="text-gray-900">{product.name}</li>
          </ol>
        </nav>

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Image */}
            <div className="aspect-square">
              <ProductImage
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                  {product.category}
                </span>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>
                
                {/* Star Rating for Social Proof */}
                <div className="mb-4">
                  <ProductStarRating productId={product.id} />
                </div>
                
                <p className="text-4xl font-bold text-green-600 mb-6">
                  ${product.price.toFixed(2)}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Stock:</span>
                <span className={`text-sm font-medium ${
                  product.stock > 10 
                    ? 'text-green-600' 
                    : product.stock > 0 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
                }`}>
                  {product.stock > 10 
                    ? 'In Stock' 
                    : product.stock > 0 
                    ? `Only ${product.stock} left` 
                    : 'Out of Stock'
                  }
                </span>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Tags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to Cart Section */}
              <div className="border-t pt-6">
                <div className="flex gap-4">
                  <AddToCartButton
                    productId={product.id}
                    productName={product.name}
                    productPrice={product.price}
                    productImage={product.imageUrl}
                    disabled={product.stock === 0}
                    className="flex-1 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </AddToCartButton>
                  <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                    Add to Wishlist
                  </button>
                </div>
              </div>

              {/* Additional Features */}
              <div className="border-t pt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>🚚</span>
                  <span>Free shipping on orders over $150</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>↩️</span>
                  <span>30-day return policy</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>🛡️</span>
                  <span>2-year warranty included</span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof: Reviews Section */}
          <ReviewSection productId={product.id}>
            <ReviewDisplay productId={product.id} />
          </ReviewSection>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              More {product.category} Products
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <ProductImage
                    src={relatedProduct.imageUrl}
                    alt={relatedProduct.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {relatedProduct.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-green-600">
                        ${relatedProduct.price.toFixed(2)}
                      </span>
                      <a
                        href={`/product/${relatedProduct.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}