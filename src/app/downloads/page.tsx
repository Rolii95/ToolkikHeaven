import React from 'react';
import { Metadata } from 'next';
import DigitalDownload from '../../components/DigitalDownload';
import { Product } from '../../types';

export const metadata: Metadata = {
  title: 'Download Your Digital Products | Aurora Commerce',
  description: 'Access and download your purchased digital products instantly.',
};

// Mock digital product for demo
const mockDigitalProduct: Product = {
  id: '7',
  name: 'Complete Web Design Course',
  description: 'Master modern web design with this comprehensive course covering HTML5, CSS3, JavaScript, React, and responsive design.',
  price: 149.99,
  category: 'Digital Courses',
  imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=600&fit=crop',
  stock: 999,
  tags: ['web-design', 'course', 'html', 'css', 'javascript', 'react'],
  isDigital: true,
  downloadUrl: '/api/download/web-design-course',
  fileSize: "8GB",
  fileFormat: 'ZIP',
  licenseType: 'personal',
  instantDownload: true,
  digitalDeliveryInfo: 'Download link sent instantly after purchase',
  previewUrl: '/preview/web-design-course',
  systemRequirements: [
    'Any modern web browser',
    'Text editor (VS Code recommended)',
    '8GB free storage space',
    'Internet connection for video content'
  ]
};

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Digital Downloads</h1>
          <p className="text-gray-600">
            Access and download your purchased digital products. Your downloads are ready instantly after purchase.
          </p>
        </div>

        {/* Demo Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
            <span>💡</span>
            <span>Demo Page</span>
          </div>
          <p className="text-blue-700 text-sm">
            This is a demonstration of how digital product downloads would work. 
            In a real implementation, this page would be protected and show actual purchased products.
          </p>
        </div>

        {/* Digital Download Component */}
        <DigitalDownload
          product={mockDigitalProduct}
          orderId="ORDER123456789"
          downloadToken="demo-token-12345"
          purchaseDate="2024-10-30T10:00:00Z"
          downloadCount={0}
          maxDownloads={10}
        />

        {/* Additional Information */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How Digital Downloads Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">💳</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">1. Purchase</h3>
              <p className="text-sm text-gray-600">
                Complete your purchase securely through our checkout process
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📧</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">2. Instant Access</h3>
              <p className="text-sm text-gray-600">
                Receive download links immediately via email and in your account
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📥</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">3. Download</h3>
              <p className="text-sm text-gray-600">
                Download your products with secure, tracked download links
              </p>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            If you're having trouble downloading your products or need technical support
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="mailto:support@aurora-commerce.com"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </a>
            <a
              href="/help"
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              View FAQ
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}