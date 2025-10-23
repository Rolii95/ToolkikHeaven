-- MIGRATION: Add missing columns to existing products table
-- Run this in Supabase SQL Editor to fix column errors

-- 1. Add missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0 CHECK (stock >= 0);
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(8,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions_cm VARCHAR(50);

-- 2. Add image_url column (standardized name) and copy data from imageurl
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
UPDATE products SET image_url = imageurl WHERE image_url IS NULL;

-- 3. Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- 4. Update existing products with default values
UPDATE products 
SET 
  is_active = TRUE,
  stock = CASE 
    WHEN name ILIKE '%headphones%' THEN 50
    WHEN name ILIKE '%iphone%' THEN 25
    WHEN name ILIKE '%macbook%' THEN 15
    WHEN name ILIKE '%airpods%' THEN 50
    ELSE 30
  END
WHERE stock = 0 OR stock IS NULL;

-- 5. Create the other missing tables needed for order prioritization

-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_category_id UUID REFERENCES product_categories(id),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  tier VARCHAR(20) DEFAULT 'standard' CHECK (tier IN ('vip', 'premium', 'standard', 'new')),
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0.00,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal',
  priority_score INTEGER DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  shipping_method VARCHAR(50),
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_sku VARCHAR(100),
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Add sample data
INSERT INTO product_categories (name, description) VALUES
  ('Electronics', 'Electronic devices and gadgets'),
  ('Clothing', 'Apparel and fashion items'),
  ('Furniture', 'Home and office furniture'),
  ('Books', 'Books and educational materials'),
  ('Sports', 'Sports and fitness equipment')
ON CONFLICT (name) DO NOTHING;

INSERT INTO customers (email, first_name, last_name, tier, total_orders, total_spent) VALUES
  ('john.doe@example.com', 'John', 'Doe', 'premium', 15, 2500.00),
  ('jane.smith@example.com', 'Jane', 'Smith', 'vip', 25, 5000.00),
  ('bob.wilson@example.com', 'Bob', 'Wilson', 'standard', 5, 500.00)
ON CONFLICT (email) DO NOTHING;

-- 7. Verify the changes
SELECT 
  id, 
  name, 
  sku, 
  is_active, 
  stock, 
  price, 
  CASE WHEN image_url IS NOT NULL THEN 'YES' ELSE 'NO' END as has_image_url
FROM products 
LIMIT 3;

-- Success message
SELECT 'All missing columns added successfully! Errors should now be fixed.' as status;