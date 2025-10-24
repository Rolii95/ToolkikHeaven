import { MetadataRoute } from 'next';
import { supabase } from '../lib/supabase/server';

// Interface for sitemap product data
interface SitemapProduct {
  id: string;
  name: string;
  updated_at?: string;
}

// Mock products for fallback
const mockProducts: SitemapProduct[] = [
  { id: '1', name: 'Premium Wireless Headphones' },
  { id: '2', name: 'Smart Fitness Watch' },
  { id: '3', name: 'Ergonomic Office Chair' },
  { id: '4', name: 'Portable Bluetooth Speaker' },
  { id: '5', name: 'Organic Cotton T-Shirt' },
  { id: '6', name: 'Professional Camera Lens' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://aurora-commerce.com'; // Replace with your actual domain

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
  ];

  // Get dynamic product pages
  let products: SitemapProduct[] = [];
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, updated_at')
      .order('updated_at', { ascending: false });

    if (error || !data) {
      console.log('Using mock data for sitemap generation');
      products = mockProducts.map(p => ({
        ...p,
        updated_at: new Date().toISOString(),
      }));
    } else {
      products = data;
    }
  } catch (error) {
    console.log('Failed to fetch products for sitemap, using mock data');
    products = mockProducts.map(p => ({
      ...p,
      updated_at: new Date().toISOString(),
    }));
  }

  // Generate product page URLs
  const productPages = products.map((product) => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: new Date(product.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Category pages (you can add more categories as needed)
  const categories = ['Electronics', 'Wearables', 'Furniture', 'Clothing', 'Photography'];
  const categoryPages = categories.map((category) => ({
    url: `${baseUrl}/category/${category.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...categoryPages];
}