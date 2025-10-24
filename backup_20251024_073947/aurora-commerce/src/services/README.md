# Aurora Commerce - Custom Logic Services

This directory contains the core business logic services for Aurora Commerce. These services are designed to be isolated, reusable, and easily imported into API routes or other components.

## 🏗️ Architecture Overview

The custom logic is separated into focused service modules:

- **`pricing.ts`** - Custom pricing rules and discount calculations
- **`fulfillment.ts`** - External API integration for shipping and ERP systems  
- **`productService.ts`** - Product data management and cart utilities
- **`demo.ts`** - Comprehensive demonstration of all services

## 📦 Services

### Pricing Service (`pricing.ts`)

Handles custom pricing rules and discount calculations.

#### Key Functions:

```typescript
// Apply all pricing rules to a cart
applyCustomPricingRules(items: CartItemWithPrice[]): PricingResult

// Get available rules for UI display
getAvailablePricingRules(): PricingRule[]

// Calculate tax (customizable per region)
calculateTax(subtotal: number, taxRate?: number): number

// Format currency for display
formatCurrency(amount: number): string
```

#### Built-in Pricing Rules:

1. **Bulk Order Discount** - 10% off orders over $200
2. **Loyalty Customer Discount** - 5% off orders over $100 (for loyalty members)
3. **Free Shipping** - Free shipping on orders over $150
4. **Volume Discount** - 15% off when buying 3+ items

#### Example Usage:

```typescript
import { applyCustomPricingRules } from '../services/pricing';
import { enrichCartItemsWithPrice } from '../services/productService';

const cartItems = [
  { productId: '1', quantity: 2 },
  { productId: '2', quantity: 1 }
];

const enrichedItems = enrichCartItemsWithPrice(cartItems);
const pricingResult = applyCustomPricingRules(enrichedItems);

console.log(`Subtotal: $${pricingResult.subtotal}`);
console.log(`Discount: $${pricingResult.totalDiscount}`);
console.log(`Final Total: $${pricingResult.finalTotal}`);
```

### Fulfillment Service (`fulfillment.ts`)

Simulates external API integrations for shipping, ERP, and inventory management.

#### Key Functions:

```typescript
// Main fulfillment processing
processExternalFulfillment(orderData: FulfillmentOrderData): Promise<FulfillmentResult>

// Get shipping cost estimates
getShippingEstimate(items, shippingMethod, destination): Promise<{cost, estimatedDays}>

// Track an existing order
trackOrder(trackingId: string): Promise<TrackingInfo>
```

#### Simulated Integrations:

- **External Shipping APIs** (UPS, FedEx, DHL, USPS)
- **ERP System Notifications**
- **Inventory Management Updates**
- **Order Tracking**

#### Example Usage:

```typescript
import { processExternalFulfillment } from '../services/fulfillment';

const orderData = {
  orderId: 'ORD-123456',
  customerInfo: {
    name: 'John Doe',
    email: 'john@example.com',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      postalCode: '12345',
      country: 'US'
    }
  },
  items: enrichedItems,
  orderTotal: 299.99,
  shippingMethod: 'express',
  paymentMethod: 'creditCard',
  orderDate: new Date()
};

const result = await processExternalFulfillment(orderData);
console.log(`Tracking ID: ${result.trackingId}`);
console.log(`Estimated Delivery: ${result.estimatedDelivery}`);
```

### Product Service (`productService.ts`)

Provides product data management and cart utility functions.

#### Key Functions:

```typescript
// Product lookup
getProductById(productId: string): Product | null
getAllProducts(): Product[]
getProductsByCategory(category: string): Product[]
searchProducts(query: string): Product[]

// Cart utilities
enrichCartItemsWithPrice(cartItems: CartItem[]): CartItemWithPrice[]
validateCartItems(cartItems: CartItem[]): ValidationResult
calculateCartSubtotal(cartItems: CartItem[]): number

// Utility functions
generateOrderId(): string
isValidEmail(email: string): boolean
formatPrice(price: number): string
```

## 🚀 API Integration

These services are designed to be used in Next.js API routes:

