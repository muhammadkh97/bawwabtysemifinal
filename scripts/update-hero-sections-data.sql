-- =================================================================
-- تحديث بيانات hero_sections وإصلاح الترجمات
-- تاريخ: 2026-01-09
-- =================================================================

-- تحديث السجل الأول: الصفحة الرئيسية
UPDATE hero_sections
SET 
    title = 'Welcome to Bawwabty',
    title_ar = 'مرحباً بك في بوابتي 🛍️',
    subtitle = 'Shop thousands of products & order from the best restaurants',
    subtitle_ar = 'تسوق من آلاف المنتجات واطلب من أفضل المطاعم',
    button_text = 'Shop Now',
    button_text_ar = 'تسوق الآن',
    background_color = '#6236FF',
    text_color = '#FFFFFF',
    image_url = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
    mobile_image_url = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600',
    updated_at = NOW()
WHERE id = 'd4beae26-9046-4c87-8ce6-eb0e562d31d9';

-- تحديث السجل الثاني: صفحة العروض
UPDATE hero_sections
SET 
    title = 'Best Daily Offers',
    title_ar = 'أفضل العروض اليومية ⚡',
    subtitle = 'Discounts up to 50% on selected products',
    subtitle_ar = 'خصومات تصل إلى 50% على منتجات مختارة',
    button_text = 'Discover Offers',
    button_text_ar = 'اكتشف العروض',
    background_color = '#EF4444',
    text_color = '#FFFFFF',
    image_url = 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200',
    mobile_image_url = 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600',
    updated_at = NOW()
WHERE id = '8782b370-8316-47f9-adb5-1a225c21aa97';

-- تحديث السجل الثالث: المطاعم
UPDATE hero_sections
SET 
    title = 'Fast Delivery to Your Door',
    title_ar = 'توصيل سريع لباب منزلك 🚀',
    subtitle = 'Fast and safe delivery service to all areas',
    subtitle_ar = 'خدمة توصيل سريعة وآمنة لجميع المناطق',
    button_text = 'Order Now',
    button_text_ar = 'اطلب الآن',
    background_color = '#10B981',
    text_color = '#FFFFFF',
    image_url = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200',
    mobile_image_url = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
    updated_at = NOW()
WHERE id = '8fa038ab-59b9-4c18-9bf4-a0cbf6c06be1';

-- التحقق من التحديثات
SELECT 
    title,
    title_ar,
    subtitle_ar,
    button_text_ar,
    button_link,
    is_active,
    display_order
FROM hero_sections
WHERE page = 'home'
ORDER BY display_order;

-- إضافة المزيد من الشرائح (اختياري)
INSERT INTO hero_sections (
    title, 
    title_ar, 
    subtitle, 
    subtitle_ar, 
    button_text, 
    button_text_ar, 
    button_link,
    background_color,
    text_color,
    is_active,
    display_order,
    page,
    image_url,
    mobile_image_url
) VALUES
(
    'New Arrivals',
    'وصل حديثاً 🎁',
    'Check out the latest products in our store',
    'تفقد أحدث المنتجات في متجرنا',
    'View New',
    'شاهد الجديد',
    '/products?sort=newest',
    '#8B5CF6',
    '#FFFFFF',
    true,
    4,
    'home',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600'
),
(
    'Premium Vendors',
    'بائعون مميزون ⭐',
    'Discover trusted vendors with premium products',
    'اكتشف البائعين الموثوقين بمنتجات مميزة',
    'Explore Vendors',
    'تصفح البائعين',
    '/vendors',
    '#F59E0B',
    '#FFFFFF',
    true,
    5,
    'home',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600'
)
ON CONFLICT (id) DO NOTHING;

-- عرض جميع الشرائح بعد التحديث
SELECT 
    '=== جميع شرائح Hero بعد التحديث ===' as info;

SELECT 
    display_order as "الترتيب",
    title_ar as "العنوان",
    subtitle_ar as "الوصف",
    button_text_ar as "نص الزر",
    button_link as "الرابط",
    is_active as "نشط"
FROM hero_sections
WHERE page = 'home'
ORDER BY display_order;

-- =================================================================
-- انتهى التحديث
-- =================================================================
