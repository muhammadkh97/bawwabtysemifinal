-- =========================================================
-- 09-initial-data.sql
-- البيانات الأولية والإعدادات
-- =========================================================

-- =====================================================
-- 1. إدراج الفئات الأساسية
-- =====================================================

INSERT INTO public.categories (id, name, name_ar, description, icon_name, order_index, is_active)
VALUES
  (gen_random_uuid(), 'Restaurants', 'المطاعم', 'مطاعم ووجبات سريعة', 'utensils', 1, true),
  (gen_random_uuid(), 'Grocery', 'البقالة', 'منتجات غذائية وبقالة', 'shopping-basket', 2, true),
  (gen_random_uuid(), 'Pharmacy', 'الصيدليات', 'الأدوية والمستحضرات', 'pill', 3, true),
  (gen_random_uuid(), 'Flowers', 'الزهور', 'الزهور والهدايا', 'flower', 4, true),
  (gen_random_uuid(), 'Fashion', 'الملابس', 'الملابس والأحذية', 'shirt', 5, true),
  (gen_random_uuid(), 'Electronics', 'الإلكترونيات', 'أجهزة إلكترونية', 'laptop', 6, true),
  (gen_random_uuid(), 'Books', 'الكتب', 'الكتب والمجلات', 'book', 7, true),
  (gen_random_uuid(), 'Beauty', 'الجمال', 'مستحضرات العناية والجمال', 'sparkles', 8, true);

-- =====================================================
-- 2. إدراج الإعدادات النظام
-- =====================================================

INSERT INTO public.settings (key, value, setting_type, description)
VALUES
  ('platform_name', 'Bawwabty', 'string', 'اسم المنصة'),
  ('platform_name_ar', 'بوابتي', 'string', 'اسم المنصة بالعربية'),
  ('commission_percentage', '10', 'number', 'نسبة العمولة من الطلبات (%)'),
  ('min_order_amount', '5', 'decimal', 'الحد الأدنى لقيمة الطلبية'),
  ('delivery_fee_base', '2', 'decimal', 'قيمة توصيل أساسية'),
  ('currency_code', 'USD', 'string', 'رمز العملة'),
  ('currency_symbol', '$', 'string', 'رمز العملة'),
  ('support_email', 'support@bawwabty.com', 'string', 'بريد الدعم الفني'),
  ('support_phone', '+1234567890', 'string', 'هاتف الدعم'),
  ('max_delivery_distance_km', '50', 'number', 'أقصى مسافة توصيل'),
  ('avg_delivery_time_minutes', '30', 'number', 'الوقت المتوسط للتوصيل'),
  ('enable_loyalty_program', 'true', 'boolean', 'تفعيل برنامج الولاء'),
  ('loyalty_points_multiplier', '1', 'decimal', 'معامل نقاط الولاء'),
  ('vendor_document_verification_required', 'true', 'boolean', 'المستندات المطلوبة للتاجر'),
  ('driver_document_verification_required', 'true', 'boolean', 'المستندات المطلوبة للسائق'),
  ('enable_cash_payment', 'true', 'boolean', 'تفعيل الدفع نقداً'),
  ('enable_card_payment', 'true', 'boolean', 'تفعيل الدفع ببطاقة'),
  ('enable_wallet_payment', 'true', 'boolean', 'تفعيل الدفع من المحفظة'),
  ('site_maintenance_mode', 'false', 'boolean', 'وضع الصيانة'),
  ('site_maintenance_message', '', 'string', 'رسالة الصيانة');

-- =====================================================
-- 3. إدراج الصفحات الثابتة
-- =====================================================

