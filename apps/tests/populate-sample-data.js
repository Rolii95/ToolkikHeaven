// Script to populate sample review data
require('dotenv').config({ path: '.env.local' });

const populateSampleData = async () => {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🌱 Populating sample review data...');
  
  // Sample reviews with demo user IDs
  const sampleReviews = [
    {
      product_id: '1',
      user_id: '00000000-0000-0000-0000-000000000001',
      rating: 5,
      review_text: 'Absolutely fantastic product! The quality exceeded my expectations and delivery was lightning fast. Would definitely recommend to anyone looking for premium wireless headphones.',
      helpful_votes: 15
    },
    {
      product_id: '1',
      user_id: '00000000-0000-0000-0000-000000000002',
      rating: 4,
      review_text: 'Great headphones with excellent sound quality. The noise cancellation works really well. Only minor complaint is the battery life could be better, but overall very satisfied.',
      helpful_votes: 8
    },
    {
      product_id: '1',
      user_id: '00000000-0000-0000-0000-000000000003',
      rating: 5,
      review_text: 'Perfect for my daily commute. The comfort is outstanding and I can wear them for hours without any discomfort.',
      helpful_votes: 12
    },
    {
      product_id: '2',
      user_id: '00000000-0000-0000-0000-000000000004',
      rating: 5,
      review_text: 'Perfect fitness watch! Tracks everything I need and the battery lasts for days. The health monitoring features are incredibly accurate and helpful for my workout routine.',
      helpful_votes: 22
    },
    {
      product_id: '2',
      user_id: '00000000-0000-0000-0000-000000000005',
      rating: 4,
      review_text: 'Really good fitness tracker. GPS is accurate and the app is user-friendly. Would like more customization options for the watch face.',
      helpful_votes: 7
    },
    {
      product_id: '3',
      user_id: '00000000-0000-0000-0000-000000000006',
      rating: 4,
      review_text: 'Very comfortable office chair. The ergonomic design has really helped with my back pain during long work sessions. Assembly was straightforward and build quality is solid.',
      helpful_votes: 18
    },
    {
      product_id: '3',
      user_id: '00000000-0000-0000-0000-000000000007',
      rating: 5,
      review_text: 'Best chair I have ever owned! Worth every penny. My productivity has increased significantly since I am no longer distracted by back pain.',
      helpful_votes: 25
    },
    {
      product_id: '4',
      user_id: '00000000-0000-0000-0000-000000000008',
      rating: 5,
      review_text: 'Amazing portable speaker! Sound quality is incredible for the size, and being waterproof makes it perfect for beach trips. Highly recommend!',
      helpful_votes: 14
    }
  ];

  // Sample user profiles to match the reviews
  const sampleProfiles = [
    { id: '00000000-0000-0000-0000-000000000001', display_name: 'Alex Chen', avatar_url: null },
    { id: '00000000-0000-0000-0000-000000000002', display_name: 'Sarah Johnson', avatar_url: null },
    { id: '00000000-0000-0000-0000-000000000003', display_name: 'Mike Rodriguez', avatar_url: null },
    { id: '00000000-0000-0000-0000-000000000004', display_name: 'Emily Davis', avatar_url: null },
    { id: '00000000-0000-0000-0000-000000000005', display_name: 'James Wilson', avatar_url: null },
    { id: '00000000-0000-0000-0000-000000000006', display_name: 'Lisa Anderson', avatar_url: null },
    { id: '00000000-0000-0000-0000-000000000007', display_name: 'David Thompson', avatar_url: null },
    { id: '00000000-0000-0000-0000-000000000008', display_name: 'Jennifer Lee', avatar_url: null }
  ];

  // Insert user profiles first
  console.log('👤 Inserting user profiles...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(sampleProfiles)
    });
    
    if (response.ok) {
      console.log('   ✅ User profiles inserted successfully');
    } else {
      const errorData = await response.text();
      console.log('   ⚠️ User profiles warning:', response.status, errorData.substring(0, 200));
    }
  } catch (error) {
    console.log('   ❌ Error inserting user profiles:', error.message);
  }

  // Insert reviews
  console.log('');
  console.log('📝 Inserting reviews...');
  let successCount = 0;
  
  for (let i = 0; i < sampleReviews.length; i++) {
    const review = sampleReviews[i];
    console.log(`   Inserting review ${i + 1}/${sampleReviews.length} for product ${review.product_id}...`);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/product_reviews`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(review)
      });
      
      if (response.ok) {
        console.log(`   ✅ Review ${i + 1} inserted successfully`);
        successCount++;
      } else {
        const errorData = await response.text();
        console.log(`   ⚠️ Review ${i + 1} warning:`, response.status, errorData.substring(0, 100));
      }
    } catch (error) {
      console.log(`   ❌ Review ${i + 1} failed:`, error.message);
    }
  }

  console.log('');
  console.log(`📊 Insert Summary: ${successCount}/${sampleReviews.length} reviews inserted`);

  // Test the results
  console.log('');
  console.log('🔍 Testing review data...');
  
  const productIds = ['1', '2', '3', '4'];
  
  for (const productId of productIds) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_product_average_rating`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          product_id_param: productId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const result = data[0];
        console.log(`   Product ${productId}: ${result.total_reviews} reviews, ${result.average_rating} avg rating`);
      } else {
        console.log(`   Product ${productId}: Error fetching stats`);
      }
    } catch (error) {
      console.log(`   Product ${productId}: ${error.message}`);
    }
  }

  console.log('');
  console.log('🎉 Sample data population complete!');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. Start the development server: npm run dev');
  console.log('   2. Visit http://localhost:3000 to see the reviews in action');
  console.log('   3. Check product detail pages for review displays');
  console.log('   4. Test the review submission form');
};

populateSampleData();