-- Additional schema for order notifications and priority alerts
-- Run this after the main order-prioritization-setup.sql

-- 1. Create order_notifications table for real-time notifications
CREATE TABLE IF NOT EXISTS order_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- priority_assigned, high_value_detected, vip_customer, express_shipping, status_changed
  priority_level INTEGER NOT NULL,
  message TEXT NOT NULL,
  recipient_type VARCHAR(20) NOT NULL, -- admin, fulfillment, customer_service
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for notifications
CREATE INDEX IF NOT EXISTS idx_order_notifications_order_id ON order_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notifications_recipient_type ON order_notifications(recipient_type);
CREATE INDEX IF NOT EXISTS idx_order_notifications_is_read ON order_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_order_notifications_created_at ON order_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_order_notifications_notification_type ON order_notifications(notification_type);

-- 2. Create priority_alerts table for urgent alerts
CREATE TABLE IF NOT EXISTS priority_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- urgent_priority, high_value_order, vip_customer_order, express_shipping
  alert_message TEXT NOT NULL,
  priority_score DECIMAL(5,2) NOT NULL,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by VARCHAR(100),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for priority alerts
CREATE INDEX IF NOT EXISTS idx_priority_alerts_order_id ON priority_alerts(order_id);
CREATE INDEX IF NOT EXISTS idx_priority_alerts_alert_type ON priority_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_priority_alerts_is_acknowledged ON priority_alerts(is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_priority_alerts_created_at ON priority_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_priority_alerts_priority_score ON priority_alerts(priority_score DESC);

-- 3. Create notification summary view
CREATE OR REPLACE VIEW notification_summary AS
SELECT 
  recipient_type,
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_count,
  COUNT(CASE WHEN notification_type = 'priority_assigned' THEN 1 END) as priority_notifications,
  COUNT(CASE WHEN notification_type = 'high_value_detected' THEN 1 END) as high_value_notifications,
  COUNT(CASE WHEN notification_type = 'vip_customer' THEN 1 END) as vip_notifications,
  COUNT(CASE WHEN notification_type = 'express_shipping' THEN 1 END) as express_notifications,
  MAX(created_at) as latest_notification
FROM order_notifications
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY recipient_type;

-- 4. Create alert summary view
CREATE OR REPLACE VIEW alert_summary AS
SELECT 
  alert_type,
  COUNT(*) as total_alerts,
  COUNT(CASE WHEN is_acknowledged = FALSE THEN 1 END) as active_alerts,
  AVG(priority_score) as avg_priority_score,
  MAX(priority_score) as max_priority_score,
  MAX(created_at) as latest_alert
FROM priority_alerts
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY alert_type;

-- 5. Create function to automatically create notifications on order changes
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

-- 6. Create trigger for automatic notification creation
DROP TRIGGER IF EXISTS order_notifications_trigger ON orders;
CREATE TRIGGER order_notifications_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_order_notifications();

-- 7. Create function to automatically create priority alerts
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

-- 8. Create trigger for automatic alert creation (only on INSERT to avoid duplicates)
DROP TRIGGER IF EXISTS priority_alerts_trigger ON orders;
CREATE TRIGGER priority_alerts_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_priority_alerts();

-- 9. Create function to mark notifications as read
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

-- 10. Create function to acknowledge alerts
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

-- 11. Create function to cleanup old notifications and alerts
CREATE OR REPLACE FUNCTION cleanup_old_notifications_and_alerts()
RETURNS TABLE (
  deleted_notifications INTEGER,
  deleted_alerts INTEGER
) AS $$
DECLARE
  notification_count INTEGER;
  alert_count INTEGER;
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM order_notifications
  WHERE is_read = TRUE 
    AND created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS notification_count = ROW_COUNT;
  
  -- Delete acknowledged alerts older than 30 days
  DELETE FROM priority_alerts
  WHERE is_acknowledged = TRUE 
    AND created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS alert_count = ROW_COUNT;
  
  deleted_notifications := notification_count;
  deleted_alerts := alert_count;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 12. Create comprehensive dashboard view for notifications and alerts
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

-- 13. Enable RLS for new tables
ALTER TABLE order_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view notifications" ON order_notifications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update notifications" ON order_notifications
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view alerts" ON priority_alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update alerts" ON priority_alerts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 14. Create indexes for better performance on new tables
CREATE INDEX IF NOT EXISTS idx_order_notifications_composite ON order_notifications(recipient_type, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_priority_alerts_composite ON priority_alerts(is_acknowledged, alert_type, created_at DESC);

-- 15. Schedule automatic cleanup (if pg_cron is available)
-- This will run daily at 2 AM to clean up old notifications and alerts
/*
SELECT cron.schedule(
  'cleanup-notifications-alerts',
  '0 2 * * *', -- Daily at 2 AM
  $$SELECT cleanup_old_notifications_and_alerts();$$
);
*/