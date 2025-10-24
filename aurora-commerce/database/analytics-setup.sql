-- Customer Analytics Database Schema
-- This file creates tables for tracking customer events and computing analytics

-- Events table to track customer interactions
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- 'page_view', 'add_to_cart', 'checkout_start', 'purchase', 'product_view'
    customer_id UUID, -- optional, anonymous events allowed
    customer_email VARCHAR(255),
    session_id VARCHAR(255),
    product_id VARCHAR(255),
    order_id VARCHAR(255),
    properties JSONB DEFAULT '{}',
    value DECIMAL(10,2), -- monetary value for purchase events
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    page_url TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_type_created ON events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_customer_email ON events(customer_email) WHERE customer_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_product ON events(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);

-- Customer analytics view for LTV and purchase behavior
CREATE OR REPLACE VIEW customer_analytics AS
SELECT 
    customer_email,
    COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as total_orders,
    SUM(CASE WHEN event_type = 'purchase' THEN value ELSE 0 END) as lifetime_value,
    AVG(CASE WHEN event_type = 'purchase' THEN value ELSE NULL END) as avg_order_value,
    MIN(created_at) as first_seen,
    MAX(created_at) as last_seen,
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
    COUNT(CASE WHEN event_type = 'add_to_cart' THEN 1 END) as add_to_cart_events,
    COUNT(CASE WHEN event_type = 'checkout_start' THEN 1 END) as checkout_starts,
    CASE 
        WHEN COUNT(CASE WHEN event_type = 'checkout_start' THEN 1 END) > 0 
        THEN COUNT(CASE WHEN event_type = 'purchase' THEN 1 END)::FLOAT / COUNT(CASE WHEN event_type = 'checkout_start' THEN 1 END)
        ELSE 0 
    END as checkout_conversion_rate
FROM events 
WHERE customer_email IS NOT NULL
GROUP BY customer_email;

-- Product analytics view
CREATE OR REPLACE VIEW product_analytics AS
SELECT 
    product_id,
    COUNT(CASE WHEN event_type = 'product_view' THEN 1 END) as views,
    COUNT(CASE WHEN event_type = 'add_to_cart' THEN 1 END) as add_to_carts,
    COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as purchases,
    SUM(CASE WHEN event_type = 'purchase' THEN value ELSE 0 END) as revenue,
    CASE 
        WHEN COUNT(CASE WHEN event_type = 'product_view' THEN 1 END) > 0 
        THEN COUNT(CASE WHEN event_type = 'add_to_cart' THEN 1 END)::FLOAT / COUNT(CASE WHEN event_type = 'product_view' THEN 1 END)
        ELSE 0 
    END as view_to_cart_rate,
    CASE 
        WHEN COUNT(CASE WHEN event_type = 'add_to_cart' THEN 1 END) > 0 
        THEN COUNT(CASE WHEN event_type = 'purchase' THEN 1 END)::FLOAT / COUNT(CASE WHEN event_type = 'add_to_cart' THEN 1 END)
        ELSE 0 
    END as cart_to_purchase_rate
FROM events 
WHERE product_id IS NOT NULL
GROUP BY product_id;

-- Daily analytics summary
CREATE OR REPLACE VIEW daily_analytics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_events,
    COUNT(DISTINCT customer_email) as unique_customers,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
    COUNT(CASE WHEN event_type = 'product_view' THEN 1 END) as product_views,
    COUNT(CASE WHEN event_type = 'add_to_cart' THEN 1 END) as add_to_carts,
    COUNT(CASE WHEN event_type = 'checkout_start' THEN 1 END) as checkout_starts,
    COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as purchases,
    SUM(CASE WHEN event_type = 'purchase' THEN value ELSE 0 END) as revenue
FROM events 
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Function to track events easily
CREATE OR REPLACE FUNCTION track_event(
    p_event_type VARCHAR(50),
    p_customer_email VARCHAR(255) DEFAULT NULL,
    p_session_id VARCHAR(255) DEFAULT NULL,
    p_product_id VARCHAR(255) DEFAULT NULL,
    p_order_id VARCHAR(255) DEFAULT NULL,
    p_properties JSONB DEFAULT '{}',
    p_value DECIMAL(10,2) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL,
    p_page_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO events (
        event_type, customer_email, session_id, product_id, order_id,
        properties, value, user_agent, ip_address, referrer, page_url
    ) VALUES (
        p_event_type, p_customer_email, p_session_id, p_product_id, p_order_id,
        p_properties, p_value, p_user_agent, p_ip_address, p_referrer, p_page_url
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically track purchase events from orders table
CREATE OR REPLACE FUNCTION trigger_track_purchase() RETURNS TRIGGER AS $$
BEGIN
    -- Only track when status changes to 'paid'
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
        PERFORM track_event(
            'purchase',
            NEW.customer_email,
            NEW.stripe_session_id,
            NULL, -- product_id will come from order items if needed
            NEW.id,
            jsonb_build_object('payment_intent', NEW.payment_intent),
            NEW.total
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on orders table (if it exists)
DROP TRIGGER IF EXISTS orders_track_purchase ON orders;
CREATE TRIGGER orders_track_purchase
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_track_purchase();