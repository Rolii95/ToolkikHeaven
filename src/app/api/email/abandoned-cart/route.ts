import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTemplateEmail, formatOrderItemsForEmail } from '../../../../lib/email'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Abandoned cart detection and email automation
 * POST /api/email/abandoned-cart
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { session_id, customer_email, cart_items, cart_total } = body

    // Validation
    if (!session_id || !cart_items || !cart_total) {
      return NextResponse.json({ 
        error: 'session_id, cart_items, and cart_total are required' 
      }, { status: 400 })
    }

    if (!Array.isArray(cart_items) || cart_items.length === 0) {
      return NextResponse.json({ error: 'cart_items must be non-empty array' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Record abandoned cart
    const abandonedCartRecord = {
      session_id,
      customer_email: customer_email || null,
      cart_items: JSON.stringify(cart_items),
      cart_total: parseFloat(cart_total),
      abandoned_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('abandoned_carts')
      .insert(abandonedCartRecord)
      .select('id')
      .single()

    if (error) {
      console.error('Error recording abandoned cart:', error)
      return NextResponse.json({ error: 'Failed to record abandoned cart' }, { status: 500 })
    }

    // Schedule reminder email if we have an email address
    if (customer_email && customer_email.includes('@')) {
      // For immediate testing, send the email right away
      // In production, you'd use a job queue or scheduled function
      const formatted = formatOrderItemsForEmail(cart_items)
      
      const emailVariables = {
        cart_total: cart_total.toString(),
        cart_items_html: formatted.html,
        cart_items_text: formatted.text,
        checkout_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/checkout?session=${session_id}`
      }

      // Send immediately for demo (in production, delay this)
      setTimeout(async () => {
        const emailSent = await sendTemplateEmail('abandoned_cart_reminder', customer_email, emailVariables)
        
        if (emailSent) {
          // Update the abandoned cart record to mark reminder sent
          await supabase
            .from('abandoned_carts')
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq('id', data.id)
        }
      }, 5000) // 5 second delay for demo purposes
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Abandoned cart recorded',
      abandonment_id: data.id,
      will_send_reminder: !!customer_email
    })

  } catch (err: any) {
    console.error('Abandoned cart API error:', err)
    return NextResponse.json({ 
      error: err?.message || 'Server error' 
    }, { status: 500 })
  }
}

/**
 * Get abandoned carts for analysis
 * GET /api/email/abandoned-cart?limit=10
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .order('abandoned_at', { ascending: false })
      .limit(Math.min(limit, 100))

    if (error) {
      console.error('Error fetching abandoned carts:', error)
      return NextResponse.json({ error: 'Failed to fetch abandoned carts' }, { status: 500 })
    }

    // Calculate summary stats
    const totalAbandoned = data.length
    const totalValue = data.reduce((sum, cart) => sum + parseFloat(cart.cart_total || 0), 0)
    const withEmail = data.filter(cart => cart.customer_email).length
    const remindersSent = data.filter(cart => cart.reminder_sent_at).length
    const recovered = data.filter(cart => cart.is_recovered).length

    return NextResponse.json({
      abandoned_carts: data,
      summary: {
        total_abandoned: totalAbandoned,
        total_value: totalValue.toFixed(2),
        with_email: withEmail,
        reminders_sent: remindersSent,
        recovered: recovered,
        recovery_rate: totalAbandoned > 0 ? ((recovered / totalAbandoned) * 100).toFixed(1) + '%' : '0%'
      }
    })

  } catch (err: any) {
    console.error('Abandoned cart fetch error:', err)
    return NextResponse.json({ 
      error: err?.message || 'Server error' 
    }, { status: 500 })
  }
}
