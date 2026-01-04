-- =====================================================
-- 🔍 سكريبتات فحص قاعدة البيانات
-- نفذ كل سكريبت بشكل منفصل وانسخ النتيجة
-- =====================================================

-- =====================================================
-- 📊 السكريبت 1: فحص جدول vendor_wallets
-- =====================================================
SELECT 
  'vendor_wallets' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vendor_wallets'
  ) as table_exists;

-- =====================================================
-- 📋 السكريبت 2: عرض أعمدة vendor_wallets
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'vendor_wallets'
ORDER BY ordinal_position;

-- =====================================================
-- 🔐 السكريبت 3: عرض RLS وسياسات vendor_wallets
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'vendor_wallets'
ORDER BY policyname;

-- =====================================================
-- ✅ السكريبت 4: فحص عمود helpful_count في reviews
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'reviews'
AND column_name = 'helpful_count';

-- =====================================================
-- 📦 السكريبت 5: فحص جدول coupons
-- =====================================================
SELECT 
  'coupons' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'coupons'
  ) as table_exists;

-- =====================================================
-- 🔐 السكريبت 6: عرض سياسات coupons
-- =====================================================
SELECT 
  policyname,
  cmd as operation,
  permissive,
  roles,
  CASE 
    WHEN length(qual) > 100 THEN substring(qual from 1 for 100) || '...'
    ELSE qual
  END as using_expression,
  CASE 
    WHEN length(with_check) > 100 THEN substring(with_check from 1 for 100) || '...'
    ELSE with_check
  END as with_check_expression
FROM pg_policies
WHERE tablename = 'coupons'
ORDER BY policyname;

-- =====================================================
-- 🔐 السكريبت 7: عرض سياسات coupon_usage
-- =====================================================
SELECT 
  policyname,
  cmd as operation,
  permissive,
  roles,
  CASE 
    WHEN length(qual) > 100 THEN substring(qual from 1 for 100) || '...'
    ELSE qual
  END as using_expression
FROM pg_policies
WHERE tablename = 'coupon_usage'
ORDER BY policyname;

-- =====================================================
-- 🛡️ السكريبت 8: فحص حالة RLS على الجداول المهمة
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('vendor_wallets', 'coupons', 'coupon_usage', 'reviews')
ORDER BY tablename;

-- =====================================================
-- 📊 السكريبت 9: عدد السجلات في vendor_wallets
-- =====================================================
SELECT 
  COUNT(*) as total_wallets,
  COUNT(DISTINCT vendor_id) as unique_vendors
FROM vendor_wallets;

-- =====================================================
-- 🔍 السكريبت 10: فحص vendor_id في vendor_wallets
-- =====================================================
SELECT 
  vw.id,
  vw.vendor_id,
  s.name as store_name,
  vw.current_balance,
  vw.total_earned
FROM vendor_wallets vw
LEFT JOIN stores s ON s.id = vw.vendor_id
LIMIT 5;
