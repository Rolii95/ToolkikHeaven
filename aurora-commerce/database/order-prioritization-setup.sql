-- Order Prioritization Engine Database Schema
-- This file contains the complete database setup for order management and prioritization
-- 
-- PREREQUISITES: Run base-schema-setup.sql first to create the products table and other dependencies
-- 
-- INSTALLATION ORDER:
-- 1. base-schema-setup.sql (creates products, categories, cart tables)
-- 2. order-prioritization-setup.sql (this file)
-- 3. order-notifications-setup.sql (notifications and alerts)
-- 4. inventory-alerts-setup.sql (optional, for inventory management)
-- 5. webhook-alert-config.sql (optional, for webhook notifications)

-- 1. Create customers table for tracking customer history
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  average_order_value DECIMAL(10,2) DEFAULT 0.00,
  loyalty_tier VARCHAR(20) DEFAULT 'bronze', -- bronze, silver, gold, platinum
  first_order_date TIMESTAMP WITH TIME ZONE,
  last_order_date TIMESTAMP WITH TIME ZONE,
  preferred_shipping VARCHAR(50) DEFAULT 'standard',
  is_vip BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_tier ON customers(loyalty_tier);
CREATE INDEX IF NOT EXISTS idx_customers_is_vip ON customers(is_vip);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON customers(total_spent);

-- 2. Create orders table with comprehensive priority and tracking fields
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_email VARCHAR(255),
  
  -- Order Details
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
  total_amount DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  shipping_amount DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Priority and Fulfillment
  priority_level INTEGER DEFAULT 3, -- 1=highest, 2=high, 3=normal, 4=low, 5=lowest
  priority_score DECIMAL(5,2) DEFAULT 0.00, -- Calculated priority score
  auto_priority_assigned BOOLEAN DEFAULT FALSE,
  manual_priority_override BOOLEAN DEFAULT FALSE,
  fulfillment_priority VARCHAR(20) DEFAULT 'normal', -- urgent, high, normal, low
  
  -- Shipping Information
  shipping_method VARCHAR(50) DEFAULT 'standard', -- express, overnight, standard, pickup
  is_express_shipping BOOLEAN DEFAULT FALSE,
  estimated_ship_date DATE,
  actual_ship_date DATE,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  tracking_number VARCHAR(100),
  
  -- Customer Classification
  is_repeat_customer BOOLEAN DEFAULT FALSE,
  customer_order_count INTEGER DEFAULT 1,
  is_high_value BOOLEAN DEFAULT FALSE, -- Orders over $500
  is_vip_customer BOOLEAN DEFAULT FALSE,
  
  -- Tags and Notes
  priority_tags TEXT[], -- Array of priority tags
  order_tags TEXT[], -- General order tags
  fulfillment_notes TEXT,
  internal_notes TEXT,
  
  -- Address Information
  billing_address JSONB,
  shipping_address JSONB,
  
  -- Timestamps
  placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comprehensive indexes for the orders table
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_priority_level ON orders(priority_level);
CREATE INDEX IF NOT EXISTS idx_orders_priority_score ON orders(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_orders_total_amount ON orders(total_amount);
CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON orders(placed_at);
CREATE INDEX IF NOT EXISTS idx_orders_is_high_value ON orders(is_high_value);
CREATE INDEX IF NOT EXISTS idx_orders_is_repeat_customer ON orders(is_repeat_customer);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_method ON orders(shipping_method);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_priority ON orders(fulfillment_priority);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- GIN indexes for array fields
CREATE INDEX IF NOT EXISTS idx_orders_priority_tags ON orders USING GIN(priority_tags);
CREATE INDEX IF NOT EXISTS idx_orders_order_tags ON orders USING GIN(order_tags);

-- 3. Create order_items table for line items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID, -- References products(id) but no foreign key constraint to avoid dependency issues
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  product_category VARCHAR(100),
  is_digital BOOLEAN DEFAULT FALSE,
  requires_special_handling BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_sku ON order_items(product_sku);

-- 4. Create order_priority_rules table for configurable business rules
CREATE TABLE IF NOT EXISTS order_priority_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- order_value, shipping_method, customer_tier, product_category, custom
  condition_field VARCHAR(100) NOT NULL,
  condition_operator VARCHAR(20) NOT NULL, -- >=, >, <=, <, =, IN, LIKE
  condition_value TEXT NOT NULL,
  priority_adjustment INTEGER NOT NULL, -- Positive = higher priority, negative = lower
  is_active BOOLEAN DEFAULT TRUE,
  rule_order INTEGER DEFAULT 1, -- Order of rule execution
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add default priority rules
INSERT INTO order_priority_rules (rule_name, rule_type, condition_field, condition_operator, condition_value, priority_adjustment, description)
VALUES 
  ('High Value Orders', 'order_value', 'total_amount', '>=', '500.00', -2, 'Orders over $500 get higher priority'),
  ('Express Shipping', 'shipping_method', 'shipping_method', 'IN', 'express,overnight', -3, 'Express shipping orders get highest priority'),
  ('VIP Customers', 'customer_tier', 'is_vip_customer', '=', 'true', -2, 'VIP customers get priority treatment'),
  ('Repeat Customers', 'customer_tier', 'is_repeat_customer', '=', 'true', -1, 'Repeat customers get slight priority boost'),
  ('Digital Products', 'product_category', 'has_digital_items', '=', 'true', 1, 'Digital-only orders can have lower priority'),
  ('Large Orders', 'order_value', 'total_amount', '>=', '1000.00', -3, 'Orders over $1000 get highest priority')
ON CONFLICT DO NOTHING;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_order_priority_rules_is_active ON order_priority_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_order_priority_rules_rule_order ON order_priority_rules(rule_order);

-- 5. Create order_status_history table for tracking status changes
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by VARCHAR(100), -- user email or 'system'
  change_reason TEXT,
  priority_before INTEGER,
  priority_after INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at);

