-- ============================================================================
-- إصلاح صلاحيات جدول payout_requests
-- ============================================================================

-- منح صلاحيات القراءة والكتابة للمستخدمين المصادق عليهم
GRANT SELECT ON TABLE payout_requests TO authenticated;
GRANT INSERT ON TABLE payout_requests TO authenticated;
GRANT UPDATE ON TABLE payout_requests TO authenticated;
GRANT DELETE ON TABLE payout_requests TO authenticated;

-- التحقق من الصلاحيات بعد التطبيق
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'payout_requests'
ORDER BY grantee, privilege_type;

-- اختبار الاستعلام المستخدم في الصفحة
SELECT 
  id,
  vendor_id,
  amount,
  status,
  bank_name,
  account_number,
  account_holder,
  iban,
  requested_at,
  notes
FROM payout_requests
WHERE status = 'pending'
ORDER BY requested_at DESC;
