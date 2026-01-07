-- ملخص إصلاحات صفحة الموافقات (Approvals Page)
-- تاريخ: 2026-01-07

-- ========================================
-- المشكلة الأولى: تعارض العلاقات في جدول products
-- ========================================
-- السبب: وجود مفتاحين أجنبيين على نفس العمود vendor_id
--   1. products_vendor_id_stores_fkey -> stores.id
--   2. products_vendor_id_vendors_fkey -> vendors.id
-- 
-- الحل: حذف المفتاح الأجنبي الزائد (products_vendor_id_vendors_fkey)

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_vendor_id_vendors_fkey;

-- النتيجة: ✅ تم تنفيذ السكريبت بنجاح
-- الآن Supabase يمكنه الربط بشكل صحيح بين products و stores

-- ========================================
-- المشكلة الثانية: استخدام عمود غير موجود في جدول drivers
-- ========================================
-- السبب: الكود يحاول جلب عمود vehicle_plate الذي لا يوجد في قاعدة البيانات
-- الحل: تم تعديل الكود ليستخدم vehicle_number بدلاً من vehicle_plate
--
-- التعديلات على الكود:
-- 1. تعديل استعلام جلب السائقين ليستخدم vehicle_number
-- 2. تعديل mapping البيانات ليستخدم vehicle_number
-- 3. إضافة حقل license_image للاستعلام والـ mapping
-- 4. تعديل العرض في الواجهة ليستخدم vehicle_number

-- ========================================
-- التحقق من الإصلاحات
-- ========================================

-- 1. التحقق من المفاتيح الأجنبية المتبقية في جدول products
SELECT
    tc.constraint_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'products' AND tc.constraint_type = 'FOREIGN KEY';

-- يجب أن يظهر فقط:
-- - products_category_id_fkey (products.category_id -> categories.id)
-- - products_vendor_id_stores_fkey (products.vendor_id -> stores.id)
-- - fk_products_currency (products.currency -> currencies.code)

-- 2. التحقق من أعمدة جدول drivers
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'drivers' 
  AND column_name IN ('vehicle_number', 'vehicle_plate', 'license_image')
ORDER BY column_name;

-- يجب أن يظهر:
-- - license_image
-- - vehicle_number
-- (ولا يظهر vehicle_plate)

-- ========================================
-- اختبار الاستعلامات المصلحة
-- ========================================

-- اختبار استعلام المنتجات المعلقة (يجب أن يعمل الآن بدون أخطاء)
SELECT 
  id,
  name,
  price,
  vendor_id,
  approval_status
FROM products
WHERE approval_status = 'pending'
LIMIT 5;

-- اختبار استعلام السائقين المعلقين (يجب أن يعمل الآن بدون أخطاء)
SELECT 
  id,
  user_id,
  license_number,
  license_image,
  vehicle_type,
  vehicle_number,
  approval_status
FROM drivers
WHERE approval_status = 'pending'
LIMIT 5;

-- ========================================
-- الملخص
-- ========================================
-- ✅ تم حل مشكلة العلاقات في جدول products
-- ✅ تم تعديل استعلام السائقين ليستخدم الأعمدة الصحيحة
-- ✅ صفحة الموافقات (/dashboard/admin/approvals) يجب أن تعمل الآن بدون أخطاء
