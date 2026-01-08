-- ============================================
-- فحص صور Hero وتحديثها
-- ============================================

-- 1️⃣ عرض البيانات الحالية مع الصور
SELECT 
    id,
    title,
    image_url,
    is_active,
    display_order
FROM hero_sections
WHERE page = 'home'
ORDER BY display_order;

-- 2️⃣ تحديث الصور - ضع روابط الصور التي تريدها هنا
UPDATE hero_sections
SET image_url = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80'
WHERE id = 'd4beae26-9046-4c87-8ce6-eb0e562d31d9';

UPDATE hero_sections
SET image_url = 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&q=80'
WHERE id = '8782b370-8316-47f9-adb5-1a225c21aa97';

UPDATE hero_sections
SET image_url = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80'
WHERE id = '8fa038ab-59b9-4c18-9bf4-a0cbf6c06be1';

-- 📝 أو استخدم هذا لتحديث بناءً على display_order:
-- UPDATE hero_sections 
-- SET image_url = 'رابط_الصورة_هنا'
-- WHERE page = 'home' AND display_order = 1;

-- 3️⃣ التحقق من التحديثات
SELECT 
    id,
    title,
    image_url,
    is_active,
    display_order
FROM hero_sections
WHERE page = 'home'
ORDER BY display_order;
