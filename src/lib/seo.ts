import { Metadata } from 'next';

interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
}

export function generateSEOMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    image = '/og-image.jpg',
    url,
    type = 'website',
    noIndex = false,
  } = config;

  const baseUrl = 'https://aurora-commerce.com';
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
  const fullTitle = title ? `${title} | Aurora Commerce` : 'Aurora Commerce - Smart E-commerce Platform';
  const fullDescription = description || 'Discover amazing products with smart pricing and fast delivery at Aurora Commerce.';

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: [...keywords, 'aurora commerce', 'e-commerce', 'online shopping'],
    robots: noIndex ? {
      index: false,
      follow: false,
    } : {
      index: true,
      follow: true,
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: fullUrl,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      type,
      siteName: 'Aurora Commerce',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [image],
    },
    alternates: {
      canonical: fullUrl,
    },
  };
}

export function generateProductStructuredData(product: {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  tags?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.imageUrl,
    "brand": {
      "@type": "Brand",
      "name": "Aurora Commerce"
    },
    "category": product.category,
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "USD",
      "availability": product.stock > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Aurora Commerce"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": "24"
    }
  };
}

export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": `https://aurora-commerce.com${crumb.url}`
    }))
  };
}

export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

// SEO Helper Functions
export function truncateDescription(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function generateProductKeywords(product: {
  name: string;
  category: string;
  tags?: string[];
  price: number;
}): string[] {
  const keywords = [
    product.name.toLowerCase(),
    product.category.toLowerCase(),
    'buy online',
    'free shipping',
  ];

  // Add tags
  if (product.tags) {
    keywords.push(...product.tags.map(tag => tag.toLowerCase()));
  }

  // Add price-related keywords
  if (product.price < 50) {
    keywords.push('affordable', 'budget-friendly', 'cheap');
  } else if (product.price > 200) {
    keywords.push('premium', 'high-quality', 'luxury');
  }

  // Remove duplicates
  return Array.from(new Set(keywords));
}

export function generateMetaDescription(product: {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
}): string {
  const baseDescription = truncateDescription(product.description, 120);
  const stockStatus = product.stock > 0 ? 'In stock' : 'Out of stock';
  const priceInfo = `$${product.price.toFixed(2)}`;
  
  return `${baseDescription} ${priceInfo}. ${stockStatus}. Free shipping on orders over $150. Shop ${product.category.toLowerCase()} at Aurora Commerce.`;
}