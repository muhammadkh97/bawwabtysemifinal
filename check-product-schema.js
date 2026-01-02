const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function checkProductSchema() {
  console.log('Checking products table schema...\n');
  
  // Get a sample product to see the structure
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Sample product structure:');
    console.log(JSON.stringify(data[0], null, 2));
    console.log('\nField types:');
    Object.entries(data[0]).forEach(([key, value]) => {
      console.log(`  ${key}: ${typeof value} (${value === null ? 'null' : value.constructor.name})`);
    });
  }
  
  // Try to insert a test to see what fails
  console.log('\n\nTesting insert with proper types...');
  const testData = {
    name: 'Test Product',
    description: 'Test',
    price: 100,
    category_id: null, // This is the problematic field
    vendor_id: 'a6552961-d379-43d1-aa23-320680d3199b', // String UUID
    stock: 10,
    status: 'draft',
  };
  
  console.log('Test data:', JSON.stringify(testData, null, 2));
}

checkProductSchema().then(() => process.exit(0));
