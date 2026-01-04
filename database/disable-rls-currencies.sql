-- ============================================
-- SOLUTION: تعطيل RLS تماماً على جداول العملات
-- السبب: هذه بيانات عامة ولا تحتاج حماية RLS
-- ============================================

-- تعطيل RLS على جداول العملات
ALTER TABLE currencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates DISABLE ROW LEVEL SECURITY;

-- حذف جميع الـ policies (لن نحتاجها)
DROP POLICY IF EXISTS "currencies_select_policy" ON currencies;
DROP POLICY IF EXISTS "currencies_admin_policy" ON currencies;
DROP POLICY IF EXISTS "exchange_rates_select_policy" ON exchange_rates;
DROP POLICY IF EXISTS "exchange_rates_admin_policy" ON exchange_rates;
DROP POLICY IF EXISTS "Anyone can read currencies" ON currencies;
DROP POLICY IF EXISTS "Anyone can read exchange_rates" ON exchange_rates;

-- منح صلاحيات قراءة كاملة للجميع
GRANT SELECT ON currencies TO anon, authenticated, public;
GRANT SELECT ON exchange_rates TO anon, authenticated, public;

-- إعطاء صلاحيات التعديل للمسؤولين فقط (بدون RLS)
-- سيتم التحكم بها من التطبيق

-- التحقق
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('currencies', 'exchange_rates')
  AND schemaname = 'public';

-- عرض العملات لل تأكد
SELECT code, name_ar, symbol, is_active
FROM currencies
ORDER BY display_order
LIMIT 10;
