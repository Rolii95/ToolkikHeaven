// Direct Supabase connection test
require('dotenv').config({ path: '.env.local' });

const testSupabaseConnection = async () => {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔍 Testing Direct Supabase Connection');
  console.log('URL:', SUPABASE_URL);
  console.log('Key starts with:', SUPABASE_KEY?.substring(0, 20) + '...');
  console.log('');

  // Test 1: Basic REST API connection
  console.log('📡 Test 1: Testing REST API connection...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ REST API connection successful');
      const data = await response.text();
      console.log('   Response type:', response.headers.get('content-type'));
    } else {
      console.log('❌ REST API connection failed:', response.status, response.statusText);
      return;
    }
  } catch (error) {
    console.log('❌ REST API connection failed:', error.message);
    return;
  }

  // Test 2: Check if product_reviews table exists
  console.log('');
  console.log('📋 Test 2: Checking product_reviews table...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/product_reviews?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ product_reviews table accessible');
      console.log('   Current reviews:', data.length);
    } else {
      console.log('❌ product_reviews table not accessible:', response.status, response.statusText);
      const errorData = await response.text();
      console.log('   Error details:', errorData);
    }
  } catch (error) {
    console.log('❌ Error checking product_reviews table:', error.message);
  }

  // Test 3: Check if user_profiles table exists
  console.log('');
  console.log('👤 Test 3: Checking user_profiles table...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ user_profiles table accessible');
      console.log('   Current profiles:', data.length);
    } else {
      console.log('❌ user_profiles table not accessible:', response.status, response.statusText);
      const errorData = await response.text();
      console.log('   Error details:', errorData);
    }
  } catch (error) {
    console.log('❌ Error checking user_profiles table:', error.message);
  }

  console.log('');
  console.log('🎉 Direct connection test complete!');
};

testSupabaseConnection();