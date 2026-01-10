-- ============================================
-- تحديث البيانات التجريبية ببيانات واقعية
-- تاريخ: 11 يناير 2026
-- ============================================

-- 1. تحديث أسماء وأوصاف المنتجات
-- ============================================

-- منتجات الإلكترونيات
UPDATE products 
SET 
  name = 'ساعة ذكية Apple Watch Series 9',
  description = 'ساعة ذكية متطورة مع شاشة Retina دائمة التشغيل، مستشعر صحي متقدم، ومقاومة للماء حتى 50 متر. تتميز بتصميم أنيق ومجموعة واسعة من الميزات الصحية واللياقة البدنية.',
  category = 'إلكترونيات'
WHERE LOWER(name) = 'تست' AND (description LIKE '%ساعة%' OR id IN (
  SELECT id FROM products WHERE LOWER(name) = 'تست' ORDER BY RANDOM() LIMIT 1
));

UPDATE products 
SET 
  name = 'هاتف iPhone 15 Pro Max',
  description = 'هاتف ذكي بمواصفات رائدة: شاشة Super Retina XDR 6.7 بوصة، معالج A17 Pro، كاميرا ثلاثية 48MP، وبطارية تدوم طوال اليوم. متوفر بألوان متعددة.',
  category = 'إلكترونيات'
WHERE LOWER(name) = 'jsj' OR (LOWER(name) = 'تست' AND id IN (
  SELECT id FROM products WHERE LOWER(name) IN ('jsj', 'تست') ORDER BY RANDOM() LIMIT 1
));

UPDATE products 
SET 
  name = 'سماعات AirPods Pro 2',
  description = 'سماعات لاسلكية بتقنية إلغاء الضوضاء النشط، صوت عالي الدقة، ومقاومة للماء والعرق. تأتي مع علبة شحن لاسلكية وعمر بطارية يصل إلى 30 ساعة.',
  category = 'إلكترونيات'
WHERE LOWER(name) = 'تست' AND (description LIKE '%سماعات%' OR id IN (
  SELECT id FROM products WHERE LOWER(name) = 'تست' AND id NOT IN (
    SELECT id FROM products WHERE name LIKE '%Apple Watch%' OR name LIKE '%iPhone%'
  ) ORDER BY RANDOM() LIMIT 1
));

-- منتجات التجميل والعطور
UPDATE products 
SET 
  name = 'عطر Dior Sauvage Eau de Toilette',
  description = 'عطر رجالي فاخر بعبير خشبي منعش، يجمع بين الأناقة والجرأة. يدوم لساعات طويلة ومناسب لجميع المناسبات. حجم 100 مل.',
  category = 'عطور وتجميل'
WHERE LOWER(name) = 'تست' AND (description LIKE '%عطر%' OR id IN (
  SELECT id FROM products WHERE LOWER(name) = 'تست' AND id NOT IN (
    SELECT id FROM products WHERE name LIKE '%Apple%' OR name LIKE '%iPhone%' OR name LIKE '%سماعات%'
  ) ORDER BY RANDOM() LIMIT 1
));

-- منتجات الألعاب
UPDATE products 
SET 
  name = 'سيارة لعبة تحكم عن بعد RC Car',
  description = 'سيارة لعبة بتحكم عن بعد بتصميم واقعي، سرعة عالية، وبطارية قابلة لإعادة الشحن. مناسبة للأطفال من عمر 6 سنوات فما فوق.',
  category = 'ألعاب'
WHERE LOWER(name) = 'تست' AND (description LIKE '%سيارة%' OR id IN (
  SELECT id FROM products WHERE LOWER(name) = 'تست' AND id NOT IN (
    SELECT id FROM products WHERE name LIKE '%Apple%' OR name LIKE '%iPhone%' OR name LIKE '%سماعات%' OR name LIKE '%عطر%'
  ) ORDER BY RANDOM() LIMIT 1
));

-- تحديث المنتجات المتبقية بأسماء عامة
UPDATE products 
SET 
  name = CASE 
    WHEN price < 50 THEN 'منتج اقتصادي مميز'
    WHEN price < 100 THEN 'منتج متوسط الجودة'
    ELSE 'منتج فاخر'
  END,
  description = 'منتج عالي الجودة بسعر مناسب، يلبي احتياجاتك اليومية ويضمن رضاك التام.'
WHERE LOWER(name) IN ('تست', 'jsj') AND name NOT LIKE '%Apple%' AND name NOT LIKE '%iPhone%' AND name NOT LIKE '%سماعات%' AND name NOT LIKE '%عطر%' AND name NOT LIKE '%سيارة%';

