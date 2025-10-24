import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface Customer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  loyalty_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  is_vip: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_category?: string;
  is_digital: boolean;
  requires_special_handling: boolean;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_email: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  
  // Priority fields
  priority_level: number; // 1-5 (1=highest)
  priority_score: number;
  auto_priority_assigned: boolean;
  manual_priority_override: boolean;
  fulfillment_priority: 'urgent' | 'high' | 'normal' | 'low';
  
  // Shipping
  shipping_method: string;
  is_express_shipping: boolean;
  estimated_ship_date?: string;
  estimated_delivery_date?: string;
  tracking_number?: string;
  
  // Customer classification
  is_repeat_customer: boolean;
  customer_order_count: number;
  is_high_value: boolean;
  is_vip_customer: boolean;
  
  // Tags and metadata
  priority_tags: string[];
  order_tags: string[];
  fulfillment_notes?: string;
  internal_notes?: string;
  
  // Addresses
  billing_address?: any;
  shipping_address?: any;
  
  // Timestamps
  placed_at: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PriorityRule {
  id: string;
  rule_name: string;
  rule_type: 'order_value' | 'shipping_method' | 'customer_tier' | 'product_category' | 'custom';
  condition_field: string;
  condition_operator: '>=' | '>' | '<=' | '<' | '=' | 'IN' | 'LIKE';
  condition_value: string;
  priority_adjustment: number;
  is_active: boolean;
  rule_order: number;
  description?: string;
}

export interface OrderWithDetails extends Order {
  customer?: Customer;
  items?: OrderItem[];
  priority_label: string;
  hours_since_placed: number;
}

export class OrderPrioritizationService {
  /**
   * Calculate priority score for an order based on business rules
   */
  static async calculatePriorityScore(orderData: Partial<Order>): Promise<number> {
    let baseScore = 50; // Default base score
    
    // Get active priority rules
    const { data: rules } = await supabase
      .from('order_priority_rules')
      .select('*')
      .eq('is_active', true)
      .order('rule_order');

    if (!rules) return baseScore;

    for (const rule of rules) {
      const adjustment = this.applyPriorityRule(rule, orderData);
      baseScore += adjustment;
    }

    // Ensure score is within bounds (1-100)
    return Math.max(1, Math.min(100, baseScore));
  }

  /**
   * Apply a single priority rule to calculate adjustment
   */
  private static applyPriorityRule(rule: PriorityRule, orderData: Partial<Order>): number {
    try {
      switch (rule.rule_type) {
        case 'order_value':
          return this.applyOrderValueRule(rule, orderData);
        case 'shipping_method':
          return this.applyShippingMethodRule(rule, orderData);
        case 'customer_tier':
          return this.applyCustomerTierRule(rule, orderData);
        default:
          return 0;
      }
    } catch (error) {
      console.error(`Error applying rule ${rule.rule_name}:`, error);
      return 0;
    }
  }

  /**
   * Apply order value based rules
   */
  private static applyOrderValueRule(rule: PriorityRule, orderData: Partial<Order>): number {
    if (!orderData.total_amount || rule.condition_field !== 'total_amount') return 0;

    const orderValue = orderData.total_amount;
    const threshold = parseFloat(rule.condition_value);

    switch (rule.condition_operator) {
      case '>=':
        return orderValue >= threshold ? rule.priority_adjustment : 0;
      case '>':
        return orderValue > threshold ? rule.priority_adjustment : 0;
      case '<=':
        return orderValue <= threshold ? rule.priority_adjustment : 0;
      case '<':
        return orderValue < threshold ? rule.priority_adjustment : 0;
      case '=':
        return orderValue === threshold ? rule.priority_adjustment : 0;
      default:
        return 0;
    }
  }

  /**
   * Apply shipping method based rules
   */
  private static applyShippingMethodRule(rule: PriorityRule, orderData: Partial<Order>): number {
    if (!orderData.shipping_method || rule.condition_field !== 'shipping_method') return 0;

    const shippingMethod = orderData.shipping_method.toLowerCase();

    switch (rule.condition_operator) {
      case 'IN':
        const allowedMethods = rule.condition_value.toLowerCase().split(',').map(m => m.trim());
        return allowedMethods.includes(shippingMethod) ? rule.priority_adjustment : 0;
      case '=':
        return shippingMethod === rule.condition_value.toLowerCase() ? rule.priority_adjustment : 0;
      default:
        return 0;
    }
  }

  /**
   * Apply customer tier based rules
   */
  private static applyCustomerTierRule(rule: PriorityRule, orderData: Partial<Order>): number {
    switch (rule.condition_field) {
      case 'is_vip_customer':
        return rule.condition_value === 'true' && orderData.is_vip_customer ? rule.priority_adjustment : 0;
      case 'is_repeat_customer':
        return rule.condition_value === 'true' && orderData.is_repeat_customer ? rule.priority_adjustment : 0;
      default:
        return 0;
    }
  }

