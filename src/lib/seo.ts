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
  isDigital?: boolean;
  fileFormat?: string;
  licenseType?: string;
  fileSize?: number;
  systemRequirements?: string[];
}) {
  const baseStructuredData = {
    "@context": "https://schema.org",
    "@type": product.isDigital ? "SoftwareApplication" : "Product",
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
      "availability": product.isDigital 
        ? "https://schema.org/InStock" 
        : product.stock > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Aurora Commerce"
      },
      ...(product.isDigital && {
        "deliveryMethod": "https://schema.org/OnSitePickup",
        "itemCondition": "https://schema.org/NewCondition"
      })
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": "24"
    }
  };

  // Add digital product specific properties
  if (product.isDigital) {
    return {
      ...baseStructuredData,
      "applicationCategory": product.category,
      "operatingSystem": product.systemRequirements || ["Windows", "macOS", "Linux"],
      "fileFormat": product.fileFormat,
      "license": product.licenseType,
      "downloadUrl": `https://aurora-commerce.com/api/download/${product.id}`,
      "fileSize": product.fileSize ? `${product.fileSize} bytes` : undefined,
      "softwareVersion": "1.0",
      "releaseNotes": "Latest version with all features included",
      "screenshot": product.imageUrl,
      "featureList": product.tags || [],
      "applicationSuite": "Aurora Commerce Digital Products"
    };
  }

  return baseStructuredData;
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
  isDigital?: boolean;
  fileFormat?: string;
  licenseType?: string;
}): string[] {
  const keywords = [
    product.name.toLowerCase(),
    product.category.toLowerCase(),
  ];

  // Add digital-specific keywords
  if (product.isDigital) {
    keywords.push(
      'digital product',
      'instant download',
      'digital delivery',
      'no shipping required',
      'immediate access',
      'downloadable'
    );
    
    if (product.fileFormat) {
      keywords.push(product.fileFormat.toLowerCase());
    }
    
    if (product.licenseType) {
      keywords.push(`${product.licenseType} license`);
    }

    // Add category-specific digital keywords
    switch (product.category.toLowerCase()) {
      case 'digital courses':
        keywords.push('online course', 'e-learning', 'education', 'tutorial', 'training');
        break;
      case 'digital assets':
        keywords.push('design assets', 'templates', 'graphics', 'creative');
        break;
      case 'digital software':
        keywords.push('software', 'application', 'tool', 'utility');
        break;
      case 'digital books':
        keywords.push('ebook', 'digital book', 'pdf', 'guide', 'manual');
        break;
      case 'digital templates':
        keywords.push('template', 'design template', 'business template');
        break;
    }
  } else {
    keywords.push('buy online', 'free shipping', 'physical product');
  }

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
  isDigital?: boolean;
  fileFormat?: string;
  licenseType?: string;
}): string {
  const baseDescription = truncateDescription(product.description, 100);
  const priceInfo = `$${product.price.toFixed(2)}`;
  
  if (product.isDigital) {
    const formatInfo = product.fileFormat ? ` ${product.fileFormat} format.` : '.';
    const licenseInfo = product.licenseType ? ` ${product.licenseType} license.` : '';
    return `${baseDescription} ${priceInfo}. Instant download${formatInfo}${licenseInfo} Shop digital ${product.category.toLowerCase()} at Aurora Commerce.`;
  } else {
    const stockStatus = product.stock > 0 ? 'In stock' : 'Out of stock';
    return `${baseDescription} ${priceInfo}. ${stockStatus}. Free shipping on orders over $150. Shop ${product.category.toLowerCase()} at Aurora Commerce.`;
  }
}