-- 6. Create function to calculate order priority score
CREATE OR REPLACE FUNCTION calculate_order_priority_score(order_row orders)
RETURNS DECIMAL AS $$
DECLARE
  base_score DECIMAL := 50.00; -- Base priority score
  final_score DECIMAL;
  rule_record order_priority_rules%ROWTYPE;
  adjustment INTEGER;
BEGIN
  final_score := base_score;
  
  -- Apply all active priority rules
  FOR rule_record IN 
    SELECT * FROM order_priority_rules 
    WHERE is_active = TRUE 
    ORDER BY rule_order ASC
  LOOP
    adjustment := 0;
    
    -- Check order value rules
    IF rule_record.rule_type = 'order_value' AND rule_record.condition_field = 'total_amount' THEN
      IF rule_record.condition_operator = '>=' AND order_row.total_amount >= rule_record.condition_value::DECIMAL THEN
        adjustment := rule_record.priority_adjustment;
      ELSIF rule_record.condition_operator = '>' AND order_row.total_amount > rule_record.condition_value::DECIMAL THEN
        adjustment := rule_record.priority_adjustment;
      END IF;
    END IF;
    
    -- Check shipping method rules
    IF rule_record.rule_type = 'shipping_method' AND rule_record.condition_field = 'shipping_method' THEN
      IF rule_record.condition_operator = 'IN' AND order_row.shipping_method = ANY(string_to_array(rule_record.condition_value, ',')) THEN
        adjustment := rule_record.priority_adjustment;
      ELSIF rule_record.condition_operator = '=' AND order_row.shipping_method = rule_record.condition_value THEN
        adjustment := rule_record.priority_adjustment;
      END IF;
    END IF;
    
    -- Check customer tier rules
    IF rule_record.rule_type = 'customer_tier' THEN
      IF rule_record.condition_field = 'is_vip_customer' AND rule_record.condition_value = 'true' AND order_row.is_vip_customer THEN
        adjustment := rule_record.priority_adjustment;
      ELSIF rule_record.condition_field = 'is_repeat_customer' AND rule_record.condition_value = 'true' AND order_row.is_repeat_customer THEN
        adjustment := rule_record.priority_adjustment;
      END IF;
    END IF;
    
    -- Apply the adjustment
    final_score := final_score + adjustment;
  END LOOP;
  
  -- Ensure score is within reasonable bounds
  final_score := GREATEST(1.00, LEAST(100.00, final_score));
  
  RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to assign priority level based on score
