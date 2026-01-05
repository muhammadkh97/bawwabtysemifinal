-- ============================================
-- فحص الطلبات الجاهزة للاستلام
-- ============================================

-- 1. عرض الطلبات بحالة ready_for_pickup
SELECT 
  o.id,
  o.order_number AS رقم_الطلب,
  o.status AS الحالة,
  o.driver_id AS معرف_السائق,
  o.vendor_id AS معرف_البائع,
  o.total AS المبلغ,
  o.delivery_fee AS رسوم_التوصيل,
  o.delivery_address AS عنوان_التوصيل,
  o.created_at AS تاريخ_الإنشاء,
  s.name AS اسم_المتجر,
  u.name AS اسم_العميل
FROM orders o
LEFT JOIN stores s ON o.vendor_id = s.id
LEFT JOIN users u ON o.customer_id = u.id
WHERE o.status = 'ready_for_pickup'
ORDER BY o.created_at DESC;

-- 2. التحقق من كل الطلبات وحالاتها
SELECT 
  status AS الحالة,
  COUNT(*) AS العدد,
  COUNT(CASE WHEN driver_id IS NULL THEN 1 END) AS بدون_سائق,
  COUNT(CASE WHEN driver_id IS NOT NULL THEN 1 END) AS مع_سائق
FROM orders
GROUP BY status
ORDER BY العدد DESC;

-- 3. فحص آخر 10 طلبات مع كل التفاصيل
SELECT 
  o.order_number AS الطلب,
  o.status AS الحالة,
  CASE 
    WHEN o.driver_id IS NULL THEN '❌ لا يوجد'
    ELSE '✅ موجود'
  END AS السائق,
  o.created_at AS التاريخ,
  s.name AS المتجر
FROM orders o
LEFT JOIN stores s ON o.vendor_id = s.id
ORDER BY o.created_at DESC
LIMIT 10;

-- 4. فحص الطلبات التي يجب أن تظهر للسائقين (الشروط الدقيقة)
SELECT 
  '📋 الطلبات المتاحة للسائقين' AS العنوان,
  COUNT(*) AS العدد
FROM orders
WHERE status = 'ready_for_pickup'
  AND driver_id IS NULL;

-- 5. عرض تفاصيل كاملة للطلبات المتاحة
SELECT 
  o.id,
  o.order_number,
  o.status,
  o.driver_id,
  o.total,
  o.delivery_address,
  o.created_at,
  EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 60 AS منذ_كم_دقيقة
FROM orders o
WHERE status = 'ready_for_pickup'
  AND driver_id IS NULL
ORDER BY o.created_at DESC;
