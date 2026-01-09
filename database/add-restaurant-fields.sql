-- ============================================
-- إضافة حقول جديدة لجدول المطاعم (stores)
-- ============================================

-- إضافة حقل نوع المطبخ
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS cuisine_type VARCHAR(100);

-- إضافة حقل وقت التوصيل
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS delivery_time VARCHAR(50);

-- إضافة حقل رسوم التوصيل
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2) DEFAULT 0.00;

-- إضافة فهرس على نوع المطبخ لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_stores_cuisine_type ON stores(cuisine_type);

-- تحديث بعض المطاعم الموجودة بأنواع مطابخ افتراضية (اختياري)
-- يمكنك تعديل هذا حسب البيانات الفعلية
UPDATE stores 
SET cuisine_type = 'arabic',
    delivery_time = '25-35',
    delivery_fee = 5.00
WHERE business_type = 'restaurant' 
  AND cuisine_type IS NULL;

-- رسالة نجاح
SELECT '✅ تم إضافة الحقول الجديدة بنجاح' AS الحالة,
       'cuisine_type, delivery_time, delivery_fee' AS الحقول_المضافة;
