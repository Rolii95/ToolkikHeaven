// Script to run the database migration
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const runMigration = async () => {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🚀 Running database migration...');
  
  // Read the migration SQL file
  const migrationSQL = fs.readFileSync('./supabase/migrations/001_create_product_reviews.sql', 'utf8');
  
  // Split the SQL into individual statements
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  console.log(`   Found ${statements.length} SQL statements to execute`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    
    // Skip comments and empty statements
    if (statement.startsWith('--') || statement.trim() === ';') {
      continue;
    }
    
    console.log(`   Executing statement ${i + 1}/${statements.length}...`);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          sql: statement
        })
      });
      
      if (response.ok) {
        console.log(`   ✅ Statement ${i + 1} executed successfully`);
        successCount++;
      } else {
        const errorData = await response.text();
        console.log(`   ⚠️ Statement ${i + 1} warning:`, response.status, errorData.substring(0, 100));
      }
    } catch (error) {
      console.log(`   ❌ Statement ${i + 1} failed:`, error.message);
      errorCount++;
    }
  }
  
  console.log('');
  console.log(`📊 Migration Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  // Test the function after migration
  console.log('');
  console.log('🧪 Testing database function...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_product_average_rating`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        product_id_param: "1"
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Function test successful:', data);
    } else {
      const errorData = await response.text();
      console.log('   ❌ Function test failed:', response.status, errorData);
    }
  } catch (error) {
    console.log('   ❌ Function test error:', error.message);
  }
  
  console.log('');
  console.log('🎉 Migration script complete!');
};

runMigration();