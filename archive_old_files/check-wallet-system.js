const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wgdbykscahoibyuwxnjc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZGJ5a3NjYWhvaWJ5dXd4bmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NTM3MzAsImV4cCI6MjA1MTIyOTczMH0.zVU5rQC4jdYvqsglGSXTyU7dDa4BXF3LY_9VPh2pVVk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWalletSystem() {
  console.log('🔍 Checking vendor_wallets table...\n');
  
  // Query vendor_wallets
  const { data: wallets, error: walletsError } = await supabase
    .from('vendor_wallets')
    .select('*')
    .limit(3);
  
  if (walletsError) {
    console.error('❌ Error querying vendor_wallets:', walletsError);
  } else {
    console.log('✅ vendor_wallets data:');
    console.log(JSON.stringify(wallets, null, 2));
  }
  
  console.log('\n🔍 Checking wallet_transactions table...\n');
  
  // Check if wallet_transactions exists
  const { data: transactions, error: transError } = await supabase
    .from('wallet_transactions')
    .select('*')
    .limit(3);
  
  if (transError) {
    if (transError.code === '42P01') {
      console.log('❌ wallet_transactions table does NOT exist');
    } else {
      console.error('❌ Error querying wallet_transactions:', transError);
    }
  } else {
    console.log('✅ wallet_transactions data:');
    console.log(JSON.stringify(transactions, null, 2));
  }
  
  console.log('\n🔍 Checking order_items commission fields...\n');
  
  // Query order_items
  const { data: orderItems, error: orderError } = await supabase
    .from('order_items')
    .select('id, commission_amount, commission_percentage')
    .limit(3);
  
  if (orderError) {
    console.error('❌ Error querying order_items:', orderError);
  } else {
    console.log('✅ order_items commission columns:');
    console.log(JSON.stringify(orderItems, null, 2));
  }
}

checkWalletSystem().catch(console.error);
