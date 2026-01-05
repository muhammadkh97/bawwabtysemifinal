-- ============================================
-- فحص صفحة المستخدمين
-- ============================================

-- 1. عرض جميع المستخدمين مع أدوارهم
SELECT 
  u.id,
  u.email AS البريد,
  u.raw_user_meta_data->>'name' AS الاسم,
  u.raw_user_meta_data->>'role' AS الدور_في_metadata,
  u.created_at AS تاريخ_التسجيل,
  -- فحص وجود سجل في جداول الأدوار
  CASE 
    WHEN d.id IS NOT NULL THEN 'driver - من جدول drivers'
    WHEN s.id IS NOT NULL THEN 'vendor - من جدول stores'
    WHEN r.id IS NOT NULL THEN 'restaurant - من جدول restaurants'
    ELSE u.raw_user_meta_data->>'role'
  END AS الدور_الفعلي
FROM auth.users u
LEFT JOIN drivers d ON d.user_id = u.id
LEFT JOIN stores s ON s.user_id = u.id
LEFT JOIN restaurants r ON r.user_id = u.id
ORDER BY u.created_at DESC;

-- 2. إحصائيات المستخدمين حسب الدور
SELECT 
  COALESCE(u.raw_user_meta_data->>'role', 'غير محدد') AS الدور,
  COUNT(*) AS العدد
FROM auth.users u
GROUP BY u.raw_user_meta_data->>'role'
ORDER BY العدد DESC;

-- 3. فحص جدول restaurants
SELECT 
  'هل جدول restaurants موجود؟' AS السؤال,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'restaurants'
    ) THEN '✅ موجود'
    ELSE '❌ غير موجود - يجب إنشاؤه'
  END AS الإجابة;

-- 4. عرض المطاعم إن وجدت
SELECT 
  r.id,
  r.name AS اسم_المطعم,
  r.user_id AS معرف_المستخدم,
  u.email AS البريد,
  u.raw_user_meta_data->>'name' AS اسم_المالك,
  r.is_active AS نشط,
  r.created_at AS تاريخ_الإنشاء
FROM restaurants r
LEFT JOIN auth.users u ON r.user_id = u.id
ORDER BY r.created_at DESC;

-- 5. العملاء فقط (بدون أدوار أخرى)
SELECT 
  COUNT(*) AS عدد_العملاء
FROM auth.users u
LEFT JOIN drivers d ON d.user_id = u.id
LEFT JOIN stores s ON s.user_id = u.id
LEFT JOIN restaurants r ON r.user_id = u.id
WHERE d.id IS NULL 
  AND s.id IS NULL 
  AND r.id IS NULL
  AND (u.raw_user_meta_data->>'role' IS NULL 
       OR u.raw_user_meta_data->>'role' = 'customer');

-- 6. البائعون (من جدول stores)
SELECT 
  COUNT(*) AS عدد_البائعين
FROM stores;

-- 7. المناديب (من جدول drivers)
SELECT 
  COUNT(*) AS عدد_المناديب
FROM drivers;

-- 8. المطاعم (من جدول restaurants)
SELECT 
  COALESCE(COUNT(*), 0) AS عدد_المطاعم
FROM restaurants;

-- 9. المديرين
SELECT 
  COUNT(*) AS عدد_المديرين
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin';

-- 10. رسالة نهائية
SELECT '✅ تم فحص جميع المستخدمين والأدوار' AS الحالة,
       'راجع النتائج أعلاه' AS الرسالة;
