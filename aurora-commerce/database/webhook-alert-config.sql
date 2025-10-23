-- Additional schema for webhook configurations and alert logs
-- Run this after the main inventory-alerts-setup.sql

-- 1. Create webhook_configs table
CREATE TABLE IF NOT EXISTS webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  webhook_type VARCHAR(50) NOT NULL DEFAULT 'custom', -- zapier, buildship, slack, discord, email, custom
  auth_header TEXT, -- Authorization header if needed
  custom_headers JSONB, -- Additional headers as JSON
  retry_attempts INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_webhook_configs_is_active ON webhook_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_webhook_type ON webhook_configs(webhook_type);

-- 2. Create inventory_alert_logs table for tracking notifications
CREATE TABLE IF NOT EXISTS inventory_alert_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  alerts_found INTEGER NOT NULL DEFAULT 0,
  alerts_summary JSONB, -- { out_of_stock: 0, critical_stock: 1, low_stock: 2 }
  webhook_results JSONB, -- Array of webhook results
  notification_sent BOOLEAN DEFAULT FALSE,
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_alert_logs_check_timestamp ON inventory_alert_logs(check_timestamp);
CREATE INDEX IF NOT EXISTS idx_inventory_alert_logs_notification_sent ON inventory_alert_logs(notification_sent);

-- 3. Create alert_notification_history table for tracking individual notifications
CREATE TABLE IF NOT EXISTS alert_notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES inventory_alerts(id),
  webhook_id UUID REFERENCES webhook_configs(id),
  notification_status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, retrying
  attempt_count INTEGER DEFAULT 1,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_alert_notification_history_alert_id ON alert_notification_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_notification_history_webhook_id ON alert_notification_history(webhook_id);
CREATE INDEX IF NOT EXISTS idx_alert_notification_history_status ON alert_notification_history(notification_status);

