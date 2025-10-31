-- Simple Reviews Table Setup (Legacy Compatibility)
-- Run this script if you need the legacy 'reviews' table for backward compatibility

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- REVIEWS TABLE (Legacy/Simple version)
-- Simple reviews table for backward compatibility with older code
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Review data
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    
    -- Reviewer info
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    
    -- Status
    approved BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews(approved);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- Add trigger for updated_at
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Approved reviews are viewable by everyone" ON public.reviews
    FOR SELECT USING (approved = true);

CREATE POLICY "Users can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE ON public.reviews TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Legacy reviews table created successfully!';
    RAISE NOTICE 'Note: You already have product_reviews table which is more comprehensive.';
    RAISE NOTICE 'This reviews table is mainly for backward compatibility.';
END $$;