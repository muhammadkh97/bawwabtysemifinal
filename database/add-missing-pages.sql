-- ============================================
-- إضافة الصفحات المفقودة وأقسام Hero
-- ============================================

-- 1. إضافة صفحة "من نحن"
INSERT INTO pages (slug, title, content)
VALUES (
  'about',
  'من نحن',
  '<h1>من نحن</h1><p>بوابة بي - منصة تجارة إلكترونية شاملة تجمع بين المتاجر الإلكترونية والمطاعم في مكان واحد.</p>'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  updated_at = NOW();

-- 2. إضافة صفحة "اتصل بنا"
INSERT INTO pages (slug, title, content)
VALUES (
  'contact',
  'اتصل بنا',
  '<h1>اتصل بنا</h1><p>نحن هنا لمساعدتك! يمكنك التواصل معنا عبر:</p><ul><li>البريد الإلكتروني: info@bawwabty.com</li><li>الهاتف: +962 XX XXX XXXX</li></ul>'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  updated_at = NOW();

-- 3. إضافة صفحة "الأسئلة الشائعة"
INSERT INTO pages (slug, title, content)
VALUES (
  'faq',
  'الأسئلة الشائعة',
  '<h1>الأسئلة الشائعة</h1><h2>كيف أقوم بإنشاء حساب؟</h2><p>اضغط على زر "تسجيل" في الصفحة الرئيسية.</p><h2>كيف أتابع طلبي؟</h2><p>يمكنك متابعة طلبك من صفحة "طلباتي".</p>'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  updated_at = NOW();

-- 4. إضافة صفحة "الشحن والتوصيل"
INSERT INTO pages (slug, title, content)
VALUES (
  'shipping',
  'الشحن والتوصيل',
  '<h1>سياسة الشحن والتوصيل</h1><p>نوفر خدمة توصيل سريعة لجميع المناطق.</p><ul><li>التوصيل خلال 24-48 ساعة</li><li>رسوم التوصيل تبدأ من 20 ريال</li><li>توصيل مجاني للطلبات فوق 100 ريال</li></ul>'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  updated_at = NOW();

-- 5. إضافة صفحة "سياسة الإرجاع"
INSERT INTO pages (slug, title, content)
VALUES (
  'return-policy',
  'سياسة الإرجاع',
  '<h1>سياسة الإرجاع والاستبدال</h1><p>يمكنك إرجاع المنتجات خلال 14 يوم من تاريخ الاستلام.</p><h2>شروط الإرجاع:</h2><ul><li>المنتج في حالته الأصلية</li><li>التغليف سليم</li><li>عدم استخدام المنتج</li></ul>'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  updated_at = NOW();

-- 6. إضافة صفحة "سياسة الخصوصية"
INSERT INTO pages (slug, title, content)
VALUES (
  'privacy-policy',
  'سياسة الخصوصية',
  '<h1>سياسة الخصوصية</h1><p>نحن نحترم خصوصيتك ونحمي بياناتك الشخصية.</p><h2>المعلومات التي نجمعها:</h2><ul><li>الاسم والبريد الإلكتروني</li><li>عنوان التوصيل</li><li>رقم الهاتف</li></ul><h2>كيف نستخدم معلوماتك:</h2><ul><li>لإتمام طلباتك</li><li>للتواصل معك</li><li>لتحسين خدماتنا</li></ul>'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  updated_at = NOW();

-- 7. إضافة صفحة "الشروط والأحكام"
INSERT INTO pages (slug, title, content)
VALUES (
  'terms',
  'الشروط والأحكام',
  '<h1>الشروط والأحكام</h1><p>باستخدامك لهذا الموقع، فإنك توافق على الشروط والأحكام التالية:</p><h2>استخدام الموقع:</h2><ul><li>يجب أن تكون فوق 18 عاماً</li><li>تقديم معلومات صحيحة</li><li>عدم إساءة استخدام المنصة</li></ul><h2>الطلبات والدفع:</h2><ul><li>جميع الأسعار بالريال الأردني</li><li>الدفع عند الاستلام متاح</li></ul>'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  updated_at = NOW();

-- 8. إضافة أقسام Hero للصفحة الرئيسية
INSERT INTO hero_sections (page, title, subtitle, button_text, button_link, image_url, is_active, display_order)
VALUES 
  ('home', 'مرحباً بك في بوابة بي', 'تسوق من آلاف المنتجات واطلب من أفضل المطاعم', 'تسوق الآن', '/products', '/images/hero-1.jpg', true, 1),
  ('home', 'أفضل العروض اليومية', 'خصومات تصل إلى 50% على منتجات مختارة', 'اكتشف العروض', '/offers', '/images/hero-2.jpg', true, 2),
  ('home', 'توصيل سريع لباب منزلك', 'خدمة توصيل سريعة وآمنة لجميع المناطق', 'اطلب الآن', '/restaurants', '/images/hero-3.jpg', true, 3)
ON CONFLICT DO NOTHING;

-- 9. التحقق من النتائج
SELECT 
  '✅ تم إضافة الصفحات' AS الحالة,
  COUNT(*) AS عدد_الصفحات_المُضافة
FROM pages
WHERE slug IN ('about', 'contact', 'faq', 'shipping', 'return-policy', 'privacy-policy', 'terms');
