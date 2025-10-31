'use client';

import React from 'react';
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

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <CartPerformanceTracker />
        {/* Fixed height container to prevent CLS */}
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8" style={{ minHeight: '600px' }}>
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-md p-12">
              <div className="text-6xl mb-4">🛒</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Your Cart is Empty
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Looks like you haven't added any items to your cart yet.
              </p>
              <a
                href="/"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
              >
                Continue Shopping
              </a>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        
        {/* Fixed grid layout to prevent CLS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ minHeight: '500px' }}>
          {/* Cart Items - Fixed width column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-6 border-b border-gray-200 last:border-b-0">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-md"
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
                          ⚡ Digital
                        </span>
                        {item.fileFormat && (
                          <span className="text-xs text-gray-500">
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
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <span className="text-gray-600">−</span>
                      </button>
                      <span className="px-4 py-2 border-l border-r border-gray-300 min-w-[3rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
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
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-800 text-sm mt-1 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary - Fixed width and positioned to prevent shifts */}
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
                      <span>{rule.description}</span>
                      <span>-${rule.savings.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                    {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                
                {freeShippingApplied && (
                  <div className="flex justify-between text-green-600 text-sm">
                    <span>Free Shipping Applied</span>
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
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-green-800 mb-2">
                      Active Discounts:
                    </h3>
                    <ul className="text-sm text-green-700 space-y-1">
                      {pricingResults.rulesApplied.map((rule, index) => (
                        <li key={index}>• {rule.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Fixed button layout */}
              <div className="space-y-3 mb-6">
                <a
                  href="/checkout"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors block text-center"
                >
                  Proceed to Checkout
                </a>
                
                <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                  Save for Later
                </button>
              </div>

              {/* Security Features - Fixed at bottom */}
              <div className="pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <span>🔒</span>
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <span>↩️</span>
                  <span>30-day return policy</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>🚚</span>
                  <span>Free shipping over $150</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}