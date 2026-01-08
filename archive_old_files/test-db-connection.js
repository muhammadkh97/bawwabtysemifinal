#!/usr/bin/env node

/**
 * سكريبت فحص اتصال قاعدة البيانات
 * Database Connection Test Script
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


// فحص المتغيرات البيئية

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ خطأ: المتغيرات البيئية مفقودة!');
  console.error('   تأكد من وجود ملف .env.local مع المتغيرات الصحيحة');
  process.exit(1);
}


// إنشاء عميل Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  
  try {
    // 1. اختبار الاتصال الأساسي
    const { data: healthCheck, error: healthError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      throw healthError;
    }

    // 2. اختبار جدول users
    const { data: users, error: usersError, count: usersCount } = await supabase
      .from('users')
      .select('id, email, name, role', { count: 'exact' })
      .limit(3);
    
    if (usersError) {
    } else {
      if (users && users.length > 0) {
        users.forEach((user, idx) => {
        });
      }
    }

    // 3. اختبار جدول vendors
    const { data: vendors, error: vendorsError, count: vendorsCount } = await supabase
      .from('vendors')
      .select('id, store_name, approval_status', { count: 'exact' })
      .limit(3);
    
    if (vendorsError) {
    } else {
      if (vendors && vendors.length > 0) {
        vendors.forEach((vendor, idx) => {
        });
      }
    }

    // 4. اختبار جدول products
    const { data: products, error: productsError, count: productsCount } = await supabase
      .from('products')
      .select('id, name, price, status', { count: 'exact' })
      .limit(3);
    
    if (productsError) {
    } else {
      if (products && products.length > 0) {
        products.forEach((product, idx) => {
        });
      }
    }

    // 5. اختبار جدول categories
    const { data: categories, error: categoriesError, count: categoriesCount } = await supabase
      .from('categories')
      .select('id, name, is_active', { count: 'exact' })
      .limit(5);
    
    if (categoriesError) {
    } else {
      if (categories && categories.length > 0) {
        categories.forEach((category, idx) => {
        });
      }
    }

    // 6. اختبار جدول orders
    const { data: orders, error: ordersError, count: ordersCount } = await supabase
      .from('orders')
      .select('id, total, status', { count: 'exact' })
      .limit(3);
    
    if (ordersError) {
    } else {
      if (orders && orders.length > 0) {
        orders.forEach((order, idx) => {
        });
      }
    }

    // نتيجة نهائية
    

  } catch (error) {
    console.error('\n❌ فشل الاختبار | Test Failed:');
    console.error('   الخطأ:', error.message);
    console.error('\n💡 الحلول المقترحة:');
    console.error('   1. تحقق من أن Supabase Project يعمل');
    console.error('   2. تحقق من صحة URL و API Key');
    console.error('   3. تحقق من Row Level Security (RLS) policies');
    console.error('   4. تحقق من أن الجداول موجودة في قاعدة البيانات');
    process.exit(1);
  }
}

testConnection();
