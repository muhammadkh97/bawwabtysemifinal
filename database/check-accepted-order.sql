-- ============================================
-- فحص الطلب الذي تم قبوله
-- ============================================

-- 1. عرض الطلب الذي تم قبوله للتو
SELECT 
  id,
  order_number AS رقم_الطلب,
  status AS الحالة,
  driver_id AS معرف_السائق,
  created_at AS تاريخ_الإنشاء,
  updated_at AS تاريخ_التحديث
FROM orders
WHERE id = '0aedaa5d-bd78-41db-953a-cf0c22b9ab41';

-- 2. عرض جميع الطلبات للسائق
SELECT 
  id,
  order_number AS رقم_الطلب,
  status AS الحالة,
  driver_id AS معرف_السائق,
  CASE 
    WHEN driver_id = '0215b40e-8c6f-4369-8c91-645d06b295e8' THEN '✅ للسائق'
    WHEN driver_id IS NULL THEN '⚪ بدون سائق'
    ELSE '❌ سائق آخر'
  END AS ملاحظة
FROM orders
WHERE driver_id = '0215b40e-8c6f-4369-8c91-645d06b295e8'
  OR id = '0aedaa5d-bd78-41db-953a-cf0c22b9ab41'
ORDER BY created_at DESC;

-- 3. التحقق من الطلبات بحالات معينة للسائق
SELECT 
  COUNT(*) AS العدد,
  status AS الحالة
FROM orders
WHERE driver_id = '0215b40e-8c6f-4369-8c91-645d06b295e8'
GROUP BY status;