  /**
   * Convert priority score to priority level (1-5)
   */
  static priorityScoreToLevel(score: number): number {
    if (score >= 80) return 1; // Urgent
    if (score >= 65) return 2; // High
    if (score >= 35) return 3; // Normal
    if (score >= 20) return 4; // Low
    return 5; // Lowest
  }

  /**
   * Convert priority level to human-readable label
   */
  static priorityLevelToLabel(level: number): string {
    switch (level) {
      case 1: return 'URGENT';
      case 2: return 'HIGH';
      case 3: return 'NORMAL';
      case 4: return 'LOW';
      case 5: return 'LOWEST';
      default: return 'NORMAL';
    }
  }

  /**
   * Get fulfillment priority based on priority level
   */
  static getFulfillmentPriority(level: number): 'urgent' | 'high' | 'normal' | 'low' {
    switch (level) {
      case 1: return 'urgent';
      case 2: return 'high';
      case 3: return 'normal';
      case 4:
      case 5: return 'low';
      default: return 'normal';
    }
  }

  /**
   * Generate priority tags based on order characteristics
   */
  static generatePriorityTags(orderData: Partial<Order>): string[] {
    const tags: string[] = [];

    if (orderData.is_high_value || (orderData.total_amount && orderData.total_amount >= 500)) {
      tags.push('high_value');
    }

    if (orderData.is_express_shipping || 
        ['express', 'overnight', 'next_day'].includes(orderData.shipping_method || '')) {
      tags.push('express_shipping');
    }

    if (orderData.is_vip_customer) {
      tags.push('vip_customer');
    }

    if (orderData.is_repeat_customer) {
      tags.push('repeat_customer');
    }

    if (orderData.total_amount && orderData.total_amount >= 1000) {
      tags.push('large_order');
    }

    if (orderData.total_amount && orderData.total_amount >= 2000) {
      tags.push('premium_order');
    }

    return tags;
  }

