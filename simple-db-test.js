const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...\n');
console.log('URL:', url);
console.log('Key:', key ? key.substring(0, 30) + '...' : 'MISSING');

if (!url || !key) {
  console.error('ERROR: Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  try {
    console.log('\nTesting users table...');
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error('ERROR:', error.message);
      return;
    }
    
    console.log('SUCCESS! Users count:', count);
    console.log('Sample data:', data);
  } catch (err) {
    console.error('EXCEPTION:', err.message);
  }
}

test().then(() => {
  console.log('\nTest completed.');
  process.exit(0);
});
