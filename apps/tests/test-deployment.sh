#!/bin/bash

# Test script to verify order prioritization deployment
echo "🧪 Testing Order Prioritization Engine Deployment"
echo "=================================================="

# Step 1: Check current state of orders table
echo "📋 Step 1: Checking current orders table structure..."

# Test for missing columns (these should fail before deployment)
echo "Testing if priority_level column exists (should fail):"
curl -s -X GET 'https://iyenjqsvxizjucmjukvj.supabase.co/rest/v1/orders?select=priority_level&limit=0' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZW5qcXN2eGl6anVjbWp1a3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDgzMTcsImV4cCI6MjA3NjY4NDMxN30.4QshyOqI8s5z3Itw7YBwEoY1Q3NjG5h73vaLleaEAR0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZW5qcXN2eGl6anVjbWp1a3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDgzMTcsImV4cCI6MjA3NjY4NDMxN30.4QshyOqI8s5z3Itw7YBwEoY1Q3NjG5h73vaLleaEAR0"

echo ""
echo "Testing if order_number column exists (should fail):"
curl -s -X GET 'https://iyenjqsvxizjucmjukvj.supabase.co/rest/v1/orders?select=order_number&limit=0' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZW5qcXN2eGl6anVjbWp1a3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDgzMTcsImV4cCI6MjA3NjY4NDMxN30.4QshyOqI8s5z3Itw7YBwEoY1Q3NjG5h73vaLleaEAR0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZW5qcXN2eGl6anVjbWp1a3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDgzMTcsImV4cCI6MjA3NjY4NDMxN30.4QshyOqI8s5z3Itw7YBwEoY1Q3NjG5h73vaLleaEAR0"

echo ""
echo "Testing if customer_id column exists (should fail):"
curl -s -X GET 'https://iyenjqsvxizjucmjukvj.supabase.co/rest/v1/orders?select=customer_id&limit=0' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZW5qcXN2eGl6anVjbWp1a3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDgzMTcsImV4cCI6MjA3NjY4NDMxN30.4QshyOqI8s5z3Itw7YBwEoY1Q3NjG5h73vaLleaEAR0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZW5qcXN2eGl6anVjbWp1a3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDgzMTcsImV4cCI6MjA3NjY4NDMxN30.4QshyOqI8s5z3Itw7YBwEoY1Q3NjG5h73vaLleaEAR0"

echo ""
echo "✅ Pre-deployment verification complete."
echo "❌ All priority columns should be missing (showing errors above is expected)"
echo ""
echo "🚀 Now you should run the master-order-prioritization-setup.sql script in Supabase SQL Editor"
echo "📍 Location: /workspaces/ToolkikHeaven/aurora-commerce/database/master-order-prioritization-setup.sql"
echo ""
echo "After running the script, these columns should exist:"
echo "   - order_number"
echo "   - customer_id" 
echo "   - priority_level"
echo "   - priority_score"
echo "   - shipping_method"
echo "   - fulfillment_priority"
echo "   - is_high_value"
echo "   - is_vip_customer"
echo "   - priority_tags"
echo "   - And 15+ more priority-related columns"