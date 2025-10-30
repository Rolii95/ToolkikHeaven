import React from 'react';
import { Metadata } from 'next';
import { Product } from '../../types';
import ProductCard from '../../components/ProductCard';
import { generateSEOMetadata } from '../../lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Digital Products - Instant Download',
  description: 'Browse our collection of digital products including courses, templates, software, and ebooks. Instant download after purchase with commercial and personal licenses available.',
  keywords: [
    'digital products',
    'instant download',
    'digital courses',
    'templates',
    'ebooks',
    'software',
    'no shipping',
    'immediate access'
  ],
  url: '/digital-products',
});

// All digital products from our mock data
const digitalProducts: Product[] = [
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

export default function DigitalProductsPage() {
  // Group products by category
  const productsByCategory = digitalProducts.reduce((acc, product) => {
    const category = product.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Digital Products
            </h1>
            <p className="text-xl md:text-2xl mb-6 text-blue-100">
              Instant access to courses, templates, software, and more
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span>⚡</span>
                <span>Instant Download</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔒</span>
                <span>Secure Access</span>
              </div>
              <div className="flex items-center gap-2">
                <span>♾️</span>
                <span>Lifetime Access</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🌍</span>
                <span>No Shipping Required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Digital Products?</h2>
            <p className="text-lg text-gray-600">Experience the advantages of digital delivery</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Access</h3>
              <p className="text-gray-600 text-sm">Download immediately after purchase. No waiting for shipping.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Global Availability</h3>
              <p className="text-gray-600 text-sm">Available worldwide with no geographic restrictions.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">No Shipping Costs</h3>
              <p className="text-gray-600 text-sm">Save on shipping and handling fees with digital delivery.</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">♾️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Lifetime Access</h3>
              <p className="text-gray-600 text-sm">Keep your products forever with unlimited downloads.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products by Category */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {Object.entries(productsByCategory).map(([category, products]) => (
            <div key={category} className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                <span className="text-sm text-gray-500">{products.length} products</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, index) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    priority={index < 4} // First 4 products get priority loading
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Go Digital?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of customers who have already embraced the convenience of digital products.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#products" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Browse All Products
            </a>
            <a 
              href="/help" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}