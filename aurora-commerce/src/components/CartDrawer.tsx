'use client';

import React, { useEffect } from 'react';
import { useCartStore, useCartDrawer } from '../lib/store/cartStore';
import { X, Plus, Minus, ShoppingBag, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function CartDrawer() {
  const { isOpen, close } = useCartDrawer();
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCartStore();

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  return (
    <>
      {/* Backdrop with smooth fade */}
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
      />
      
      {/* Drawer with smooth slide animation */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
              {itemCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                  {itemCount}
                </div>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Shopping Cart
            </h2>
          </div>
          <button
            onClick={close}
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          {items.length === 0 ? (
            // Empty cart state with animation
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
              <div className="relative mb-6">
                <ShoppingBag className="h-20 w-20 text-gray-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-gray-100 rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Your cart is empty
              </h3>
              <p className="text-gray-500 mb-6">
                Discover amazing products and add them to your cart!
              </p>
              <button
                onClick={close}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 group"
              >
                <span>Start Shopping</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items with staggered animation */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-100 hover:shadow-sm transition-all duration-200"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'slideInLeft 0.3s ease-out'
                    }}
                  >
                    <div className="flex space-x-3">
                      {/* Product Image with loading state */}
                      <div className="flex-shrink-0 relative">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover transition-transform hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 rounded-lg transition-all duration-200"></div>
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {formatPrice(item.price)} each
                        </p>
                        
                        {/* Quantity Controls with hover effects */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-200 p-1">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="p-1 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-medium px-3 py-1 min-w-[2.5rem] text-center bg-gray-50 rounded">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="p-1 hover:bg-green-50 hover:text-green-600 rounded transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          
                          {/* Item Total with emphasis */}
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-xs text-red-500 hover:text-red-700 mt-2 transition-colors"
                        >
                          Remove item
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer with enhanced styling */}
              <div className="border-t bg-gradient-to-t from-gray-50 to-white p-4 space-y-4">
                {/* Total with animation */}
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border-2 border-green-100">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-green-600 animate-pulse">
                    {formatPrice(total)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link
                    href="/checkout"
                    onClick={close}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 group"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/cart"
                      onClick={close}
                      className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center text-sm"
                    >
                      View Full Cart
                    </Link>
                    <button
                      onClick={() => {
                        clearCart();
                        close();
                      }}
                      className="bg-red-50 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>

                {/* Continue Shopping */}
                <button
                  onClick={close}
                  className="w-full text-blue-600 py-2 text-sm font-medium hover:text-blue-800 transition-colors border-t pt-3"
                >
                  ← Continue Shopping
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}