// Simple test script to verify the checkout API route
const testCheckoutAPI = async () => {
  const checkoutPayload = {
    customerInfo: {
      name: "John Doe",
      email: "john@example.com",
      address: {
        street: "123 Main St",
        city: "San Francisco",
        postalCode: "94102",
        country: "US"
      }
    },
    paymentMethod: "creditCard",
    shippingMethod: "standard"
  };

  console.log('Testing checkout API endpoint...');
  console.log('Payload:', JSON.stringify(checkoutPayload, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutPayload)
    });

    const result = await response.json();

    console.log('\n--- API Response ---');
    console.log('Status:', response.status);
    console.log('Success:', response.ok);
    console.log('Result:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Checkout API test successful!');
      console.log('Order ID:', result.orderId);
      console.log('Total:', result.orderTotal);
      console.log('Applied pricing rules:', result.pricingRulesApplied?.length || 0);
      console.log('Fulfillment status:', result.fulfillmentDetails?.status);
    } else {
      console.log('\n❌ Checkout API test failed:', result.error);
    }

  } catch (error) {
    console.error('\n❌ Error testing checkout API:', error.message);
  }
};

// Run the test
testCheckoutAPI();