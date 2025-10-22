import React from 'react';
import { supabase } from '../../lib/supabase/server';
import { Product, CartItem } from '../../types';
import { applyCustomPricingRules, CartItemWithPrice } from '../../services/pricing';
import ProductImage from '../../components/ProductImage';

// Mock cart data for development
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

async function getCartItems(): Promise<CartItem[]> {
  try {
    // In a real app, you would fetch this from user session or database
    // For now, we'll return mock data
    return mockCartItems;
  } catch (error) {
    console.error('Failed to fetch cart items:', error);
    return [];
  }
}

async function getProductsForCart(cartItems: CartItem[]): Promise<CartItem[]> {
  try {
    const productIds = cartItems.map(item => item.productId);
    
    // Try to fetch from Supabase first
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (error) {
      console.log('Using mock product data for cart');
      // Use mock data and populate cart items
      return cartItems.map(item => ({
        ...item,
        product: mockProducts.find((p: Product) => p.id === item.productId)
      })).filter(item => item.product);
    }

    // Populate cart items with product data
    return cartItems.map(item => ({
      ...item,
      product: data?.find((p: Product) => p.id === item.productId) || 
               mockProducts.find((p: Product) => p.id === item.productId)
    })).filter(item => item.product);
  } catch (error) {
    console.log('Failed to fetch products for cart, using mock data');
    return cartItems.map(item => ({
      ...item,
      product: mockProducts.find((p: Product) => p.id === item.productId)
    })).filter(item => item.product);
  }
}

function convertToCartItemWithPrice(cartItems: CartItem[]): CartItemWithPrice[] {
  return cartItems.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    price: item.product?.price || 0,
    name: item.product?.name || 'Unknown Product'
  }));
}

interface CartItemComponentProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

function CartItemComponent({ item, onUpdateQuantity, onRemoveItem }: CartItemComponentProps) {
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

export default async function CartPage() {
  const cartItems = await getCartItems();
  const populatedCartItems = await getProductsForCart(cartItems);

  // Convert to CartItemWithPrice format for pricing service
  const cartItemsWithPrice = convertToCartItemWithPrice(populatedCartItems);

  // Apply custom pricing rules
  const pricingResults = applyCustomPricingRules(cartItemsWithPrice);
  
  const standardShipping = pricingResults.subtotal > 0 ? 15.99 : 0;
  
  // Check if free shipping is applied
  const freeShippingApplied = pricingResults.rulesApplied.some(rule => rule.id.includes('free-shipping'));
  const shippingCost = freeShippingApplied ? 0 : standardShipping;
  const finalTotal = pricingResults.finalTotal + shippingCost;

  if (populatedCartItems.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
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
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {populatedCartItems.map((item) => (
              <CartItemComponent
                key={item.productId}
                item={item}
                onUpdateQuantity={(productId: string, quantity: number) => {
                  // In a real app, this would update the cart in state/database
                  console.log(`Update ${productId} quantity to ${quantity}`);
                }}
                onRemoveItem={(productId: string) => {
                  // In a real app, this would remove the item from cart
                  console.log(`Remove ${productId} from cart`);
                }}
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

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({populatedCartItems.length} items)</span>
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

              {/* Applied Rules Info */}
              {pricingResults.rulesApplied.length > 0 && (
                <div className="mb-6 p-3 bg-green-50 rounded-lg">
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

              <a
                href="/checkout"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-3 block text-center"
              >
                Proceed to Checkout
              </a>
              
              <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Save for Later
              </button>

              {/* Security Features */}
              <div className="mt-6 pt-6 border-t">
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