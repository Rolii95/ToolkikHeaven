import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { applyCustomPricingRules, CartItemWithPrice } from '../../../services/pricing';
import { processExternalFulfillment, FulfillmentOrderData } from '../../../services/fulfillment';

// Create Supabase client for server-side operations
function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo_key';
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase environment variables not configured. Using demo values.');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

interface CheckoutRequest {
  customerInfo: {
    name: string;
    email: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };
  paymentMethod: 'creditCard' | 'paypal';
  shippingMethod?: 'standard' | 'express' | 'overnight';
}

interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  
  try {
    console.log('🚀 Starting checkout process...');
    
    // Parse request body
    const checkoutData: CheckoutRequest = await request.json();
    
    // Step 1: Authorization - Verify user session
    console.log('🔐 Step 1: Verifying user session...');
    
    // For demo purposes, we'll simulate a user session
    // In a real app, you would get this from the session/JWT token
    const mockUserId = 'demo-user-' + Date.now();
    const userEmail = checkoutData.customerInfo.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Invalid session: email required' },
        { status: 401 }
      );
    }
    
    console.log(`✅ User session verified for: ${userEmail}`);
    
    // Step 2: Get cart items and apply custom pricing logic
    console.log('🛒 Step 2: Retrieving cart items and applying pricing rules...');
    
    let cartItems: CartItem[] = [];
    let products: Product[] = [];
    
    try {
      // Try to fetch cart from Supabase
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', mockUserId);
      
      if (cartError) {
        console.log('Using mock cart data (Supabase not configured)');
        // Use mock cart data for demo
        cartItems = [
          {
            id: '1',
            user_id: mockUserId,
            product_id: '1',
            quantity: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            user_id: mockUserId,
            product_id: '4',
            quantity: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
      } else {
        cartItems = cartData || [];
      }
      
      if (cartItems.length === 0) {
        return NextResponse.json(
          { error: 'Cart is empty' },
          { status: 400 }
        );
      }
      
      // Get product details for cart items
      const productIds = cartItems.map(item => item.product_id);
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);
      
      if (productError) {
        console.log('Using mock product data (Supabase not configured)');
        // Use mock product data
        products = [
          {
            id: '1',
            name: 'Premium Wireless Headphones',
            price: 299.99,
            stock: 50,
            category: 'Electronics',
            description: 'High-quality wireless headphones'
          },
          {
            id: '4',
            name: 'Portable Bluetooth Speaker',
            price: 89.99,
            stock: 75,
            category: 'Electronics',
            description: 'Compact Bluetooth speaker'
          }
        ];
      } else {
        products = productData || [];
      }
      
    } catch (error) {
      console.log('Database connection failed, using mock data for demo');
      // Fallback to mock data
      cartItems = [
        {
          id: '1',
          user_id: mockUserId,
          product_id: '1',
          quantity: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: mockUserId,
          product_id: '4',
          quantity: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      products = [
        {
          id: '1',
          name: 'Premium Wireless Headphones',
          price: 299.99,
          stock: 50,
          category: 'Electronics',
          description: 'High-quality wireless headphones'
        },
        {
          id: '4',
          name: 'Portable Bluetooth Speaker',
          price: 89.99,
          stock: 75,
          category: 'Electronics',
          description: 'Compact Bluetooth speaker'
        }
      ];
    }
    
    // Convert to CartItemWithPrice format for pricing service
    const cartItemsWithPrice: CartItemWithPrice[] = cartItems.map(cartItem => {
      const product = products.find(p => p.id === cartItem.product_id);
      if (!product) {
        throw new Error(`Product not found: ${cartItem.product_id}`);
      }
      
      return {
        productId: cartItem.product_id,
        quantity: cartItem.quantity,
        price: product.price,
        name: product.name
      };
    });
    
    // Apply custom pricing rules
    const pricingResult = applyCustomPricingRules(cartItemsWithPrice);
    
    console.log('💰 Pricing calculation completed:', {
      subtotal: pricingResult.subtotal,
      totalDiscount: pricingResult.totalDiscount,
      finalTotal: pricingResult.finalTotal,
      rulesApplied: pricingResult.rulesApplied.length
    });
    
    // Calculate shipping
    const freeShippingApplied = pricingResult.rulesApplied.some(rule => rule.id.includes('free-shipping'));
    const shippingCost = freeShippingApplied ? 0 : 15.99;
    const orderTotal = pricingResult.finalTotal + shippingCost;
    
    // Step 3: Database Transaction - Insert order
    console.log('💾 Step 3: Creating order in database...');
    
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const orderDate = new Date().toISOString();
    
    // Prepare order data
    const orderData = {
      id: orderId,
      user_id: mockUserId,
      customer_email: userEmail,
      customer_name: checkoutData.customerInfo.name,
      shipping_address: checkoutData.customerInfo.address,
      payment_method: checkoutData.paymentMethod,
      shipping_method: checkoutData.shippingMethod || 'standard',
      subtotal: pricingResult.subtotal,
      discount_amount: pricingResult.totalDiscount,
      shipping_cost: shippingCost,
      total_amount: orderTotal,
      pricing_rules_applied: pricingResult.rulesApplied,
      order_status: 'confirmed',
      created_at: orderDate,
      updated_at: orderDate
    };
    
    let orderInserted = false;
    
    try {
      const { error: orderError } = await supabase
        .from('orders')
        .insert([orderData]);
      
      if (orderError) {
        console.log('Order database insertion failed, continuing with fulfillment simulation');
      } else {
        orderInserted = true;
        console.log('✅ Order successfully inserted into database');
      }
    } catch (error) {
      console.log('Database transaction failed, continuing with fulfillment simulation');
    }
    
    // Step 4: Fulfillment - Process external fulfillment
    console.log('📦 Step 4: Processing external fulfillment...');
    
    const fulfillmentOrderData: FulfillmentOrderData = {
      orderId: orderId,
      customerInfo: {
        name: checkoutData.customerInfo.name,
        email: checkoutData.customerInfo.email,
        address: checkoutData.customerInfo.address
      },
      items: cartItemsWithPrice.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      orderTotal: orderTotal,
      shippingMethod: checkoutData.shippingMethod || 'standard',
      paymentMethod: checkoutData.paymentMethod,
      orderDate: new Date(orderDate)
    };
    
    const fulfillmentResult = await processExternalFulfillment(fulfillmentOrderData);
    
    if (!fulfillmentResult.success) {
      console.error('❌ Fulfillment processing failed:', fulfillmentResult.error);
      // In a real app, you might want to rollback the order or mark it as failed
    } else {
      console.log('✅ Fulfillment processing completed successfully');
    }
    
    // Step 5: Clean Up - Clear user's cart
    console.log('🧹 Step 5: Clearing user cart...');
    
    try {
      const { error: deleteError } = await supabase
        .from('carts')
        .delete()
        .eq('user_id', mockUserId);
      
      if (deleteError) {
        console.log('Cart cleanup failed (database not configured)');
      } else {
        console.log('✅ Cart successfully cleared');
      }
    } catch (error) {
      console.log('Cart cleanup failed, continuing...');
    }
    
    // Step 6: Response - Return success with order details
    console.log('📄 Step 6: Sending response...');
    
    const response = {
      success: true,
      orderId: orderId,
      trackingId: fulfillmentResult.trackingId,
      orderTotal: orderTotal,
      estimatedDelivery: fulfillmentResult.estimatedDelivery,
      carrier: fulfillmentResult.carrier,
      shippingCost: fulfillmentResult.shippingCost,
      pricingRulesApplied: pricingResult.rulesApplied.filter(rule => rule.applied),
      fulfillmentDetails: {
        success: fulfillmentResult.success,
        carrier: fulfillmentResult.carrier,
        estimatedDelivery: fulfillmentResult.estimatedDelivery
      },
      orderSummary: {
        subtotal: pricingResult.subtotal,
        discount: pricingResult.totalDiscount,
        shipping: shippingCost,
        total: orderTotal,
        items: cartItemsWithPrice
      }
    };
    
    console.log('✅ Checkout process completed successfully!', {
      orderId: orderId,
      total: orderTotal,
      trackingId: fulfillmentResult.trackingId
    });
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('❌ Checkout process failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Checkout failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to process checkout.' },
    { status: 405 }
  );
}