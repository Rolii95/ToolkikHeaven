import { NextRequest, NextResponse } from 'next/server'

/**
 * Success and cancel pages for Stripe Checkout redirects.
 * These handle the post-payment flow after Stripe redirects users back.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing session_id parameter' },
      { status: 400 }
    )
  }

  // In a real app, you might want to verify the session with Stripe
  // and show order details, but for now we'll just show a success message
  
  const successHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Successful</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; text-align: center; }
        .success { color: #059669; }
        .button { display: inline-block; background: #059669; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 0.375rem; margin-top: 1rem; }
      </style>
    </head>
    <body>
      <h1 class="success">✅ Payment Successful!</h1>
      <p>Thank you for your order. Your payment has been processed successfully.</p>
      <p><strong>Session ID:</strong> ${sessionId}</p>
      <p>You will receive an email confirmation shortly.</p>
      <a href="/" class="button">Continue Shopping</a>
      <a href="/admin/orders" class="button">View Orders (Admin)</a>
    </body>
    </html>
  `

  return new Response(successHtml, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}