-- FINAL CORRECTED NOTIFICATION SETUP SCRIPT
-- Run this in Supabase SQL Editor - all column references fixed

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
    IF NEW.total_amount >= 1000 OR NEW.shipping_method ILIKE '%express%' OR NEW.shipping_method ILIKE '%overnight%' THEN
      notification_messages := array_append(notification_messages, 
        CASE 
          WHEN NEW.total_amount >= 1000 THEN 'HIGH VALUE order ' || NEW.order_number || ' ($' || NEW.total_amount::TEXT || ') requires priority attention'
          WHEN NEW.shipping_method ILIKE '%overnight%' THEN 'OVERNIGHT shipping order ' || NEW.order_number || ' requires immediate attention'
          WHEN NEW.shipping_method ILIKE '%express%' THEN 'EXPRESS shipping order ' || NEW.order_number || ' requires prompt attention'
        END
      );
      recipient_types := array_append(recipient_types, 'fulfillment');
      notification_types := array_append(notification_types, 'priority_assigned');
    END IF;
  END IF;

  -- Check for high value orders (only on INSERT)
  IF TG_OP = 'INSERT' AND NEW.total_amount >= 500 THEN
    notification_messages := array_append(notification_messages, 
      'High-value order ' || NEW.order_number || ' ($' || NEW.total_amount::TEXT || ') detected'
    );
    recipient_types := array_append(recipient_types, 'admin');
    notification_types := array_append(notification_types, 'high_value_detected');
  END IF;

  -- Check for express shipping (only on INSERT)
  IF TG_OP = 'INSERT' AND NEW.shipping_method ILIKE '%express%' THEN
    notification_messages := array_append(notification_messages, 
      'Express shipping order ' || NEW.order_number || ' needs expedited fulfillment'
    );
    recipient_types := array_append(recipient_types, 'fulfillment');
    notification_types := array_append(notification_types, 'express_shipping');
  END IF;

  -- Check for status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    notification_messages := array_append(notification_messages, 
      'Order ' || NEW.order_number || ' status changed from ' || OLD.status || ' to ' || NEW.status
    );
    recipient_types := array_append(recipient_types, 'admin');
    notification_types := array_append(notification_types, 'status_changed');
  END IF;

  -- Insert notifications
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
        WHEN NEW.total_amount >= 1000 THEN 1
        WHEN NEW.shipping_method ILIKE '%overnight%' THEN 1
        WHEN NEW.shipping_method ILIKE '%express%' THEN 2
        WHEN NEW.total_amount >= 500 THEN 2
        ELSE 3
      END,
      notification_messages[i],
      recipient_types[i],
      FALSE
    );
  END LOOP;

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
  IF NEW.total_amount >= 1000 OR NEW.shipping_method ILIKE '%overnight%' THEN
    alert_messages := array_append(alert_messages, 
      CASE 
        WHEN NEW.total_amount >= 1000 THEN 'HIGH VALUE: Order ' || NEW.order_number || ' ($' || NEW.total_amount::TEXT || ') requires immediate attention'
        WHEN NEW.shipping_method ILIKE '%overnight%' THEN 'OVERNIGHT: Order ' || NEW.order_number || ' requires immediate fulfillment attention'
      END
    );
    alert_types := array_append(alert_types, 'urgent_priority');
  END IF;

  -- Create alert for very high value orders
  IF NEW.total_amount >= 1000 THEN
    alert_messages := array_append(alert_messages, 
      'High-value order ' || NEW.order_number || ' ($' || NEW.total_amount::TEXT || ') detected'
    );
    alert_types := array_append(alert_types, 'high_value_order');
  END IF;

  -- Create alert for express shipping orders
  IF NEW.shipping_method ILIKE '%express%' AND NEW.total_amount >= 500 THEN
    alert_messages := array_append(alert_messages, 
      'Express shipping order ' || NEW.order_number || ' needs expedited processing'
    );
    alert_types := array_append(alert_types, 'express_shipping');
  END IF;

  -- Insert alerts
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
      NEW.priority_score,
      FALSE
    );
  END LOOP;

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
CREATE OR REPLACE VIEW order_management_dashboard AS
SELECT 
  -- Order counts by status (using actual status column)
  COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_orders,
  COUNT(CASE WHEN o.status = 'processing' THEN 1 END) as processing_orders,
  COUNT(CASE WHEN o.status = 'shipped' THEN 1 END) as shipped_orders,
  COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
  COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled_orders,
  
  -- Order counts by value ranges
  COUNT(CASE WHEN o.total_amount >= 1000 THEN 1 END) as high_value_orders,
  COUNT(CASE WHEN o.total_amount >= 500 AND o.total_amount < 1000 THEN 1 END) as medium_value_orders,
  COUNT(CASE WHEN o.total_amount < 500 THEN 1 END) as standard_orders,
  
  -- Special order types
  COUNT(CASE WHEN o.shipping_method ILIKE '%express%' THEN 1 END) as express_orders,
  COUNT(CASE WHEN o.shipping_method ILIKE '%overnight%' THEN 1 END) as overnight_orders,
  
  -- Notification counts
  (SELECT COUNT(*) FROM order_notifications WHERE is_read = FALSE) as unread_notifications,
  (SELECT COUNT(*) FROM priority_alerts WHERE is_acknowledged = FALSE) as active_alerts,
  
  -- Recent activity
  (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '1 hour') as orders_last_hour,
  (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '24 hours') as orders_last_24h,
  
  -- Performance metrics
  COALESCE(AVG(o.priority_score), 0) as avg_priority_score,
  COALESCE(SUM(o.total_amount), 0) as total_order_value,
  COUNT(*) as total_orders,
  NOW() as last_updated

FROM orders o
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days';

-- 9. Enable RLS
ALTER TABLE order_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view notifications" ON order_notifications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view alerts" ON priority_alerts
  FOR SELECT USING (auth.role() = 'authenticated');

-- 10. Create utility functions for notification management
CREATE OR REPLACE FUNCTION mark_notifications_read(notification_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE order_notifications 
  SET is_read = TRUE, read_at = NOW()
  WHERE id = ANY(notification_ids) AND is_read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION acknowledge_alerts(alert_ids UUID[], acknowledged_by_user VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE priority_alerts 
  SET 
    is_acknowledged = TRUE, 
    acknowledged_by = acknowledged_by_user,
    acknowledged_at = NOW()
  WHERE id = ANY(alert_ids) AND is_acknowledged = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Notification system setup completed successfully!' as status;