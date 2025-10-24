import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * Analytics dashboard data endpoint
 * GET /api/analytics/dashboard
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30') // Default to last 30 days

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // Get customer analytics (top customers by LTV)
    const { data: customerAnalytics, error: customerError } = await supabase
      .from('customer_analytics')
      .select('*')
      .order('lifetime_value', { ascending: false })
      .limit(10)

    if (customerError) {
      console.error('Error fetching customer analytics:', customerError)
      return NextResponse.json({ error: 'Failed to fetch customer analytics' }, { status: 500 })
    }

    // Get daily analytics for the specified period
    const { data: dailyAnalytics, error: dailyError } = await supabase
      .from('daily_analytics')
      .select('*')
      .gte('date', since.split('T')[0]) // Convert to date string
      .order('date', { ascending: false })
      .limit(days)

    if (dailyError) {
      console.error('Error fetching daily analytics:', dailyError)
      return NextResponse.json({ error: 'Failed to fetch daily analytics' }, { status: 500 })
    }

    // Get product analytics
    const { data: productAnalytics, error: productError } = await supabase
      .from('product_analytics')
      .select('*')
      .order('revenue', { ascending: false })
      .limit(10)

    if (productError) {
      console.error('Error fetching product analytics:', productError)
      return NextResponse.json({ error: 'Failed to fetch product analytics' }, { status: 500 })
    }

    // Calculate summary statistics
    const totalRevenue = dailyAnalytics.reduce((sum, day) => sum + parseFloat(day.revenue || 0), 0)
    const totalCustomers = dailyAnalytics.reduce((sum, day) => sum + (day.unique_customers || 0), 0)
    const totalOrders = dailyAnalytics.reduce((sum, day) => sum + (day.purchases || 0), 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Get recent events for activity feed
    const { data: recentEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50)

    if (eventsError) {
      console.error('Error fetching recent events:', eventsError)
      // Don't fail the whole request for this
    }

    const dashboard = {
      summary: {
        totalRevenue: totalRevenue.toFixed(2),
        totalCustomers,
        totalOrders,
        avgOrderValue: avgOrderValue.toFixed(2),
        period: `Last ${days} days`
      },
      customerAnalytics: customerAnalytics || [],
      dailyAnalytics: dailyAnalytics || [],
      productAnalytics: productAnalytics || [],
      recentEvents: recentEvents || []
    }

    return NextResponse.json(dashboard)

  } catch (err: any) {
    console.error('Dashboard analytics error:', err)
    return NextResponse.json({ 
      error: err?.message || 'Server error' 
    }, { status: 500 })
  }
}
