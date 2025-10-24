import { NextRequest, NextResponse } from 'next/server'
import { sendTemplateEmail, formatOrderItemsForEmail } from '../../../../lib/email'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export interface SendEmailRequest {
  template: 'order_confirmation' | 'abandoned_cart_reminder' | 'welcome_email'
  recipient: string
  variables: Record<string, any>
}

/**
 * Email sending API endpoint
 * POST /api/email/send
 */
export async function POST(req: NextRequest) {
  try {
    const body: SendEmailRequest = await req.json()
    const { template, recipient, variables } = body

    // Validation
    if (!template || !recipient || !variables) {
      return NextResponse.json({ 
        error: 'template, recipient, and variables are required' 
      }, { status: 400 })
    }

    if (!recipient.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const validTemplates = ['order_confirmation', 'abandoned_cart_reminder', 'welcome_email']
    if (!validTemplates.includes(template)) {
      return NextResponse.json({ 
        error: `Invalid template. Must be one of: ${validTemplates.join(', ')}` 
      }, { status: 400 })
    }

    // Special handling for order confirmation emails
    if (template === 'order_confirmation' && variables.order_items) {
      const formatted = formatOrderItemsForEmail(variables.order_items)
      variables.order_items_html = formatted.html
      variables.order_items_text = formatted.text
    }

    // Special handling for abandoned cart emails
    if (template === 'abandoned_cart_reminder' && variables.cart_items) {
      const formatted = formatOrderItemsForEmail(variables.cart_items)
      variables.cart_items_html = formatted.html
      variables.cart_items_text = formatted.text
    }

    const success = await sendTemplateEmail(template, recipient, variables)

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: `Email sent to ${recipient}` 
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to send email' 
      }, { status: 500 })
    }

  } catch (err: any) {
    console.error('Email API error:', err)
    return NextResponse.json({ 
      error: err?.message || 'Server error' 
    }, { status: 500 })
  }
}

/**
 * Test email endpoint - for development
 * GET /api/email/send?test=order_confirmation
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const testType = searchParams.get('test')
    const email = searchParams.get('email') || 'test@example.com'

    if (!testType) {
      return NextResponse.json({ 
        message: 'Available tests: order_confirmation, abandoned_cart_reminder, welcome_email',
        usage: 'GET /api/email/send?test=order_confirmation&email=test@example.com'
      })
    }

    let variables: Record<string, any> = {}

    switch (testType) {
      case 'order_confirmation':
        variables = {
          customer_name: 'John Doe',
          customer_email: email,
          order_id: 'ORD-12345',
          order_total: '99.99',
          order_items: [
            { name: 'Test Product 1', quantity: 1, price: 49.99 },
            { name: 'Test Product 2', quantity: 2, price: 25.00 }
          ]
        }
        break
      case 'abandoned_cart_reminder':
        variables = {
          cart_total: '149.98',
          checkout_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/checkout`,
          cart_items: [
            { name: 'Abandoned Product 1', quantity: 1, price: 79.99 },
            { name: 'Abandoned Product 2', quantity: 1, price: 69.99 }
          ]
        }
        break
      case 'welcome_email':
        variables = {
          customer_name: 'Jane Smith',
          shop_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/products`
        }
        break
      default:
        return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
    }

    const success = await sendTemplateEmail(testType, email, variables)

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: `Test ${testType} email sent to ${email}`,
        variables 
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to send test email' 
      }, { status: 500 })
    }

  } catch (err: any) {
    console.error('Test email error:', err)
    return NextResponse.json({ 
      error: err?.message || 'Server error' 
    }, { status: 500 })
  }
}
