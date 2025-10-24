import { NextRequest, NextResponse } from 'next/server';
import { applyCustomPricingRules } from '../../../services/pricing';
import { processExternalFulfillment } from '../../../services/fulfillment';
import { enrichCartItemsWithPrice, validateCartItems, generateOrderId } from '../../../services/productService';
import { CartItem, CheckoutForm } from '../../../types';

export interface OrderRequest {
  cartItems: CartItem[];
  customerInfo: CheckoutForm;
  shippingMethod: 'standard' | 'express' | 'overnight';
}

export interface OrderResponse {
  success: boolean;
  orderId: string;
  pricing: {
    subtotal: number;
    totalDiscount: number;
    finalTotal: number;
    rulesApplied: any[];
  };
  fulfillment: {
    trackingId: string;
    estimatedDelivery?: Date;
    carrier?: string;
    shippingCost?: number;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: OrderRequest = await request.json();
    const { cartItems, customerInfo, shippingMethod } = body;

    // Input validation
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    if (!customerInfo || !customerInfo.name || !customerInfo.email) {
      return NextResponse.json(
        { error: 'Customer information is required' },
        { status: 400 }
      );
    }

    // Step 1: Validate cart items
    console.log('🔍 Step 1: Validating cart items...');
    const validation = validateCartItems(cartItems);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Cart validation failed: ${validation.errors.join(', ')}` },
        { status: 400 }
      );
    }

    // Step 2: Enrich cart items with pricing information
    console.log('💰 Step 2: Enriching cart items with pricing...');
    const enrichedItems = enrichCartItemsWithPrice(cartItems);

    // Step 3: Apply custom pricing rules
    console.log('🎯 Step 3: Applying custom pricing rules...');
    const pricingResult = applyCustomPricingRules(enrichedItems);
    
    console.log('Pricing calculation result:', {
      subtotal: pricingResult.subtotal,
      totalDiscount: pricingResult.totalDiscount,
      finalTotal: pricingResult.finalTotal,
      rulesApplied: pricingResult.rulesApplied.filter(rule => rule.applied)
    });

    // Step 4: Generate order ID
    const orderId = generateOrderId();

    // Step 5: Prepare fulfillment data
    console.log('📦 Step 5: Preparing fulfillment data...');
    const fulfillmentData = {
      orderId,
      customerInfo: {
        name: customerInfo.name,
        email: customerInfo.email,
        address: {
          street: customerInfo.address,
          city: customerInfo.city,
          postalCode: customerInfo.postalCode,
          country: customerInfo.country
        }
      },
      items: enrichedItems.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      orderTotal: pricingResult.finalTotal,
      shippingMethod,
      paymentMethod: customerInfo.paymentMethod,
      orderDate: new Date()
    };

    // Step 6: Process external fulfillment
    console.log('🚀 Step 6: Processing external fulfillment...');
    const fulfillmentResult = await processExternalFulfillment(fulfillmentData);

    // Step 7: Prepare response
    const response: OrderResponse = {
      success: fulfillmentResult.success,
      orderId,
      pricing: {
        subtotal: pricingResult.subtotal,
        totalDiscount: pricingResult.totalDiscount,
        finalTotal: pricingResult.finalTotal,
        rulesApplied: pricingResult.rulesApplied.filter(rule => rule.applied)
      },
      fulfillment: {
        trackingId: fulfillmentResult.trackingId,
        estimatedDelivery: fulfillmentResult.estimatedDelivery,
        carrier: fulfillmentResult.carrier,
        shippingCost: fulfillmentResult.shippingCost
      }
    };

    if (!fulfillmentResult.success) {
      response.error = fulfillmentResult.error;
    }

    console.log('✅ Order processing completed:', {
      orderId,
      success: fulfillmentResult.success,
      trackingId: fulfillmentResult.trackingId
    });

    return NextResponse.json(response, { 
      status: fulfillmentResult.success ? 200 : 207 // 207 = Multi-Status (partial success)
    });

  } catch (error) {
    console.error('❌ Order processing failed:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        orderId: generateOrderId() // Provide orderId even on failure for tracking
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve order status
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Mock order lookup - in a real app, this would query a database
    const mockOrder = {
      orderId,
      status: 'confirmed',
      trackingId: `MOCK-${orderId.substring(4)}`,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      carrier: 'UPS',
      orderTotal: 299.99,
      createdAt: new Date()
    };

    return NextResponse.json(mockOrder);

  } catch (error) {
    console.error('Failed to retrieve order:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve order' },
      { status: 500 }
    );
  }
}