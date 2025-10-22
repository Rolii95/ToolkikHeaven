'use client';

import React from 'react';
import { CartItem } from '../types';
import ProductImage from './ProductImage';

interface CartItemClientProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

export default function CartItemClient({ item, onUpdateQuantity, onRemoveItem }: CartItemClientProps) {
  if (!item.product) return null;

  const { product } = item;
  const itemTotal = product.price * item.quantity;

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border">
      <ProductImage
        src={product.imageUrl}
        alt={product.name}
        className="w-20 h-20 object-cover rounded-md"
      />
      
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 truncate">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 mb-1">{product.category}</p>
        <p className="text-lg font-bold text-green-600">
          ${product.price.toFixed(2)}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center border rounded-lg">
          <button
            className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => onUpdateQuantity(product.id, Math.max(0, item.quantity - 1))}
          >
            -
          </button>
          <span className="px-4 py-1 text-center min-w-12">
            {item.quantity}
          </span>
          <button
            className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => onUpdateQuantity(product.id, item.quantity + 1)}
          >
            +
          </button>
        </div>
        
        <div className="text-right min-w-20">
          <p className="text-lg font-bold text-gray-900">
            ${itemTotal.toFixed(2)}
          </p>
        </div>
        
        <button
          className="text-red-600 hover:text-red-800 transition-colors p-1"
          onClick={() => onRemoveItem(product.id)}
          title="Remove item"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}