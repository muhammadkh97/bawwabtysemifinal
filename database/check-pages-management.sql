-- ============================================
-- فحص صفحة إدارة الصفحات
-- ============================================

-- 1. فحص جدول pages
SELECT 
  'هل جدول pages موجود؟' AS السؤال,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'pages'
    ) THEN '✅ موجود'
    ELSE '❌ غير موجود - يجب إنشاؤه'
  END AS الإجابة;

-- 2. عرض جميع الصفحات إن وجدت
SELECT 
  id,
  slug AS الرابط,
  title AS العنوان,
  content AS المحتوى,
  is_active AS نشطة,
  created_at AS تاريخ_الإنشاء,
  updated_at AS تاريخ_التحديث
FROM pages
ORDER BY slug;

-- 3. فحص أقسام Hero
SELECT 
  'هل جدول hero_sections موجود؟' AS السؤال,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'hero_sections'
    ) THEN '✅ موجود'
    ELSE '❌ غير موجود - يجب إنشاؤه'
  END AS الإجابة;

-- 4. عرض أقسام Hero إن وجدت
SELECT 
  id,
  page AS الصفحة,
  title AS العنوان,
  subtitle AS العنوان_الفرعي,
  is_active AS نشط,
  display_order AS الترتيب
FROM hero_sections
ORDER BY display_order;

-- 5. قائمة الصفحات المطلوبة
SELECT * FROM (
  VALUES 
    ('about', 'من نحن', 'صفحة تعريفية عن الموقع'),
    ('contact', 'اتصل بنا', 'صفحة معلومات الاتصال'),
    ('faq', 'الأسئلة الشائعة', 'صفحة الأسئلة المتكررة'),
    ('shipping', 'الشحن والتوصيل', 'سياسة الشحن والتوصيل'),
    ('return-policy', 'سياسة الإرجاع', 'سياسة إرجاع المنتجات'),
    ('privacy-policy', 'سياسة الخصوصية', 'سياسة حماية البيانات'),
    ('terms', 'الشروط والأحكام', 'شروط استخدام الموقع')
) AS required_pages(slug, title, description);

-- 6. الصفحات المفقودة
SELECT 
  rp.slug AS الرابط_المفقود,
  rp.title AS العنوان,
  rp.description AS الوصف,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ موجودة'
    ELSE '❌ مفقودة'
  END AS الحالة
FROM (
  VALUES 
    ('about', 'من نحن', 'صفحة تعريفية عن الموقع'),
    ('contact', 'اتصل بنا', 'صفحة معلومات الاتصال'),
    ('faq', 'الأسئلة الشائعة', 'صفحة الأسئلة المتكررة'),
    ('shipping', 'الشحن والتوصيل', 'سياسة الشحن والتوصيل'),
    ('return-policy', 'سياسة الإرجاع', 'سياسة إرجاع المنتجات'),
    ('privacy-policy', 'سياسة الخصوصية', 'سياسة حماية البيانات'),
    ('terms', 'الشروط والأحكام', 'شروط استخدام الموقع')
) AS rp(slug, title, description)
LEFT JOIN pages p ON p.slug = rp.slug;

-- 7. عدد الصفحات الموجودة vs المطلوبة
SELECT 
  COUNT(*) FILTER (WHERE p.id IS NOT NULL) AS الصفحات_الموجودة,
  7 AS الصفحات_المطلوبة,
  7 - COUNT(*) FILTER (WHERE p.id IS NOT NULL) AS الصفحات_المفقودة
FROM (
  VALUES 
    ('about'), ('contact'), ('faq'), ('shipping'),
    ('return-policy'), ('privacy-policy'), ('terms')
) AS rp(slug)
LEFT JOIN pages p ON p.slug = rp.slug;

-- 8. رسالة نهائية
SELECT '✅ تم فحص صفحة إدارة الصفحات' AS الحالة,
       'راجع النتائج أعلاه لمعرفة الصفحات المفقودة' AS الرسالة;
