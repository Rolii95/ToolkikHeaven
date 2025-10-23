-- Master Aurora Commerce Database Setup
-- This file executes all schema files in the correct order
-- Run this file to set up the complete Aurora Commerce database

-- Step 1: Base schema with products, categories, and cart functionality
\i database/base-schema-setup.sql

-- Step 2: Order prioritization engine with customer management and priority calculation
\i database/order-prioritization-setup.sql

-- Step 3: Order notifications and priority alerts
\i database/order-notifications-setup.sql

-- Step 4: Inventory management and stock alerts (optional)
\i database/inventory-alerts-setup.sql

-- Step 5: Webhook configurations for external notifications (optional)
\i database/webhook-alert-config.sql

-- Verification queries to check installation
SELECT 'Database setup completed successfully!' as status;

-- Check table counts
SELECT 
  'products' as table_name, 
  COUNT(*) as record_count 
FROM products
UNION ALL
SELECT 
  'customers' as table_name, 
  COUNT(*) as record_count 
FROM customers
UNION ALL
SELECT 
  'orders' as table_name, 
  COUNT(*) as record_count 
FROM orders
UNION ALL
SELECT 
  'order_priority_rules' as table_name, 
  COUNT(*) as record_count 
FROM order_priority_rules;

-- Show available functions
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%order%' 
  OR routine_name LIKE '%priority%'
  OR routine_name LIKE '%customer%'
ORDER BY routine_name;

-- Show available views
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'VIEW'
  AND table_name LIKE '%order%'
ORDER BY table_name;