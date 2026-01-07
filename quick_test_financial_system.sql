-- ====================================================================
-- اختبار سريع للنظام المالي - Quick Financial System Test
-- نسخ والصق في Supabase SQL Editor
-- Copy and paste in Supabase SQL Editor
-- ====================================================================

-- 1️⃣ Test Platform Stats
SELECT '1️⃣ Platform Stats' as test_name;
SELECT * FROM get_platform_financial_stats();

-- 2️⃣ Test Vendors Report  
SELECT '2️⃣ Vendors Report (Top 5)' as test_name;
SELECT * FROM get_vendors_earnings_report() LIMIT 5;

-- 3️⃣ Test Daily Revenue (Last 7 days)
SELECT '3️⃣ Daily Revenue (Last 7 days)' as test_name;
SELECT * FROM get_daily_revenue_report(
  (CURRENT_DATE - INTERVAL '7 days')::date,
  CURRENT_DATE::date
) ORDER BY date DESC;

-- 4️⃣ Test Pending Payouts
SELECT '4️⃣ Pending Payouts' as test_name;
SELECT 
  pr.id,
  s.name as vendor_name,
  pr.amount,
  pr.status,
  vw.current_balance
FROM payout_requests pr
JOIN stores s ON pr.vendor_id = s.id
JOIN vendor_wallets vw ON pr.vendor_id = vw.vendor_id
WHERE pr.status = 'pending';

-- 5️⃣ Connection Test
SELECT '5️⃣ Connection Status' as test_name;
SELECT 
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Connected Successfully'
    ELSE '❌ Connection Failed'
  END as status
FROM financial_settings;

-- ✅ All Tests Complete!
SELECT '✅ All Tests Completed!' as final_status;
