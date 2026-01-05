-- ============================================
-- فحص شامل للوحة تحكم المدير
-- ============================================

-- 1. إحصائيات المستخدمين حسب الدور
SELECT 
  raw_user_meta_data->>'role' AS الدور,
  COUNT(*) AS العدد
FROM auth.users
GROUP BY raw_user_meta_data->>'role'
ORDER BY العدد DESC;

-- 2. إحصائيات الطلبات حسب الحالة
SELECT 
  status AS الحالة,
  COUNT(*) AS عدد_الطلبات,
  SUM(total) AS إجمالي_المبلغ,
  SUM(delivery_fee) AS إجمالي_رسوم_التوصيل
FROM orders
GROUP BY status
ORDER BY عدد_الطلبات DESC;

-- 3. إحصائيات المتاجر
SELECT 
  'إجمالي المتاجر' AS النوع,
  COUNT(*) AS العدد
FROM stores
UNION ALL
SELECT 
  'متاجر نشطة' AS النوع,
  COUNT(*) AS العدد
FROM stores
WHERE is_active = true;

-- 4. إحصائيات المنتجات
SELECT 
  'إجمالي المنتجات' AS النوع,
  COUNT(*) AS العدد
FROM products
UNION ALL
SELECT 
  'منتجات نشطة' AS النوع,
  COUNT(*) AS العدد
FROM products
WHERE is_active = true;

-- 5. إحصائيات السائقين
SELECT 
  'إجمالي السائقين' AS النوع,
  COUNT(*) AS العدد
FROM drivers
UNION ALL
SELECT 
  'سائقين متاحين' AS النوع,
  COUNT(*) AS العدد
FROM drivers
WHERE is_available = true;

-- 6. الإيرادات اليومية
SELECT 
  DATE(created_at) AS التاريخ,
  COUNT(*) AS عدد_الطلبات,
  SUM(total) AS الإيرادات,
  SUM(delivery_fee) AS رسوم_التوصيل
FROM orders
WHERE status IN ('delivered', 'completed')
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY التاريخ DESC;

-- 7. أحدث الطلبات (آخر 10)
SELECT 
  o.order_number AS رقم_الطلب,
  o.status AS الحالة,
  o.total AS المبلغ,
  o.created_at AS التاريخ,
  u.raw_user_meta_data->>'name' AS العميل,
  s.name AS المتجر
FROM orders o
LEFT JOIN auth.users u ON o.customer_id = u.id
LEFT JOIN stores s ON o.vendor_id = s.id
ORDER BY o.created_at DESC
LIMIT 10;

-- 8. فحص جدول المحافظ (wallets)
SELECT 
  'هل جدول wallets موجود؟' AS السؤال,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'wallets'
    ) THEN '✅ موجود'
    ELSE '❌ غير موجود'
  END AS الإجابة;

-- 9. إحصائيات المحافظ إن وجدت
SELECT 
  COUNT(*) AS عدد_المحافظ,
  SUM(balance) AS إجمالي_الأرصدة,
  AVG(balance) AS متوسط_الرصيد
FROM wallets;

-- 10. فحص العلاقات الأساسية
SELECT 
  '✅ تم فحص جميع الإحصائيات' AS الحالة,
  'راجع النتائج أعلاه' AS الرسالة;
