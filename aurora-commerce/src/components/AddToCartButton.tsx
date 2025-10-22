'use client';

import React, { useState, useEffect } from 'react';
import { useCartStore } from '../lib/store/cartStore';
import { ShoppingCart, CheckCircle, Plus } from 'lucide-react';

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'icon';
}

export default function AddToCartButton({ 
  productId,
  productName,
  productPrice,
  productImage,
  className = '',
  disabled = false,
  children,
  variant = 'primary'
}: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  // Use proper Zustand selectors to avoid infinite re-renders
  const addItem = useCartStore((state) => state.addItem);
  const currentQuantity = useCartStore((state) => {
    const item = state.items.find(item => item.id === productId);
    return item ? item.quantity : 0;
  });
  const inCart = useCartStore((state) => 
    state.items.some(item => item.id === productId)
  );

  const handleAddToCart = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    
    try {
      // Add item to Zustand store immediately for instant feedback
      addItem({
        id: productId,
        name: productName,
        price: productPrice,
        imageUrl: productImage,
      });

      // Show success feedback
      setJustAdded(true);
      
      // Optional: You can also sync with server here
      // await fetch('/api/cart', { method: 'POST', body: JSON.stringify({ productId }) });
      
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsLoading(false);
      // Reset success state after a short delay
      setTimeout(() => setJustAdded(false), 1500);
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Adding...</span>
        </div>
      );
    }
    
    if (justAdded) {
      return (
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4" />
          <span>Added!</span>
        </div>
      );
    }

    if (variant === 'icon') {
      return (
        <div className="flex items-center space-x-1">
          <ShoppingCart className="h-4 w-4" />
          {inCart && currentQuantity > 0 && (
            <span className="text-xs">({currentQuantity})</span>
          )}
        </div>
      );
    }

    if (inCart && currentQuantity > 0) {
      return (
        <div className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add More ({currentQuantity})</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <ShoppingCart className="h-4 w-4" />
        <span>{children || 'Add to Cart'}</span>
      </div>
    );
  };

  const getButtonClasses = () => {
    const baseClasses = `
      transition-all duration-200 font-medium rounded-lg
      disabled:opacity-50 disabled:cursor-not-allowed
      flex items-center justify-center
    `;

    if (variant === 'icon') {
      return `
        ${baseClasses}
        ${className}
        p-2 w-10 h-10
        ${justAdded 
          ? 'bg-green-600 text-white hover:bg-green-700' 
          : inCart 
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
      `.trim().replace(/\s+/g, ' ');
    }

    if (variant === 'secondary') {
      return `
        ${baseClasses}
        ${className}
        px-4 py-2 border-2
        ${justAdded 
          ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' 
          : inCart 
          ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100' 
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }
      `.trim().replace(/\s+/g, ' ');
    }

    // Primary variant (default)
    return `
      ${baseClasses}
      ${className}
      px-6 py-3
      ${justAdded 
        ? 'bg-green-600 text-white hover:bg-green-700' 
        : inCart 
        ? 'bg-blue-700 text-white hover:bg-blue-800' 
        : 'bg-blue-600 text-white hover:bg-blue-700'
      }
    `.trim().replace(/\s+/g, ' ');
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || isLoading}
      className={getButtonClasses()}
      type="button"
      title={inCart ? `Add another ${productName} to cart` : `Add ${productName} to cart`}
    >
      {getButtonContent()}
    </button>
  );
}