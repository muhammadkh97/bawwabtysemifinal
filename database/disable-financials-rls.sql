-- ====================================
-- تعطيل RLS على جداول الماليات
-- ====================================

-- تعطيل RLS (الحماية موجودة في الكود - ProtectedRoute)
ALTER TABLE financial_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE commissions DISABLE ROW LEVEL SECURITY;

-- التحقق من النتيجة
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('financial_settings', 'commissions');
