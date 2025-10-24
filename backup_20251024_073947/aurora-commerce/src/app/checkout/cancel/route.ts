import { NextRequest, NextResponse } from 'next/server'

/**
 * Cancel page for when users cancel Stripe Checkout
 */

export async function GET(request: NextRequest) {
  const cancelHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Cancelled</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; text-align: center; }
        .cancel { color: #dc2626; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 0.375rem; margin-top: 1rem; }
      </style>
    </head>
    <body>
      <h1 class="cancel">❌ Payment Cancelled</h1>
      <p>Your payment was cancelled. No charges were made to your account.</p>
      <p>Your cart items are still saved. You can complete your purchase anytime.</p>
      <a href="/cart" class="button">Return to Cart</a>
      <a href="/" class="button">Continue Shopping</a>
    </body>
    </html>
  `

  return new Response(cancelHtml, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}