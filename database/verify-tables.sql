-- Supabase Tables Verification Script
-- Run this to check if all required tables exist in your Aurora Commerce database

-- Check for Core E-commerce Tables
SELECT 'products' as table_name, COUNT(*) as exists 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'products'
UNION ALL
SELECT 'orders', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'orders'
UNION ALL
SELECT 'order_items', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'order_items'
UNION ALL
SELECT 'carts', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'carts'
UNION ALL

-- Check for Reviews and Ratings
SELECT 'product_reviews', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'product_reviews'
UNION ALL
SELECT 'reviews', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'reviews'
UNION ALL

-- Check for Analytics Tables
SELECT 'events', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'events'
UNION ALL
SELECT 'analytics_events', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'analytics_events'
UNION ALL
SELECT 'customer_analytics', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'customer_analytics'
UNION ALL
SELECT 'daily_analytics', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'daily_analytics'
UNION ALL
SELECT 'product_analytics', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'product_analytics'
UNION ALL

-- Check for Email Marketing Tables
SELECT 'abandoned_carts', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'abandoned_carts'
UNION ALL
SELECT 'email_templates', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'email_templates'
UNION ALL
SELECT 'email_sends', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'email_sends'
UNION ALL
SELECT 'email_campaigns', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'email_campaigns'
UNION ALL

-- Check for Notification Tables
SELECT 'order_notifications', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'order_notifications'
UNION ALL
SELECT 'priority_alerts', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'priority_alerts'
UNION ALL

-- Check for Chat Support Tables
SELECT 'chat_sessions', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'chat_sessions'
UNION ALL
SELECT 'chat_messages', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'chat_messages'
UNION ALL
SELECT 'contact_submissions', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'contact_submissions'
UNION ALL
SELECT 'business_hours_config', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'business_hours_config'
UNION ALL
SELECT 'chat_agent_availability', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'chat_agent_availability'
UNION ALL

-- Check for User Management Tables
-- Note: 'users' table is in auth schema, not public schema
SELECT 'users_auth_schema', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'auth' AND table_name = 'users'
UNION ALL
SELECT 'user_profiles', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_profiles'

ORDER BY table_name;

-- Additional query to show summary
SELECT 
  'Total Core Tables Required' as metric,
  23 as expected_count, -- 24 minus auth.users which is managed by Supabase
  (SELECT COUNT(DISTINCT table_name) 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'products', 'orders', 'order_items', 'carts', 'product_reviews', 'reviews',
     'events', 'analytics_events', 'customer_analytics', 'daily_analytics', 'product_analytics',
     'abandoned_carts', 'email_templates', 'email_sends', 'email_campaigns',
     'order_notifications', 'priority_alerts',
     'chat_sessions', 'chat_messages', 'contact_submissions', 'business_hours_config', 'chat_agent_availability',
     'user_profiles'
   )) as actual_count;

-- Show which tables are missing
SELECT 'Missing Tables:' as status;
SELECT 
  required_table as missing_table
FROM (
  VALUES 
    ('products'), ('orders'), ('order_items'), ('carts'), 
    ('product_reviews'), ('reviews'),
    ('events'), ('analytics_events'), ('customer_analytics'), ('daily_analytics'), ('product_analytics'),
    ('abandoned_carts'), ('email_templates'), ('email_sends'), ('email_campaigns'),
    ('order_notifications'), ('priority_alerts'),
    ('chat_sessions'), ('chat_messages'), ('contact_submissions'), ('business_hours_config'), ('chat_agent_availability'),
    ('user_profiles')
) AS required_tables(required_table)
WHERE required_table NOT IN (
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
);

-- Show existing tables count
SELECT 
  'Existing Tables Count' as metric,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
  'products', 'orders', 'order_items', 'carts', 'product_reviews', 'reviews',
  'events', 'analytics_events', 'customer_analytics', 'daily_analytics', 'product_analytics',
  'abandoned_carts', 'email_templates', 'email_sends', 'email_campaigns',
  'order_notifications', 'priority_alerts',
  'chat_sessions', 'chat_messages', 'contact_submissions', 'business_hours_config', 'chat_agent_availability',
  'user_profiles'
);