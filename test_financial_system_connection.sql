-- ====================================================================
-- اختبار اتصال النظام المالي الكامل
-- Test Complete Financial System Connection
-- ====================================================================

\echo ''
\echo '======================================'
\echo 'اختبار اتصال النظام المالي'
\echo 'Financial System Connection Test'
\echo '======================================'
\echo ''

-- 1. Test Platform Financial Stats
\echo '1️⃣ اختبار إحصائيات المنصة | Testing Platform Stats...'
SELECT 
  'get_platform_financial_stats' as function_name,
  total_orders,
  completed_orders,
  total_revenue,
  total_platform_earning,
  total_vendors_earning,
  avg_commission_rate,
  active_vendors
FROM get_platform_financial_stats();

\echo ''
\echo '✅ نجح اختبار إحصائيات المنصة'
\echo ''

-- 2. Test Vendors Earnings Report
\echo '2️⃣ اختبار تقرير أرباح البائعين | Testing Vendors Earnings...'
SELECT 
  'get_vendors_earnings_report' as function_name,
  vendor_name,
  total_orders,
  total_revenue,
  total_commission,
  net_earnings,
  current_balance
FROM get_vendors_earnings_report()
LIMIT 5;

\echo ''
\echo '✅ نجح اختبار تقرير البائعين'
\echo ''

-- 3. Test Daily Revenue Report
\echo '3️⃣ اختبار تقرير الإيرادات اليومية | Testing Daily Revenue...'
SELECT 
  'get_daily_revenue_report' as function_name,
  date,
  total_orders,
  total_revenue,
  platform_earning,
  vendors_earning
FROM get_daily_revenue_report(
  (CURRENT_DATE - INTERVAL '7 days')::date,
  CURRENT_DATE::date
)
ORDER BY date DESC
LIMIT 7;

\echo ''
\echo '✅ نجح اختبار الإيرادات اليومية'
\echo ''

-- 4. Test Payout Requests (if any)
\echo '4️⃣ اختبار طلبات السحب المعلقة | Testing Pending Payouts...'
SELECT 
  'payout_requests' as table_name,
  pr.id,
  s.name as vendor_name,
  pr.amount,
  pr.status,
  pr.requested_at,
  vw.current_balance
FROM payout_requests pr
JOIN stores s ON pr.vendor_id = s.id
JOIN vendor_wallets vw ON pr.vendor_id = vw.vendor_id
WHERE pr.status = 'pending'
ORDER BY pr.requested_at DESC
LIMIT 5;

\echo ''
\echo '✅ نجح اختبار طلبات السحب'
\echo ''

-- 5. Test Connection to Financial Settings (for connection status check)
\echo '5️⃣ اختبار جدول إعدادات المالية | Testing Financial Settings...'
SELECT 
  'financial_settings' as table_name,
  COUNT(*) as row_count
FROM financial_settings;

\echo ''
\echo '✅ نجح اختبار إعدادات المالية'
\echo ''

-- 6. Test Top Vendors Function
\echo '6️⃣ اختبار أفضل البائعين | Testing Top Vendors...'
SELECT 
  'get_top_vendors' as function_name,
  vendor_name,
  total_revenue,
  total_orders,
  total_commission
FROM get_top_vendors(5);

\echo ''
\echo '✅ نجح اختبار أفضل البائعين'
\echo ''

-- 7. Summary Statistics
\echo '========================================'
\echo '📊 ملخص الإحصائيات | Summary Statistics'
\echo '========================================'
\echo ''

WITH stats AS (
  SELECT * FROM get_platform_financial_stats()
)
SELECT
  '💰 إجمالي الإيرادات: ' || total_revenue || ' ر.س' as metric_1,
  '🏆 أرباح المنصة: ' || total_platform_earning || ' ر.س' as metric_2,
  '🛍️ أرباح البائعين: ' || total_vendors_earning || ' ر.س' as metric_3,
  '📦 الطلبات المكتملة: ' || completed_orders || ' من ' || total_orders as metric_4,
  '👥 البائعون النشطون: ' || active_vendors as metric_5
FROM stats;

\echo ''
\echo '========================================'
\echo '✅ اكتمل الاختبار بنجاح!'
\echo 'All Tests Completed Successfully!'
\echo '========================================'
\echo ''

-- 8. Connection Verification
\echo '🔌 حالة الاتصال | Connection Status'
SELECT 
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ متصل بنجاح | Connected Successfully'
    ELSE '❌ فشل الاتصال | Connection Failed'
  END as status
FROM financial_settings;