  /**
   * Create a new order with automatic priority calculation
   */
  static async createOrderWithPriority(orderData: {
    customer_email: string;
    total_amount: number;
    subtotal: number;
    tax_amount?: number;
    shipping_amount?: number;
    discount_amount?: number;
    shipping_method: string;
    billing_address?: any;
    shipping_address?: any;
    items: Omit<OrderItem, 'id' | 'order_id'>[];
    customer_id?: string;
  }): Promise<{ order: Order; success: boolean; error?: string }> {
    try {
      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Get customer info if customer_id provided
      let customerInfo: Customer | null = null;
      if (orderData.customer_id) {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .eq('id', orderData.customer_id)
          .single();
        customerInfo = data;
      }

      // Prepare order data with customer insights
      const enrichedOrderData: Partial<Order> = {
        order_number: orderNumber,
        customer_id: orderData.customer_id,
        customer_email: orderData.customer_email,
        status: 'pending',
        total_amount: orderData.total_amount,
        subtotal: orderData.subtotal,
        tax_amount: orderData.tax_amount || 0,
        shipping_amount: orderData.shipping_amount || 0,
        discount_amount: orderData.discount_amount || 0,
        shipping_method: orderData.shipping_method,
        billing_address: orderData.billing_address,
        shipping_address: orderData.shipping_address,
        
        // Customer insights
        is_vip_customer: customerInfo?.is_vip || false,
        is_repeat_customer: (customerInfo?.total_orders || 0) > 1,
        customer_order_count: (customerInfo?.total_orders || 0) + 1,
        is_high_value: orderData.total_amount >= 500,
        is_express_shipping: ['express', 'overnight', 'next_day'].includes(orderData.shipping_method.toLowerCase()),
      };

      // Calculate priority
      const priorityScore = await this.calculatePriorityScore(enrichedOrderData);
      const priorityLevel = this.priorityScoreToLevel(priorityScore);
      const fulfillmentPriority = this.getFulfillmentPriority(priorityLevel);
      const priorityTags = this.generatePriorityTags(enrichedOrderData);

      // Final order data
      const finalOrderData = {
        ...enrichedOrderData,
        priority_score: priorityScore,
        priority_level: priorityLevel,
        fulfillment_priority: fulfillmentPriority,
        priority_tags: priorityTags,
        auto_priority_assigned: true,
        manual_priority_override: false,
        placed_at: new Date().toISOString(),
      };

      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(finalOrderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = orderData.items.map(item => ({
        ...item,
        order_id: order.id,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return { order, success: true };

    } catch (error) {
      console.error('Error creating order:', error);
      return { 
        order: {} as Order, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update order priority manually
   */
  static async updateOrderPriority(
    orderId: string, 
    newPriorityLevel: number, 
    isManualOverride = true
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const fulfillmentPriority = this.getFulfillmentPriority(newPriorityLevel);
      
      const { error } = await supabase
        .from('orders')
        .update({
          priority_level: newPriorityLevel,
          fulfillment_priority: fulfillmentPriority,
          manual_priority_override: isManualOverride,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Recalculate priorities for all pending orders
   */
  static async recalculateAllPriorities(): Promise<{ updated: number; errors: number }> {
    let updated = 0;
    let errors = 0;

    try {
      // Get all pending/processing orders without manual override
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'confirmed', 'processing'])
        .eq('manual_priority_override', false);

      if (!orders) return { updated: 0, errors: 0 };

      for (const order of orders) {
        try {
          const priorityScore = await this.calculatePriorityScore(order);
          const priorityLevel = this.priorityScoreToLevel(priorityScore);
          const fulfillmentPriority = this.getFulfillmentPriority(priorityLevel);
          const priorityTags = this.generatePriorityTags(order);

          await supabase
            .from('orders')
            .update({
              priority_score: priorityScore,
              priority_level: priorityLevel,
              fulfillment_priority: fulfillmentPriority,
              priority_tags: priorityTags,
              auto_priority_assigned: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);

          updated++;
        } catch (error) {
          console.error(`Error updating order ${order.id}:`, error);
          errors++;
        }
      }

    } catch (error) {
      console.error('Error in batch priority recalculation:', error);
      errors++;
    }

    return { updated, errors };
  }

  /**
   * Get orders with priority and customer info for dashboard
   */
  static async getOrdersForDashboard(filters: {
    status?: string[];
    priority_level?: number[];
    shipping_method?: string[];
    is_high_value?: boolean;
    is_vip_customer?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  } = {}): Promise<{ orders: OrderWithDetails[]; total: number }> {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers:customer_id (
            first_name,
            last_name,
            loyalty_tier,
            is_vip
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.priority_level && filters.priority_level.length > 0) {
        query = query.in('priority_level', filters.priority_level);
      }

      if (filters.shipping_method && filters.shipping_method.length > 0) {
        query = query.in('shipping_method', filters.shipping_method);
      }

      if (filters.is_high_value !== undefined) {
        query = query.eq('is_high_value', filters.is_high_value);
      }

      if (filters.is_vip_customer !== undefined) {
        query = query.eq('is_vip_customer', filters.is_vip_customer);
      }

      if (filters.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`);
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'priority_level';
      const sortOrder = filters.sort_order || 'asc';
      
      if (sortBy === 'priority_level') {
        query = query.order('priority_level', { ascending: sortOrder === 'asc' })
                     .order('priority_score', { ascending: false })
                     .order('placed_at', { ascending: true });
      } else {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      }

      // Apply pagination
      if (filters.limit) {
        query = query.range(filters.offset || 0, (filters.offset || 0) + filters.limit - 1);
      }

      const { data: orders, error, count } = await query;

      if (error) throw error;

      // Transform data to include computed fields
      const transformedOrders: OrderWithDetails[] = (orders || []).map(order => ({
        ...order,
        customer: order.customers,
        priority_label: this.priorityLevelToLabel(order.priority_level),
        hours_since_placed: this.calculateHoursSincePlaced(order.placed_at),
      }));

      return {
        orders: transformedOrders,
        total: count || 0,
      };

    } catch (error) {
      console.error('Error fetching orders for dashboard:', error);
      return { orders: [], total: 0 };
    }
  }

  /**
   * Generate unique order number
   */
  private static async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Calculate hours since order was placed
   */
  private static calculateHoursSincePlaced(placedAt: string): number {
    const placed = new Date(placedAt);
    const now = new Date();
    return (now.getTime() - placed.getTime()) / (1000 * 60 * 60);
  }

  /**
   * Get dashboard summary statistics
   */
  static async getDashboardSummary(): Promise<any> {
    const { data } = await supabase
      .from('orders_dashboard_summary')
      .select('*')
      .single();

    return data || {};
  }

  /**
   * Update order status with history tracking
   */
  static async updateOrderStatus(
    orderId: string, 
    newStatus: string, 
    changedBy: string = 'system',
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current order
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('status, priority_level')
        .eq('id', orderId)
        .single();

      if (!currentOrder) {
        return { success: false, error: 'Order not found' };
      }

      // Update order status
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Set status-specific timestamps
      if (newStatus === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      } else if (newStatus === 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Log status change
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          previous_status: currentOrder.status,
          new_status: newStatus,
          changed_by: changedBy,
          change_reason: reason,
          priority_before: currentOrder.priority_level,
          priority_after: currentOrder.priority_level,
        });

      return { success: true };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export default OrderPrioritizationService;