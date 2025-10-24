#!/bin/bash

# Stripe Payment Integration Test Script
# This script tests the payment endpoints locally

echo "🧪 Testing Stripe Payment Integration"
echo "======================================"

# Check if environment variables are set
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "❌ STRIPE_SECRET_KEY not set"
    echo "Please set: export STRIPE_SECRET_KEY=sk_test_..."
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL not set"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY not set"
    exit 1
fi

echo "✅ Environment variables configured"

# Test data
TEST_ITEMS='[{"name":"Test Product","price":29.99,"quantity":1}]'
TEST_CUSTOMER='{"name":"Test User","email":"test@example.com"}'
TEST_TOTAL=29.99

echo ""
echo "📝 Step 1: Testing draft order creation..."

# Create draft order
DRAFT_RESPONSE=$(curl -s -X POST http://localhost:3002/api/orders/create-draft \
  -H "Content-Type: application/json" \
  -d "{\"items\":$TEST_ITEMS,\"customer\":$TEST_CUSTOMER,\"total\":$TEST_TOTAL}")

echo "Draft order response: $DRAFT_RESPONSE"

# Extract order ID
ORDER_ID=$(echo $DRAFT_RESPONSE | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ORDER_ID" ]; then
    echo "❌ Failed to create draft order"
    exit 1
fi

echo "✅ Draft order created with ID: $ORDER_ID"

echo ""
echo "💳 Step 2: Testing Stripe checkout session creation..."

# Create checkout session
CHECKOUT_RESPONSE=$(curl -s -X POST http://localhost:3002/api/payments \
  -H "Content-Type: application/json" \
  -d "{\"items\":$TEST_ITEMS,\"customerEmail\":\"test@example.com\",\"metadata\":{\"order_id\":\"$ORDER_ID\"}}")

echo "Checkout response: $CHECKOUT_RESPONSE"

# Check if URL is present
CHECKOUT_URL=$(echo $CHECKOUT_RESPONSE | grep -o '"url":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CHECKOUT_URL" ]; then
    echo "❌ Failed to create checkout session"
    exit 1
fi

echo "✅ Checkout session created"
echo "🔗 Checkout URL: $CHECKOUT_URL"

echo ""
echo "🎉 Payment integration test completed successfully!"
echo ""
echo "Next steps:"
echo "1. Start webhook listener: stripe listen --forward-to localhost:3002/api/stripe/webhook"
echo "2. Complete test payment at: $CHECKOUT_URL"
echo "3. Check order status in admin dashboard"