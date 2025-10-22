import { CartItem, Product } from '../types';
import { CartItemWithPrice } from './pricing';

/**
 * Mock product database - in a real app, this would come from a database
 */
const PRODUCTS_DB: Product[] = [
  {
    id: '1',
    name: 'Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 199.99,
    imageUrl: '/images/headphones.jpg',
    category: 'Electronics'
  },
  {
    id: '2',
    name: 'Smart Watch',
    description: 'Feature-rich smartwatch with fitness tracking',
    price: 299.99,
    imageUrl: '/images/smartwatch.jpg',
    category: 'Electronics'
  },
  {
    id: '3',
    name: 'Laptop Backpack',
    description: 'Durable backpack designed for laptops and tech gear',
    price: 89.99,
    imageUrl: '/images/backpack.jpg',
    category: 'Accessories'
  },
  {
    id: '4',
    name: 'Bluetooth Speaker',
    description: 'Portable speaker with premium sound quality',
    price: 129.99,
    imageUrl: '/images/speaker.jpg',
    category: 'Electronics'
  },
  {
    id: '5',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking',
    price: 59.99,
    imageUrl: '/images/mouse.jpg',
    category: 'Electronics'
  }
];

/**
 * Get product by ID
 */
export function getProductById(productId: string): Product | null {
  return PRODUCTS_DB.find(product => product.id === productId) || null;
}

/**
 * Get all products
 */
export function getAllProducts(): Product[] {
  return [...PRODUCTS_DB];
}

/**
 * Convert CartItem array to CartItemWithPrice array by looking up product information
 */
export function enrichCartItemsWithPrice(cartItems: CartItem[]): CartItemWithPrice[] {
  return cartItems.map(item => {
    const product = getProductById(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    
    return {
      ...item,
      price: product.price,
      name: product.name
    };
  });
}

/**
 * Calculate cart total without any discounts
 */
export function calculateCartSubtotal(cartItems: CartItem[]): number {
  const enrichedItems = enrichCartItemsWithPrice(cartItems);
  return enrichedItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

/**
 * Validate cart items (check if products exist and quantities are valid)
 */
export function validateCartItems(cartItems: CartItem[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  for (const item of cartItems) {
    // Check if product exists
    const product = getProductById(item.productId);
    if (!product) {
      errors.push(`Product not found: ${item.productId}`);
      continue;
    }
    
    // Check quantity
    if (item.quantity <= 0) {
      errors.push(`Invalid quantity for ${product.name}: ${item.quantity}`);
    }
    
    if (item.quantity > 99) {
      errors.push(`Quantity too high for ${product.name}: ${item.quantity} (max: 99)`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get products by category
 */
export function getProductsByCategory(category: string): Product[] {
  return PRODUCTS_DB.filter(product => 
    product.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Search products by name or description
 */
export function searchProducts(query: string): Product[] {
  const searchTerm = query.toLowerCase();
  return PRODUCTS_DB.filter(product =>
    product.name.toLowerCase().includes(searchTerm) ||
    product.description.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get featured products (mock implementation)
 */
export function getFeaturedProducts(limit: number = 4): Product[] {
  // For demo, return first N products as "featured"
  return PRODUCTS_DB.slice(0, limit);
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
}

/**
 * Generate order ID
 */
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${random}`.toUpperCase();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate postal code (basic validation)
 */
export function isValidPostalCode(postalCode: string, country: string = 'US'): boolean {
  if (country === 'US') {
    return /^\d{5}(-\d{4})?$/.test(postalCode);
  }
  // For other countries, just check it's not empty
  return postalCode.trim().length > 0;
}

/**
 * Get available shipping methods
 */
export function getShippingMethods(): Array<{
  id: string;
  name: string;
  description: string;
  estimatedDays: number;
  baseCost: number;
}> {
  return [
    {
      id: 'standard',
      name: 'Standard Shipping',
      description: 'Delivery in 5-7 business days',
      estimatedDays: 7,
      baseCost: 9.99
    },
    {
      id: 'express',
      name: 'Express Shipping',
      description: 'Delivery in 2-3 business days',
      estimatedDays: 3,
      baseCost: 19.99
    },
    {
      id: 'overnight',
      name: 'Overnight Shipping',
      description: 'Next business day delivery',
      estimatedDays: 1,
      baseCost: 29.99
    }
  ];
}