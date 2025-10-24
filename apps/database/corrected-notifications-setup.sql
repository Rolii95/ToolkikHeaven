-- CORRECTED NOTIFICATION SETUP SCRIPT
-- Run this in Supabase SQL Editor after running the main schema fixes

-- 1. Create order_notifications table for real-time notifications
CREATE TABLE IF NOT EXISTS order_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- priority_assigned, high_value_detected, express_shipping, status_changed
  priority_level INTEGER NOT NULL,
  message TEXT NOT NULL,
  recipient_type VARCHAR(20) NOT NULL, -- admin, fulfillment, customer_service
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create priority_alerts table for urgent alerts
CREATE TABLE IF NOT EXISTS priority_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- urgent_priority, high_value_order, express_shipping
  alert_message TEXT NOT NULL,
  priority_score DECIMAL(5,2) NOT NULL,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by VARCHAR(100),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_notifications_order_id ON order_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notifications_recipient_type ON order_notifications(recipient_type);
CREATE INDEX IF NOT EXISTS idx_order_notifications_is_read ON order_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_priority_alerts_order_id ON priority_alerts(order_id);
CREATE INDEX IF NOT EXISTS idx_priority_alerts_is_acknowledged ON priority_alerts(is_acknowledged);

-- 4. Create function to automatically create notifications on order changes
CREATE OR REPLACE FUNCTION create_order_notifications()
RETURNS TRIGGER AS $$
DECLARE
  notification_messages TEXT[];
  recipient_types TEXT[];
  notification_types TEXT[];
  i INTEGER;
