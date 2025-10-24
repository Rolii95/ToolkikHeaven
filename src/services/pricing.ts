import { CartItem, Product } from '../types';

export interface CartItemWithPrice extends CartItem {
  price: number;
  name: string;
}

export interface PricingRule {
  id: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y';
  threshold?: number;
  discountValue: number;
  applied: boolean;
  savings: number;
}

export interface PricingResult {
  subtotal: number;
  totalDiscount: number;
  finalTotal: number;
  rulesApplied: PricingRule[];
}

/**
 * Calculate subtotal from cart items with price information
 */
function calculateSubtotal(items: CartItemWithPrice[]): number {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

/**
 * Apply bulk discount rule: 10% off if cart total exceeds $200
 */
function applyBulkDiscountRule(subtotal: number): PricingRule {
  const rule: PricingRule = {
    id: 'bulk-discount-200',
    name: 'Bulk Order Discount',
    description: 'Get 10% off orders over $200',
    type: 'percentage',
    threshold: 200,
    discountValue: 10,
    applied: false,
    savings: 0
  };

  if (subtotal >= (rule.threshold || 0)) {
    rule.applied = true;
    rule.savings = subtotal * (rule.discountValue / 100);
  }

  return rule;
}

/**
 * Apply loyalty customer rule: 5% off for orders over $100
 */
function applyLoyaltyDiscountRule(subtotal: number): PricingRule {
  const rule: PricingRule = {
    id: 'loyalty-discount-100',
    name: 'Loyalty Customer Discount',
    description: 'Get 5% off orders over $100 (loyalty members)',
    type: 'percentage',
    threshold: 100,
    discountValue: 5,
    applied: false,
    savings: 0
  };

  // Simulate loyalty check (in real app, this would check user status)
  const isLoyaltyMember = Math.random() > 0.5; // 50% chance for demo

  if (isLoyaltyMember && subtotal >= (rule.threshold || 0)) {
    rule.applied = true;
    rule.savings = subtotal * (rule.discountValue / 100);
  }

  return rule;
}

/**
 * Apply free shipping rule: Free shipping for orders over $150
 */
function applyFreeShippingRule(subtotal: number): PricingRule {
  const shippingCost = 15.99; // Standard shipping cost
  
  const rule: PricingRule = {
    id: 'free-shipping-150',
    name: 'Free Shipping',
    description: 'Free shipping on orders over $150',
    type: 'fixed_amount',
    threshold: 150,
    discountValue: shippingCost,
    applied: false,
    savings: 0
  };

  if (subtotal >= (rule.threshold || 0)) {
    rule.applied = true;
    rule.savings = shippingCost;
  }

  return rule;
}

/**
 * Apply quantity-based discount: Buy 3 or more items, get 15% off
 */
function applyQuantityDiscountRule(items: CartItemWithPrice[], subtotal: number): PricingRule {
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
  
  const rule: PricingRule = {
    id: 'quantity-discount-3',
    name: 'Volume Discount',
    description: 'Buy 3+ items and get 15% off',
    type: 'percentage',
    threshold: 3,
    discountValue: 15,
    applied: false,
    savings: 0
  };

  if (totalQuantity >= (rule.threshold || 0)) {
    rule.applied = true;
    rule.savings = subtotal * (rule.discountValue / 100);
  }

  return rule;
}

/**
 * Main function to apply all custom pricing rules
 * This is the primary export that API routes will use
 */
export function applyCustomPricingRules(items: CartItemWithPrice[]): PricingResult {
  // Calculate base subtotal
  const subtotal = calculateSubtotal(items);
  
  // Apply all available rules
  const allRules = [
    applyBulkDiscountRule(subtotal),
    applyLoyaltyDiscountRule(subtotal),
    applyFreeShippingRule(subtotal),
    applyQuantityDiscountRule(items, subtotal)
  ];

  // Filter only applied rules
  const rulesApplied = allRules.filter(rule => rule.applied);
  
  // Calculate total discount (only apply the best discount to avoid stacking)
  let totalDiscount = 0;
  if (rulesApplied.length > 0) {
    // Apply the rule with highest savings
    const bestRule = rulesApplied.reduce((best, current) => 
      current.savings > best.savings ? current : best
    );
    totalDiscount = bestRule.savings;
    
    // Mark only the best rule as applied for final calculation
    rulesApplied.forEach(rule => {
      rule.applied = rule.id === bestRule.id;
      rule.savings = rule.id === bestRule.id ? rule.savings : 0;
    });
  }

  // Calculate final total
  const finalTotal = Math.max(0, subtotal - totalDiscount);

  // Log pricing calculation for debugging
  console.log('Pricing Rules Applied:', {
    subtotal: subtotal.toFixed(2),
    totalDiscount: totalDiscount.toFixed(2),
    finalTotal: finalTotal.toFixed(2),
    rulesApplied: rulesApplied.map(rule => ({
      name: rule.name,
      applied: rule.applied,
      savings: rule.savings.toFixed(2)
    }))
  });

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    finalTotal: Math.round(finalTotal * 100) / 100,
    rulesApplied
  };
}

/**
 * Get all available pricing rules (for UI display)
 */
export function getAvailablePricingRules(): Omit<PricingRule, 'applied' | 'savings'>[] {
  return [
    {
      id: 'bulk-discount-200',
      name: 'Bulk Order Discount',
      description: 'Get 10% off orders over $200',
      type: 'percentage',
      threshold: 200,
      discountValue: 10
    },
    {
      id: 'loyalty-discount-100',
      name: 'Loyalty Customer Discount',
      description: 'Get 5% off orders over $100 (loyalty members)',
      type: 'percentage',
      threshold: 100,
      discountValue: 5
    },
    {
      id: 'free-shipping-150',
      name: 'Free Shipping',
      description: 'Free shipping on orders over $150',
      type: 'fixed_amount',
      threshold: 150,
      discountValue: 15.99
    },
    {
      id: 'quantity-discount-3',
      name: 'Volume Discount',
      description: 'Buy 3+ items and get 15% off',
      type: 'percentage',
      threshold: 3,
      discountValue: 15
    }
  ];
}

/**
 * Calculate tax amount (can be customized per region)
 */
export function calculateTax(subtotal: number, taxRate: number = 0.08): number {
  return Math.round(subtotal * taxRate * 100) / 100;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}