// Test Priority System - Run this in browser console or as a script

async function testOrderPrioritization() {
  console.log('🚀 Testing Order Prioritization System...');
  
  // Test 1: Create a high-value VIP order
  const highValueOrder = {
    order_number: `TEST-HV-${Date.now()}`,
    customer_email: 'vip@example.com',
    total_amount: 1250.00,
    shipping_method: 'express',
    items: [
      {
        product_name: 'Premium Product',
        quantity: 2,
        unit_price: 625.00,
        total_price: 1250.00
      }
    ],
    subtotal: 1125.00,
    tax_amount: 112.50,
    shipping_amount: 12.50
  };

  // Test 2: Create a standard order
  const standardOrder = {
    order_number: `TEST-STD-${Date.now()}`,
    customer_email: 'customer@example.com', 
    total_amount: 85.00,
    shipping_method: 'standard',
    items: [
      {
        product_name: 'Regular Product',
        quantity: 1,
        unit_price: 85.00,
        total_price: 85.00
      }
    ],
    subtotal: 75.00,
    tax_amount: 7.50,
    shipping_amount: 2.50
  };

  try {
    // Create orders via your API
    const response1 = await fetch('http://localhost:3002/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(highValueOrder)
    });
    
    const response2 = await fetch('http://localhost:3002/api/orders', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(standardOrder)
    });

    if (response1.ok && response2.ok) {
      console.log('✅ Test orders created successfully!');
      console.log('📊 Check your admin dashboard at /admin/orders');
      console.log('🔍 High-value order should have priority_level = 1 or 2');
      console.log('📦 Standard order should have priority_level = 3');
    } else {
      console.error('❌ Failed to create test orders');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testOrderPrioritization();