```typescript
// /app/api/orders/route.ts
import { applyCustomPricingRules } from '../../../services/pricing';
import { processExternalFulfillment } from '../../../services/fulfillment';
import { enrichCartItemsWithPrice } from '../../../services/productService';

export async function POST(request: NextRequest) {
  const { cartItems, customerInfo, shippingMethod } = await request.json();
  
  // 1. Validate and enrich cart items
  const enrichedItems = enrichCartItemsWithPrice(cartItems);
  
  // 2. Apply pricing rules
  const pricingResult = applyCustomPricingRules(enrichedItems);
  
  // 3. Process fulfillment
  const fulfillmentResult = await processExternalFulfillment({
    orderId: generateOrderId(),
    customerInfo,
    items: enrichedItems,
    orderTotal: pricingResult.finalTotal,
    shippingMethod,
    // ... other fields
  });
  
  return NextResponse.json({
    orderId: fulfillmentResult.trackingId,
    pricing: pricingResult,
    fulfillment: fulfillmentResult
  });
}
```

## 🧪 Testing and Demos

### Running Demos

```bash
# Run all service demos
npm run demo

# Run specific demos
npm run demo:pricing
npm run demo:fulfillment

# Test all services
npm run test:services
```

### Demo Scenarios

The demo script includes several test scenarios:

- **Small Cart** - Single item, no discounts
- **Medium Cart** - Two items, potential loyalty discount  
- **Large Cart** - Multiple items, bulk discount eligible
- **Bulk Cart** - High quantity, volume discount eligible

## 🔧 Customization

### Adding New Pricing Rules

1. Create a new rule function in `pricing.ts`:

```typescript
function applyNewDiscountRule(subtotal: number): PricingRule {
  const rule: PricingRule = {
    id: 'new-rule-id',
    name: 'New Discount Rule',
    description: 'Custom discount logic',
    type: 'percentage',
    threshold: 100,
    discountValue: 5,
    applied: false,
    savings: 0
  };

  // Your custom logic here
  if (/* your condition */) {
    rule.applied = true;
    rule.savings = /* calculate savings */;
  }

  return rule;
}
```

2. Add it to the `applyCustomPricingRules` function:

```typescript
const allRules = [
  applyBulkDiscountRule(subtotal),
  applyLoyaltyDiscountRule(subtotal),
  applyFreeShippingRule(subtotal),
  applyQuantityDiscountRule(items, subtotal),
  applyNewDiscountRule(subtotal) // Add your new rule
];
```

### Extending Fulfillment

To add real external API integrations:

1. Replace mock functions in `fulfillment.ts` with actual API calls
2. Add proper error handling and retry logic
3. Implement webhook handlers for status updates
4. Add authentication for external services

## 📊 Monitoring and Logging

All services include comprehensive logging:

- **Pricing calculations** are logged with rule details
- **Fulfillment steps** are tracked with timestamps
- **API calls** are logged for debugging
- **Errors** include full context for troubleshooting

## 🔒 Security Considerations

- Services validate all input data
- External API calls include proper error handling
- Sensitive data is not logged
- Rate limiting should be implemented for external calls

## 📈 Performance

- Services are stateless and cacheable
- Product data can be cached with Redis
- Async operations use proper Promise handling
- Database queries should be optimized for production

## 🚀 Production Deployment

Before deploying to production:

1. Replace mock data with real database connections
2. Add proper environment variable configuration
3. Implement real external API integrations
4. Add monitoring and alerting
5. Set up proper logging infrastructure
6. Add rate limiting and security measures

---

## Example API Response

```json
{
  "success": true,
  "orderId": "ORD-ABC123",
  "pricing": {
    "subtotal": 659.97,
    "totalDiscount": 65.99,
    "finalTotal": 593.98,
    "rulesApplied": [
      {
        "id": "bulk-discount-200",
        "name": "Bulk Order Discount",
        "applied": true,
        "savings": 65.99
      }
    ]
  },
  "fulfillment": {
    "trackingId": "1ZXY789ABC123",
    "estimatedDelivery": "2024-10-25T00:00:00.000Z",
    "carrier": "UPS",
    "shippingCost": 19.99
  }
}
```

This architecture provides a solid foundation for scalable e-commerce business logic that can be easily extended and customized for specific business requirements.