BEGIN
  -- Initialize arrays
  notification_messages := ARRAY[]::TEXT[];
  recipient_types := ARRAY[]::TEXT[];
  notification_types := ARRAY[]::TEXT[];

  -- Check for high priority orders based on value and shipping method
  IF TG_OP = 'INSERT' THEN
    -- High value orders get priority notifications
    IF CAST(COALESCE(NEW.total_amount, 0) AS DECIMAL) >= 1000 OR COALESCE(NEW.shipping_method, '') ILIKE '%express%' OR COALESCE(NEW.shipping_method, '') ILIKE '%overnight%' THEN
      notification_messages := array_append(notification_messages, 
        CASE 
          WHEN CAST(COALESCE(NEW.total_amount, 0) AS DECIMAL) >= 1000 THEN 'HIGH VALUE order ' || COALESCE(NEW.id::TEXT, 'Unknown') || ' ($' || COALESCE(NEW.total_amount, 0)::TEXT || ') requires priority attention'
          WHEN COALESCE(NEW.shipping_method, '') ILIKE '%overnight%' THEN 'OVERNIGHT shipping order ' || COALESCE(NEW.id::TEXT, 'Unknown') || ' requires immediate attention'
          WHEN COALESCE(NEW.shipping_method, '') ILIKE '%express%' THEN 'EXPRESS shipping order ' || COALESCE(NEW.id::TEXT, 'Unknown') || ' requires prompt attention'
        END
      );
      recipient_types := array_append(recipient_types, 'fulfillment');
      notification_types := array_append(notification_types, 'priority_assigned');
    END IF;
  END IF;

  -- Check for high value orders (only on INSERT)
  IF TG_OP = 'INSERT' AND CAST(COALESCE(NEW.total_amount, 0) AS DECIMAL) >= 500 THEN
    notification_messages := array_append(notification_messages, 
      'High-value order ' || COALESCE(NEW.id::TEXT, 'Unknown') || ' ($' || COALESCE(NEW.total_amount, 0)::TEXT || ') detected'
    );
    recipient_types := array_append(recipient_types, 'admin');
    notification_types := array_append(notification_types, 'high_value_detected');
  END IF;

  -- Check for express shipping (only on INSERT)
  IF TG_OP = 'INSERT' AND COALESCE(NEW.shipping_method, '') ILIKE '%express%' THEN
    notification_messages := array_append(notification_messages, 
      'Express shipping order ' || COALESCE(NEW.id::TEXT, 'Unknown') || ' needs expedited fulfillment'
    );
    recipient_types := array_append(recipient_types, 'fulfillment');
    notification_types := array_append(notification_types, 'express_shipping');
  END IF;

  -- Check for status changes requiring notifications
  IF TG_OP = 'UPDATE' THEN
    -- Critical status changes requiring immediate notification
    IF OLD.status != NEW.status THEN
      notification_messages := array_append(notification_messages, 
        'Order ' || COALESCE(NEW.id::TEXT, 'Unknown') || ' status changed from ' || COALESCE(OLD.status, 'unknown') || ' to ' || COALESCE(NEW.status, 'unknown')
      );
      
      -- Customer notifications for specific status changes
      IF NEW.status IN ('shipped', 'delivered', 'cancelled', 'refunded') THEN
        recipient_types := array_append(recipient_types, 'customer');
        notification_types := array_append(notification_types, 'status_update');
      END IF;
      
      -- Admin notifications for problem statuses
      IF NEW.status IN ('cancelled', 'refunded', 'disputed', 'failed') THEN
        recipient_types := array_append(recipient_types, 'admin');
        notification_types := array_append(notification_types, 'admin_alert');
      END IF;
    END IF;

    -- Check for order value changes (could indicate refunds, adjustments)
    IF COALESCE(OLD.total_amount, 0) != COALESCE(NEW.total_amount, 0) THEN
      notification_messages := array_append(notification_messages, 
        'Order ' || COALESCE(NEW.id::TEXT, 'Unknown') || ' value changed from $' || 
        COALESCE(OLD.total_amount, 0)::TEXT || ' to $' || COALESCE(NEW.total_amount, 0)::TEXT
      );
      recipient_types := array_append(recipient_types, 'admin');
      notification_types := array_append(notification_types, 'value_changed');
    END IF;
  END IF;

  -- Insert notifications (only if we have notifications to insert)
  IF array_length(notification_messages, 1) IS NOT NULL AND array_length(notification_messages, 1) > 0 THEN
    FOR i IN 1..array_length(notification_messages, 1) LOOP
      INSERT INTO order_notifications (
        order_id,
        notification_type,
        priority_level,
        message,
        recipient_type,
        is_read
      ) VALUES (
        NEW.id,
        notification_types[i],
        CASE 
          WHEN CAST(COALESCE(NEW.total_amount, 0) AS DECIMAL) >= 1000 THEN 1
          WHEN COALESCE(NEW.shipping_method, '') ILIKE '%overnight%' THEN 1
          WHEN COALESCE(NEW.shipping_method, '') ILIKE '%express%' THEN 2
          WHEN CAST(COALESCE(NEW.total_amount, 0) AS DECIMAL) >= 500 THEN 2
          ELSE 3
        END,
        notification_messages[i],
        recipient_types[i],
        FALSE
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for automatic notification creation
DROP TRIGGER IF EXISTS order_notifications_trigger ON orders;
CREATE TRIGGER order_notifications_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_order_notifications();

-- 6. Create function to automatically create priority alerts
CREATE OR REPLACE FUNCTION create_priority_alerts()
RETURNS TRIGGER AS $$
DECLARE
  alert_messages TEXT[];
  alert_types TEXT[];
  i INTEGER;
BEGIN
  -- Initialize arrays
  alert_messages := ARRAY[]::TEXT[];
  alert_types := ARRAY[]::TEXT[];

  -- Create alert for urgent orders (high value or express shipping)
  IF CAST(COALESCE(NEW.total_amount, 0) AS DECIMAL) >= 1000 OR COALESCE(NEW.shipping_method, '') ILIKE '%overnight%' THEN
    alert_messages := array_append(alert_messages, 
      CASE 
        WHEN CAST(COALESCE(NEW.total_amount, 0) AS DECIMAL) >= 1000 THEN 'HIGH VALUE: Order ' || COALESCE(NEW.id::TEXT, 'Unknown') || ' ($' || COALESCE(NEW.total_amount, 0)::TEXT || ') requires immediate attention'
        WHEN COALESCE(NEW.shipping_method, '') ILIKE '%overnight%' THEN 'OVERNIGHT: Order ' || COALESCE(NEW.id::TEXT, 'Unknown') || ' requires immediate fulfillment attention'
      END
    );
    alert_types := array_append(alert_types, 'urgent_priority');
  END IF;

  -- Create alert for very high value orders
  IF CAST(COALESCE(NEW.total_amount, 0) AS DECIMAL) >= 1000 THEN
    alert_messages := array_append(alert_messages, 
      'High-value order ' || COALESCE(NEW.id::TEXT, 'Unknown') || ' ($' || COALESCE(NEW.total_amount, 0)::TEXT || ') detected'
    );
    alert_types := array_append(alert_types, 'high_value_order');
  END IF;

  -- Create alert for express shipping orders
  IF COALESCE(NEW.shipping_method, '') ILIKE '%express%' AND CAST(COALESCE(NEW.total_amount, 0) AS DECIMAL) >= 500 THEN
    alert_messages := array_append(alert_messages, 
      'Express shipping order ' || COALESCE(NEW.id::TEXT, 'Unknown') || ' needs expedited processing'
    );
    alert_types := array_append(alert_types, 'express_shipping');
  END IF;

  -- Insert alerts (only if we have alerts to insert)
  IF array_length(alert_messages, 1) IS NOT NULL AND array_length(alert_messages, 1) > 0 THEN
    FOR i IN 1..array_length(alert_messages, 1) LOOP
      INSERT INTO priority_alerts (
        order_id,
        alert_type,
        alert_message,
        priority_score,
        is_acknowledged
      ) VALUES (
        NEW.id,
        alert_types[i],
        alert_messages[i],
        CASE WHEN CAST(COALESCE(NEW.total_amount, 0) AS DECIMAL) >= 1000 THEN 100 WHEN CAST(COALESCE(NEW.total_amount, 0) AS DECIMAL) >= 500 THEN 75 ELSE 50 END, -- Calculate priority score based on total
        FALSE
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for automatic alert creation
DROP TRIGGER IF EXISTS priority_alerts_trigger ON orders;
CREATE TRIGGER priority_alerts_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_priority_alerts();

-- 8. Create dashboard view (using actual column names)
-- First drop the view if it exists to avoid column conflicts
DROP VIEW IF EXISTS order_management_dashboard;

CREATE VIEW order_management_dashboard AS
SELECT 
  -- Order counts by status (using actual status column)
  COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_orders,
  COUNT(CASE WHEN o.status = 'processing' THEN 1 END) as processing_orders,
  COUNT(CASE WHEN o.status = 'shipped' THEN 1 END) as shipped_orders,
  COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
  COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled_orders,
  
  -- Order counts by value ranges (using correct column name)
  COUNT(CASE WHEN CAST(COALESCE(o.total_amount, 0) AS DECIMAL) >= 1000 THEN 1 END) as high_value_orders,
  COUNT(CASE WHEN CAST(COALESCE(o.total_amount, 0) AS DECIMAL) >= 500 AND CAST(COALESCE(o.total_amount, 0) AS DECIMAL) < 1000 THEN 1 END) as medium_value_orders,
  COUNT(CASE WHEN CAST(COALESCE(o.total_amount, 0) AS DECIMAL) < 500 THEN 1 END) as standard_orders,
  
  -- Special order types (using shipping_method column)
  COUNT(CASE WHEN COALESCE(o.shipping_method, '') ILIKE '%express%' THEN 1 END) as express_orders,
  COUNT(CASE WHEN COALESCE(o.shipping_method, '') ILIKE '%overnight%' THEN 1 END) as overnight_orders,
  
  -- Notification counts
  (SELECT COUNT(*) FROM order_notifications WHERE is_read = FALSE) as unread_notifications,
  (SELECT COUNT(*) FROM priority_alerts WHERE is_acknowledged = FALSE) as active_alerts,
  
  -- Recent activity
  (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '1 hour') as orders_last_hour,
  (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '24 hours') as orders_last_24h,
  
  -- Performance metrics (using correct column name)
  COALESCE(AVG(CASE WHEN CAST(COALESCE(o.total_amount, 0) AS DECIMAL) >= 1000 THEN 100 WHEN CAST(COALESCE(o.total_amount, 0) AS DECIMAL) >= 500 THEN 75 ELSE 50 END), 50) as avg_priority_score,
  COALESCE(SUM(CAST(COALESCE(o.total_amount, 0) AS DECIMAL)), 0) as total_order_value,
  COUNT(*) as total_orders,
  NOW() as last_updated

FROM orders o
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days';

-- 9. Enable RLS
ALTER TABLE order_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
DROP POLICY IF EXISTS "Users can view notifications" ON order_notifications;
CREATE POLICY "Users can view notifications" ON order_notifications
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can manage notifications" ON order_notifications;
CREATE POLICY "Users can manage notifications" ON order_notifications
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view alerts" ON priority_alerts;
CREATE POLICY "Users can view alerts" ON priority_alerts
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can manage alerts" ON priority_alerts;
CREATE POLICY "Users can manage alerts" ON priority_alerts
  FOR ALL USING (auth.role() = 'authenticated');

-- Success message
SELECT 'Notification system setup completed successfully!' as status;