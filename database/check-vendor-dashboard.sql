-- ============================================
-- فحص شامل للوحة تحكم البائع
-- Vendor Dashboard Structure Check
-- ============================================

-- ========== 1. فحص الجداول الأساسية ==========

SELECT 
  'stores' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') as exists;

SELECT 
  'products' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') as exists;

SELECT 
  'orders' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') as exists;

SELECT 
  'order_items' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') as exists;

-- ========== 2. فحص الجداول الاختيارية ==========

SELECT 
  'vendor_wallets' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_wallets') as exists;

SELECT 
  'chats' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chats') as exists;

SELECT 
  'reviews' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') as exists;

SELECT 
  'coupons' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coupons') as exists;

SELECT 
  'vendor_staff' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_staff') as exists;

SELECT 
  'staff_invitations' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_invitations') as exists;

-- ========== 3. أعمدة جدول stores ==========

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stores'
ORDER BY ordinal_position;

-- ========== 4. إحصائيات البيانات ==========

SELECT 
  'stores' as table_name,
  COUNT(*) as count
FROM stores;

SELECT 
  'products' as table_name,
  COUNT(*) as count
FROM products;

SELECT 
  'orders' as table_name,
  COUNT(*) as count
FROM orders;

-- ========== 5. فحص دوال RPC ==========

SELECT 
  'create_staff_invitation' as function_name,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_staff_invitation') as exists;

SELECT 
  'update_order_status' as function_name,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname IN ('updateOrderStatus', 'update_order_status')) as exists;

-- ========== 6. عدد سياسات RLS ==========

SELECT 
  'stores' as table_name,
  COUNT(*) as policies_count
FROM pg_policies
WHERE tablename = 'stores';

SELECT 
  'products' as table_name,
  COUNT(*) as policies_count
FROM pg_policies
WHERE tablename = 'products';

-- ========== 7. الملخص النهائي ==========

SELECT 
  'الجداول الأساسية' as category,
  COUNT(CASE WHEN table_name IN ('stores', 'products', 'orders', 'order_items', 'users') THEN 1 END) as found,
  5 as required
FROM information_schema.tables
WHERE table_name IN ('stores', 'products', 'orders', 'order_items', 'users');

SELECT 
  'الجداول الاختيارية' as category,
  COUNT(CASE WHEN table_name IN ('vendor_wallets', 'chats', 'reviews', 'coupons', 'vendor_staff', 'staff_invitations') THEN 1 END) as found,
  6 as required
FROM information_schema.tables
WHERE table_name IN ('vendor_wallets', 'chats', 'reviews', 'coupons', 'vendor_staff', 'staff_invitations');

-- تم الفحص ✅
