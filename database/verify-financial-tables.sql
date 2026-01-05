-- ====================================
-- التحقق من وجود جداول الماليات
-- ====================================

-- 1. التحقق من وجود الجداول
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN ('financial_settings', 'commissions')
AND schemaname = 'public';

-- 2. عرض عدد الصفوف
SELECT 'financial_settings' as table_name, COUNT(*) as row_count FROM financial_settings
UNION ALL
SELECT 'commissions' as table_name, COUNT(*) as row_count FROM commissions;

-- 3. عرض بيانات نموذجية
SELECT * FROM financial_settings LIMIT 2;
SELECT * FROM commissions LIMIT 2;
