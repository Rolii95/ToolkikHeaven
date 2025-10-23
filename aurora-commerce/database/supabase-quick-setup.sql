-- SUPABASE SQL EDITOR SETUP
-- Copy and paste this entire script into your Supabase SQL Editor and run it
-- This will create all necessary tables to fix the "column sku does not exist" error

-- 1. Create products table (ESSENTIAL - this fixes the sku error)
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
  dimensions_cm VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_category_id UUID REFERENCES product_categories(id),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create customers table (needed for order prioritization)
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

-- 4. Create orders table (needed for order prioritization)
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

-- 5. Create order_items table
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

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_sku ON order_items(product_sku);

-- 7. Insert sample data
INSERT INTO product_categories (name, description) VALUES
  ('Electronics', 'Electronic devices and gadgets'),
  ('Clothing', 'Apparel and fashion items'),
  ('Furniture', 'Home and office furniture'),
  ('Books', 'Books and educational materials'),
  ('Sports', 'Sports and fitness equipment')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, description, sku, category, price, stock, image_url) VALUES
  ('iPhone 15 Pro', 'Latest iPhone with Pro features', 'IPHONE-15-PRO', 'Electronics', 999.00, 25, '/images/iphone-15-pro.jpg'),
  ('MacBook Air M3', '13-inch laptop with M3 chip', 'MBA-M3-13', 'Electronics', 1299.00, 15, '/images/macbook-air-m3.jpg'),
  ('AirPods Pro', 'Wireless earbuds with noise cancellation', 'AIRPODS-PRO', 'Electronics', 249.00, 50, '/images/airpods-pro.jpg'),
  ('Premium T-Shirt', 'High-quality cotton t-shirt', 'TSHIRT-001', 'Clothing', 29.99, 100, '/images/premium-tshirt.jpg'),
  ('Designer Jeans', 'Premium denim jeans', 'JEANS-001', 'Clothing', 89.99, 75, '/images/designer-jeans.jpg')
ON CONFLICT (sku) DO NOTHING;

INSERT INTO customers (email, first_name, last_name, tier, total_orders, total_spent) VALUES
  ('john.doe@example.com', 'John', 'Doe', 'premium', 15, 2500.00),
  ('jane.smith@example.com', 'Jane', 'Smith', 'vip', 25, 5000.00),
  ('bob.wilson@example.com', 'Bob', 'Wilson', 'standard', 5, 500.00)
ON CONFLICT (email) DO NOTHING;

-- Success message
SELECT 'Database schema setup completed successfully! The products table with sku column has been created.' as status;