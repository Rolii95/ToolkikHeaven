import { NextRequest, NextResponse } from 'next/server';
import { ReviewSubmission } from '../../../types';

// Initialize Supabase client only if credentials are available
let supabase: any = null;

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Only create client if we have real credentials (not demo values)
  if (supabaseUrl && 
      supabaseKey && 
      !supabaseUrl.includes('demo.supabase.co') && 
      !supabaseKey.includes('demo_key')) {
    
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (error) {
  console.log('Supabase client initialization failed, using mock data mode');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // If Supabase is configured, try to fetch from database
    if (supabase) {
      const { data: reviews, error: reviewsError } = await supabase
        .from('product_reviews')
        .select(`
          *,
          user_profile:user_profiles(display_name, avatar_url)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (!reviewsError && reviews) {
        const stats = calculateReviewStats(reviews);
        return NextResponse.json({
          reviews,
          stats,
          source: 'database'
        });
      }
    }

    // Fallback to mock data (for demo or when Supabase isn't configured)
    const mockReviews = generateMockReviews(productId);
    return NextResponse.json({
      reviews: mockReviews,
      stats: calculateReviewStats(mockReviews),
      source: 'mock'
    });

  } catch (error) {
    console.error('Error in reviews API:', error);
    
    // Always provide mock data as fallback
    const productId = new URL(request.url).searchParams.get('product_id') || '1';
    const mockReviews = generateMockReviews(productId);
    
    return NextResponse.json({
      reviews: mockReviews,
      stats: calculateReviewStats(mockReviews),
      source: 'mock'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ReviewSubmission = await request.json();
    const { product_id, rating, review_text } = body;

    // Validate input
    if (!product_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Valid product_id and rating (1-5) are required' },
        { status: 400 }
      );
    }

    // For demo purposes, we'll simulate user authentication
    const mockUserId = 'demo-user-' + Date.now();

    // If Supabase is configured, try to insert into database
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('product_reviews')
          .insert({
            product_id,
            user_id: mockUserId,
            rating,
            review_text: review_text || null,
          })
          .select()
          .single();

        if (!error && data) {
          return NextResponse.json({
            success: true,
            review: data,
            message: 'Review submitted successfully to database',
            source: 'database'
          });
        }
      } catch (dbError) {
        console.log('Database insert failed, using demo mode:', dbError);
      }
    }

    // Fallback: Return success response for demo purposes
    return NextResponse.json({
      success: true,
      review: {
        id: 'demo-' + Date.now(),
        product_id,
        user_id: mockUserId,
        rating,
        review_text,
        helpful_votes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_profile: {
          display_name: 'Demo User',
          avatar_url: null
        }
      },
      message: 'Review submitted successfully (demo mode)',
      source: 'mock'
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}

// Helper function to calculate review statistics
function calculateReviewStats(reviews: any[]) {
  if (!reviews.length) {
    return {
      average_rating: 0,
      total_reviews: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
  
  const ratingDistribution = reviews.reduce((dist, review) => {
    dist[review.rating] = (dist[review.rating] || 0) + 1;
    return dist;
  }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  return {
    average_rating: Math.round(averageRating * 10) / 10,
    total_reviews: totalReviews,
    rating_distribution: ratingDistribution
  };
}

// Generate mock reviews for development/demo
function generateMockReviews(productId: string) {
  const mockReviewTexts = [
    "Absolutely love this product! Quality is outstanding and delivery was super fast.",
    "Great value for money. Exactly what I was looking for.",
    "Good product, but packaging could be improved. Overall satisfied.",
    "Excellent customer service and the product exceeded my expectations!",
    "Decent quality, though I've seen better. Price is fair.",
    "Amazing! Will definitely buy again. Highly recommend to everyone.",
    "Product works as described. No complaints here.",
    "Top-notch quality and beautiful design. Worth every penny!",
    "Fast shipping and excellent quality. Very happy with this purchase.",
    "Good product overall, but took longer to arrive than expected."
  ];

  const mockNames = [
    "Sarah Johnson", "Mike Chen", "Emma Davis", "Alex Rodriguez", 
    "Lisa Thompson", "David Kim", "Rachel Green", "Tom Wilson",
    "Jessica Brown", "Chris Lee"
  ];

  return Array.from({ length: Math.floor(Math.random() * 8) + 3 }, (_, index) => {
    const rating = Math.floor(Math.random() * 2) + 4; // Mostly 4-5 stars for demo
    const randomReview = Math.floor(Math.random() * mockReviewTexts.length);
    const randomName = Math.floor(Math.random() * mockNames.length);
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);

    return {
      id: `mock-review-${productId}-${index}`,
      product_id: productId,
      user_id: `mock-user-${index}`,
      rating,
      review_text: mockReviewTexts[randomReview],
      helpful_votes: Math.floor(Math.random() * 15),
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
      user_profile: {
        display_name: mockNames[randomName],
        avatar_url: null
      }
    };
  });
}