-- Base Aurora Commerce Database Schema
-- This file contains the foundational tables that other schemas depend on

-- 1. Create products table (base dependency for other schemas)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100) UNIQUE,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  weight_kg DECIMAL(8,2),
  dimensions_cm VARCHAR(50), -- e.g., "30x20x10"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for products
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- 2. Create product_categories table for better organization
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_category_id UUID REFERENCES product_categories(id),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for categories
CREATE INDEX IF NOT EXISTS idx_product_categories_parent ON product_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_name ON product_categories(name);

-- 3. Enable RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for products (public read, authenticated write)
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Authenticated users can manage products" ON products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view categories" ON product_categories
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Authenticated users can manage categories" ON product_categories
  FOR ALL USING (auth.role() = 'authenticated');

-- 4. Insert sample products for testing
INSERT INTO product_categories (name, description) VALUES
  ('Electronics', 'Electronic devices and gadgets'),
  ('Clothing', 'Apparel and fashion items'),
  ('Furniture', 'Home and office furniture'),
  ('Books', 'Books and educational materials'),
  ('Sports', 'Sports and fitness equipment')
ON CONFLICT (name) DO NOTHING;

-- Get category IDs for sample data
DO $$
DECLARE
  electronics_id UUID;
  clothing_id UUID;
  furniture_id UUID;
BEGIN
  SELECT id INTO electronics_id FROM product_categories WHERE name = 'Electronics';
  SELECT id INTO clothing_id FROM product_categories WHERE name = 'Clothing';
  SELECT id INTO furniture_id FROM product_categories WHERE name = 'Furniture';

  -- Insert sample products
  INSERT INTO products (name, description, sku, category, price, stock, image_url) VALUES
    ('iPhone 15 Pro', 'Latest iPhone with Pro features', 'IPHONE-15-PRO', 'Electronics', 999.00, 25, '/images/iphone-15-pro.jpg'),
    ('MacBook Air M3', '13-inch laptop with M3 chip', 'MBA-M3-13', 'Electronics', 1299.00, 15, '/images/macbook-air-m3.jpg'),
    ('AirPods Pro', 'Wireless earbuds with noise cancellation', 'AIRPODS-PRO', 'Electronics', 249.00, 50, '/images/airpods-pro.jpg'),
    ('Premium T-Shirt', 'High-quality cotton t-shirt', 'TSHIRT-001', 'Clothing', 29.99, 100, '/images/premium-tshirt.jpg'),
    ('Designer Jeans', 'Premium denim jeans', 'JEANS-001', 'Clothing', 89.99, 75, '/images/designer-jeans.jpg'),
    ('Office Chair', 'Ergonomic office chair', 'CHAIR-001', 'Furniture', 299.99, 20, '/images/office-chair.jpg'),
    ('Standing Desk', 'Adjustable height desk', 'DESK-001', 'Furniture', 599.99, 10, '/images/standing-desk.jpg'),
    ('Gaming Monitor', '27-inch 4K gaming monitor', 'MONITOR-001', 'Electronics', 449.99, 30, '/images/gaming-monitor.jpg'),
    ('Running Shoes', 'Professional running shoes', 'SHOES-001', 'Sports', 129.99, 60, '/images/running-shoes.jpg'),
    ('Wireless Mouse', 'Bluetooth wireless mouse', 'MOUSE-001', 'Electronics', 59.99, 80, '/images/wireless-mouse.jpg')
  ON CONFLICT (sku) DO NOTHING;
END $$;

-- 5. Create function to update product updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for products updated_at
DROP TRIGGER IF EXISTS products_updated_at_trigger ON products;
CREATE TRIGGER products_updated_at_trigger
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_updated_at();

-- 6. Create view for product catalog with category info
CREATE OR REPLACE VIEW product_catalog AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.sku,
  p.category,
  pc.name as category_name,
  p.price,
  p.stock,
  p.image_url,
  p.is_active,
  p.weight_kg,
  p.dimensions_cm,
  p.created_at,
  p.updated_at,
  CASE 
    WHEN p.stock = 0 THEN 'out_of_stock'
    WHEN p.stock <= 10 THEN 'low_stock'
    WHEN p.stock <= 25 THEN 'medium_stock'
    ELSE 'high_stock'
  END as stock_status
FROM products p
LEFT JOIN product_categories pc ON p.category = pc.name
WHERE p.is_active = TRUE;

-- 7. Create basic cart/session table for future use
CREATE TABLE IF NOT EXISTS cart_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_session_id UUID NOT NULL REFERENCES cart_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cart_session_id, product_id)
);

-- Add indexes for cart tables
CREATE INDEX IF NOT EXISTS idx_cart_sessions_session_id ON cart_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_user_id ON cart_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_session_id ON cart_items(cart_session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Enable RLS for cart tables
ALTER TABLE cart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Cart policies
CREATE POLICY "Users can manage their own cart sessions" ON cart_sessions
  FOR ALL USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));

CREATE POLICY "Users can manage their own cart items" ON cart_items
  FOR ALL USING (
    cart_session_id IN (
      SELECT id FROM cart_sessions 
      WHERE auth.uid() = user_id OR session_id = current_setting('app.session_id', true)
    )
  );