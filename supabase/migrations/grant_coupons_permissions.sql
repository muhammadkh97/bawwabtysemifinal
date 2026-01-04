-- منح صلاحيات كاملة على جدول coupons
-- الحل النهائي للمشكلة

-- 1. منح صلاحيات على coupons
GRANT ALL ON TABLE coupons TO authenticated;
GRANT ALL ON TABLE coupons TO anon;

-- 2. منح صلاحيات على coupon_usage
GRANT ALL ON TABLE coupon_usage TO authenticated;
GRANT ALL ON TABLE coupon_usage TO anon;

-- 3. التحقق
SELECT 
  grantee, 
  table_name, 
  privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('coupons', 'coupon_usage')
AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee;
