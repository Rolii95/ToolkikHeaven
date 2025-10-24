import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
// Use built-in crypto.randomUUID() (Node 18+/V8). Avoid adding a dependency.

// Order types for validation
interface OrderItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  productId?: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

interface CreateOrderRequest {
  items: OrderItem[];
  customer: CustomerInfo;
  total: number;
  metadata?: Record<string, any>;
}

// Validation helpers
function validateOrderItems(items: any[]): items is OrderItem[] {
  if (!Array.isArray(items) || items.length === 0) return false
  return items.every(item => 
    typeof item.name === 'string' && 
    typeof item.price === 'number' && 
    typeof item.quantity === 'number' && 
    item.price >= 0 && 
    item.quantity > 0
  )
}

function validateCustomer(customer: any): boolean {
  return customer && 
    typeof customer.name === 'string' && 
    typeof customer.email === 'string' &&
    customer.name.trim().length > 0 &&
    customer.email.includes('@')
}

/**
 * Creates a lightweight draft order record in the `orders` table.
 * This is used to reserve an order id before redirecting the customer to Stripe Checkout.
 * Expects JSON body: CreateOrderRequest
 */
export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderRequest = await req.json()
    const { items, customer, total, metadata = {} } = body

    // Input validation
    if (!validateOrderItems(items)) {
      return NextResponse.json({ 
        error: 'Invalid items: must be non-empty array with name, price, quantity' 
      }, { status: 400 })
    }

    if (!validateCustomer(customer)) {
      return NextResponse.json({ 
        error: 'Invalid customer: name and valid email required' 
      }, { status: 400 })
    }

    if (typeof total !== 'number' || total <= 0) {
      return NextResponse.json({ 
        error: 'Invalid total: must be positive number' 
      }, { status: 400 })
    }

    // Calculate expected total to verify client calculation
    const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    if (Math.abs(calculatedTotal - total) > 0.01) {
      return NextResponse.json({ 
        error: `Total mismatch: expected ${calculatedTotal.toFixed(2)}, got ${total.toFixed(2)}` 
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const id = typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2,8)
    const record = {
      id,
      customer_name: customer?.name || null,
      customer_email: customer?.email || null,
      items: JSON.stringify(items || []),
      total: total ?? 0,
      status: 'pending',
      created_at: new Date().toISOString(),
      metadata: JSON.stringify(metadata),
    }

    const { error } = await supabase.from('orders').insert(record)
    if (error) {
      console.error('Error inserting draft order:', error)
      return NextResponse.json({ error: 'Failed to create draft order' }, { status: 500 })
    }

    return NextResponse.json({ orderId: id })
  } catch (err: any) {
    console.error('create-draft order error', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
