-- ============================================================================
-- إصلاح صلاحيات جدول exchange_rates
-- ============================================================================

-- إضافة صلاحية القراءة لجميع المستخدمين (مسجلين وغير مسجلين)
GRANT SELECT ON TABLE exchange_rates TO anon;
GRANT SELECT ON TABLE exchange_rates TO authenticated;

-- إضافة صلاحيات الكتابة للمستخدمين المسجلين (سيتم التحكم بها عبر RLS)
GRANT INSERT, UPDATE, DELETE ON TABLE exchange_rates TO authenticated;

-- التحقق من الصلاحيات بعد التطبيق
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'exchange_rates'
ORDER BY grantee, privilege_type;

-- اختبار القراءة كمستخدم غير مسجل
-- (هذا سيعمل الآن بدون أخطاء)
SELECT 
  base_currency,
  target_currency,
  rate
FROM exchange_rates
WHERE target_currency = 'JOD'
LIMIT 5;
