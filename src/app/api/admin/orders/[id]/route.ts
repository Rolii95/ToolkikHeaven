import { NextRequest, NextResponse } from 'next/server';
import OrderPrioritizationService from '../../../../../lib/order-prioritization';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get single order by ID
    const { orders } = await OrderPrioritizationService.getOrdersForDashboard({
      search: params.id,
      limit: 1,
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: orders[0],
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, ...updateData } = body;

    let result;

    switch (action) {
      case 'update_status':
        if (!updateData.status) {
          return NextResponse.json(
            { success: false, error: 'Status is required' },
            { status: 400 }
          );
        }
        result = await OrderPrioritizationService.updateOrderStatus(
          params.id,
          updateData.status,
          updateData.changed_by || 'admin',
          updateData.reason
        );
        break;

      case 'update_priority':
        if (!updateData.priority_level) {
          return NextResponse.json(
            { success: false, error: 'Priority level is required' },
            { status: 400 }
          );
        }
        result = await OrderPrioritizationService.updateOrderPriority(
          params.id,
          parseInt(updateData.priority_level),
          true // Manual override
        );
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Order ${action.replace('_', ' ')} updated successfully`,
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}