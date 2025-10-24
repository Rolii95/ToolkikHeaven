/**
 * Demo script showcasing the custom logic services
 * This demonstrates the pricing rules and fulfillment processing
 * 
 * To run this demo:
 * 1. Make sure your environment is set up with the services
 * 2. Run: npm run demo (after adding this script to package.json)
 * 3. Or import these functions in your application
 */

import { applyCustomPricingRules, getAvailablePricingRules, formatCurrency } from '../services/pricing';
import { processExternalFulfillment, getShippingEstimate, trackOrder } from '../services/fulfillment';
import { enrichCartItemsWithPrice, validateCartItems, generateOrderId } from '../services/productService';
import { CartItem } from '../types';

// Demo cart scenarios
const DEMO_CARTS = {
  smallCart: [
    { productId: '1', quantity: 1 }, // Wireless Headphones - $199.99
  ] as CartItem[],
  
  mediumCart: [
    { productId: '1', quantity: 1 }, // Wireless Headphones - $199.99
    { productId: '3', quantity: 1 }, // Laptop Backpack - $89.99
  ] as CartItem[],
  
  largeCart: [
    { productId: '1', quantity: 1 }, // Wireless Headphones - $199.99
    { productId: '2', quantity: 1 }, // Smart Watch - $299.99
    { productId: '4', quantity: 2 }, // Bluetooth Speaker - $129.99 x2
  ] as CartItem[],
  
  bulkCart: [
    { productId: '1', quantity: 2 }, // Wireless Headphones - $199.99 x2
    { productId: '3', quantity: 3 }, // Laptop Backpack - $89.99 x3
    { productId: '5', quantity: 4 }, // Wireless Mouse - $59.99 x4
  ] as CartItem[]
};

/**
 * Demo function to showcase pricing rules
 */