-- 2. تحديث أسماء وأوصاف وجبات المطاعم
-- ============================================

UPDATE menu_items 
SET 
  name = 'بيتزا مارغريتا كبيرة',
  description = 'بيتزا إيطالية كلاسيكية بصلصة الطماطم الطازجة، جبنة موتزاريلا، وأوراق الريحان. تُخبز في فرن حجري تقليدي.'
WHERE LOWER(name) = 'بيتزا';

UPDATE menu_items 
SET 
  name = 'برجر لحم أنجوس فاخر',
  description = 'برجر لحم أنجوس 200 جرام، خس، طماطم، بصل، مخلل، وصلصة خاصة. يُقدم مع بطاطس مقلية وكولسلو.'
WHERE LOWER(name) = 'برجر';

UPDATE menu_items 
SET 
  name = 'دجاج بروستد مقرمش',
  description = 'قطع دجاج طازجة متبلة بخلطة سرية ومقلية حتى تصبح ذهبية ومقرمشة. تُقدم مع ثوميه وبطاطس.'
WHERE LOWER(name) = 'بروست';

UPDATE menu_items 
SET 
  name = CASE 
    WHEN price < 20 THEN 'وجبة خفيفة لذيذة'
    WHEN price < 40 THEN 'وجبة رئيسية شهية'
    ELSE 'وجبة فاخرة مميزة'
  END,
  description = 'وجبة طازجة محضرة بأجود المكونات وبمعايير صحية عالية.'
WHERE LOWER(name) IN ('تست', 'jsj') OR name IS NULL;

-- 3. تحديث معلومات المتاجر
-- ============================================

UPDATE stores 
SET 
  description = CASE 
    WHEN description IS NULL OR description = '' THEN 'متجر متخصص في بيع منتجات عالية الجودة بأسعار تنافسية. نوفر خدمة توصيل سريعة وضمان على جميع المنتجات.'
    ELSE description
  END,
  business_hours = CASE 
    WHEN business_hours IS NULL THEN '{"السبت-الخميس":"9:00-22:00","الجمعة":"14:00-22:00"}'::jsonb
    ELSE business_hours
  END
WHERE description IS NULL OR description = '' OR business_hours IS NULL;

-- 4. تحديث معلومات المطاعم
-- ============================================

UPDATE restaurants 
SET 
  description = CASE 
    WHEN description IS NULL OR description = '' THEN 'مطعم يقدم أشهى الأطباق المحضرة بأجود المكونات الطازجة. نلتزم بأعلى معايير النظافة والجودة.'
    ELSE description
  END,
  cuisine_type = CASE 
    WHEN cuisine_type IS NULL THEN 'مأكولات متنوعة'
    ELSE cuisine_type
  END,
  business_hours = CASE 
    WHEN business_hours IS NULL THEN '{"السبت-الخميس":"10:00-23:00","الجمعة":"14:00-23:00"}'::jsonb
    ELSE business_hours
  END
WHERE description IS NULL OR description = '' OR cuisine_type IS NULL OR business_hours IS NULL;

-- 5. تقريب الأسعار إلى منزلتين عشريتين
-- ============================================

UPDATE products 
SET price = ROUND(price::numeric, 2);

UPDATE products 
SET original_price = ROUND(original_price::numeric, 2)
WHERE original_price IS NOT NULL;

UPDATE menu_items 
SET price = ROUND(price::numeric, 2);

UPDATE orders 
SET total_amount = ROUND(total_amount::numeric, 2);

-- 6. إضافة فئات للمنتجات إذا كانت فارغة
-- ============================================

UPDATE products 
SET category = CASE 
  WHEN name LIKE '%ساعة%' OR name LIKE '%هاتف%' OR name LIKE '%سماعات%' THEN 'إلكترونيات'
  WHEN name LIKE '%عطر%' THEN 'عطور وتجميل'
  WHEN name LIKE '%سيارة%' THEN 'ألعاب'
  ELSE 'منتجات متنوعة'
END
WHERE category IS NULL OR category = '';

-- ============================================
-- انتهى ملف تحديث البيانات
-- ============================================

-- ملاحظات:
-- 1. يجب تنفيذ هذا الملف بعد تنفيذ fix_critical_issues.sql
-- 2. هذه البيانات هي أمثلة، يمكن تخصيصها حسب الحاجة
-- 3. يُنصح بمراجعة البيانات بعد التحديث للتأكد من صحتها
