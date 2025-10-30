import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { supabase } from '../../../lib/supabase/server';
import { Product } from '../../../types';
import { generateSEOMetadata, generateProductStructuredData, generateBreadcrumbStructuredData, generateMetaDescription as createMetaDescription, generateProductKeywords } from '../../../lib/seo';
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
  },
  // Digital Products
  {
    id: '7',
    name: 'Complete Web Design Course',
    description: 'Master modern web design with this comprehensive course covering HTML5, CSS3, JavaScript, React, and responsive design. Includes 50+ hours of video content, downloadable resources, and lifetime access. Perfect for beginners and professionals looking to upgrade their skills.',
    price: 149.99,
    category: 'Digital Courses',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=600&fit=crop',
    stock: 999,
    tags: ['web-design', 'course', 'html', 'css', 'javascript', 'react'],
    isDigital: true,
    downloadUrl: '/download/web-design-course',
    fileSize: 8589934592, // 8GB
    fileFormat: 'ZIP',
    licenseType: 'personal',
    instantDownload: true,
    digitalDeliveryInfo: 'Download link sent instantly after purchase',
    previewUrl: '/preview/web-design-course',
    systemRequirements: ['Any modern web browser', 'Text editor (VS Code recommended)', '8GB free storage space']
  },
  {
    id: '8',
    name: 'Premium Lightroom Presets Pack',
    description: 'Transform your photos with 50 professional Lightroom presets designed for portraits, landscapes, and street photography. Includes mobile-friendly versions and detailed installation guide. Compatible with Lightroom Classic, CC, and Mobile.',
    price: 39.99,
    category: 'Digital Assets',
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&h=600&fit=crop',
    stock: 999,
    tags: ['lightroom', 'presets', 'photography', 'editing'],
    isDigital: true,
    downloadUrl: '/download/lightroom-presets',
    fileSize: 104857600, // 100MB
    fileFormat: 'ZIP',
    licenseType: 'commercial',
    instantDownload: true,
    digitalDeliveryInfo: 'Instant download + installation guide',
    previewUrl: '/preview/lightroom-presets',
    systemRequirements: ['Adobe Lightroom Classic 7.0+', 'Adobe Lightroom CC', 'Lightroom Mobile']
  },
  {
    id: '9',
    name: 'Business Plan Template Bundle',
    description: 'Professional business plan templates for startups and established businesses. Includes financial models, pitch deck templates, and market analysis frameworks. Available in Word, PDF, and PowerPoint formats.',
    price: 79.99,
    category: 'Digital Templates',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=600&fit=crop',
    stock: 999,
    tags: ['business', 'template', 'startup', 'finance'],
    isDigital: true,
    downloadUrl: '/download/business-templates',
    fileSize: 52428800, // 50MB
    fileFormat: 'ZIP',
    licenseType: 'commercial',
    instantDownload: true,
    digitalDeliveryInfo: 'Editable templates in multiple formats',
    previewUrl: '/preview/business-templates',
    systemRequirements: ['Microsoft Office 2016+', 'Google Workspace', 'LibreOffice 6.0+']
  },
  {
    id: '10',
    name: 'Meditation & Mindfulness App',
    description: 'Premium meditation app with guided sessions, ambient sounds, and progress tracking. Includes 200+ meditations, sleep stories, and breathing exercises. Works offline after download.',
    price: 24.99,
    category: 'Digital Software',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop',
    stock: 999,
    tags: ['meditation', 'mindfulness', 'app', 'wellness'],
    isDigital: true,
    downloadUrl: '/download/meditation-app',
    fileSize: 209715200, // 200MB
    fileFormat: 'SOFTWARE',
    licenseType: 'personal',
    instantDownload: true,
    digitalDeliveryInfo: 'Download for iOS, Android, and Desktop',
    demoUrl: '/demo/meditation-app',
    systemRequirements: ['iOS 12.0+', 'Android 8.0+', 'Windows 10+', 'macOS 10.14+']
  },
  {
    id: '11',
    name: 'The Complete Guide to Digital Marketing',
    description: 'Comprehensive 300-page eBook covering SEO, social media marketing, email campaigns, and conversion optimization. Written by industry experts with real-world case studies and actionable strategies.',
    price: 19.99,
    category: 'Digital Books',
    imageUrl: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=600&h=600&fit=crop',
    stock: 999,
    tags: ['ebook', 'marketing', 'seo', 'digital'],
    isDigital: true,
    downloadUrl: '/download/digital-marketing-guide',
    fileSize: 15728640, // 15MB
    fileFormat: 'PDF',
    licenseType: 'personal',
    instantDownload: true,
    digitalDeliveryInfo: 'PDF format with bookmarks and searchable text',
    previewUrl: '/preview/digital-marketing-guide',
    systemRequirements: ['PDF reader (Adobe Acrobat, Preview, etc.)']
  },
  {
    id: '12',
    name: 'UI/UX Design Kit for Figma',
    description: 'Complete design system with 500+ components, icons, and templates for Figma. Perfect for creating modern web and mobile interfaces. Includes design tokens, color palettes, and typography guides.',
    price: 89.99,
    category: 'Digital Design',
    imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=600&fit=crop',
    stock: 999,
    tags: ['figma', 'ui-kit', 'design', 'components'],
    isDigital: true,
    downloadUrl: '/download/figma-design-kit',
    fileSize: 209715200, // 200MB
    fileFormat: 'ZIP',
    licenseType: 'commercial',
    instantDownload: true,
    digitalDeliveryInfo: 'Figma file + documentation',
    previewUrl: '/preview/figma-design-kit',
    systemRequirements: ['Figma (free or paid)', 'Web browser or Figma Desktop App']
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

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(params.id);

  if (!product) {
    return generateSEOMetadata({
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
      noIndex: true,
    });
  }

  // Use SEO utilities for optimized metadata
  return generateSEOMetadata({
    title: `${product.name} - ${product.category}`,
    description: createMetaDescription(product),
    keywords: generateProductKeywords(product),
    image: product.imageUrl,
    url: `/product/${product.id}`,
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.category, product.id);

  // Generate structured data for SEO
  const productStructuredData = generateProductStructuredData(product);
  
  // Generate breadcrumb structured data
  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: product.category, url: `/category/${product.category.toLowerCase()}` },
    { name: product.name, url: `/product/${product.id}` },
  ]);

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      
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
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {product.category}
                  </span>
                  {product.isDigital && (
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      ⚡ Digital Product
                    </span>
                  )}
                </div>
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

              {/* Digital Product Specific Information */}
              {product.isDigital && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Digital Product Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {product.fileSize && (
                      <div>
                        <span className="font-medium text-gray-700">File Size:</span>
                        <span className="ml-2 text-gray-600">{formatFileSize(product.fileSize)}</span>
                      </div>
                    )}
                    {product.fileFormat && (
                      <div>
                        <span className="font-medium text-gray-700">Format:</span>
                        <span className="ml-2 text-gray-600">{product.fileFormat}</span>
                      </div>
                    )}
                    {product.licenseType && (
                      <div>
                        <span className="font-medium text-gray-700">License:</span>
                        <span className="ml-2 text-gray-600 capitalize">{product.licenseType}</span>
                      </div>
                    )}
                    {product.instantDownload && (
                      <div>
                        <span className="font-medium text-gray-700">Delivery:</span>
                        <span className="ml-2 text-green-600">Instant Download</span>
                      </div>
                    )}
                  </div>
                  
                  {/* System Requirements */}
                  {product.systemRequirements && product.systemRequirements.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-2">System Requirements:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {product.systemRequirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Preview and Demo Links */}
                  <div className="mt-4 flex gap-2">
                    {product.previewUrl && (
                      <a 
                        href={product.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        👁️ Preview
                      </a>
                    )}
                    {product.demoUrl && (
                      <a 
                        href={product.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                      >
                        🚀 Live Demo
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Physical Product Stock Status */}
              {!product.isDigital && (
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
              )}

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
                    isDigital={product.isDigital}
                    fileFormat={product.fileFormat}
                    licenseType={product.licenseType}
                    product={product}
                    disabled={!product.isDigital && product.stock === 0}
                    className="flex-1 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {product.isDigital 
                      ? '💾 Buy & Download Now' 
                      : product.stock === 0 
                      ? 'Out of Stock' 
                      : 'Add to Cart'
                    }
                  </AddToCartButton>
                  <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                    Add to Wishlist
                  </button>
                </div>
              </div>

              {/* Additional Features */}
              <div className="border-t pt-6 space-y-3">
                {product.isDigital ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>⚡</span>
                      <span>Instant download after purchase</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>🔒</span>
                      <span>Secure download links</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>♾️</span>
                      <span>Lifetime access</span>
                    </div>
                    {product.digitalDeliveryInfo && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>📧</span>
                        <span>{product.digitalDeliveryInfo}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {relatedProduct.name}
                      </h3>
                      {relatedProduct.isDigital && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Digital
                        </span>
                      )}
                    </div>
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
    </>
  );
}