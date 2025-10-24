import { NextRequest, NextResponse } from 'next/server';
import OrderPrioritizationService from '@/lib/order-prioritization';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, order_ids, data } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order IDs array is required' },
        { status: 400 }
      );
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    switch (action) {
      case 'update_status':
        if (!data?.status) {
          return NextResponse.json(
            { success: false, error: 'Status is required for bulk status update' },
            { status: 400 }
          );
        }

        for (const orderId of order_ids) {
          try {
            const result = await OrderPrioritizationService.updateOrderStatus(
              orderId,
              data.status,
              data.changed_by || 'admin',
              data.reason || 'Bulk status update'
            );
            
            if (result.success) {
              successCount++;
            } else {
              errorCount++;
              errors.push(`Order ${orderId}: ${result.error}`);
            }
          } catch (error) {
            errorCount++;
            errors.push(`Order ${orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        break;

      case 'update_priority':
        if (!data?.priority_level) {
          return NextResponse.json(
            { success: false, error: 'Priority level is required for bulk priority update' },
            { status: 400 }
          );
        }

        for (const orderId of order_ids) {
          try {
            const result = await OrderPrioritizationService.updateOrderPriority(
              orderId,
              parseInt(data.priority_level),
              true // Manual override
            );
            
            if (result.success) {
              successCount++;
            } else {
              errorCount++;
              errors.push(`Order ${orderId}: ${result.error}`);
            }
          } catch (error) {
            errorCount++;
            errors.push(`Order ${orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        break;

      case 'recalculate_priorities':
        try {
          const result = await OrderPrioritizationService.recalculateAllPriorities();
          successCount = result.updated;
          errorCount = result.errors;
        } catch (error) {
          errorCount = order_ids.length;
          errors.push(error instanceof Error ? error.message : 'Failed to recalculate priorities');
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    const totalProcessed = successCount + errorCount;
    const success = errorCount === 0;

    return NextResponse.json({
      success,
      message: `Bulk ${action.replace('_', ' ')} completed. ${successCount} successful, ${errorCount} failed.`,
      results: {
        total: totalProcessed,
        successful: successCount,
        failed: errorCount,
        errors: errors.slice(0, 10), // Limit error messages to prevent huge responses
      },
    });

  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}