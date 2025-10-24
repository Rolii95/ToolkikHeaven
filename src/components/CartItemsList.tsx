'use client';

import React from 'react';
import { CartItem } from '../types';
import CartItemClient from './CartItemClient';

interface CartItemsListProps {
  cartItems: CartItem[];
}

export default function CartItemsList({ cartItems }: CartItemsListProps) {
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    // In a real app, this would update the cart in state/database
    console.log(`Update ${productId} quantity to ${quantity}`);
  };

  const handleRemoveItem = (productId: string) => {
    // In a real app, this would remove the item from cart
    console.log(`Remove ${productId} from cart`);
  };

  return (
    <div className="lg:col-span-2 space-y-4">
      {cartItems.map((item) => (
        <CartItemClient
          key={item.productId}
          item={item}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
        />
      ))}
      
      <div className="pt-4">
        <a
          href="/"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Continue Shopping
        </a>
      </div>
    </div>
  );
}