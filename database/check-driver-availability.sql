-- ============================================
-- التحقق من نظام متاح/غير متاح للمندوبين
-- ============================================

-- 1. التحقق من وجود عمود is_available في جدول drivers
SELECT 
  column_name AS اسم_العمود,
  data_type AS نوع_البيانات,
  column_default AS القيمة_الافتراضية,
  is_nullable AS يقبل_null
FROM information_schema.columns
WHERE table_name = 'drivers' 
  AND column_name = 'is_available';

-- 2. عرض حالة جميع المندوبين
SELECT 
  d.id,
  u.name AS اسم_المندوب,
  u.email,
  d.is_available AS متاح,
  d.approval_status AS حالة_الموافقة,
  d.updated_at AS آخر_تحديث,
  COUNT(o.id) AS عدد_الطلبات_النشطة
FROM drivers d
LEFT JOIN users u ON d.user_id = u.id
LEFT JOIN orders o ON o.driver_id = d.id AND o.status IN ('ready_for_pickup', 'picked_up', 'in_transit', 'out_for_delivery')
GROUP BY d.id, u.name, u.email, d.is_available, d.approval_status, d.updated_at
ORDER BY d.is_available DESC, d.updated_at DESC;

-- 3. إحصائيات المندوبين
SELECT 
  '✅ نظام متاح/غير متاح يعمل' AS الحالة,
  COUNT(*) AS إجمالي_المندوبين,
  COUNT(CASE WHEN is_available = true THEN 1 END) AS المندوبين_المتاحين,
  COUNT(CASE WHEN is_available = false THEN 1 END) AS المندوبين_غير_المتاحين,
  COUNT(CASE WHEN approval_status = 'approved' AND is_available = true THEN 1 END) AS المتاحين_والموافق_عليهم
FROM drivers;

-- 4. التحقق من آخر تحديثات الحالة
SELECT 
  u.name AS المندوب,
  d.is_available AS متاح,
  d.updated_at AS وقت_التحديث,
  EXTRACT(EPOCH FROM (NOW() - d.updated_at)) / 60 AS منذ_كم_دقيقة
FROM drivers d
LEFT JOIN users u ON d.user_id = u.id
ORDER BY d.updated_at DESC
LIMIT 10;
