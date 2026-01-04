-- منح صلاحيات على vendor_wallets
GRANT ALL ON TABLE vendor_wallets TO authenticated;
GRANT ALL ON TABLE vendor_wallets TO anon;

-- التحقق
SELECT 
  grantee, 
  table_name, 
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'vendor_wallets'
AND grantee IN ('authenticated', 'anon')
ORDER BY grantee;
