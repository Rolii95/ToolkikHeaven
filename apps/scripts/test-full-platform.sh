#!/bin/bash

# Complete E-commerce Platform Test Script
# Tests all three major features: Payments, Analytics, and Email Marketing

echo "🚀 Testing Complete E-commerce Platform"
echo "======================================="

# Configuration
BASE_URL="http://localhost:3002"
TEST_EMAIL="test@example.com"

# Check server is running
echo "🔍 Checking if Next.js server is running..."
if ! curl -s "$BASE_URL" > /dev/null; then
    echo "❌ Server not running at $BASE_URL"
    echo "Please start the server with: npm run dev"
    exit 1
fi
echo "✅ Server is running"

echo ""
echo "📊 Testing Analytics Tracking..."

# Test analytics event tracking
curl -s -X POST "$BASE_URL/api/analytics/track" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "page_view",
    "customer_email": "'$TEST_EMAIL'",
    "page_url": "'$BASE_URL'/test"
  }' | grep -q "success" && echo "✅ Page view tracked" || echo "❌ Page view tracking failed"

curl -s -X POST "$BASE_URL/api/analytics/track" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "product_view",
    "customer_email": "'$TEST_EMAIL'",
    "product_id": "test-product-1"
  }' | grep -q "success" && echo "✅ Product view tracked" || echo "❌ Product view tracking failed"

curl -s -X POST "$BASE_URL/api/analytics/track" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "add_to_cart",
    "customer_email": "'$TEST_EMAIL'",
    "product_id": "test-product-1",
    "value": 29.99
  }' | grep -q "success" && echo "✅ Add to cart tracked" || echo "❌ Add to cart tracking failed"

echo ""
echo "📧 Testing Email Marketing..."

# Test abandoned cart
curl -s -X POST "$BASE_URL/api/email/abandoned-cart" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-123",
    "customer_email": "'$TEST_EMAIL'",
    "cart_items": [
      {"name": "Test Product", "price": 29.99, "quantity": 1}
    ],
    "cart_total": 29.99
  }' | grep -q "success" && echo "✅ Abandoned cart recorded" || echo "❌ Abandoned cart recording failed"

# Test email sending
curl -s "$BASE_URL/api/email/send?test=welcome_email&email=$TEST_EMAIL" | grep -q "success" && echo "✅ Welcome email sent" || echo "❌ Welcome email failed"

echo ""
echo "💳 Testing Payment Integration..."

# Test draft order creation
DRAFT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/orders/create-draft" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"name": "Test Product", "price": 29.99, "quantity": 1}],
    "customer": {"name": "Test User", "email": "'$TEST_EMAIL'"},
    "total": 29.99
  }')

ORDER_ID=$(echo $DRAFT_RESPONSE | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4)
if [ -n "$ORDER_ID" ]; then
    echo "✅ Draft order created: $ORDER_ID"
else
    echo "❌ Draft order creation failed"
    echo "Response: $DRAFT_RESPONSE"
fi

# Test checkout session creation
if [ -n "$ORDER_ID" ]; then
    CHECKOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/payments" \
      -H "Content-Type: application/json" \
      -d '{
        "items": [{"name": "Test Product", "price": 29.99, "quantity": 1}],
        "customerEmail": "'$TEST_EMAIL'",
        "metadata": {"order_id": "'$ORDER_ID'"}
      }')
    
    echo $CHECKOUT_RESPONSE | grep -q "url" && echo "✅ Stripe checkout session created" || echo "❌ Stripe checkout session failed"
fi

echo ""
echo "📈 Testing Dashboard APIs..."

# Test analytics dashboard
curl -s "$BASE_URL/api/analytics/dashboard?days=7" | grep -q "summary" && echo "✅ Analytics dashboard API working" || echo "❌ Analytics dashboard API failed"

# Test abandoned cart data
curl -s "$BASE_URL/api/email/abandoned-cart" | grep -q "abandoned_carts" && echo "✅ Abandoned cart API working" || echo "❌ Abandoned cart API failed"

echo ""
echo "🎉 Integration test completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Visit $BASE_URL/admin/analytics to see analytics dashboard"
echo "2. Visit $BASE_URL/admin/email to see email marketing dashboard"
echo "3. Visit $BASE_URL/admin/orders to see order management"
echo "4. Configure email settings in .env for actual email sending"
echo "5. Set up Stripe webhook listener for payment processing"
echo ""
echo "🔧 Environment Variables Needed:"
echo "- STRIPE_SECRET_KEY"
echo "- STRIPE_WEBHOOK_SECRET"
echo "- NEXT_PUBLIC_SUPABASE_URL"
echo "- SUPABASE_SERVICE_ROLE_KEY"
echo "- EMAIL_SERVICE (gmail/sendgrid/postmark/smtp)"
echo "- SMTP_HOST, SMTP_USER, SMTP_PASS (for SMTP)"
echo "- NEXT_PUBLIC_APP_URL"