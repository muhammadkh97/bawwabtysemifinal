-- ====================================
-- تفعيل RLS على جداول الماليات
-- ====================================

-- تفعيل RLS على financial_settings
ALTER TABLE financial_settings ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على commissions
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- التحقق من النتيجة
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('financial_settings', 'commissions');