-- 4. Create enhanced function to get comprehensive alert data
CREATE OR REPLACE FUNCTION get_comprehensive_inventory_alerts()
RETURNS TABLE (
  alert_id UUID,
  product_id UUID,
  product_name VARCHAR,
  category VARCHAR,
  sku VARCHAR,
  alert_type VARCHAR,
  current_stock INTEGER,
  threshold_value INTEGER,
  alert_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  product_price DECIMAL,
  product_image_url TEXT,
  notification_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ia.id as alert_id,
    ia.product_id,
    p.name as product_name,
    p.category,
    p.sku,
    ia.alert_type,
    ia.current_stock,
    ia.threshold_value,
    ia.alert_message,
    ia.created_at,
    p.price as product_price,
    p.image_url as product_image_url,
    COALESCE(nh.notification_count, 0) as notification_count
  FROM inventory_alerts ia
  JOIN products p ON ia.product_id = p.id
  LEFT JOIN (
    SELECT 
      alert_id, 
      COUNT(*) as notification_count
    FROM alert_notification_history
    GROUP BY alert_id
  ) nh ON ia.id = nh.alert_id
  WHERE ia.notification_status = 'pending'
    AND ia.is_resolved = FALSE
  ORDER BY 
    CASE ia.alert_type
      WHEN 'out_of_stock' THEN 1
      WHEN 'critical_stock' THEN 2
      WHEN 'low_stock' THEN 3
    END,
    ia.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to update notification history
CREATE OR REPLACE FUNCTION record_notification_attempt(
  p_alert_id UUID,
  p_webhook_id UUID,
  p_status VARCHAR,
  p_response_status INTEGER DEFAULT NULL,
  p_response_body TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  history_id UUID;
  attempt_number INTEGER;
BEGIN
  -- Get current attempt count
  SELECT COALESCE(MAX(attempt_count), 0) + 1
  INTO attempt_number
  FROM alert_notification_history
  WHERE alert_id = p_alert_id AND webhook_id = p_webhook_id;

  -- Insert notification history record
  INSERT INTO alert_notification_history (
    alert_id,
    webhook_id,
    notification_status,
    attempt_count,
    response_status,
    response_body,
    error_message,
    sent_at
  ) VALUES (
    p_alert_id,
    p_webhook_id,
    p_status,
    attempt_number,
    p_response_status,
    p_response_body,
    p_error_message,
    CASE WHEN p_status = 'sent' THEN NOW() ELSE NULL END
  )
  RETURNING id INTO history_id;

  -- Update main alert if notification was successful
  IF p_status = 'sent' THEN
    UPDATE inventory_alerts
    SET 
      notification_status = 'sent',
      notified_at = NOW()
    WHERE id = p_alert_id;
  END IF;

  RETURN history_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to get webhook statistics
CREATE OR REPLACE FUNCTION get_webhook_statistics(p_webhook_id UUID DEFAULT NULL)
RETURNS TABLE (
  webhook_id UUID,
  webhook_name VARCHAR,
  total_notifications INTEGER,
  successful_notifications INTEGER,
  failed_notifications INTEGER,
  success_rate DECIMAL,
  avg_response_time_ms DECIMAL,
  last_notification_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wc.id as webhook_id,
    wc.name as webhook_name,
    COALESCE(stats.total_notifications, 0) as total_notifications,
    COALESCE(stats.successful_notifications, 0) as successful_notifications,
    COALESCE(stats.failed_notifications, 0) as failed_notifications,
    CASE 
      WHEN COALESCE(stats.total_notifications, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(stats.successful_notifications, 0)::DECIMAL / stats.total_notifications::DECIMAL) * 100, 2)
    END as success_rate,
    COALESCE(stats.avg_response_time_ms, 0) as avg_response_time_ms,
    stats.last_notification_at
  FROM webhook_configs wc
  LEFT JOIN (
    SELECT 
      anh.webhook_id,
      COUNT(*) as total_notifications,
      COUNT(CASE WHEN anh.notification_status = 'sent' THEN 1 END) as successful_notifications,
      COUNT(CASE WHEN anh.notification_status = 'failed' THEN 1 END) as failed_notifications,
      AVG(EXTRACT(EPOCH FROM (anh.created_at - ia.created_at)) * 1000) as avg_response_time_ms,
      MAX(anh.sent_at) as last_notification_at
    FROM alert_notification_history anh
    JOIN inventory_alerts ia ON anh.alert_id = ia.id
    WHERE anh.created_at >= NOW() - INTERVAL '30 days' -- Last 30 days
    GROUP BY anh.webhook_id
  ) stats ON wc.id = stats.webhook_id
  WHERE (p_webhook_id IS NULL OR wc.id = p_webhook_id)
    AND wc.is_active = TRUE
  ORDER BY wc.name;
END;
$$ LANGUAGE plpgsql;

-- 7. Create automated cleanup function for old logs
CREATE OR REPLACE FUNCTION cleanup_old_inventory_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete logs older than 90 days
  DELETE FROM inventory_alert_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete notification history older than 90 days
  DELETE FROM alert_notification_history
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Create view for dashboard summary
CREATE OR REPLACE VIEW inventory_dashboard_summary AS
SELECT 
  -- Current alert counts
  COUNT(CASE WHEN ia.alert_type = 'out_of_stock' THEN 1 END) as out_of_stock_count,
  COUNT(CASE WHEN ia.alert_type = 'critical_stock' THEN 1 END) as critical_stock_count,
  COUNT(CASE WHEN ia.alert_type = 'low_stock' THEN 1 END) as low_stock_count,
  COUNT(*) as total_active_alerts,
  
  -- Product counts by stock status
  (SELECT COUNT(*) FROM low_stock_products WHERE stock_status = 'OUT_OF_STOCK') as products_out_of_stock,
  (SELECT COUNT(*) FROM low_stock_products WHERE stock_status = 'CRITICAL') as products_critical_stock,
  (SELECT COUNT(*) FROM low_stock_products WHERE stock_status = 'LOW') as products_low_stock,
  (SELECT COUNT(*) FROM low_stock_products) as total_low_stock_products,
  
  -- Notification statistics (last 24 hours)
  COUNT(CASE WHEN ia.notification_status = 'sent' AND ia.notified_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as notifications_sent_24h,
  COUNT(CASE WHEN ia.notification_status = 'pending' THEN 1 END) as pending_notifications,
  
  -- Webhook statistics
  (SELECT COUNT(*) FROM webhook_configs WHERE is_active = TRUE) as active_webhooks,
  
  -- Last check information
  (SELECT MAX(check_timestamp) FROM inventory_alert_logs) as last_inventory_check,
  (SELECT notification_sent FROM inventory_alert_logs ORDER BY check_timestamp DESC LIMIT 1) as last_check_success

FROM inventory_alerts ia
WHERE ia.is_resolved = FALSE;

-- 9. Insert some sample webhook configurations
INSERT INTO webhook_configs (name, url, webhook_type, retry_attempts, timeout_seconds, is_active)
VALUES 
  ('Zapier Inventory Alerts', 'https://hooks.zapier.com/hooks/catch/YOUR_HOOK_ID/', 'zapier', 3, 30, FALSE),
  ('BuildShip Workflow', 'https://api.buildship.app/trigger/YOUR_TRIGGER_ID', 'buildship', 2, 25, FALSE),
  ('Slack Notifications', 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK', 'slack', 3, 15, FALSE)
ON CONFLICT DO NOTHING;

-- 10. Enable RLS for new tables
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alert_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notification_history ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can manage webhook configs" ON webhook_configs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view alert logs" ON inventory_alert_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view notification history" ON alert_notification_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- 11. Create cron job function to run inventory checks (if pg_cron is available)
-- Note: This requires the pg_cron extension to be installed
/*
SELECT cron.schedule(
  'inventory-check-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT 
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/inventory-check',
      headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
*/