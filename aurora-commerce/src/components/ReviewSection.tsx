'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReviewForm from './ReviewForm';

interface ReviewSectionProps {
  productId: string;
  children: React.ReactNode; // ReviewDisplay server component
}

export default function ReviewSection({ productId, children }: ReviewSectionProps) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleReviewSubmitted = () => {
    // Refresh the page to show the new review
    router.refresh();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div key={refreshKey}>
      {children}
      <ReviewForm 
        productId={productId} 
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}