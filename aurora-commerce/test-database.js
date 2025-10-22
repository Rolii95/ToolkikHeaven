// Test script to verify Supabase connection and populate sample review data
const testDatabaseConnection = async () => {
  console.log('🔍 Testing Supabase Database Connection\n');
  
  // Test 1: Verify we can connect to the reviews API
  console.log('📡 Test 1: Testing API connection...');
  try {
    const response = await fetch('http://localhost:3000/api/reviews?product_id=1');
    const data = await response.json();
    
    console.log('✅ API connection successful!');
    console.log('   Response status:', response.status);
    console.log('   Reviews found:', data.reviews?.length || 0);
    console.log('   Average rating:', data.stats?.average_rating || 'N/A');
    
    if (data.reviews && data.reviews.length > 0) {
      console.log('   Using:', data.reviews[0].id?.includes('mock') ? 'Mock data' : 'Real database data');
    }
  } catch (error) {
    console.log('❌ API connection failed:', error.message);
    return;
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 2: Try to submit a sample review
  console.log('📝 Test 2: Submitting sample review data...');
  
  const sampleReviews = [
    {
      product_id: '1',
      rating: 5,
      review_text: 'Absolutely fantastic product! The quality exceeded my expectations and delivery was lightning fast. Would definitely recommend to anyone looking for premium wireless headphones.'
    },
    {
      product_id: '1', 
      rating: 4,
      review_text: 'Great headphones with excellent sound quality. The noise cancellation works really well. Only minor complaint is the battery life could be better, but overall very satisfied.'
    },
    {
      product_id: '2',
      rating: 5,
      review_text: 'Perfect fitness watch! Tracks everything I need and the battery lasts for days. The health monitoring features are incredibly accurate and helpful for my workout routine.'
    },
    {
      product_id: '3',
      rating: 4,
      review_text: 'Very comfortable office chair. The ergonomic design has really helped with my back pain during long work sessions. Assembly was straightforward and build quality is solid.'
    },
    {
      product_id: '4',
      rating: 5,
      review_text: 'Amazing portable speaker! Sound quality is incredible for the size, and being waterproof makes it perfect for beach trips. Highly recommend!'
    }
  ];
  
  let successfulSubmissions = 0;
  
  for (let i = 0; i < sampleReviews.length; i++) {
    const review = sampleReviews[i];
    console.log(`   Submitting review ${i + 1}/${sampleReviews.length} for product ${review.product_id}...`);
    
    try {
      const response = await fetch('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(review)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`   ✅ Review ${i + 1} submitted successfully`);
        successfulSubmissions++;
      } else {
        console.log(`   ⚠️ Review ${i + 1} submission warning:`, result.message || result.error);
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`   ❌ Review ${i + 1} submission failed:`, error.message);
    }
  }
  
  console.log(`\n📊 Submission Summary: ${successfulSubmissions}/${sampleReviews.length} reviews submitted successfully`);
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 3: Verify the reviews are now in the system
  console.log('🔄 Test 3: Verifying review data...');
  
  const productIds = ['1', '2', '3', '4'];
  
  for (const productId of productIds) {
    try {
      const response = await fetch(`http://localhost:3000/api/reviews?product_id=${productId}`);
      const data = await response.json();
      
      console.log(`   Product ${productId}:`);
      console.log(`     Reviews: ${data.stats.total_reviews}`);
      console.log(`     Average Rating: ${data.stats.average_rating}`);
      console.log(`     Latest Review: "${data.reviews[0]?.review_text?.substring(0, 50)}..."`);
      
    } catch (error) {
      console.log(`   Product ${productId}: Error fetching data`);
    }
  }
  
  console.log('\n🎉 Database connection and review system test complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Check the application at http://localhost:3000');
  console.log('   2. Navigate to product detail pages to see reviews');
  console.log('   3. Try submitting a review using the "Write a Review" button');
  console.log('   4. Verify star ratings appear on product cards');
  
  console.log('\n🔧 If using real Supabase database:');
  console.log('   ✓ Update .env.local with your actual Supabase URL and keys');
  console.log('   ✓ Ensure RLS policies allow your service role to insert/read');
  console.log('   ✓ Check Supabase dashboard for review data');
};

// Run the test
testDatabaseConnection();