'use client';

import React, { useState } from 'react';

interface AddToCartButtonProps {
  productId: string;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export default function AddToCartButton({ 
  productId, 
  className = '',
  disabled = false,
  children 
}: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Here you would normally call your cart API
      // For now, we'll just simulate success
      console.log(`Adding product ${productId} to cart`);
      
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = () => {
    if (isLoading) return 'Adding...';
    if (isAdded) return 'Added!';
    return children || 'Add to Cart';
  };

  const buttonClass = `
    ${className}
    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
    ${isAdded ? 'bg-green-600 hover:bg-green-700' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    transition-all duration-200
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || isLoading}
      className={buttonClass}
      type="button"
    >
      {buttonText()}
    </button>
  );
}