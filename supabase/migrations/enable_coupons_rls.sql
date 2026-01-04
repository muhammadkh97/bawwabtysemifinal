-- إعادة تفعيل RLS على coupons (الآن السياسات ستعمل)
-- بعد حل مشكلة GRANT، السياسات ستطبق صح

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- التحقق
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('coupons', 'coupon_usage')
AND schemaname = 'public';
