-- Missing Analytics Tables Setup for Aurora Commerce
-- Run this script in your Supabase SQL editor to create the missing analytics tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check for existing views/tables that might conflict
DO $$
BEGIN
    -- Check if customer_analytics exists as a view
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'customer_analytics') THEN
        RAISE NOTICE 'WARNING: customer_analytics already exists as a view. Will create customer_analytics_aggregated instead.';
    END IF;
    
    -- Check if daily_analytics exists as a view  
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'daily_analytics') THEN
        RAISE NOTICE 'WARNING: daily_analytics already exists as a view. Will create daily_analytics_aggregated instead.';
    END IF;
    
    -- Check if product_analytics exists as a view
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'product_analytics') THEN
        RAISE NOTICE 'WARNING: product_analytics already exists as a view. Will create product_analytics_aggregated instead.';
    END IF;
END $$;

-- 1. ANALYTICS_EVENTS TABLE (Alternative to events table)
-- This provides an alternative events structure if needed
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    event_category VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    customer_email VARCHAR(255),
    
    -- Event properties
    properties JSONB DEFAULT '{}'::jsonb,
    event_value DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Page/product context
    page_url TEXT,
    page_title VARCHAR(255),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    
    -- Technical details
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    -- Timestamps
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CUSTOMER_ANALYTICS_AGGREGATED TABLE
-- Store aggregated customer analytics data (renamed to avoid conflict with existing view)
CREATE TABLE IF NOT EXISTS public.customer_analytics_aggregated (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Time period for this analytics record
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Customer behavior metrics
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    total_products_purchased INTEGER DEFAULT 0,
    unique_products_purchased INTEGER DEFAULT 0,
    
    -- Engagement metrics
    website_visits INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    session_duration_minutes INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
    
    -- Channel attribution
    first_touch_channel VARCHAR(100),
    last_touch_channel VARCHAR(100),
    top_traffic_source VARCHAR(100),
    
    -- Product preferences
    top_category VARCHAR(100),
    top_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    
    -- Behavioral flags
    is_repeat_customer BOOLEAN DEFAULT false,
    days_since_last_order INTEGER,
    lifetime_value DECIMAL(10,2) DEFAULT 0,
    churn_risk_score DECIMAL(3,2) DEFAULT 0, -- 0.00 to 1.00
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for period tracking
    UNIQUE(customer_id, period_type, period_start)
);

