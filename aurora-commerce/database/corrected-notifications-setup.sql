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

  -- Check for high priority orders (only on INSERT or priority change)
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.priority != NEW.priority)) THEN
    IF NEW.priority IN ('urgent', 'high') THEN
      notification_messages := array_append(notification_messages, 
        CASE NEW.priority
          WHEN 'urgent' THEN 'URGENT priority order ' || NEW.order_number || ' requires immediate attention'
          WHEN 'high' THEN 'HIGH priority order ' || NEW.order_number || ' requires prompt attention'
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
      CASE NEW.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        ELSE 4
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

  -- Create alert for urgent priority orders
  IF NEW.priority = 'urgent' THEN
    alert_messages := array_append(alert_messages, 
      'URGENT: Order ' || NEW.order_number || ' requires immediate fulfillment attention'
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

  -- Create alert for express shipping with high priority
  IF NEW.shipping_method ILIKE '%express%' AND NEW.priority IN ('urgent', 'high') THEN
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

-- 8. Create dashboard view
CREATE OR REPLACE VIEW order_management_dashboard AS
SELECT 
  -- Order counts by priority
  COUNT(CASE WHEN o.priority = 'urgent' THEN 1 END) as urgent_orders,
  COUNT(CASE WHEN o.priority = 'high' THEN 1 END) as high_priority_orders,
  COUNT(CASE WHEN o.priority = 'normal' THEN 1 END) as normal_priority_orders,
  
  -- Order counts by status
  COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_orders,
  COUNT(CASE WHEN o.status = 'processing' THEN 1 END) as processing_orders,
  COUNT(CASE WHEN o.status = 'shipped' THEN 1 END) as shipped_orders,
  
  -- Special order types
  COUNT(CASE WHEN o.total_amount >= 500 THEN 1 END) as high_value_orders,
  COUNT(CASE WHEN o.shipping_method ILIKE '%express%' THEN 1 END) as express_orders,
  
  -- Notification counts
  (SELECT COUNT(*) FROM order_notifications WHERE is_read = FALSE) as unread_notifications,
  (SELECT COUNT(*) FROM priority_alerts WHERE is_acknowledged = FALSE) as active_alerts,
  
  -- Recent activity
  (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '1 hour') as orders_last_hour,
  (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '24 hours') as orders_last_24h,
  
  -- Performance metrics
  COALESCE(AVG(o.priority_score), 0) as avg_priority_score,
  COALESCE(SUM(o.total_amount), 0) as total_order_value,
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

-- Success message
SELECT 'Notification system setup completed successfully!' as status;