export async function demoPricingRules() {
  console.log('\n🎯 PRICING RULES DEMO');
  console.log('='.repeat(50));
  
  // Show available rules
  console.log('\n📋 Available Pricing Rules:');
  const availableRules = getAvailablePricingRules();
  availableRules.forEach(rule => {
    console.log(`  • ${rule.name}: ${rule.description}`);
  });
  
  // Test different cart scenarios
  for (const [cartName, cartItems] of Object.entries(DEMO_CARTS)) {
    console.log(`\n💰 Testing ${cartName}:`);
    
    try {
      // Validate and enrich cart items
      const validation = validateCartItems(cartItems);
      if (!validation.isValid) {
        console.log(`  ❌ Validation failed: ${validation.errors.join(', ')}`);
        continue;
      }
      
      const enrichedItems = enrichCartItemsWithPrice(cartItems);
      console.log(`  📦 Items: ${enrichedItems.map(item => `${item.name} x${item.quantity}`).join(', ')}`);
      
      // Apply pricing rules
      const pricingResult = applyCustomPricingRules(enrichedItems);
      
      console.log(`  💵 Subtotal: ${formatCurrency(pricingResult.subtotal)}`);
      console.log(`  🎁 Discount: ${formatCurrency(pricingResult.totalDiscount)}`);
      console.log(`  💲 Final Total: ${formatCurrency(pricingResult.finalTotal)}`);
      
      if (pricingResult.rulesApplied.length > 0) {
        console.log(`  🏆 Rules Applied:`);
        pricingResult.rulesApplied
          .filter(rule => rule.applied)
          .forEach(rule => {
            console.log(`    - ${rule.name}: ${formatCurrency(rule.savings)} saved`);
          });
      } else {
        console.log(`  📝 No discount rules applied`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Demo function to showcase fulfillment processing
 */
export async function demoFulfillmentProcessing() {
  console.log('\n📦 FULFILLMENT PROCESSING DEMO');
  console.log('='.repeat(50));
  
  const orderId = generateOrderId();
  const cartItems = DEMO_CARTS.mediumCart;
  const enrichedItems = enrichCartItemsWithPrice(cartItems);
  
  // Demo order data
  const orderData = {
    orderId,
    customerInfo: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      address: {
        street: '123 Demo Street',
        city: 'Demo City',
        postalCode: '12345',
        country: 'US'
      }
    },
    items: enrichedItems.map(item => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price
    })),
    orderTotal: 289.98,
    shippingMethod: 'express' as const,
    paymentMethod: 'creditCard',
    orderDate: new Date()
  };
  
  console.log(`\n🚀 Processing Order: ${orderId}`);
  console.log(`📧 Customer: ${orderData.customerInfo.name} (${orderData.customerInfo.email})`);
  console.log(`📍 Shipping to: ${orderData.customerInfo.address.city}, ${orderData.customerInfo.address.country}`);
  console.log(`📦 Items: ${orderData.items.length} products`);
  console.log(`💰 Total: ${formatCurrency(orderData.orderTotal)}`);
  
  try {
    // Process fulfillment
    const fulfillmentResult = await processExternalFulfillment(orderData);
    
    console.log(`\n✅ Fulfillment Result:`);
    console.log(`  Success: ${fulfillmentResult.success ? 'Yes' : 'No'}`);
    console.log(`  Tracking ID: ${fulfillmentResult.trackingId}`);
    
    if (fulfillmentResult.success) {
      console.log(`  Carrier: ${fulfillmentResult.carrier}`);
      console.log(`  Shipping Cost: ${formatCurrency(fulfillmentResult.shippingCost || 0)}`);
      console.log(`  Estimated Delivery: ${fulfillmentResult.estimatedDelivery?.toLocaleDateString()}`);
    } else {
      console.log(`  Error: ${fulfillmentResult.error}`);
    }
    
    // Demo shipping estimate
    console.log(`\n📋 Shipping Estimates:`);
    const methods = ['standard', 'express', 'overnight'] as const;
    
    for (const method of methods) {
      const estimate = await getShippingEstimate(
        orderData.items.map(item => ({ quantity: item.quantity })),
        method,
        { country: orderData.customerInfo.address.country, postalCode: orderData.customerInfo.address.postalCode }
      );
      
      console.log(`  ${method}: ${formatCurrency(estimate.cost)} (${estimate.estimatedDays} days)`);
    }
    
    // Demo order tracking
    if (fulfillmentResult.trackingId) {
      console.log(`\n📍 Tracking Order:`);
      const trackingInfo = await trackOrder(fulfillmentResult.trackingId);
      console.log(`  Status: ${trackingInfo.status}`);
      console.log(`  Location: ${trackingInfo.location}`);
      console.log(`  Estimated Delivery: ${trackingInfo.estimatedDelivery.toLocaleDateString()}`);
      console.log(`  Recent Updates:`);
      trackingInfo.updates.slice(-2).forEach(update => {
        console.log(`    ${update.timestamp.toLocaleString()}: ${update.status} - ${update.location}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Fulfillment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Demo function to showcase complete order flow
 */
export async function demoCompleteOrderFlow() {
  console.log('\n🛒 COMPLETE ORDER FLOW DEMO');
  console.log('='.repeat(50));
  
  const cartItems = DEMO_CARTS.largeCart;
  
  console.log('\n1️⃣ Cart Validation & Enrichment');
  const validation = validateCartItems(cartItems);
  console.log(`   Validation: ${validation.isValid ? 'Passed' : 'Failed'}`);
  
  if (!validation.isValid) {
    console.log(`   Errors: ${validation.errors.join(', ')}`);
    return;
  }
  
  const enrichedItems = enrichCartItemsWithPrice(cartItems);
  console.log(`   Items enriched with pricing data ✓`);
  
  console.log('\n2️⃣ Pricing Rules Application');
  const pricingResult = applyCustomPricingRules(enrichedItems);
  console.log(`   Subtotal: ${formatCurrency(pricingResult.subtotal)}`);
  console.log(`   Discount: ${formatCurrency(pricingResult.totalDiscount)}`);
  console.log(`   Final Total: ${formatCurrency(pricingResult.finalTotal)}`);
  
  const appliedRules = pricingResult.rulesApplied.filter(rule => rule.applied);
  if (appliedRules.length > 0) {
    console.log(`   Applied Rules: ${appliedRules.map(r => r.name).join(', ')}`);
  }
  
  console.log('\n3️⃣ Order Creation & Fulfillment');
  const orderId = generateOrderId();
  console.log(`   Order ID: ${orderId}`);
  
  const fulfillmentData = {
    orderId,
    customerInfo: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      address: {
        street: '456 Commerce Blvd',
        city: 'Tech City',
        postalCode: '54321',
        country: 'US'
      }
    },
    items: enrichedItems.map(item => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price
    })),
    orderTotal: pricingResult.finalTotal,
    shippingMethod: 'express' as const,
    paymentMethod: 'creditCard',
    orderDate: new Date()
  };
  
  const fulfillmentResult = await processExternalFulfillment(fulfillmentData);
  console.log(`   Fulfillment: ${fulfillmentResult.success ? 'Success' : 'Failed'}`);
  console.log(`   Tracking ID: ${fulfillmentResult.trackingId}`);
  
  if (fulfillmentResult.success && fulfillmentResult.carrier) {
    console.log(`   Carrier: ${fulfillmentResult.carrier}`);
    console.log(`   Shipping Cost: ${formatCurrency(fulfillmentResult.shippingCost || 0)}`);
  }
  
  console.log('\n4️⃣ Order Summary');
  console.log(`   Order Total: ${formatCurrency(pricingResult.finalTotal)}`);
  console.log(`   Shipping: ${formatCurrency(fulfillmentResult.shippingCost || 0)}`);
  console.log(`   Grand Total: ${formatCurrency(pricingResult.finalTotal + (fulfillmentResult.shippingCost || 0))}`);
  console.log(`   Status: ${fulfillmentResult.success ? 'Confirmed' : 'Pending'}`);
}

/**
 * Run all demos
 */
export async function runAllDemos() {
  console.log('🎭 AURORA COMMERCE - CUSTOM LOGIC SERVICES DEMO');
  console.log('================================================');
  
  await demoPricingRules();
  await demoFulfillmentProcessing();
  await demoCompleteOrderFlow();
  
  console.log('\n🎉 All demos completed!');
  console.log('\nNext steps:');
  console.log('  • Test the API endpoints: /api/orders');
  console.log('  • Integrate these services into your components');
  console.log('  • Customize pricing rules for your business logic');
  console.log('  • Add real external API integrations');
}

// Auto-run if this file is executed directly
if (require.main === module) {
  runAllDemos().catch(console.error);
}