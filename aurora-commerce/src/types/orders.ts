// Order types for the payment and order management system

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  productId?: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface Order {
  id: string;
  customer_name?: string;
  customer_email?: string;
  items: OrderItem[] | string; // JSON string in DB, array in memory
  total: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_intent?: string;
  stripe_session_id?: string;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  customer: CustomerInfo;
  total: number;
  metadata?: Record<string, any>;
}

export interface StripeCheckoutRequest {
  items: { name: string; price: number; quantity: number }[];
  customerEmail: string;
  metadata?: Record<string, any>;
}