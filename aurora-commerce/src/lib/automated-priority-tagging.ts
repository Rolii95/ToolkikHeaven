import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface OrderNotification {
  id: string;
  order_id: string;
  notification_type: 'priority_assigned' | 'high_value_detected' | 'vip_customer' | 'express_shipping' | 'status_changed';
  priority_level: number;
  message: string;
  recipient_type: 'admin' | 'fulfillment' | 'customer_service';
  is_read: boolean;
  created_at: string;
}

export interface PriorityAlert {
  id: string;
  order_id: string;
  alert_type: 'urgent_priority' | 'high_value_order' | 'vip_customer_order' | 'express_shipping';
  alert_message: string;
  priority_score: number;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
}

export class AutomatedPriorityTaggingService {
  /**
   * Listen for order changes and send real-time notifications
   */
  static async setupRealtimeListeners() {
    // Subscribe to orders table changes
    const ordersChannel = supabase
      .channel('orders-changes')
      .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'orders' },
          this.handleNewOrder.bind(this)
      )
      .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          this.handleOrderUpdate.bind(this)
      )
      .subscribe();

    return ordersChannel;
  }

  /**
   * Handle new order creation
   */
  private static async handleNewOrder(payload: any) {
    try {
      const order = payload.new;
      console.log('🆕 New order detected:', order.order_number);

      // Generate notifications for new high-priority orders
      await this.generateOrderNotifications(order, 'new');

      // Create priority alerts if needed
      await this.createPriorityAlerts(order);

      // Send real-time notifications to admin dashboard
      await this.sendRealtimeNotifications(order, 'order_created');

    } catch (error) {
      console.error('Error handling new order:', error);
    }
  }

  /**
   * Handle order updates
   */
  private static async handleOrderUpdate(payload: any) {
    try {
      const oldOrder = payload.old;
      const newOrder = payload.new;
      
      console.log('📝 Order updated:', newOrder.order_number);

      // Check if priority changed
      if (oldOrder.priority_level !== newOrder.priority_level) {
        await this.handlePriorityChange(oldOrder, newOrder);
      }

      // Check if status changed
      if (oldOrder.status !== newOrder.status) {
        await this.handleStatusChange(oldOrder, newOrder);
      }

      // Generate notifications for updates
      await this.generateOrderNotifications(newOrder, 'updated');

    } catch (error) {
      console.error('Error handling order update:', error);
    }
  }

  /**
   * Generate appropriate notifications based on order characteristics
   */
  static async generateOrderNotifications(order: any, eventType: 'new' | 'updated') {
    const notifications: Omit<OrderNotification, 'id' | 'created_at'>[] = [];

    // High priority order notifications
    if (order.priority_level <= 2) {
      notifications.push({
        order_id: order.id,
        notification_type: 'priority_assigned',
        priority_level: order.priority_level,
        message: `${order.priority_level === 1 ? 'URGENT' : 'HIGH'} priority order ${order.order_number} requires immediate attention`,
        recipient_type: 'fulfillment',
        is_read: false,
      });
    }

    // High value order notifications
    if (order.is_high_value) {
      notifications.push({
        order_id: order.id,
        notification_type: 'high_value_detected',
        priority_level: order.priority_level,
        message: `High-value order ${order.order_number} (${this.formatCurrency(order.total_amount)}) detected`,
        recipient_type: 'admin',
        is_read: false,
      });
    }

    // VIP customer notifications
    if (order.is_vip_customer) {
      notifications.push({
        order_id: order.id,
        notification_type: 'vip_customer',
        priority_level: order.priority_level,
        message: `VIP customer order ${order.order_number} requires priority handling`,
        recipient_type: 'customer_service',
        is_read: false,
      });
    }

    // Express shipping notifications
    if (order.is_express_shipping) {
      notifications.push({
        order_id: order.id,
        notification_type: 'express_shipping',
        priority_level: order.priority_level,
        message: `Express shipping order ${order.order_number} needs expedited fulfillment`,
        recipient_type: 'fulfillment',
        is_read: false,
      });
    }

    // Insert notifications if any
    if (notifications.length > 0) {
      const { error } = await supabase
        .from('order_notifications')
        .insert(notifications);

      if (error) {
        console.error('Error creating notifications:', error);
      } else {
        console.log(`✅ Created ${notifications.length} notifications for order ${order.order_number}`);
      }
    }
  }

  /**
   * Create priority alerts for urgent orders
   */
  static async createPriorityAlerts(order: any) {
    const alerts: Omit<PriorityAlert, 'id' | 'created_at'>[] = [];

    // Create alert for urgent priority orders
    if (order.priority_level === 1) {
      alerts.push({
        order_id: order.id,
        alert_type: 'urgent_priority',
        alert_message: `URGENT: Order ${order.order_number} requires immediate fulfillment attention`,
        priority_score: order.priority_score,
        is_acknowledged: false,
      });
    }

    // Create alert for very high value orders
    if (order.total_amount >= 1000) {
      alerts.push({
        order_id: order.id,
        alert_type: 'high_value_order',
        alert_message: `High-value order ${order.order_number} (${this.formatCurrency(order.total_amount)}) detected`,
        priority_score: order.priority_score,
        is_acknowledged: false,
      });
    }

    // Create alert for VIP customer orders
    if (order.is_vip_customer) {
      alerts.push({
        order_id: order.id,
        alert_type: 'vip_customer_order',
        alert_message: `VIP customer order ${order.order_number} requires special attention`,
        priority_score: order.priority_score,
        is_acknowledged: false,
      });
    }

    // Create alert for express shipping
    if (order.is_express_shipping && order.priority_level <= 2) {
      alerts.push({
        order_id: order.id,
        alert_type: 'express_shipping',
        alert_message: `Express shipping order ${order.order_number} needs expedited processing`,
        priority_score: order.priority_score,
        is_acknowledged: false,
      });
    }

    // Insert alerts if any
    if (alerts.length > 0) {
      const { error } = await supabase
        .from('priority_alerts')
        .insert(alerts);

      if (error) {
        console.error('Error creating priority alerts:', error);
      } else {
        console.log(`🚨 Created ${alerts.length} priority alerts for order ${order.order_number}`);
      }
    }
  }

  /**
   * Handle priority level changes
   */
  private static async handlePriorityChange(oldOrder: any, newOrder: any) {
    const priorityIncreased = newOrder.priority_level < oldOrder.priority_level;
    const priorityDecreased = newOrder.priority_level > oldOrder.priority_level;

    if (priorityIncreased) {
      // Priority increased (lower number = higher priority)
      await this.generateOrderNotifications({
        ...newOrder,
        notification_type: 'priority_assigned',
        message: `Order ${newOrder.order_number} priority increased to ${this.getPriorityLabel(newOrder.priority_level)}`,
      }, 'updated');

      // Create new alerts if now urgent
      if (newOrder.priority_level === 1) {
        await this.createPriorityAlerts(newOrder);
      }
    }

    // Log priority change
    console.log(`📊 Priority changed for order ${newOrder.order_number}: ${this.getPriorityLabel(oldOrder.priority_level)} → ${this.getPriorityLabel(newOrder.priority_level)}`);
  }

  /**
   * Handle status changes
   */
  private static async handleStatusChange(oldOrder: any, newOrder: any) {
    const statusNotification: Omit<OrderNotification, 'id' | 'created_at'> = {
      order_id: newOrder.id,
      notification_type: 'status_changed',
      priority_level: newOrder.priority_level,
      message: `Order ${newOrder.order_number} status changed from ${oldOrder.status} to ${newOrder.status}`,
      recipient_type: 'admin',
      is_read: false,
    };

    await supabase
      .from('order_notifications')
      .insert(statusNotification);

    console.log(`📋 Status changed for order ${newOrder.order_number}: ${oldOrder.status} → ${newOrder.status}`);
  }

  /**
   * Send real-time notifications to connected clients
   */
  private static async sendRealtimeNotifications(order: any, eventType: string) {
    const notification = {
      type: eventType,
      order: {
        id: order.id,
        order_number: order.order_number,
        priority_level: order.priority_level,
        priority_label: this.getPriorityLabel(order.priority_level),
        total_amount: order.total_amount,
        customer_email: order.customer_email,
        status: order.status,
        is_high_value: order.is_high_value,
        is_vip_customer: order.is_vip_customer,
        is_express_shipping: order.is_express_shipping,
        priority_tags: order.priority_tags,
      },
      timestamp: new Date().toISOString(),
    };

    // Send to admin channel
    await supabase
      .channel('admin-notifications')
      .send({
        type: 'broadcast',
        event: 'order_notification',
        payload: notification,
      });
  }

  /**
   * Get unread notifications for a recipient type
   */
  static async getUnreadNotifications(recipientType: 'admin' | 'fulfillment' | 'customer_service') {
    const { data, error } = await supabase
      .from('order_notifications')
      .select(`
        *,
        orders:order_id (
          order_number,
          customer_email,
          total_amount,
          status
        )
      `)
      .eq('recipient_type', recipientType)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get active priority alerts
   */
  static async getActivePriorityAlerts() {
    const { data, error } = await supabase
      .from('priority_alerts')
      .select(`
        *,
        orders:order_id (
          order_number,
          customer_email,
          total_amount,
          status,
          priority_level
        )
      `)
      .eq('is_acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching priority alerts:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Mark notifications as read
   */
  static async markNotificationsAsRead(notificationIds: string[]) {
    const { error } = await supabase
      .from('order_notifications')
      .update({ is_read: true })
      .in('id', notificationIds);

    if (error) {
      console.error('Error marking notifications as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Acknowledge priority alerts
   */
  static async acknowledgePriorityAlerts(alertIds: string[], acknowledgedBy: string) {
    const { error } = await supabase
      .from('priority_alerts')
      .update({
        is_acknowledged: true,
        acknowledged_by: acknowledgedBy,
        acknowledged_at: new Date().toISOString(),
      })
      .in('id', alertIds);

    if (error) {
      console.error('Error acknowledging alerts:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats() {
    try {
      // Get unread counts by type
      const { data: unreadCounts } = await supabase
        .from('order_notifications')
        .select('recipient_type')
        .eq('is_read', false);

      // Get active alert counts by type  
      const { data: alertCounts } = await supabase
        .from('priority_alerts')
        .select('alert_type')
        .eq('is_acknowledged', false);

      const stats = {
        unread_notifications: {
          admin: unreadCounts?.filter(n => n.recipient_type === 'admin').length || 0,
          fulfillment: unreadCounts?.filter(n => n.recipient_type === 'fulfillment').length || 0,
          customer_service: unreadCounts?.filter(n => n.recipient_type === 'customer_service').length || 0,
        },
        active_alerts: {
          urgent_priority: alertCounts?.filter(a => a.alert_type === 'urgent_priority').length || 0,
          high_value_order: alertCounts?.filter(a => a.alert_type === 'high_value_order').length || 0,
          vip_customer_order: alertCounts?.filter(a => a.alert_type === 'vip_customer_order').length || 0,
          express_shipping: alertCounts?.filter(a => a.alert_type === 'express_shipping').length || 0,
        },
        total_unread: unreadCounts?.length || 0,
        total_active_alerts: alertCounts?.length || 0,
      };

      return stats;

    } catch (error) {
      console.error('Error getting notification stats:', error);
      return null;
    }
  }

  /**
   * Clean up old notifications and alerts
   */
  static async cleanupOldNotifications(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Clean up old read notifications
      const { error: notificationError } = await supabase
        .from('order_notifications')
        .delete()
        .eq('is_read', true)
        .lt('created_at', cutoffDate.toISOString());

      // Clean up old acknowledged alerts
      const { error: alertError } = await supabase
        .from('priority_alerts')
        .delete()
        .eq('is_acknowledged', true)
        .lt('created_at', cutoffDate.toISOString());

      if (notificationError || alertError) {
        console.error('Error during cleanup:', { notificationError, alertError });
        return { success: false };
      }

      console.log(`🧹 Cleaned up notifications and alerts older than ${daysToKeep} days`);
      return { success: true };

    } catch (error) {
      console.error('Error in cleanup process:', error);
      return { success: false };
    }
  }

  // Utility methods
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  private static getPriorityLabel(level: number): string {
    switch (level) {
      case 1: return 'URGENT';
      case 2: return 'HIGH';
      case 3: return 'NORMAL';
      case 4: return 'LOW';
      case 5: return 'LOWEST';
      default: return 'NORMAL';
    }
  }
}

export default AutomatedPriorityTaggingService;