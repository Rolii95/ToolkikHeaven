'use client';

import React, { useState } from 'react';
import { CheckoutForm, Product, CartItem } from '../../types';
import { applyCustomPricingRules, CartItemWithPrice } from '../../services/pricing';
import { processExternalFulfillment, FulfillmentOrderData } from '../../services/fulfillment';
import ProductImage from '../../components/ProductImage';

// Mock cart data for development (in real app, this would come from state/session)
const mockCartItems: CartItem[] = [
  { productId: '1', quantity: 2 },
  { productId: '4', quantity: 1 },
  { productId: '5', quantity: 3 }
];

// Mock products data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and long battery life.',
    price: 299.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
    stock: 50,
    tags: ['wireless', 'audio', 'premium']
  },
  {
    id: '4',
    name: 'Portable Bluetooth Speaker',
    description: 'Compact and powerful Bluetooth speaker perfect for outdoor adventures.',
    price: 89.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop',
    stock: 75,
    tags: ['bluetooth', 'speaker', 'portable']
  },
  {
    id: '5',
    name: 'Organic Cotton T-Shirt',
    description: 'Soft and sustainable organic cotton t-shirt available in multiple colors.',
    price: 29.99,
    category: 'Clothing',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
    stock: 100,
    tags: ['organic', 'cotton', 'sustainable']
  }
];

// Mock populated cart items with products
const populatedCartItems: CartItem[] = mockCartItems.map(item => ({
  ...item,
  product: mockProducts.find(p => p.id === item.productId)
})).filter(item => item.product);

