/**
 * Client-side analytics tracking utility
 * Usage: import { track } from '@/lib/analytics'
 */

// Generate a simple session ID for client-side tracking
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2)
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}

// Get customer email from various sources (localStorage, auth context, etc.)
const getCustomerEmail = (): string | undefined => {
  // Try localStorage first (if user is logged in)
  const stored = localStorage.getItem('customer_email')
  if (stored) return stored
  
  // Could also check auth context, cookies, etc.
  return undefined
}

export interface TrackingOptions {
  customerEmail?: string
  sessionId?: string
  productId?: string
  orderId?: string
  properties?: Record<string, any>
  value?: number
}

/**
 * Track an analytics event
 */
export const track = async (
  eventType: 'page_view' | 'product_view' | 'add_to_cart' | 'checkout_start' | 'purchase',
  options: TrackingOptions = {}
) => {
  try {
    const payload = {
      event_type: eventType,
      customer_email: options.customerEmail || getCustomerEmail(),
      session_id: options.sessionId || getSessionId(),
      product_id: options.productId,
      order_id: options.orderId,
      properties: options.properties || {},
      value: options.value,
      page_url: window.location.href,
      referrer: document.referrer || undefined
    }

    // Send to our analytics endpoint
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    console.log(`📊 Tracked ${eventType}`, payload)
  } catch (error) {
    console.error('Analytics tracking failed:', error)
    // Fail silently - don't break user experience
  }
}

/**
 * Track page view automatically
 */
export const trackPageView = (customerEmail?: string) => {
  track('page_view', { customerEmail })
}

/**
 * Track product view
 */
export const trackProductView = (productId: string, customerEmail?: string) => {
  track('product_view', { productId, customerEmail })
}

/**
 * Track add to cart
 */
export const trackAddToCart = (productId: string, properties?: Record<string, any>, customerEmail?: string) => {
  track('add_to_cart', { productId, properties, customerEmail })
}

/**
 * Track checkout start
 */
export const trackCheckoutStart = (value?: number, properties?: Record<string, any>, customerEmail?: string) => {
  track('checkout_start', { value, properties, customerEmail })
}

/**
 * Track purchase
 */
export const trackPurchase = (orderId: string, value: number, properties?: Record<string, any>, customerEmail?: string) => {
  track('purchase', { orderId, value, properties, customerEmail })
}

/**
 * Set customer email for future tracking
 */
export const setCustomerEmail = (email: string) => {
  localStorage.setItem('customer_email', email)
}

/**
 * React hook for tracking page views
 */
export const usePageTracking = (customerEmail?: string) => {
  if (typeof window !== 'undefined') {
    // Track on mount
    setTimeout(() => trackPageView(customerEmail), 100)
  }
}