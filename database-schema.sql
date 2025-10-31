-- ToolkitHeaven Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    category TEXT,
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    tags TEXT[] DEFAULT '{}',
    
    -- Digital product fields
    is_digital BOOLEAN DEFAULT false,
    download_url TEXT,
    file_size BIGINT, -- in bytes
    file_format TEXT, -- 'PDF', 'ZIP', 'MP4', 'SOFTWARE'
    license_type TEXT CHECK (license_type IN ('personal', 'commercial', 'extended')),
    instant_download BOOLEAN DEFAULT true,
    digital_delivery_info TEXT,
    system_requirements TEXT[],
    
    -- Preview and demo fields
    preview_url TEXT,
    demo_url TEXT,
    sample_files TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- Can be null for guest checkouts
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'cancelled', 'refunded')),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    tax DECIMAL(10,2) DEFAULT 0 CHECK (tax >= 0),
    shipping DECIMAL(10,2) DEFAULT 0 CHECK (shipping >= 0),
    
    -- Customer information
    customer_name TEXT,
    customer_email TEXT NOT NULL,
    
    -- Shipping address (for physical products)
    shipping_address_street TEXT,
    shipping_address_city TEXT,
    shipping_address_postal_code TEXT,
    shipping_address_country TEXT,
    
    -- Payment information
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    payment_method TEXT,
    
    -- Order metadata
    is_digital_only BOOLEAN DEFAULT false,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    
    -- Digital product specific
    license_selected TEXT CHECK (license_selected IN ('personal', 'commercial', 'extended')),
    download_token TEXT,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT 5,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID, -- Can be null for anonymous reviews
    order_id UUID REFERENCES orders(id), -- Link to verified purchase
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    helpful_votes INTEGER DEFAULT 0,
    
    -- Reviewer information (for anonymous reviews)
    reviewer_name TEXT,
    reviewer_email TEXT,
    
    -- Moderation
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- 'page_view', 'product_view', 'add_to_cart', 'purchase', etc.
    user_id UUID,
    session_id TEXT,
    
    -- Event data
    product_id UUID REFERENCES products(id),
    order_id UUID REFERENCES orders(id),
    page_path TEXT,
    user_agent TEXT,
    ip_address INET,
    
    -- Event metadata
    metadata JSONB DEFAULT '{}',
    value DECIMAL(10,2), -- For revenue events
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    
    -- User preferences
    newsletter_subscribed BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_digital ON products(is_digital);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_product_id ON analytics_events(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Products: Public read access
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);

-- Orders: Users can only see their own orders, admins can see all
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all orders" ON orders FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Order items: Linked to order policies
CREATE POLICY "Order items viewable with order access" ON order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders WHERE orders.id = order_items.order_id 
        AND (orders.user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin')
    )
);

-- Reviews: Public read, authenticated write
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (user_id = auth.uid());

-- Analytics: Admin only
CREATE POLICY "Admins can manage analytics" ON analytics_events FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Users: Users can view/update own profile
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid());

-- Insert sample products (optional)
INSERT INTO products (name, description, price, category, stock, is_digital, image_url) VALUES
    ('Complete Web Design Course', 'Learn modern web design from scratch', 49.99, 'Digital Courses', 999, true, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=600&fit=crop'),
    ('Premium Lightroom Presets Pack', 'Professional photo editing presets', 29.99, 'Digital Assets', 999, true, 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&h=600&fit=crop'),
    ('Business Plan Template Bundle', 'Comprehensive business planning templates', 39.99, 'Digital Templates', 999, true, 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=600&fit=crop'),
    ('Meditation & Mindfulness App', 'Digital wellness application', 19.99, 'Digital Software', 999, true, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop'),
    ('The Complete Guide to Digital Marketing', 'Comprehensive digital marketing ebook', 24.99, 'Digital Books', 999, true, 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=600&h=600&fit=crop'),
    ('UI/UX Design Kit for Figma', 'Professional design system', 34.99, 'Digital Design', 999, true, 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=600&fit=crop')
ON CONFLICT DO NOTHING;

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();