const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function checkProductSchema() {
  
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
    Object.entries(data[0]).forEach(([key, value]) => {
    });
  }
  
  // Try to insert a test to see what fails
  const testData = {
    name: 'Test Product',
    description: 'Test',
    price: 100,
    category_id: null, // This is the problematic field
    vendor_id: 'a6552961-d379-43d1-aa23-320680d3199b', // String UUID
    stock: 10,
    status: 'draft',
  };
  
}

checkProductSchema().then(() => process.exit(0));
