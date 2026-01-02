#!/usr/bin/env node

/**
 * سكريبت فحص اتصال قاعدة البيانات
 * Database Connection Test Script
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔍 فحص اتصال قاعدة البيانات | Database Connection Test');
console.log('━'.repeat(70));

// فحص المتغيرات البيئية
console.log('\n📋 فحص المتغيرات البيئية | Checking Environment Variables:');
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ موجود' : '❌ مفقود'}`);
console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ موجود' : '❌ مفقود'}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ خطأ: المتغيرات البيئية مفقودة!');
  console.error('   تأكد من وجود ملف .env.local مع المتغيرات الصحيحة');
  process.exit(1);
}

console.log(`\n🌐 URL: ${supabaseUrl}`);
console.log(`🔑 Key: ${supabaseAnonKey.substring(0, 20)}...`);

// إنشاء عميل Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('\n🧪 اختبار الاتصال | Testing Connection...\n');
  
  try {
    // 1. اختبار الاتصال الأساسي
    console.log('1️⃣  اختبار الاتصال الأساسي...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.log('   ❌ فشل:', healthError.message);
      throw healthError;
    }
    console.log('   ✅ نجح الاتصال بقاعدة البيانات!');

    // 2. اختبار جدول users
    console.log('\n2️⃣  اختبار جدول المستخدمين (users)...');
    const { data: users, error: usersError, count: usersCount } = await supabase
      .from('users')
      .select('id, email, name, role', { count: 'exact' })
      .limit(3);
    
    if (usersError) {
      console.log('   ⚠️  خطأ:', usersError.message);
    } else {
      console.log(`   ✅ عدد المستخدمين: ${usersCount || 0}`);
      if (users && users.length > 0) {
        console.log('   📊 عينة من البيانات:');
        users.forEach((user, idx) => {
          console.log(`      ${idx + 1}. ${user.email} - ${user.role || 'customer'}`);
        });
      }
    }

    // 3. اختبار جدول vendors
    console.log('\n3️⃣  اختبار جدول البائعين (vendors)...');
    const { data: vendors, error: vendorsError, count: vendorsCount } = await supabase
      .from('vendors')
      .select('id, store_name, approval_status', { count: 'exact' })
      .limit(3);
    
    if (vendorsError) {
      console.log('   ⚠️  خطأ:', vendorsError.message);
    } else {
      console.log(`   ✅ عدد البائعين: ${vendorsCount || 0}`);
      if (vendors && vendors.length > 0) {
        console.log('   📊 عينة من البيانات:');
        vendors.forEach((vendor, idx) => {
          console.log(`      ${idx + 1}. ${vendor.store_name} - ${vendor.approval_status}`);
        });
      }
    }

    // 4. اختبار جدول products
    console.log('\n4️⃣  اختبار جدول المنتجات (products)...');
    const { data: products, error: productsError, count: productsCount } = await supabase
      .from('products')
      .select('id, name, price, status', { count: 'exact' })
      .limit(3);
    
    if (productsError) {
      console.log('   ⚠️  خطأ:', productsError.message);
    } else {
      console.log(`   ✅ عدد المنتجات: ${productsCount || 0}`);
      if (products && products.length > 0) {
        console.log('   📊 عينة من البيانات:');
        products.forEach((product, idx) => {
          console.log(`      ${idx + 1}. ${product.name} - ${product.price} ₪ - ${product.status}`);
        });
      }
    }

    // 5. اختبار جدول categories
    console.log('\n5️⃣  اختبار جدول التصنيفات (categories)...');
    const { data: categories, error: categoriesError, count: categoriesCount } = await supabase
      .from('categories')
      .select('id, name, is_active', { count: 'exact' })
      .limit(5);
    
    if (categoriesError) {
      console.log('   ⚠️  خطأ:', categoriesError.message);
    } else {
      console.log(`   ✅ عدد التصنيفات: ${categoriesCount || 0}`);
      if (categories && categories.length > 0) {
        console.log('   📊 التصنيفات المتاحة:');
        categories.forEach((category, idx) => {
          console.log(`      ${idx + 1}. ${category.name} - ${category.is_active ? 'نشط' : 'غير نشط'}`);
        });
      }
    }

    // 6. اختبار جدول orders
    console.log('\n6️⃣  اختبار جدول الطلبات (orders)...');
    const { data: orders, error: ordersError, count: ordersCount } = await supabase
      .from('orders')
      .select('id, total, status', { count: 'exact' })
      .limit(3);
    
    if (ordersError) {
      console.log('   ⚠️  خطأ:', ordersError.message);
    } else {
      console.log(`   ✅ عدد الطلبات: ${ordersCount || 0}`);
      if (orders && orders.length > 0) {
        console.log('   📊 عينة من البيانات:');
        orders.forEach((order, idx) => {
          console.log(`      ${idx + 1}. طلب #${order.id.substring(0, 8)} - ${order.total} ₪ - ${order.status}`);
        });
      }
    }

    // نتيجة نهائية
    console.log('\n' + '━'.repeat(70));
    console.log('✅ اكتمل الفحص بنجاح! | Test Completed Successfully!');
    console.log('━'.repeat(70));
    
    console.log('\n📊 ملخص النتائج | Summary:');
    console.log(`   • المستخدمين: ${usersCount || 0}`);
    console.log(`   • البائعين: ${vendorsCount || 0}`);
    console.log(`   • المنتجات: ${productsCount || 0}`);
    console.log(`   • التصنيفات: ${categoriesCount || 0}`);
    console.log(`   • الطلبات: ${ordersCount || 0}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ فشل الاختبار | Test Failed:');
    console.error('   الخطأ:', error.message);
    console.error('\n💡 الحلول المقترحة:');
    console.error('   1. تحقق من أن Supabase Project يعمل');
    console.error('   2. تحقق من صحة URL و API Key');
    console.error('   3. تحقق من Row Level Security (RLS) policies');
    console.error('   4. تحقق من أن الجداول موجودة في قاعدة البيانات');
    console.log('');
    process.exit(1);
  }
}

testConnection();
