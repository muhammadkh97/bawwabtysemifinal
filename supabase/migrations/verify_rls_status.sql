-- التحقق من حالة RLS الفعلية
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('coupons', 'coupon_usage')
AND schemaname = 'public';
