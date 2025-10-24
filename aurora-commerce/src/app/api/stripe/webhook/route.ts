import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Use default api version from the installed Stripe package to avoid
// TypeScript literal mismatches between SDK types and hard-coded strings.
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured' }, 
      { status: 500 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
  const sig = req.headers.get('stripe-signature') || ''

  const payload = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      // If the session includes an order_id in metadata, mark the order paid
      const orderId = session.metadata?.order_id
      if (orderId) {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
          const supabase = createClient(supabaseUrl, supabaseServiceKey)

          const updateData = {
            status: 'paid',
            payment_intent: session.payment_intent,
            stripe_session_id: session.id,
            updated_at: new Date().toISOString()
          }

          const { error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId)

          if (error) {
            console.error('Error updating order status after webhook:', error)
          } else {
            console.log(`✅ Order ${orderId} marked as paid via webhook`)
            
            // Send order confirmation email
            try {
              const { sendTemplateEmail, formatOrderItemsForEmail } = await import('../../../../lib/email')
              
              // Get order details for email
              const { data: orderData } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single()

              if (orderData && orderData.customer_email) {
                const orderItems = typeof orderData.items === 'string' 
                  ? JSON.parse(orderData.items) 
                  : orderData.items

                const formatted = formatOrderItemsForEmail(orderItems || [])
                
                const emailVariables = {
                  customer_name: orderData.customer_name || 'Customer',
                  customer_email: orderData.customer_email,
                  order_id: orderId,
                  order_total: orderData.total?.toString() || '0',
                  order_items_html: formatted.html,
                  order_items_text: formatted.text
                }

                await sendTemplateEmail('order_confirmation', orderData.customer_email, emailVariables)
                console.log(`📧 Order confirmation email sent to ${orderData.customer_email}`)
              }
            } catch (emailError) {
              console.error('Error sending order confirmation email:', emailError)
              // Don't fail the webhook for email errors
            }
          }
        } catch (err) {
          console.error('Error updating order status after webhook:', err)
        }
      } else {
        console.log('No order_id in session metadata, skipping order update')
      }
      break
    }
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