INSERT INTO public.static_pages (id, slug, title, title_ar, content, content_ar, is_published)
VALUES
  (
    gen_random_uuid(),
    'about-us',
    'About Us',
    'من نحن',
    '<h2>About Bawwabty</h2><p>We are a leading delivery platform providing fast and reliable service.</p>',
    '<h2>حول بوابتي</h2><p>نحن منصة توصيل رائدة توفر خدمة سريعة وموثوقة.</p>',
    true
  ),
  (
    gen_random_uuid(),
    'terms-of-service',
    'Terms of Service',
    'شروط الخدمة',
    '<h2>Terms of Service</h2><p>By using our service, you agree to our terms...</p>',
    '<h2>شروط الخدمة</h2><p>باستخدامك لخدمتنا، أنت توافق على شروطنا...</p>',
    true
  ),
  (
    gen_random_uuid(),
    'privacy-policy',
    'Privacy Policy',
    'سياسة الخصوصية',
    '<h2>Privacy Policy</h2><p>Your privacy is important to us...</p>',
    '<h2>سياسة الخصوصية</h2><p>خصوصيتك مهمة لنا...</p>',
    true
  ),
  (
    gen_random_uuid(),
    'faq',
    'FAQ',
    'الأسئلة الشائعة',
    '<h2>Frequently Asked Questions</h2><p>Find answers to common questions...</p>',
    '<h2>الأسئلة الشائعة</h2><p>ابحث عن إجابات للأسئلة الشائعة...</p>',
    true
  ),
  (
    gen_random_uuid(),
    'contact-us',
    'Contact Us',
    'تواصل معنا',
    '<h2>Contact Us</h2><p>Get in touch with our support team...</p>',
    '<h2>تواصل معنا</h2><p>تواصل مع فريق دعمنا...</p>',
    true
  );

-- =====================================================
-- 4. إدراج الأسئلة الشائعة
-- =====================================================

INSERT INTO public.faqs (id, question, answer, category, order_index, is_active)
VALUES
  (
    gen_random_uuid(),
    'How do I place an order?',
    'You can place an order by browsing available restaurants, selecting items, adding them to your cart, and proceeding to checkout.',
    'orders',
    1,
    true
  ),
  (
    gen_random_uuid(),
    'What are the delivery charges?',
    'Delivery charges depend on your location and the distance from the restaurant. You can see the exact charges before confirming your order.',
    'delivery',
    2,
    true
  ),
  (
    gen_random_uuid(),
    'How can I cancel my order?',
    'You can cancel your order within 5 minutes of placing it. Visit your orders page and click the cancel button.',
    'orders',
    3,
    true
  ),
  (
    gen_random_uuid(),
    'Is my payment information secure?',
    'Yes, we use industry-standard encryption to protect your payment information.',
    'payment',
    4,
    true
  ),
  (
    gen_random_uuid(),
    'How do I earn loyalty points?',
    'You earn 1 point for every 10 currency units you spend. Points can be used for discounts on future orders.',
    'loyalty',
    5,
    true
  ),
  (
    gen_random_uuid(),
    'Can I track my delivery?',
    'Yes, you can track your delivery in real-time through the app or website.',
    'delivery',
    6,
    true
  );

-- =====================================================
-- 5. إدراج كوبونات البداية
-- =====================================================

INSERT INTO public.coupons (id, code, discount_type, discount_value, min_order_amount, usage_limit, valid_from, valid_until, is_active)
VALUES
  (
    gen_random_uuid(),
    'WELCOME20',
    'percentage',
    20,
    10,
    100,
    NOW(),
    NOW() + INTERVAL '30 days',
    true
  ),
  (
    gen_random_uuid(),
    'FIRST10',
    'fixed',
    10,
    5,
    50,
    NOW(),
    NOW() + INTERVAL '60 days',
    true
  ),
  (
    gen_random_uuid(),
    'SUMMER25',
    'percentage',
    25,
    20,
    NULL,
    NOW(),
    NOW() + INTERVAL '90 days',
    true
  );

-- =====================================================
-- تأكيد تم إدراج البيانات الأولية
-- =====================================================

SELECT 'تم إدراج البيانات الأولية بنجاح ✓' AS status;

-- =====================================================
-- عرض ملخص البيانات المضافة
-- =====================================================

SELECT 
  (SELECT COUNT(*) FROM public.categories) AS total_categories,
  (SELECT COUNT(*) FROM public.settings) AS total_settings,
  (SELECT COUNT(*) FROM public.static_pages) AS total_pages,
  (SELECT COUNT(*) FROM public.faqs) AS total_faqs,
  (SELECT COUNT(*) FROM public.coupons) AS total_coupons;
