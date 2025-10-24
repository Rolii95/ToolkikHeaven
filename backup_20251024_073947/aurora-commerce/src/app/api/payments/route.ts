import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Instantiate Stripe using the library default API version to avoid
// TypeScript apiVersion literal mismatches between installed types.
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing not configured' }, 
        { status: 500 }
      )
    }

    const body = await req.json()
    const { items, customerEmail, metadata } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const line_items = items.map((it: any) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: it.name || 'Item' },
        unit_amount: Math.round((it.price || 0) * 100),
      },
      quantity: it.quantity || 1,
    }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/checkout/cancel`,
      customer_email: customerEmail,
      metadata: metadata || {},
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Error creating Stripe session', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
