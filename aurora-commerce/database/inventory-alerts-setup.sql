-- Inventory Threshold Alerts Database Schema
-- This file contains the database setup for inventory monitoring

-- 1. Create inventory_alerts table to track alert history
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  alert_type VARCHAR(50) NOT NULL DEFAULT 'low_stock',
  threshold_value INTEGER NOT NULL,
  current_stock INTEGER NOT NULL,
  alert_message TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified_at TIMESTAMP WITH TIME ZONE,
  notification_status VARCHAR(20) DEFAULT 'pending' -- pending, sent, failed
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_created_at ON inventory_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_is_resolved ON inventory_alerts(is_resolved);

-- 2. Create inventory_thresholds table for configurable thresholds
CREATE TABLE IF NOT EXISTS inventory_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  category VARCHAR(100),
  low_stock_threshold INTEGER NOT NULL DEFAULT 15,
  critical_stock_threshold INTEGER NOT NULL DEFAULT 5,
  out_of_stock_threshold INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id),
  UNIQUE(category)
);

-- Add default thresholds for common categories
INSERT INTO inventory_thresholds (category, low_stock_threshold, critical_stock_threshold, out_of_stock_threshold)
VALUES 
  ('Electronics', 20, 5, 0),
  ('Clothing', 25, 10, 0),
  ('Furniture', 10, 3, 0),
  ('Wearables', 15, 5, 0),
  ('Photography', 8, 2, 0)
ON CONFLICT (category) DO NOTHING;

-- 3. Create function to check stock thresholds
CREATE OR REPLACE FUNCTION check_inventory_threshold()
RETURNS TRIGGER AS $$
DECLARE
  threshold_record inventory_thresholds%ROWTYPE;
  alert_message TEXT;
  alert_type VARCHAR(50);
BEGIN
  -- Get threshold settings for this product or category
  SELECT * INTO threshold_record
  FROM inventory_thresholds 
  WHERE (product_id = NEW.id OR category = NEW.category)
    AND is_active = TRUE
  ORDER BY product_id IS NOT NULL DESC -- Prefer product-specific over category
  LIMIT 1;

  -- If no threshold found, use default
  IF NOT FOUND THEN
    threshold_record.low_stock_threshold := 15;
    threshold_record.critical_stock_threshold := 5;
    threshold_record.out_of_stock_threshold := 0;
  END IF;

  -- Determine alert type and message based on stock level
  IF NEW.stock <= threshold_record.out_of_stock_threshold THEN
    alert_type := 'out_of_stock';
    alert_message := format('URGENT: Product "%s" is OUT OF STOCK! Current stock: %s units. Immediate restock required.', 
                           NEW.name, NEW.stock);
  ELSIF NEW.stock <= threshold_record.critical_stock_threshold THEN
    alert_type := 'critical_stock';
    alert_message := format('CRITICAL: Product "%s" has critically low stock! Current stock: %s units (threshold: %s). Urgent restock needed.', 
                           NEW.name, NEW.stock, threshold_record.critical_stock_threshold);
  ELSIF NEW.stock <= threshold_record.low_stock_threshold THEN
    alert_type := 'low_stock';
    alert_message := format('WARNING: Product "%s" is running low on stock. Current stock: %s units (threshold: %s). Please consider restocking.', 
                           NEW.name, NEW.stock, threshold_record.low_stock_threshold);
  END IF;

  -- Create alert if threshold is breached and no recent unresolved alert exists
  IF alert_type IS NOT NULL THEN
    -- Check if there's already an unresolved alert for this product
    IF NOT EXISTS (
      SELECT 1 FROM inventory_alerts 
      WHERE product_id = NEW.id 
        AND alert_type = check_inventory_threshold.alert_type
        AND is_resolved = FALSE
        AND created_at > NOW() - INTERVAL '24 hours' -- Prevent spam alerts
    ) THEN
      INSERT INTO inventory_alerts (
        product_id, 
        alert_type, 
        threshold_value, 
        current_stock, 
        alert_message
      ) VALUES (
        NEW.id, 
        alert_type, 
        CASE 
          WHEN alert_type = 'out_of_stock' THEN threshold_record.out_of_stock_threshold
          WHEN alert_type = 'critical_stock' THEN threshold_record.critical_stock_threshold
          ELSE threshold_record.low_stock_threshold
        END, 
        NEW.stock, 
        alert_message
      );
    END IF;
  ELSE
    -- Resolve any existing alerts if stock is now above thresholds
    UPDATE inventory_alerts 
    SET is_resolved = TRUE, resolved_at = NOW()
    WHERE product_id = NEW.id 
      AND is_resolved = FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger on products table
DROP TRIGGER IF EXISTS inventory_threshold_trigger ON products;
CREATE TRIGGER inventory_threshold_trigger
  AFTER UPDATE OF stock ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_inventory_threshold();

-- 5. Create function to get pending alerts (for webhook notifications)
CREATE OR REPLACE FUNCTION get_pending_inventory_alerts()
RETURNS TABLE (
  alert_id UUID,
  product_id UUID,
  product_name VARCHAR,
  category VARCHAR,
  alert_type VARCHAR,
  current_stock INTEGER,
  threshold_value INTEGER,
  alert_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ia.id as alert_id,
    ia.product_id,
    p.name as product_name,
    p.category,
    ia.alert_type,
    ia.current_stock,
    ia.threshold_value,
    ia.alert_message,
    ia.created_at
  FROM inventory_alerts ia
  JOIN products p ON ia.product_id = p.id
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

-- 6. Create function to mark alerts as notified
CREATE OR REPLACE FUNCTION mark_alerts_as_notified(alert_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE inventory_alerts 
  SET notification_status = 'sent', notified_at = NOW()
  WHERE id = ANY(alert_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Enable Row Level Security (optional, for multi-tenant setup)
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_thresholds ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view inventory alerts" ON inventory_alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view inventory thresholds" ON inventory_thresholds
  FOR SELECT USING (auth.role() = 'authenticated');

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_notification_status ON inventory_alerts(notification_status);

-- 9. Add useful views for reporting
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
  p.id,
  p.name,
  p.category,
  p.stock,
  p.price,
  COALESCE(pt.low_stock_threshold, ct.low_stock_threshold, 15) as threshold,
  CASE 
    WHEN p.stock <= COALESCE(pt.out_of_stock_threshold, ct.out_of_stock_threshold, 0) THEN 'OUT_OF_STOCK'
    WHEN p.stock <= COALESCE(pt.critical_stock_threshold, ct.critical_stock_threshold, 5) THEN 'CRITICAL'
    WHEN p.stock <= COALESCE(pt.low_stock_threshold, ct.low_stock_threshold, 15) THEN 'LOW'
    ELSE 'NORMAL'
  END as stock_status
FROM products p
LEFT JOIN inventory_thresholds pt ON pt.product_id = p.id AND pt.is_active = TRUE
LEFT JOIN inventory_thresholds ct ON ct.category = p.category AND ct.is_active = TRUE AND pt.id IS NULL
WHERE p.stock <= COALESCE(pt.low_stock_threshold, ct.low_stock_threshold, 15)
ORDER BY 
  CASE 
    WHEN p.stock <= COALESCE(pt.out_of_stock_threshold, ct.out_of_stock_threshold, 0) THEN 1
    WHEN p.stock <= COALESCE(pt.critical_stock_threshold, ct.critical_stock_threshold, 5) THEN 2
    WHEN p.stock <= COALESCE(pt.low_stock_threshold, ct.low_stock_threshold, 15) THEN 3
  END,
  p.stock ASC;