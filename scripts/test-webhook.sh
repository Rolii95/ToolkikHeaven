#!/bin/bash

# Stripe Webhook Test Script
# This script tests your Stripe webhook endpoint

echo "🔗 Testing Stripe Webhook Endpoint"
echo "=================================="

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Server not running. Please start with: npm run dev"
    exit 1
fi

echo "✅ Server is running"

# Test webhook endpoint
echo ""
echo "🧪 Testing webhook endpoint..."
echo "URL: http://localhost:3000/api/stripe/webhook"

# Test POST request (should fail signature verification, which is expected)
response=$(curl -s -X POST http://localhost:3000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}' \
  -w "HTTP_STATUS:%{http_code}")

http_status=$(echo $response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo $response | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Response Status: $http_status"
echo "Response Body: $response_body"

if [ "$http_status" = "400" ]; then
    if echo "$response_body" | grep -q "signature verification failed"; then
        echo "✅ Webhook endpoint is working correctly!"
        echo "   (Signature verification failure is expected without valid Stripe signature)"
    else
        echo "⚠️  Unexpected response, but endpoint is accessible"
    fi
elif [ "$http_status" = "500" ]; then
    if echo "$response_body" | grep -q "Stripe not configured"; then
        echo "⚠️  Stripe not configured - please add your API keys to .env.local"
        echo "   Required variables:"
        echo "   - STRIPE_SECRET_KEY"
        echo "   - STRIPE_WEBHOOK_SECRET"
        echo "   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    else
        echo "❌ Server error: $response_body"
    fi
else
    echo "❌ Unexpected status code: $http_status"
    echo "Response: $response_body"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Add your Stripe API keys to .env.local"
echo "2. Create webhook in Stripe Dashboard"
echo "3. Set webhook URL to: http://localhost:3000/api/stripe/webhook (for local dev)"
echo "4. For production: https://your-domain.com/api/stripe/webhook"
echo ""
echo "📖 See STRIPE_WEBHOOK_SETUP.md for detailed instructions"