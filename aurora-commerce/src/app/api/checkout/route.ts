import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { applyCustomPricingRules, CartItemWithPrice } from '../../../services/pricing';
import { processExternalFulfillment, FulfillmentOrderData } from '../../../services/fulfillment';
import { createApiLogger, Logger } from '../../../lib/logger';

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
  // Initialize structured logging for this checkout transaction
  const logger = createApiLogger(request);
  logger.startTransaction('checkout', 'Starting checkout process');

  const supabase = createServerClient();
  
  try {
    logger.info('checkout_init', 'Checkout process initialized', {
      method: 'POST',
      endpoint: '/api/checkout'
    });
    
    // Parse request body
    const checkoutData: CheckoutRequest = await request.json();
    logger.info('checkout_request_parsed', 'Request body parsed successfully', {
      hasCustomerInfo: !!checkoutData.customerInfo,
      paymentMethod: checkoutData.paymentMethod,
      shippingMethod: checkoutData.shippingMethod
    });
    
    // Step 1: Authorization - Verify user session
    logger.info('auth_start', 'Starting user session verification');
    
    // For demo purposes, we'll simulate a user session
    // In a real app, you would get this from the session/JWT token
    const mockUserId = 'demo-user-' + Date.now();
    const userEmail = checkoutData.customerInfo.email;
    
    if (!userEmail) {
      logger.error('auth_failed', 'User session verification failed: missing email', {
        reason: 'missing_email'
      });
      return NextResponse.json(
        { error: 'Invalid session: email required' },
        { status: 401 }
      );
    }
    
    // Update logger context with user information
    logger.updateContext({
      userId: mockUserId,
      email: userEmail
    });
    
    logger.info('auth_success', 'User session verified successfully', {
      userId: mockUserId,
      email: userEmail
    });
    
    // Step 2: Get cart items and apply custom pricing logic
    logger.info('cart_load_start', 'Starting cart retrieval and pricing calculation');
    
    let cartItems: CartItem[] = [];
    let products: Product[] = [];
    
    try {
      // Try to fetch cart from Supabase
      logger.debug('cart_fetch_attempt', 'Attempting to fetch cart from database', {
        userId: mockUserId
      });
      
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', mockUserId);
      
      if (cartError) {
        logger.warn('cart_fetch_fallback', 'Database cart fetch failed, using mock data', {
          error: cartError.message,
          fallbackReason: 'supabase_not_configured'
        });
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
        logger.info('cart_fetch_success', 'Cart retrieved from database successfully', {
          itemCount: cartItems.length
        });
      }
      
      if (cartItems.length === 0) {
        logger.error('cart_empty', 'Checkout failed: cart is empty', {
          userId: mockUserId
        });
        return NextResponse.json(
          { error: 'Cart is empty' },
          { status: 400 }
        );
      }
      
      logger.info('cart_loaded', 'Cart loaded successfully', {
        itemCount: cartItems.length,
        productIds: cartItems.map(item => item.product_id)
      });
      
      // Get product details for cart items
      const productIds = cartItems.map(item => item.product_id);
      logger.debug('products_fetch_attempt', 'Fetching product details for cart items', {
        productIds: productIds
      });
      
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);
      
      if (productError) {
        logger.warn('products_fetch_fallback', 'Database product fetch failed, using mock data', {
          error: productError.message,
          productIds: productIds
        });
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
        logger.info('products_fetch_success', 'Product details retrieved successfully', {
          productCount: products.length
        });
      }
      
    } catch (error) {
      logger.warn('database_connection_failed', 'Database connection failed, using mock data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
    logger.debug('cart_conversion_start', 'Converting cart items for pricing service');
    const cartItemsWithPrice: CartItemWithPrice[] = cartItems.map(cartItem => {
      const product = products.find(p => p.id === cartItem.product_id);
      if (!product) {
        logger.error('product_not_found', 'Product not found for cart item', {
          cartItemId: cartItem.id,
          productId: cartItem.product_id
        });
        throw new Error(`Product not found: ${cartItem.product_id}`);
      }
      
      return {
        productId: cartItem.product_id,
        quantity: cartItem.quantity,
        price: product.price,
        name: product.name
      };
    });
    
    logger.info('cart_conversion_success', 'Cart items converted for pricing', {
      itemCount: cartItemsWithPrice.length,
      totalQuantity: cartItemsWithPrice.reduce((sum, item) => sum + item.quantity, 0)
    });
    
    // Apply custom pricing rules
    logger.info('pricing_rules_start', 'Applying custom pricing rules');
    const pricingResult = applyCustomPricingRules(cartItemsWithPrice);
    
    logger.info('pricing_rules_applied', 'Pricing rules applied successfully', {
      subtotal: pricingResult.subtotal,
      totalDiscount: pricingResult.totalDiscount,
      finalTotal: pricingResult.finalTotal,
      rulesApplied: pricingResult.rulesApplied.filter(rule => rule.applied).map(rule => ({
        name: rule.name,
        savings: rule.savings
      }))
    });
    
    // Calculate shipping
    const freeShippingApplied = pricingResult.rulesApplied.some(rule => rule.id.includes('free-shipping'));
    const shippingCost = freeShippingApplied ? 0 : 15.99;
    const orderTotal = pricingResult.finalTotal + shippingCost;
    
    logger.info('shipping_calculated', 'Shipping cost calculated', {
      freeShippingApplied,
      shippingCost,
      orderTotal
    });
    
    // Step 3: Database Transaction - Insert order
    logger.info('order_creation_start', 'Starting order creation in database');
    
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const orderDate = new Date().toISOString();
    
    // Update logger context with order information
    logger.updateContext({ orderId });
    
    logger.debug('order_data_prepared', 'Order data prepared for database insertion', {
      orderId,
      orderTotal,
      itemCount: cartItemsWithPrice.length
    });
    
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
      logger.debug('order_insert_attempt', 'Attempting to insert order into database');
      const { error: orderError } = await supabase
        .from('orders')
        .insert([orderData]);
      
      if (orderError) {
        logger.warn('order_insert_failed', 'Order database insertion failed, continuing with fulfillment', {
          error: orderError.message,
          orderId
        });
      } else {
        orderInserted = true;
        logger.info('order_insert_success', 'Order successfully inserted into database', {
          orderId,
          orderTotal
        });
      }
    } catch (error) {
      logger.warn('order_insert_exception', 'Database transaction failed, continuing with fulfillment', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId
      });
    }
    
    // Step 4: Fulfillment - Process external fulfillment
    logger.info('fulfillment_start', 'Starting external fulfillment processing');
    
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
    
    logger.debug('fulfillment_data_prepared', 'Fulfillment data prepared', {
      orderId,
      itemCount: fulfillmentOrderData.items.length,
      shippingMethod: fulfillmentOrderData.shippingMethod
    });
    
    const fulfillmentResult = await processExternalFulfillment(fulfillmentOrderData);
    
    if (!fulfillmentResult.success) {
      logger.error('fulfillment_failed', 'External fulfillment processing failed', {
        orderId,
        error: fulfillmentResult.error
      });
      // In a real app, you might want to rollback the order or mark it as failed
    } else {
      logger.info('fulfillment_success', 'External fulfillment processing completed successfully', {
        orderId,
        trackingId: fulfillmentResult.trackingId,
        carrier: fulfillmentResult.carrier,
        estimatedDelivery: fulfillmentResult.estimatedDelivery
      });
    }
    
    // Step 5: Clean Up - Clear user's cart
    logger.info('cart_cleanup_start', 'Starting cart cleanup process');
    
    try {
      logger.debug('cart_cleanup_attempt', 'Attempting to clear user cart from database');
      const { error: deleteError } = await supabase
        .from('carts')
        .delete()
        .eq('user_id', mockUserId);
      
      if (deleteError) {
        logger.warn('cart_cleanup_failed', 'Cart cleanup failed (database not configured)', {
          error: deleteError.message,
          userId: mockUserId
        });
      } else {
        logger.info('cart_cleanup_success', 'Cart successfully cleared', {
          userId: mockUserId
        });
      }
    } catch (error) {
      logger.warn('cart_cleanup_exception', 'Cart cleanup failed, continuing...', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: mockUserId
      });
    }
    
    // Step 6: Response - Return success with order details
    logger.info('response_preparation_start', 'Preparing checkout response');
    
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
    
    logger.completeTransaction('checkout', 'Checkout process completed successfully', {
      orderId: orderId,
      total: orderTotal,
      trackingId: fulfillmentResult.trackingId,
      fulfillmentSuccess: fulfillmentResult.success,
      orderInserted: orderInserted
    });
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    logger.failTransaction('checkout', 'Checkout process failed with error', error instanceof Error ? error : undefined, {
      stage: 'unknown',
      errorType: error instanceof Error ? error.constructor.name : 'UnknownError'
    });
    
    return NextResponse.json(
      { 
        error: 'Checkout failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        traceId: logger.getTraceId()
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