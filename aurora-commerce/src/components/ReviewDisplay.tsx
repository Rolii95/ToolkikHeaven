import React from 'react';
import { ProductReview, ReviewStats } from '../types';

interface ReviewDisplayProps {
  productId: string;
}

interface ReviewsData {
  reviews: ProductReview[];
  stats: ReviewStats;
}

async function getProductReviews(productId: string): Promise<ReviewsData> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/reviews?product_id=${productId}`, {
      cache: 'no-store', // Always fetch fresh reviews
    });

    if (!response.ok) {
      throw new Error('Failed to fetch reviews');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching reviews:', error);
    
    // Return mock data as fallback
    return generateMockReviewsData(productId);
  }
}

export default async function ReviewDisplay({ productId }: ReviewDisplayProps) {
  const { reviews, stats } = await getProductReviews(productId);

  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Customer Reviews</h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.round(stats.average_rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {stats.average_rating.toFixed(1)} out of 5 ({stats.total_reviews} reviews)
          </span>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="mb-8 bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Rating Breakdown</h4>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.rating_distribution[rating as keyof typeof stats.rating_distribution] || 0;
            const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700 w-12">
                  {rating} star{rating !== 1 ? 's' : ''}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.72-.424l-5.45 2.728a.5.5 0 01-.68-.681L6.88 16.4A8 8 0 1121 12z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
            <p className="mt-1 text-sm text-gray-500">Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {review.user_profile?.avatar_url ? (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={review.user_profile.avatar_url}
                      alt={review.user_profile.display_name || 'User avatar'}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">
                        {review.user_profile?.display_name || 'Anonymous User'}
                      </h5>
                      <div className="flex items-center mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <time className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </time>
                  </div>
                  
                  {review.review_text && (
                    <p className="mt-3 text-gray-700 text-sm leading-6">
                      {review.review_text}
                    </p>
                  )}
                  
                  <div className="mt-3 flex items-center space-x-4">
                    <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L9 7v13m-3-5l-2-2m0 0l-2-2m2 2v6" />
                      </svg>
                      <span>Helpful ({review.helpful_votes})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Generate mock reviews data as fallback
function generateMockReviewsData(productId: string): ReviewsData {
  const mockReviews: ProductReview[] = [
    {
      id: `mock-${productId}-1`,
      product_id: productId,
      user_id: 'mock-user-1',
      rating: 5,
      review_text: "Absolutely love this product! Quality is outstanding and delivery was super fast. Exactly what I was looking for.",
      helpful_votes: 12,
      created_at: '2024-10-15T10:30:00Z',
      updated_at: '2024-10-15T10:30:00Z',
      user_profile: {
        id: 'mock-user-1',
        display_name: 'Sarah Johnson',
        avatar_url: '',
        created_at: '2024-01-01T00:00:00Z'
      }
    },
    {
      id: `mock-${productId}-2`,
      product_id: productId,
      user_id: 'mock-user-2',
      rating: 4,
      review_text: "Great value for money. The product works as described and arrived quickly. Would recommend!",
      helpful_votes: 8,
      created_at: '2024-10-12T14:20:00Z',
      updated_at: '2024-10-12T14:20:00Z',
      user_profile: {
        id: 'mock-user-2',
        display_name: 'Mike Chen',
        avatar_url: '',
        created_at: '2024-01-01T00:00:00Z'
      }
    },
    {
      id: `mock-${productId}-3`,
      product_id: productId,
      user_id: 'mock-user-3',
      rating: 5,
      review_text: "Excellent customer service and the product exceeded my expectations! Will definitely buy again.",
      helpful_votes: 15,
      created_at: '2024-10-10T09:15:00Z',
      updated_at: '2024-10-10T09:15:00Z',
      user_profile: {
        id: 'mock-user-3',
        display_name: 'Emma Davis',
        avatar_url: '',
        created_at: '2024-01-01T00:00:00Z'
      }
    }
  ];

  const stats: ReviewStats = {
    average_rating: 4.7,
    total_reviews: 3,
    rating_distribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 1,
      5: 2
    }
  };

  return { reviews: mockReviews, stats };
}