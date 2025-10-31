'use client';

import React, { useState } from 'react';
import { Product } from '../types';

interface DigitalDownloadProps {
  product: Product;
  orderId?: string;
  downloadToken?: string;
  purchaseDate?: string;
  downloadCount?: number;
  maxDownloads?: number;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getDigitalTypeIcon = (fileFormat?: string) => {
  switch (fileFormat?.toLowerCase()) {
    case 'pdf':
      return '📄';
    case 'zip':
    case 'rar':
      return '📦';
    case 'mp4':
    case 'mov':
    case 'avi':
      return '🎥';
    case 'mp3':
    case 'wav':
    case 'flac':
      return '🎵';
    case 'psd':
    case 'ai':
    case 'sketch':
      return '🎨';
    case 'software':
    case 'exe':
    case 'dmg':
      return '💿';
    case 'epub':
    case 'mobi':
      return '📚';
    default:
      return '💾';
  }
};

export default function DigitalDownload({
  product,
  orderId,
  downloadToken,
  purchaseDate,
  downloadCount = 0,
  maxDownloads = 10
}: DigitalDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!product.downloadUrl || isDownloading) return;

    setIsDownloading(true);
    setDownloadError(null);

    try {
      // In a real implementation, this would validate the download token and track downloads
      const downloadUrl = `${product.downloadUrl}?token=${downloadToken}&order=${orderId}`;
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${product.name.replace(/\s+/g, '_')}.${product.fileFormat?.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // In a real app, you'd track the download on the server
      console.log(`Download initiated for product ${product.id}`);
      
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadError('Download failed. Please try again or contact support.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getDigitalTypeIcon(product.fileFormat)}</span>
            <div>
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <p className="text-blue-100 text-sm">Digital Product - Ready for Download</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Order #{orderId?.slice(-8).toUpperCase()}</div>
            {purchaseDate && (
              <div className="text-xs text-blue-200">
                Purchased: {new Date(purchaseDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Product Image */}
          <div className="aspect-square max-w-xs mx-auto">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Product Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Format:</span>
                  <span className="font-medium">{product.fileFormat}</span>
                </div>
                {product.fileSize && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{product.fileSize}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">License:</span>
                  <span className="font-medium capitalize">{product.licenseType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Downloads:</span>
                  <span className="font-medium">{downloadCount} / {maxDownloads}</span>
                </div>
              </div>
            </div>

            {/* System Requirements */}
            {product.systemRequirements && product.systemRequirements.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">System Requirements</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {product.systemRequirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Download Section */}
        <div className="border-t pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Download Your Product</h3>
              <p className="text-sm text-gray-600">
                Click the button below to download your digital product. 
                {maxDownloads && ` You have ${maxDownloads - downloadCount} downloads remaining.`}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Preview/Demo Links */}
              {product.previewUrl && (
                <a
                  href={product.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium inline-flex items-center gap-2"
                >
                  👁️ Preview
                </a>
              )}
              
              {/* Main Download Button */}
              <button
                onClick={handleDownload}
                disabled={isDownloading || downloadCount >= maxDownloads}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium inline-flex items-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Downloading...
                  </>
                ) : downloadCount >= maxDownloads ? (
                  <>
                    🚫 Download Limit Reached
                  </>
                ) : (
                  <>
                    📥 Download Now
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Download Error */}
          {downloadError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{downloadError}</p>
            </div>
          )}

          {/* License Information */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">License Information</h4>
            <p className="text-xs text-gray-600">
              This product is licensed under a {product.licenseType} license. 
              Please read the full license terms included with your download. 
              Redistribution or resale is prohibited unless specified in your license agreement.
            </p>
          </div>

          {/* Support Information */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team with your order number #{orderId?.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}