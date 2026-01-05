-- ====================================
-- منح صلاحيات الوصول للجداول عبر API
-- ====================================

-- منح صلاحيات للـ anon role
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON commissions TO anon;

-- منح صلاحيات للـ authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON commissions TO authenticated;

-- منح صلاحيات على الـ sequences إن وجدت
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- التحقق من الصلاحيات
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('financial_settings', 'commissions')
AND grantee IN ('anon', 'authenticated', 'postgres')
ORDER BY table_name, grantee, privilege_type;
