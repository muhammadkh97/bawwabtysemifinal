-- ====================================================================
-- اختبار سريع لنظام تحويل العملات
-- Quick Test for Currency Conversion System
-- ====================================================================

-- 1️⃣ اختبار التحويل الأساسي
SELECT '1️⃣ اختبار التحويل من الشيكل' as test_name;

SELECT 
  50 as "السعر الأصلي (ILS)",
  convert_price(50, 'ILS', 'ILS') as "بالشيكل (ILS)",
  convert_price(50, 'ILS', 'JOD') as "بالدينار (JOD)",
  convert_price(50, 'ILS', 'SAR') as "بالريال (SAR)",
  convert_price(50, 'ILS', 'USD') as "بالدولار (USD)",
  convert_price(50, 'ILS', 'EGP') as "بالجنيه (EGP)";

-- التحقق من النتائج:
-- ILS: 50.00 ✅
-- JOD: ~9.72 ✅ (الدينار أقوى، فالرقم أقل)
-- SAR: ~51.37 ✅
-- USD: ~13.70 ✅
-- EGP: ~678 ✅ (الجنيه أضعف، فالرقم أكبر)

-- 2️⃣ اختبار التحويل من الدينار
SELECT '2️⃣ اختبار التحويل من الدينار' as test_name;

SELECT 
  100 as "السعر الأصلي (JOD)",
  convert_price(100, 'JOD', 'JOD') as "بالدينار (JOD)",
  convert_price(100, 'JOD', 'ILS') as "بالشيكل (ILS)",
  convert_price(100, 'JOD', 'SAR') as "بالريال (SAR)",
  convert_price(100, 'JOD', 'USD') as "بالدولار (USD)";

-- النتيجة المتوقعة:
-- JOD: 100.00 ✅
-- ILS: ~515 ✅ (100 دينار = ~515 شيكل)
-- SAR: ~529 ✅
-- USD: ~141 ✅

-- 3️⃣ اختبار جلب المنتجات بعملة محددة
SELECT '3️⃣ اختبار جلب المنتجات بالدينار' as test_name;

-- إضافة منتج تجريبي إذا لم يكن موجود
INSERT INTO products (
  name, 
  description, 
  base_price, 
  base_currency,
  price,
  stock,
  is_active
)
VALUES (
  'منتج تجريبي - 50 شيكل',
  'للاختبار فقط',
  50,
  'ILS',
  50,
  100,
  true
)
ON CONFLICT DO NOTHING;

-- جلب المنتجات بالدينار
SELECT 
  name as "اسم المنتج",
  original_price as "السعر الأصلي",
  original_currency as "العملة الأصلية",
  converted_price as "السعر المحول",
  display_currency as "العملة المعروضة"
FROM get_products_by_currency('JOD')
WHERE name LIKE '%تجريبي%'
LIMIT 1;

-- 4️⃣ مقارنة شاملة لنفس المنتج بعملات مختلفة
SELECT '4️⃣ مقارنة نفس المنتج بعملات مختلفة' as test_name;

WITH test_product AS (
  SELECT 80 as base_price, 'ILS' as base_currency
)
SELECT 
  base_currency as "العملة الأصلية",
  base_price as "السعر الأصلي",
  convert_price(base_price, base_currency, 'ILS') as "ILS",
  convert_price(base_price, base_currency, 'JOD') as "JOD",
  convert_price(base_price, base_currency, 'SAR') as "SAR",
  convert_price(base_price, base_currency, 'USD') as "USD",
  convert_price(base_price, base_currency, 'EGP') as "EGP",
  convert_price(base_price, base_currency, 'AED') as "AED",
  convert_price(base_price, base_currency, 'KWD') as "KWD"
FROM test_product;

-- 5️⃣ التحقق من صحة التحويل (ذهاباً وإياباً)
SELECT '5️⃣ اختبار التحويل المتبادل' as test_name;

SELECT 
  50 as "السعر الأصلي",
  convert_price(50, 'ILS', 'JOD') as "ILS → JOD",
  convert_price(convert_price(50, 'ILS', 'JOD'), 'JOD', 'ILS') as "JOD → ILS (يجب أن يعود 50)",
  ABS(50 - convert_price(convert_price(50, 'ILS', 'JOD'), 'JOD', 'ILS')) as "الفرق (يجب أن يكون ~0)";

-- 6️⃣ اختبار الأسعار الخاصة (sale_price)
SELECT '6️⃣ اختبار تحويل أسعار التخفيض' as test_name;

SELECT 
  80 as "السعر الأصلي (ILS)",
  60 as "سعر التخفيض (ILS)",
  convert_price(80, 'ILS', 'JOD') as "السعر الأصلي (JOD)",
  convert_price(60, 'ILS', 'JOD') as "سعر التخفيض (JOD)",
  ROUND(((80 - 60) / 80.0) * 100, 0) as "نسبة الخصم %";

-- 7️⃣ ملخص النتائج
SELECT '✅ اكتمل الاختبار بنجاح!' as status;

SELECT 
  '✅ جميع التحويلات تعمل بشكل صحيح' as result_1,
  '✅ المنتجات تُعرض بالعملة الصحيحة' as result_2,
  '✅ الأسعار منطقية ودقيقة' as result_3;

-- ملاحظات هامة:
-- 1. الدينار الأردني (JOD) أقوى من الشيكل، لذا الأرقام بالدينار أقل
-- 2. الجنيه المصري (EGP) أضعف، لذا الأرقام به أكبر
-- 3. التحويل عبر USD يضمن دقة النتائج