CREATE OR REPLACE FUNCTION assign_priority_level(priority_score DECIMAL)
RETURNS INTEGER AS $$
BEGIN
  IF priority_score >= 80 THEN RETURN 1; -- Highest priority
  ELSIF priority_score >= 65 THEN RETURN 2; -- High priority
  ELSIF priority_score >= 35 THEN RETURN 3; -- Normal priority
  ELSIF priority_score >= 20 THEN RETURN 4; -- Low priority
  ELSE RETURN 5; -- Lowest priority
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to update order priority automatically
CREATE OR REPLACE FUNCTION update_order_priority()
RETURNS TRIGGER AS $$
DECLARE
  customer_record customers%ROWTYPE;
  new_priority_score DECIMAL;
  new_priority_level INTEGER;
  priority_tags_array TEXT[] := ARRAY[]::TEXT[];
  fulfillment_priority_value VARCHAR(20) := 'normal';
BEGIN
  -- Get customer information if customer_id exists
  IF NEW.customer_id IS NOT NULL THEN
    SELECT * INTO customer_record FROM customers WHERE id = NEW.customer_id;
    
    IF FOUND THEN
      NEW.is_vip_customer := customer_record.is_vip;
      NEW.is_repeat_customer := customer_record.total_orders > 1;
      NEW.customer_order_count := customer_record.total_orders;
    END IF;
  END IF;
  
  -- Determine if high value order
  NEW.is_high_value := NEW.total_amount >= 500.00;
  
  -- Determine if express shipping
  NEW.is_express_shipping := NEW.shipping_method IN ('express', 'overnight', 'next_day');
  
  -- Calculate priority score
  new_priority_score := calculate_order_priority_score(NEW);
  NEW.priority_score := new_priority_score;
  
  -- Assign priority level
  new_priority_level := assign_priority_level(new_priority_score);
  
  -- Only update priority level if not manually overridden
  IF NOT NEW.manual_priority_override THEN
    NEW.priority_level := new_priority_level;
    NEW.auto_priority_assigned := TRUE;
  END IF;
  
  -- Build priority tags array
  IF NEW.is_high_value THEN
    priority_tags_array := array_append(priority_tags_array, 'high_value');
  END IF;
  
  IF NEW.is_express_shipping THEN
    priority_tags_array := array_append(priority_tags_array, 'express_shipping');
  END IF;
  
  IF NEW.is_vip_customer THEN
    priority_tags_array := array_append(priority_tags_array, 'vip_customer');
  END IF;
  
  IF NEW.is_repeat_customer THEN
    priority_tags_array := array_append(priority_tags_array, 'repeat_customer');
  END IF;
  
  IF NEW.total_amount >= 1000.00 THEN
    priority_tags_array := array_append(priority_tags_array, 'large_order');
  END IF;
  
  -- Set fulfillment priority based on priority level
  CASE NEW.priority_level
    WHEN 1 THEN fulfillment_priority_value := 'urgent';
    WHEN 2 THEN fulfillment_priority_value := 'high';
    WHEN 3 THEN fulfillment_priority_value := 'normal';
    WHEN 4, 5 THEN fulfillment_priority_value := 'low';
  END CASE;
  
  NEW.priority_tags := priority_tags_array;
  NEW.fulfillment_priority := fulfillment_priority_value;
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create triggers for automatic priority assignment
DROP TRIGGER IF EXISTS order_priority_trigger ON orders;
CREATE TRIGGER order_priority_trigger
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_priority();

-- 10. Create function to update customer statistics
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
DECLARE
  customer_stats RECORD;
