-- ============================================
-- فحص شامل لجميع الجداول المطلوبة للوحة تحكم المدير
-- ============================================

-- 1. فحص جدول categories
SELECT 
  'categories' AS الجدول,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categories') 
    THEN '✅ موجود'
    ELSE '❌ غير موجود'
  END AS الحالة,
  (SELECT COUNT(*) FROM categories) AS العدد;

-- 2. فحص جدول loyalty_points
SELECT 
  'loyalty_points' AS الجدول,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'loyalty_points') 
    THEN '✅ موجود'
    ELSE '❌ غير موجود - يجب إنشاؤه'
  END AS الحالة;

-- 3. فحص جدول lucky_boxes
SELECT 
  'lucky_boxes' AS الجدول,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lucky_boxes') 
    THEN '✅ موجود'
    ELSE '❌ غير موجود - يجب إنشاؤه'
  END AS الحالة;

-- 4. فحص جدول tickets
SELECT 
  'tickets' AS الجدول,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tickets') 
    THEN '✅ موجود'
    ELSE '❌ غير موجود - يجب إنشاؤه'
  END AS الحالة;

-- 5. فحص جدول disputes
SELECT 
  'disputes' AS الجدول,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'disputes') 
    THEN '✅ موجود'
    ELSE '❌ غير موجود - يجب إنشاؤه'
  END AS الحالة;

-- 6. فحص جدول transactions (للماليات)
SELECT 
  'transactions' AS الجدول,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') 
    THEN '✅ موجود'
    ELSE '❌ غير موجود - يجب إنشاؤه'
  END AS الحالة;

-- 7. فحص جدول shipping_settings
SELECT 
  'shipping_settings' AS الجدول,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shipping_settings') 
    THEN '✅ موجود'
    ELSE '❌ غير موجود - يجب إنشاؤه'
  END AS الحالة;

-- 8. فحص أعمدة shipping_settings إن وجد
SELECT 
  column_name AS اسم_العمود,
  data_type AS نوع_البيانات,
  is_nullable AS يقبل_null
FROM information_schema.columns
WHERE table_name = 'shipping_settings'
ORDER BY ordinal_position;

-- 9. فحص جدول commissions (للماليات - العمولات)
SELECT 
  'commissions' AS الجدول,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'commissions') 
    THEN '✅ موجود'
    ELSE '❌ غير موجود'
  END AS الحالة;

-- 10. فحص wallet_transactions (للماليات)
SELECT 
  'wallet_transactions' AS الجدول,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wallet_transactions') 
    THEN '✅ موجود'
    ELSE '❌ غير موجود'
  END AS الحالة,
  (SELECT COUNT(*) FROM wallet_transactions) AS عدد_المعاملات;

-- 11. ملخص الجداول
SELECT 
  '📊 ملخص الجداول' AS العنوان,
  COUNT(CASE WHEN table_name = 'categories' THEN 1 END) AS categories,
  COUNT(CASE WHEN table_name = 'loyalty_points' THEN 1 END) AS loyalty_points,
  COUNT(CASE WHEN table_name = 'lucky_boxes' THEN 1 END) AS lucky_boxes,
  COUNT(CASE WHEN table_name = 'tickets' THEN 1 END) AS tickets,
  COUNT(CASE WHEN table_name = 'disputes' THEN 1 END) AS disputes,
  COUNT(CASE WHEN table_name = 'transactions' THEN 1 END) AS transactions,
  COUNT(CASE WHEN table_name = 'shipping_settings' THEN 1 END) AS shipping_settings,
  COUNT(CASE WHEN table_name = 'commissions' THEN 1 END) AS commissions
FROM information_schema.tables
WHERE table_name IN ('categories', 'loyalty_points', 'lucky_boxes', 'tickets', 'disputes', 'transactions', 'shipping_settings', 'commissions');

-- رسالة نهائية
SELECT '✅ تم فحص جميع الجداول' AS الحالة,
       'راجع النتائج أعلاه' AS الرسالة;
