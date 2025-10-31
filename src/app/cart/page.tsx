'use client';

import React, { useState } from 'react';
import { useCartStore, useCartItems, useCartTotal, useCartItemCount } from '../../lib/store/cartStore';
import { applyCustomPricingRules, CartItemWithPrice } from '../../services/pricing';
import { measurePageLoad } from '../../lib/performance';

// Cart Performance Client Component for monitoring
function CartPerformanceTracker() {
  React.useEffect(() => {
    const cleanup = measurePageLoad('cart');
    return cleanup;
  }, []);

  return null;
}

export default function CartPage() {
  const cartItems = useCartItems();
  const cartTotal = useCartTotal();
  const itemCount = useCartItemCount();
  const { updateQuantity, removeItem } = useCartStore();
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [updatingQuantities, setUpdatingQuantities] = useState<Set<string>>(new Set());

  // Convert cart items to pricing format
  const cartItemsWithPrice: CartItemWithPrice[] = cartItems.map(item => ({
    productId: item.id,
    quantity: item.quantity,
    price: item.price,
    name: item.name
  }));

  // Apply custom pricing rules
  const pricingResults = applyCustomPricingRules(cartItemsWithPrice);
  
  const standardShipping = pricingResults.subtotal > 0 ? 15.99 : 0;
  
  // Check if free shipping is applied
  const freeShippingApplied = pricingResults.rulesApplied.some(rule => rule.id.includes('free-shipping'));
  const shippingCost = freeShippingApplied ? 0 : standardShipping;
  const finalTotal = pricingResults.finalTotal + shippingCost;

  const handleQuantityUpdate = async (itemId: string, newQuantity: number) => {
    setUpdatingQuantities(prev => new Set(prev).add(itemId));
    // Add small delay for better UX feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    updateQuantity(itemId, newQuantity);
    setUpdatingQuantities(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  const handleRemoveItem = async (itemId: string) => {
    setRemovingItems(prev => new Set(prev).add(itemId));
    // Add small delay for better UX feedback
    await new Promise(resolve => setTimeout(resolve, 500));
    removeItem(itemId);
    setRemovingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <CartPerformanceTracker />
        {/* Enhanced empty state */}
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8" style={{ minHeight: '600px' }}>
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-md p-12">
              <div className="text-6xl mb-6">🛒</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Your Cart is Empty
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Looks like you haven't added any items to your cart yet.<br />
                Start shopping to find amazing products!
              </p>
              
              {/* Featured Categories */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <a href="/#products" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <div className="text-2xl mb-2">📱</div>
                  <div className="text-sm font-medium text-gray-700">Electronics</div>
                </a>
                <a href="/#products" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <div className="text-2xl mb-2">🏠</div>
                  <div className="text-sm font-medium text-gray-700">Home & Garden</div>
                </a>
                <a href="/#products" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <div className="text-2xl mb-2">👕</div>
                  <div className="text-sm font-medium text-gray-700">Fashion</div>
                </a>
                <a href="/digital-products" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                  <div className="text-2xl mb-2">💿</div>
                  <div className="text-sm font-medium text-gray-700">Digital</div>
                </a>
              </div>

              <div className="space-y-4">
                <a
                  href="/"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
                >
                  Continue Shopping
                </a>
                <div className="text-sm text-gray-500">
                  or <a href="#" className="text-blue-600 hover:underline">browse our bestsellers</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <CartPerformanceTracker />
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <div className="text-sm text-gray-600">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </div>
        </div>
        
        {/* Fixed grid layout to prevent CLS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ minHeight: '500px' }}>
          {/* Cart Items - Fixed width column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              {cartItems.map((item) => {
                const isRemoving = removingItems.has(item.id);
                const isUpdating = updatingQuantities.has(item.id);
                
                return (
                  <div 
                    key={item.id} 
                    className={`flex items-center gap-4 p-6 border-b border-gray-200 last:border-b-0 transition-all duration-500 ${
                      isRemoving ? 'opacity-0 transform translate-x-full' : 'opacity-100 transform translate-x-0'
                    }`}
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md border border-gray-200"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-grow min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {item.name}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        ${item.price.toFixed(2)} each
                      </p>
                      {item.isDigital && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            ⚡ Digital Download
                          </span>
                          {item.fileFormat && (
                            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                              {item.fileFormat}
                            </span>
                          )}
                          {item.licenseType && (
                            <span className="text-xs text-gray-500">
                              {item.licenseType} license
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button
                          onClick={() => handleQuantityUpdate(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={item.quantity <= 1 || isUpdating}
                        >
                          <span className="text-gray-600">−</span>
                        </button>
                        <span className={`px-4 py-2 border-l border-r border-gray-300 min-w-[3rem] text-center transition-opacity ${
                          isUpdating ? 'opacity-50' : 'opacity-100'
                        }`}>
                          {isUpdating ? (
                            <div className="flex justify-center">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : (
                            item.quantity
                          )}
                        </span>
                        <button
                          onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isUpdating}
                        >
                          <span className="text-gray-600">+</span>
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-800 text-sm mt-1 transition-colors flex items-center space-x-1 disabled:opacity-50"
                        disabled={isRemoving}
                      >
                        {isRemoving ? (
                          <>
                            <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Removing...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Remove</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Actions */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Save for Later</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span>Share Cart</span>
                  </button>
                </div>

                <a
                  href="/"
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  ← Continue Shopping
                </a>
              </div>
            </div>
          </div>

          {/* Enhanced Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8" style={{ minHeight: '600px' }}>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Fixed height for summary sections to prevent CLS */}
              <div className="space-y-3 mb-6" style={{ minHeight: '200px' }}>
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({itemCount} items)</span>
                  <span>${pricingResults.subtotal.toFixed(2)}</span>
                </div>
                
                {/* Applied discounts section with reserved space */}
                <div style={{ minHeight: '60px' }}>
                  {pricingResults.rulesApplied.filter(rule => rule.applied && rule.savings > 0).map((rule, index) => (
                    <div key={index} className="flex justify-between text-green-600 mb-1">
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{rule.description}</span>
                      </span>
                      <span>-${rule.savings.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={shippingCost === 0 ? 'text-green-600 font-medium' : ''}>
                    {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                
                {freeShippingApplied && (
                  <div className="flex justify-between text-green-600 text-sm">
                    <span className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Free Shipping Applied</span>
                    </span>
                    <span>-$15.99</span>
                  </div>
                )}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Applied Rules Info with reserved space */}
              <div className="mb-6" style={{ minHeight: '80px' }}>
                {pricingResults.rulesApplied.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Active Discounts:</span>
                    </h3>
                    <ul className="text-sm text-green-700 space-y-1">
                      {pricingResults.rulesApplied.map((rule, index) => (
                        <li key={index} className="flex items-start space-x-1">
                          <span>•</span>
                          <span>{rule.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Enhanced Checkout Buttons */}
              <div className="space-y-3 mb-6">
                <a
                  href="/checkout"
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors block text-center relative overflow-hidden group"
                >
                  <span className="relative z-10">Proceed to Checkout</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                </a>
                
                <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>Save for Later</span>
                </button>

                <button className="w-full bg-yellow-400 text-gray-900 py-3 rounded-lg font-medium hover:bg-yellow-500 transition-colors flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Express Checkout</span>
                </button>
              </div>

              {/* Enhanced Security Features */}
              <div className="pt-6 border-t">
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <span>Secure SSL checkout</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <span>30-day return policy</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <span>Free shipping over $150</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}