-- 3. DAILY_ANALYTICS_AGGREGATED TABLE
-- Store daily aggregated site-wide analytics (renamed to avoid conflict with existing view)
CREATE TABLE IF NOT EXISTS public.daily_analytics_aggregated (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    analytics_date DATE NOT NULL UNIQUE,
    
    -- Revenue metrics
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    
    -- Traffic metrics
    unique_visitors INTEGER DEFAULT 0,
    total_page_views INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    average_session_duration INTEGER DEFAULT 0, -- in minutes
    bounce_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    
    -- Conversion metrics
    conversion_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    cart_abandonment_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    
    -- Product metrics
    products_sold INTEGER DEFAULT 0,
    top_selling_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    top_selling_category VARCHAR(100),
    
    -- Customer metrics
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    customer_retention_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    
    -- Channel metrics
    organic_traffic INTEGER DEFAULT 0,
    paid_traffic INTEGER DEFAULT 0,
    social_traffic INTEGER DEFAULT 0,
    direct_traffic INTEGER DEFAULT 0,
    referral_traffic INTEGER DEFAULT 0,
    
    -- Operational metrics
    order_fulfillment_time_hours DECIMAL(8,2) DEFAULT 0,
    customer_service_tickets INTEGER DEFAULT 0,
    product_returns INTEGER DEFAULT 0,
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PRODUCT_ANALYTICS_AGGREGATED TABLE
-- Store product-specific analytics data (renamed to avoid conflict with existing view)
CREATE TABLE IF NOT EXISTS public.product_analytics_aggregated (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    
    -- Time period for this analytics record
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Sales metrics
    units_sold INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    average_selling_price DECIMAL(10,2) DEFAULT 0,
    
    -- Engagement metrics
    product_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    add_to_cart_count INTEGER DEFAULT 0,
    cart_abandonment_count INTEGER DEFAULT 0,
    
    -- Conversion metrics
    view_to_cart_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    cart_to_purchase_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    overall_conversion_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    
    -- Review metrics
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(2,1) DEFAULT 0,
    rating_distribution JSONB DEFAULT '{}'::jsonb, -- {1: count, 2: count, ...}
    
    -- Inventory metrics
    stock_level_start INTEGER DEFAULT 0,
    stock_level_end INTEGER DEFAULT 0,
    out_of_stock_days INTEGER DEFAULT 0,
    restock_frequency INTEGER DEFAULT 0,
    
    -- Return metrics
    return_count INTEGER DEFAULT 0,
    return_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    refund_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Performance ranking
    category_rank INTEGER,
    overall_rank INTEGER,
    trending_score DECIMAL(5,2) DEFAULT 0,
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for period tracking
    UNIQUE(product_id, period_type, period_start)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_product_id ON public.analytics_events(product_id);

CREATE INDEX IF NOT EXISTS idx_customer_analytics_aggregated_customer_id ON public.customer_analytics_aggregated(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_aggregated_period ON public.customer_analytics_aggregated(period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_aggregated_email ON public.customer_analytics_aggregated(customer_email);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_aggregated_date ON public.daily_analytics_aggregated(analytics_date);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_aggregated_revenue ON public.daily_analytics_aggregated(total_revenue);

CREATE INDEX IF NOT EXISTS idx_product_analytics_aggregated_product_id ON public.product_analytics_aggregated(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_aggregated_period ON public.product_analytics_aggregated(period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_product_analytics_aggregated_revenue ON public.product_analytics_aggregated(revenue);

-- Add triggers to automatically update updated_at
CREATE TRIGGER update_customer_analytics_aggregated_updated_at BEFORE UPDATE ON public.customer_analytics_aggregated FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_analytics_aggregated_updated_at BEFORE UPDATE ON public.daily_analytics_aggregated FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_analytics_aggregated_updated_at BEFORE UPDATE ON public.product_analytics_aggregated FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_analytics_aggregated ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_analytics_aggregated ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_analytics_aggregated ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Analytics Events: Read access for authenticated users
CREATE POLICY "Analytics events are viewable by authenticated users" ON public.analytics_events
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Analytics events can be created by authenticated users" ON public.analytics_events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Customer Analytics: Customers can view their own analytics
CREATE POLICY "Customer analytics aggregated viewable by customer" ON public.customer_analytics_aggregated
    FOR SELECT USING (
        customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR auth.role() = 'authenticated'
    );

-- Daily Analytics: Read access for authenticated users
CREATE POLICY "Daily analytics aggregated are viewable by authenticated users" ON public.daily_analytics_aggregated
    FOR SELECT USING (auth.role() = 'authenticated');

-- Product Analytics: Public read access
CREATE POLICY "Product analytics aggregated are viewable by everyone" ON public.product_analytics_aggregated
    FOR SELECT USING (true);

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT SELECT ON public.customer_analytics_aggregated TO authenticated;
GRANT SELECT ON public.daily_analytics_aggregated TO authenticated;
GRANT SELECT ON public.product_analytics_aggregated TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Missing analytics tables created successfully!';
    RAISE NOTICE 'Tables created: analytics_events, customer_analytics_aggregated, daily_analytics_aggregated, product_analytics_aggregated';
    RAISE NOTICE 'Note: Some analytics tables were renamed with "_aggregated" suffix to avoid conflicts with existing views.';
    RAISE NOTICE 'Your Aurora Commerce database now has all required analytics tables!';
    RAISE NOTICE 'Run the verification script to confirm all tables exist.';
END $$;