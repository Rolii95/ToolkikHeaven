-- Create product_reviews table for social proof integration
-- This enables users to rate and review products on the PDP

CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate reviews from same user for same product
    UNIQUE(product_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for secure access
-- Anyone can read reviews
CREATE POLICY "Anyone can read product reviews" 
ON product_reviews FOR SELECT 
USING (true);

-- Only authenticated users can insert reviews
CREATE POLICY "Authenticated users can insert reviews" 
ON product_reviews FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own reviews
CREATE POLICY "Users can update own reviews" 
ON product_reviews FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" 
ON product_reviews FOR DELETE 
USING (auth.uid() = user_id);

-- Create a function to calculate average rating for a product
CREATE OR REPLACE FUNCTION get_product_average_rating(product_id_param TEXT)
RETURNS TABLE(
    average_rating NUMERIC,
    total_reviews INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(rating::NUMERIC), 2) as average_rating,
        COUNT(*)::INTEGER as total_reviews
    FROM product_reviews 
    WHERE product_id = product_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create mock user profiles table for demo purposes
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for user profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON user_profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert own profile" 
ON user_profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = id);