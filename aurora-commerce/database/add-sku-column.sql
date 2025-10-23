-- ADD SKU COLUMN TO EXISTING PRODUCTS TABLE
-- Run this in Supabase SQL Editor to fix the "column sku does not exist" error

-- 1. Add the missing sku column
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100) UNIQUE;

-- 2. Add index for the sku column
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- 3. Update existing products with sample SKUs (optional)
UPDATE products 
SET sku = CASE 
  WHEN name = 'Wireless Headphones' THEN 'WH-001'
  WHEN name ILIKE '%iphone%' THEN 'IPHONE-15-PRO'
  WHEN name ILIKE '%macbook%' THEN 'MBA-M3-13'
  WHEN name ILIKE '%airpods%' THEN 'AIRPODS-PRO'
  WHEN name ILIKE '%shirt%' THEN 'TSHIRT-001'
  WHEN name ILIKE '%jeans%' THEN 'JEANS-001'
  ELSE UPPER(REPLACE(LEFT(name, 10), ' ', '-')) || '-' || SUBSTRING(id::text, 1, 3)
END
WHERE sku IS NULL;

-- 4. Verify the change
SELECT id, name, sku, price FROM products LIMIT 5;

-- Success message
SELECT 'SKU column added successfully! The "column sku does not exist" error is now fixed.' as status;