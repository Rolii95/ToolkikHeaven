#!/bin/bash

echo "🔧 Testing the items column NOT NULL constraint fix..."
echo "=================================================="

# Test 1: Try to create an order with items column explicitly set
echo "📋 Test 1: Creating order with items column..."
curl -s -X POST 'https://iyenjqsvxizjucmjukvj.supabase.co/rest/v1/orders' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZW5qcXN2eGl6anVjbWp1a3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDgzMTcsImV4cCI6MjA3NjY4NDMxN30.4QshyOqI8s5z3Itw7YBwEoY1Q3NjG5h73vaLleaEAR0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZW5qcXN2eGl6anVjbWp1a3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDgzMTcsImV4cCI6MjA3NjY4NDMxN30.4QshyOqI8s5z3Itw7YBwEoY1Q3NjG5h73vaLleaEAR0" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "total_amount": 150.00,
    "status": "pending", 
    "items": []
  }'

echo ""
echo ""

# Test 2: Check if we can read orders with items column
echo "📋 Test 2: Reading orders to verify items column structure..."
curl -s -X GET 'https://iyenjqsvxizjucmjukvj.supabase.co/rest/v1/orders?select=id,total_amount,items,status&limit=3' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZW5qcXN2eGl6anVjbWp1a3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDgzMTcsImV4cCI6MjA3NjY4NDMxN30.4QshyOqI8s5z3Itw7YBwEoY1Q3NjG5h73vaLleaEAR0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZW5qcXN2eGl6anVjbWp1a3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDgzMTcsImV4cCI6MjA3NjY4NDMxN30.4QshyOqI8s5z3Itw7YBwEoY1Q3NjG5h73vaLleaEAR0"

echo ""
echo ""

echo "✅ Tests complete!"
echo ""
echo "🚀 The fixed master script should now handle the items NOT NULL constraint."
echo "💡 Key fixes applied:"
echo "   1. Added explicit 'items': '[]'::jsonb in sample data INSERT"
echo "   2. Added safety UPDATE to populate NULL items before inserting"
echo "   3. Expanded UPDATE WHERE clause to handle all new columns"
echo ""
echo "📍 Ready to run: /workspaces/ToolkikHeaven/aurora-commerce/database/master-order-prioritization-setup.sql"