const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


if (!url || !key) {
  console.error('ERROR: Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  try {
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error('ERROR:', error.message);
      return;
    }
    
  } catch (err) {
    console.error('EXCEPTION:', err.message);
  }
}

test().then(() => {
  process.exit(0);
});
