/**
 * Simple test utilities for the payment flow
 */

export interface TestOrderItem {
  name: string;
  price: number;
  quantity: number;
}

export interface TestCustomer {
  name: string;
  email: string;
}

export const createTestOrder = async (
  items: TestOrderItem[] = [{ name: 'Test Product', price: 29.99, quantity: 1 }],
  customer: TestCustomer = { name: 'Test User', email: 'test@example.com' }
) => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  const response = await fetch('/api/orders/create-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, customer, total })
  })
  
  return await response.json()
}

export const createTestCheckoutSession = async (
  items: TestOrderItem[] = [{ name: 'Test Product', price: 29.99, quantity: 1 }],
  customerEmail: string = 'test@example.com',
  orderId?: string
) => {
  const metadata = orderId ? { order_id: orderId } : {}
  
  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, customerEmail, metadata })
  })
  
  return await response.json()
}

// Helper to test the full flow
export const testCompleteFlow = async () => {
  console.log('🧪 Testing complete payment flow...')
  
  // Step 1: Create draft order
  const orderResult = await createTestOrder()
  if (orderResult.error) {
    console.error('❌ Draft order creation failed:', orderResult.error)
    return { success: false, error: orderResult.error }
  }
  
  console.log('✅ Draft order created:', orderResult.orderId)
  
  // Step 2: Create checkout session
  const sessionResult = await createTestCheckoutSession(
    [{ name: 'Test Product', price: 29.99, quantity: 1 }],
    'test@example.com',
    orderResult.orderId
  )
  
  if (sessionResult.error || !sessionResult.url) {
    console.error('❌ Checkout session creation failed:', sessionResult.error)
    return { success: false, error: sessionResult.error }
  }
  
  console.log('✅ Checkout session created:', sessionResult.url)
  
  return {
    success: true,
    orderId: orderResult.orderId,
    checkoutUrl: sessionResult.url
  }
}