-- Core E-commerce Tables Setup for Aurora Commerce
-- Run this script in your Supabase SQL editor to create the missing core tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PRODUCTS TABLE
-- Store product catalog information
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    compare_price DECIMAL(10,2) CHECK (compare_price >= 0),
    cost_per_item DECIMAL(10,2) CHECK (cost_per_item >= 0),
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    track_quantity BOOLEAN DEFAULT true,
    quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
    continue_selling_when_out_of_stock BOOLEAN DEFAULT false,
    weight DECIMAL(8,2) CHECK (weight >= 0),
    weight_unit VARCHAR(10) DEFAULT 'kg',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    visibility VARCHAR(20) DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden')),
    category_id UUID,
    vendor VARCHAR(100),
    product_type VARCHAR(100),
    tags TEXT[], -- Array of tags
    images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs
    variants JSONB DEFAULT '[]'::jsonb, -- Product variants data
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_handle VARCHAR(255) UNIQUE, -- URL slug
    featured_image VARCHAR(500),
    gallery_images TEXT[],
    options JSONB DEFAULT '{}'::jsonb, -- Additional product options
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ORDERS TABLE  
-- Store customer orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    
    -- Order status and financial info
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    financial_status VARCHAR(50) DEFAULT 'pending' CHECK (financial_status IN ('pending', 'paid', 'partially_paid', 'refunded', 'partially_refunded')),
    fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled')),
    
    -- Pricing information
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    shipping_amount DECIMAL(10,2) DEFAULT 0 CHECK (shipping_amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Shipping address
    shipping_first_name VARCHAR(100),
    shipping_last_name VARCHAR(100),
    shipping_company VARCHAR(100),
    shipping_address_1 VARCHAR(255),
    shipping_address_2 VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(100),
    shipping_phone VARCHAR(50),
    
    -- Billing address
    billing_first_name VARCHAR(100),
    billing_last_name VARCHAR(100),
    billing_company VARCHAR(100),
    billing_address_1 VARCHAR(255),
    billing_address_2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100),
    billing_phone VARCHAR(50),
    
    -- Payment and shipping info
    payment_method VARCHAR(100),
    payment_reference VARCHAR(255), -- Stripe payment intent ID, etc.
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(255),
    tracking_url VARCHAR(500),
    
    -- Additional data
    notes TEXT,
    tags TEXT[],
    source VARCHAR(50) DEFAULT 'web', -- web, mobile, api, etc.
    source_identifier VARCHAR(255),
    discount_codes TEXT[],
    custom_fields JSONB DEFAULT '{}'::jsonb,
    
    -- Priority and automation
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    automated_priority BOOLEAN DEFAULT false,
    priority_reason TEXT,
    
    -- Timestamps
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ORDER_ITEMS TABLE
-- Store individual items within each order
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    
    -- Product details (stored to preserve order history even if product changes)
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    variant_title VARCHAR(255),
    vendor VARCHAR(100),
    
    -- Quantity and pricing
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0), -- Unit price
    compare_at_price DECIMAL(10,2) CHECK (compare_at_price >= 0),
    total_discount DECIMAL(10,2) DEFAULT 0 CHECK (total_discount >= 0),
    
    -- Product attributes at time of order
    weight DECIMAL(8,2) CHECK (weight >= 0),
    weight_unit VARCHAR(10) DEFAULT 'kg',
    requires_shipping BOOLEAN DEFAULT true,
    taxable BOOLEAN DEFAULT true,
    
    -- Additional data
    properties JSONB DEFAULT '{}'::jsonb, -- Custom properties/options
    custom_fields JSONB DEFAULT '{}'::jsonb,
    
    -- Fulfillment
    fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled')),
    fulfilled_quantity INTEGER DEFAULT 0 CHECK (fulfilled_quantity >= 0),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure fulfilled quantity doesn't exceed ordered quantity
    CONSTRAINT check_fulfilled_quantity CHECK (fulfilled_quantity <= quantity)
);

-- 4. CARTS TABLE
-- Store shopping cart data for users
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- For guest users
    
    -- Cart items stored as JSONB for flexibility
    items JSONB DEFAULT '[]'::jsonb, -- Array of cart items
    
    -- Pricing calculations
    subtotal DECIMAL(10,2) DEFAULT 0 CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    shipping_amount DECIMAL(10,2) DEFAULT 0 CHECK (shipping_amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount DECIMAL(10,2) DEFAULT 0 CHECK (total_amount >= 0),
    
    -- Cart metadata
    currency VARCHAR(3) DEFAULT 'USD',
    discount_codes TEXT[],
    notes TEXT,
    abandoned_at TIMESTAMP WITH TIME ZONE, -- When cart was abandoned
    recovered_at TIMESTAMP WITH TIME ZONE, -- When abandoned cart was recovered
    
    -- Additional data
    custom_fields JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure either user_id or session_id is provided
    CONSTRAINT check_cart_owner CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_seo_handle ON public.products(seo_handle);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_financial_status ON public.orders(financial_status);
CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON public.orders(placed_at);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON public.orders(priority);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON public.carts(session_id);
CREATE INDEX IF NOT EXISTS idx_carts_abandoned_at ON public.carts(abandoned_at);
CREATE INDEX IF NOT EXISTS idx_carts_updated_at ON public.carts(updated_at);

-- Create function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to automatically update updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Products: Public read access for active products, admin write access
CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (status = 'active' AND visibility = 'visible');

CREATE POLICY "Products are manageable by authenticated users" ON public.products
    FOR ALL USING (auth.role() = 'authenticated');

-- Orders: Users can only see their own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Order Items: Users can only see items from their orders
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create order items" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Carts: Users can only access their own carts
CREATE POLICY "Users can view own carts" ON public.carts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own carts" ON public.carts
    FOR ALL USING (auth.uid() = user_id);

-- Insert some sample data for testing (optional)
-- Uncomment the following lines if you want sample data

/*
-- Sample products
INSERT INTO public.products (name, description, price, sku, seo_handle) VALUES
('Sample Product 1', 'This is a sample product for testing', 29.99, 'SAMPLE-001', 'sample-product-1'),
('Sample Product 2', 'Another sample product', 49.99, 'SAMPLE-002', 'sample-product-2'),
('Sample Product 3', 'Third sample product', 19.99, 'SAMPLE-003', 'sample-product-3');
*/

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;  
GRANT ALL ON public.carts TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Core e-commerce tables created successfully!';
    RAISE NOTICE 'Tables created: products, orders, order_items, carts';
    RAISE NOTICE 'Indexes, triggers, and RLS policies have been applied.';
    RAISE NOTICE 'You can now run the verify-tables.sql script to confirm all tables exist.';
END $$;