BEGIN
  -- Only update if customer_id exists
  IF NEW.customer_id IS NOT NULL THEN
    -- Calculate customer statistics
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(total_amount), 0) as total_spent,
      COALESCE(AVG(total_amount), 0) as average_order_value,
      MIN(placed_at) as first_order_date,
      MAX(placed_at) as last_order_date
    INTO customer_stats
    FROM orders 
    WHERE customer_id = NEW.customer_id 
      AND status NOT IN ('cancelled');
    
    -- Determine loyalty tier based on total spent
    DECLARE
      loyalty_tier_value VARCHAR(20) := 'bronze';
    BEGIN
      IF customer_stats.total_spent >= 5000 THEN
        loyalty_tier_value := 'platinum';
      ELSIF customer_stats.total_spent >= 2000 THEN
        loyalty_tier_value := 'gold';
      ELSIF customer_stats.total_spent >= 500 THEN
        loyalty_tier_value := 'silver';
      END IF;
      
      -- Update customer record
      UPDATE customers 
      SET 
        total_orders = customer_stats.total_orders,
        total_spent = customer_stats.total_spent,
        average_order_value = customer_stats.average_order_value,
        loyalty_tier = loyalty_tier_value,
        first_order_date = customer_stats.first_order_date,
        last_order_date = customer_stats.last_order_date,
        is_vip = (customer_stats.total_spent >= 2000 OR customer_stats.total_orders >= 10),
        updated_at = NOW()
      WHERE id = NEW.customer_id;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for customer stats update
DROP TRIGGER IF EXISTS customer_stats_trigger ON orders;
CREATE TRIGGER customer_stats_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

-- 11. Create useful views for the admin dashboard

-- High priority orders view
CREATE OR REPLACE VIEW high_priority_orders AS
SELECT 
  o.*,
  c.first_name,
  c.last_name,
  c.loyalty_tier,
  CASE o.priority_level
    WHEN 1 THEN 'URGENT'
    WHEN 2 THEN 'HIGH'
    WHEN 3 THEN 'NORMAL'
    WHEN 4 THEN 'LOW'
    WHEN 5 THEN 'LOWEST'
  END as priority_label,
  EXTRACT(EPOCH FROM (NOW() - o.placed_at))/3600 as hours_since_placed
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.priority_level <= 2
  AND o.status NOT IN ('delivered', 'cancelled')
ORDER BY o.priority_level ASC, o.priority_score DESC, o.placed_at ASC;

-- Orders dashboard summary view
CREATE OR REPLACE VIEW orders_dashboard_summary AS
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
  COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
  COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
  COUNT(CASE WHEN priority_level = 1 THEN 1 END) as urgent_orders,
  COUNT(CASE WHEN priority_level = 2 THEN 1 END) as high_priority_orders,
  COUNT(CASE WHEN is_high_value = TRUE THEN 1 END) as high_value_orders,
  COUNT(CASE WHEN is_express_shipping = TRUE THEN 1 END) as express_orders,
  COUNT(CASE WHEN is_vip_customer = TRUE THEN 1 END) as vip_orders,
  COALESCE(SUM(total_amount), 0) as total_order_value,
  COALESCE(AVG(total_amount), 0) as average_order_value
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- 12. Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_priority_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can manage customers" ON customers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage orders" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage order items" ON order_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view priority rules" ON order_priority_rules
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view status history" ON order_status_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- 13. Insert sample data for testing
INSERT INTO customers (email, first_name, last_name, total_orders, total_spent, is_vip)
VALUES 
  ('john.doe@example.com', 'John', 'Doe', 5, 2500.00, TRUE),
  ('jane.smith@example.com', 'Jane', 'Smith', 2, 350.00, FALSE),
  ('bob.wilson@example.com', 'Bob', 'Wilson', 12, 5200.00, TRUE),
  ('alice.brown@example.com', 'Alice', 'Brown', 1, 75.00, FALSE)
ON CONFLICT (email) DO NOTHING;