import { NextRequest, NextResponse } from 'next/server';
import OrderPrioritizationService from '@/lib/order-prioritization';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const status = searchParams.getAll('status');
    const priority_level = searchParams.getAll('priority_level').map(Number).filter(n => !isNaN(n));
    const shipping_method = searchParams.getAll('shipping_method');
    const is_high_value = searchParams.get('is_high_value') === 'true' ? true : undefined;
    const is_vip_customer = searchParams.get('is_vip_customer') === 'true' ? true : undefined;
    const search = searchParams.get('search') || '';
    const sort_by = searchParams.get('sort_by') || 'priority_level';
    const sort_order = (searchParams.get('sort_order') || 'asc') as 'asc' | 'desc';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get orders with filters
    const result = await OrderPrioritizationService.getOrdersForDashboard({
      status: status.length > 0 ? status : undefined,
      priority_level: priority_level.length > 0 ? priority_level : undefined,
      shipping_method: shipping_method.length > 0 ? shipping_method : undefined,
      is_high_value,
      is_vip_customer,
      search,
      sort_by,
      sort_order,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result.orders,
      total: result.total,
      pagination: {
        limit,
        offset,
        total: result.total,
        pages: Math.ceil(result.total / limit),
        current_page: Math.floor(offset / limit) + 1,
      },
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['customer_email', 'total_amount', 'subtotal', 'shipping_method', 'items'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate items array
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Create order with automatic priority calculation
    const result = await OrderPrioritizationService.createOrderWithPriority({
      customer_email: body.customer_email,
      customer_id: body.customer_id,
      total_amount: parseFloat(body.total_amount),
      subtotal: parseFloat(body.subtotal),
      tax_amount: parseFloat(body.tax_amount || 0),
      shipping_amount: parseFloat(body.shipping_amount || 0),
      discount_amount: parseFloat(body.discount_amount || 0),
      shipping_method: body.shipping_method,
      billing_address: body.billing_address,
      shipping_address: body.shipping_address,
      items: body.items.map((item: any) => ({
        product_name: item.product_name,
        product_id: item.product_id,
        product_sku: item.product_sku,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price),
        total_price: parseFloat(item.total_price),
        product_category: item.product_category,
        is_digital: Boolean(item.is_digital),
        requires_special_handling: Boolean(item.requires_special_handling),
      })),
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.order,
      message: 'Order created successfully with automatic priority assignment',
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}