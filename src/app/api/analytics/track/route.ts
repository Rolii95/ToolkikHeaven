import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export interface TrackEventRequest {
  event_type: 'page_view' | 'product_view' | 'add_to_cart' | 'checkout_start' | 'purchase'
  customer_email?: string
  session_id?: string
  product_id?: string
  order_id?: string
  properties?: Record<string, any>
  value?: number
  page_url?: string
  referrer?: string
}

/**
 * Analytics event tracking endpoint
 * POST /api/analytics/track
 */
export async function POST(req: NextRequest) {
  try {
    const body: TrackEventRequest = await req.json()
    const { 
      event_type, 
      customer_email, 
      session_id, 
      product_id, 
      order_id, 
      properties = {},
      value,
      page_url,
      referrer 
    } = body

    // Validation
    if (!event_type) {
      return NextResponse.json({ error: 'event_type is required' }, { status: 400 })
    }

    const validEventTypes = ['page_view', 'product_view', 'add_to_cart', 'checkout_start', 'purchase']
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json({ 
        error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}` 
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract additional metadata from request
    const userAgent = req.headers.get('user-agent') || undefined
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || undefined

    const eventRecord = {
      event_type,
      customer_email: customer_email || null,
      session_id: session_id || null,
      product_id: product_id || null,
      order_id: order_id || null,
      properties: JSON.stringify(properties),
      value: value || null,
      user_agent: userAgent,
      ip_address: ip,
      referrer: referrer || null,
      page_url: page_url || null,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('events')
      .insert(eventRecord)
      .select('id')
      .single()

    if (error) {
      console.error('Error inserting analytics event:', error)
      return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      eventId: data.id,
      message: `Event ${event_type} tracked successfully`
    })

  } catch (err: any) {
    console.error('Analytics tracking error:', err)
    return NextResponse.json({ 
      error: err?.message || 'Server error' 
    }, { status: 500 })
  }
}

/**
 * Get analytics events
 * GET /api/analytics/track?limit=100&event_type=purchase
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const eventType = searchParams.get('event_type')
    const customerEmail = searchParams.get('customer_email')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let query = supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 1000)) // Cap at 1000

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    if (customerEmail) {
      query = query.eq('customer_email', customerEmail)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching analytics events:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    return NextResponse.json({ 
      events: data,
      count: data.length
    })

  } catch (err: any) {
    console.error('Analytics fetch error:', err)
    return NextResponse.json({ 
      error: err?.message || 'Server error' 
    }, { status: 500 })
  }
}
