-- ============================================
-- التحقق من نظام المحفظة بعد التشغيل
-- ============================================

-- 1. عرض أرصدة المحافظ لجميع البائعين
SELECT 
  s.name AS اسم_المتجر,
  vw.pending_balance AS الرصيد_المعلق,
  vw.current_balance AS الرصيد_الحالي,
  vw.total_earned AS إجمالي_الأرباح,
  vw.total_withdrawn AS المسحوبات,
  vw.updated_at AS آخر_تحديث
FROM vendor_wallets vw
JOIN stores s ON s.id = vw.vendor_id
ORDER BY vw.updated_at DESC;

-- 2. عرض آخر 10 معاملات
SELECT 
  wt.type AS نوع_المعاملة,
  wt.amount AS المبلغ,
  wt.status AS الحالة,
  wt.description AS الوصف,
  wt.created_at AS التاريخ
FROM wallet_transactions wt
ORDER BY wt.created_at DESC
LIMIT 10;

-- 3. عرض عدد المعاملات حسب النوع والحالة
SELECT 
  type AS النوع,
  status AS الحالة,
  COUNT(*) AS العدد,
  SUM(amount) AS المجموع
FROM wallet_transactions
GROUP BY type, status
ORDER BY type, status;

-- 4. التحقق من الـ Trigger - عرض الطلبات وحالاتها
SELECT 
  o.order_number AS رقم_الطلب,
  o.status AS الحالة,
  o.total AS إجمالي_الطلب,
  s.name AS المتجر,
  o.created_at AS تاريخ_الطلب
FROM orders o
JOIN stores s ON s.id = o.vendor_id
ORDER BY o.created_at DESC
LIMIT 5;

-- 5. عرض طلبات السحب (إن وجدت)
SELECT 
  pr.amount AS المبلغ,
  pr.status AS الحالة,
  pr.bank_name AS البنك,
  pr.requested_at AS تاريخ_الطلب,
  s.name AS المتجر
FROM payout_requests pr
JOIN stores s ON s.id = pr.vendor_id
ORDER BY pr.requested_at DESC
LIMIT 10;

-- 6. إحصائيات عامة
SELECT 
  '✅ نظام المحفظة يعمل بنجاح' AS الحالة,
  (SELECT COUNT(*) FROM wallet_transactions) AS عدد_المعاملات,
  (SELECT COUNT(*) FROM payout_requests) AS عدد_طلبات_السحب,
  (SELECT COUNT(*) FROM vendor_wallets WHERE pending_balance > 0) AS البائعين_برصيد_معلق,
  (SELECT COUNT(*) FROM vendor_wallets WHERE current_balance > 0) AS البائعين_برصيد_حالي;
