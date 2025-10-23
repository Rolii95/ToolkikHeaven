import { NextRequest, NextResponse } from 'next/server';
import OrderPrioritizationService from '@/lib/order-prioritization';

export async function GET(request: NextRequest) {
  try {
    // Get dashboard summary statistics
    const summary = await OrderPrioritizationService.getDashboardSummary();

    return NextResponse.json({
      success: true,
      data: summary,
    });

  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard summary' },
      { status: 500 }
    );
  }
}