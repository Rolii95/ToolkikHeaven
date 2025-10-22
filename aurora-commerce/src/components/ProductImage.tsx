'use client';

import React from 'react';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ProductImage({ src, alt, className }: ProductImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
        (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
      }}
    />
  );
}