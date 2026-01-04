-- ============================================
-- FIX: إصلاح شامل لجميع صلاحيات العملات والسلة
-- المشكلة: 403 Forbidden على currencies, exchange_rates, restaurant_cart_with_details
-- ============================================

-- ========================================
-- 1. إصلاح صلاحيات جداول العملات
-- ========================================

-- تعطيل RLS مؤقتاً لحذف الـ policies القديمة
ALTER TABLE currencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates DISABLE ROW LEVEL SECURITY;

-- حذف جميع الـ policies القديمة
DROP POLICY IF EXISTS "Anyone can read currencies" ON currencies;
DROP POLICY IF EXISTS "Anyone can read active currencies" ON currencies;
DROP POLICY IF EXISTS "Anyone can read exchange rates" ON currencies;
DROP POLICY IF EXISTS "Public read access to currencies" ON currencies;
DROP POLICY IF EXISTS "Admins can manage currencies" ON currencies;

DROP POLICY IF EXISTS "Anyone can read exchange_rates" ON exchange_rates;
DROP POLICY IF EXISTS "Public read access to exchange_rates" ON exchange_rates;
DROP POLICY IF EXISTS "Admins can manage exchange_rates" ON exchange_rates;

-- إعادة تفعيل RLS
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- إنشاء policy جديدة للقراءة العامة
CREATE POLICY "currencies_select_policy"
ON currencies
FOR SELECT
USING (true);

CREATE POLICY "exchange_rates_select_policy"
ON exchange_rates
FOR SELECT
USING (true);

-- إنشاء policy للمسؤولين للتعديل
CREATE POLICY "currencies_admin_policy"
ON currencies
FOR ALL
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "exchange_rates_admin_policy"
ON exchange_rates
FOR ALL
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ========================================
-- 2. إصلاح صلاحيات View سلة المطاعم
-- ========================================

-- منح صلاحيات على الـ view
GRANT SELECT ON restaurant_cart_with_details TO anon;
GRANT SELECT ON restaurant_cart_with_details TO authenticated;
GRANT SELECT ON restaurant_cart_with_details TO public;

-- ========================================
-- 3. منح صلاحيات على الدوال
-- ========================================

GRANT EXECUTE ON FUNCTION convert_currency(numeric, text, text) TO anon;
GRANT EXECUTE ON FUNCTION convert_currency(numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION convert_currency(numeric, text, text) TO public;

-- إذا كانت هناك دالة get_product_cart_type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_product_cart_type'
  ) THEN
    GRANT EXECUTE ON FUNCTION get_product_cart_type(uuid) TO anon;
    GRANT EXECUTE ON FUNCTION get_product_cart_type(uuid) TO authenticated;
    GRANT EXECUTE ON FUNCTION get_product_cart_type(uuid) TO public;
  END IF;
END $$;

-- ========================================
-- 4. التحقق من النتائج
-- ========================================

-- عرض جميع الـ policies على جداول العملات
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('currencies', 'exchange_rates')
ORDER BY tablename, policyname;

-- عرض صلاحيات الـ view
SELECT 
  table_name,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'restaurant_cart_with_details';

-- عرض عدد العملات والصرف
SELECT 
  'currencies' as table_name,
  COUNT(*) as count
FROM currencies
WHERE is_active = true
UNION ALL
SELECT 
  'exchange_rates' as table_name,
  COUNT(*) as count
FROM exchange_rates;

-- ملاحظة هامة:
-- بعد تنفيذ هذا السكريبت، يجب إعادة تشغيل التطبيق أو الانتظار قليلاً
-- حتى تتحدث الـ cache في Supabase
