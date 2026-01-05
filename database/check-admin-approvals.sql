-- ============================================
-- فحص صفحة الموافقات في لوحة تحكم المدير
-- ============================================

-- 1. فحص جدول approvals إن وجد
SELECT 
  'هل جدول approvals موجود؟' AS السؤال,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'approvals'
    ) THEN '✅ موجود'
    ELSE '❌ غير موجود - يجب إنشاؤه'
  END AS الإجابة;

-- 2. المتاجر المعلقة (بانتظار الموافقة)
SELECT 
  s.id,
  s.name AS اسم_المتجر,
  s.is_active AS نشط,
  s.created_at AS تاريخ_الإنشاء,
  u.email AS البريد_الإلكتروني,
  u.raw_user_meta_data->>'name' AS اسم_البائع
FROM stores s
LEFT JOIN auth.users u ON s.user_id = u.id
WHERE s.is_active = false
ORDER BY s.created_at DESC;

-- 3. المنتجات المعلقة (بانتظار الموافقة)
SELECT 
  p.id,
  p.name AS اسم_المنتج,
  p.is_active AS نشط,
  p.created_at AS تاريخ_الإنشاء,
  s.name AS المتجر,
  c.name AS التصنيف
FROM products p
LEFT JOIN stores s ON p.store_id = s.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = false
ORDER BY p.created_at DESC
LIMIT 20;

-- 4. التصنيفات المعلقة (إن كان هناك نظام موافقة)
SELECT 
  c.id,
  c.name AS اسم_التصنيف,
  c.is_active AS نشط,
  c.parent_id AS التصنيف_الأب,
  c.created_at AS تاريخ_الإنشاء
FROM categories c
WHERE c.is_active = false
ORDER BY c.created_at DESC;

-- 5. فحص حقل approval_status في جداول مختلفة
-- للمتاجر
SELECT 
  'stores' AS الجدول,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'stores' 
      AND column_name = 'approval_status'
    ) THEN '✅ موجود'
    ELSE '❌ غير موجود'
  END AS حقل_approval_status;

-- للمنتجات
SELECT 
  'products' AS الجدول,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'approval_status'
    ) THEN '✅ موجود'
    ELSE '❌ غير موجود'
  END AS حقل_approval_status;

-- 6. إحصائيات الموافقات
SELECT 
  '📊 إحصائيات الموافقات' AS العنوان,
  COUNT(CASE WHEN is_active = false THEN 1 END) AS متاجر_معلقة,
  (SELECT COUNT(*) FROM products WHERE is_active = false) AS منتجات_معلقة,
  (SELECT COUNT(*) FROM categories WHERE is_active = false) AS تصنيفات_معلقة
FROM stores;

-- 7. رسالة نهائية
SELECT '✅ تم فحص جميع الموافقات' AS الحالة,
       'راجع النتائج أعلاه' AS الرسالة;