export default function CheckoutPage() {
  const [formData, setFormData] = useState<CheckoutForm>({
    name: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'US',
    paymentMethod: 'creditCard'
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderDetails, setOrderDetails] = useState<{
    orderId: string;
    total: number;
    trackingId?: string;
    estimatedDelivery?: string;
    carrier?: string;
    pricingRulesApplied?: any[];
    fulfillment?: any;
    shippingAddress: CheckoutForm;
    items: CartItem[];
    orderSummary?: {
      subtotal: number;
      shippingCost: number;
      tax: number;
      discount: number;
      total: number;
    };
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Convert to CartItemWithPrice format for pricing service
  const cartItemsWithPrice: CartItemWithPrice[] = populatedCartItems.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    price: item.product?.price || 0,
    name: item.product?.name || 'Unknown Product'
  }));

  // Apply custom pricing rules
  const pricingResults = applyCustomPricingRules(cartItemsWithPrice);
  const freeShippingApplied = pricingResults.rulesApplied.some(rule => rule.id.includes('free-shipping'));
  const standardShipping = 15.99;
  const shippingCost = freeShippingApplied ? 0 : standardShipping;
  const finalTotal = pricingResults.finalTotal + shippingCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate order processing
      const orderId = `ORD-${Date.now()}`;
      
      // Call our checkout API route
      const checkoutPayload = {
        customerInfo: {
          name: formData.name,
          email: formData.email,
          address: {
            street: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            country: formData.country
          }
        },
        paymentMethod: formData.paymentMethod,
        shippingMethod: 'standard'
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutPayload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Checkout failed');
      }

      setOrderDetails({
        orderId: result.orderId,
        total: result.orderTotal,
        trackingId: result.trackingId,
        estimatedDelivery: result.estimatedDelivery,
        carrier: result.carrier,
        pricingRulesApplied: result.pricingRulesApplied,
        fulfillment: result.fulfillmentDetails,
        shippingAddress: formData,
        items: populatedCartItems,
        orderSummary: result.orderSummary
      });

      setOrderComplete(true);
    } catch (error) {
      console.error('Order processing failed:', error);
      setErrors({ general: error instanceof Error ? error.message : 'Order processing failed. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderComplete && orderDetails) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
              <p className="text-lg text-gray-600 mb-8">
                Thank you for your order. We've received your payment and are processing your order.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-left">Order Summary</h2>
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="font-medium">Order ID:</span>
                  <span>{orderDetails.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total:</span>
                  <span className="font-semibold">${orderDetails.total.toFixed(2)}</span>
                </div>
                {orderDetails.trackingId && (
                  <div className="flex justify-between">
                    <span className="font-medium">Tracking ID:</span>
                    <span>{orderDetails.trackingId}</span>
                  </div>
                )}
                {orderDetails.carrier && (
                  <div className="flex justify-between">
                    <span className="font-medium">Carrier:</span>
                    <span>{orderDetails.carrier}</span>
                  </div>
                )}
                {orderDetails.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span className="font-medium">Estimated Delivery:</span>
                    <span>{orderDetails.estimatedDelivery}</span>
                  </div>
                )}
              </div>
            </div>

            {orderDetails.pricingRulesApplied && orderDetails.pricingRulesApplied.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Applied Discounts</h3>
                {orderDetails.pricingRulesApplied.map((rule, index) => (
                  <div key={index} className="text-blue-700 text-sm mb-2">
                    <p><strong>{rule.name}:</strong> {rule.description}</p>
                    <p className="text-blue-600">Discount: ${rule.discount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}

            {orderDetails.orderSummary && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">Order Breakdown</h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${orderDetails.orderSummary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>${orderDetails.orderSummary.shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${orderDetails.orderSummary.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span className="text-green-600">-${orderDetails.orderSummary.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Final Total:</span>
                    <span>${orderDetails.orderSummary.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 text-left">Items Ordered</h3>
              <div className="space-y-3">
                {orderDetails.items.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <ProductImage
                        src={item.product?.imageUrl || ''}
                        alt={item.product?.name || 'Unknown Product'}
                        className="w-15 h-15 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-medium">
                      ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 text-left">Shipping Address</h3>
              <div className="text-gray-700 bg-gray-50 p-4 rounded-lg text-left">
                <p className="font-medium">{orderDetails.shippingAddress.name}</p>
                <p>{orderDetails.shippingAddress.address}</p>
                <p>{orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.postalCode}</p>
                <p>{orderDetails.shippingAddress.country}</p>
              </div>
            </div>

            {orderDetails.fulfillment && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Fulfillment Status</h4>
                <p className="text-green-700">{orderDetails.fulfillment.status}</p>
                {orderDetails.fulfillment.notes && (
                  <p className="text-green-600 text-sm mt-1">{orderDetails.fulfillment.notes}</p>
                )}
              </div>
            )}

            <div className="text-center space-y-4">
              <a
                href="/"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
              >
                Continue Shopping
              </a>
              <p className="text-sm text-gray-500">
                A confirmation email has been sent to {orderDetails.shippingAddress.email}
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {errors.general}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your street address"
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="City"
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.postalCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Postal Code"
                  />
                  {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="creditCard"
                      checked={formData.paymentMethod === 'creditCard'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span>Credit Card</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={formData.paymentMethod === 'paypal'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span>PayPal</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
              >
                {isProcessing ? 'Processing...' : `Place Order - $${finalTotal.toFixed(2)}`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {populatedCartItems.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <ProductImage
                    src={item.product?.imageUrl || ''}
                    alt={item.product?.name || ''}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.product?.name}</h3>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">
                    ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Pricing Breakdown */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${pricingResults.subtotal.toFixed(2)}</span>
              </div>
              
              {pricingResults.rulesApplied.filter(rule => rule.applied && rule.savings > 0).map((rule, index) => (
                <div key={index} className="flex justify-between text-green-600">
                  <span>{rule.description}</span>
                  <span>-${rule.savings.toFixed(2)}</span>
                </div>
              ))}
              
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                  {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Security Features */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <span>🔒</span>
                <span>Your payment information is secure</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <span>↩️</span>
                <span>30-day return policy</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📞</span>
                <span>24/7 customer support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}