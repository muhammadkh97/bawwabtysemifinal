-- =========================================================
-- إضافة أعمدة opening_time و closing_time لجدول vendors
-- Add opening_time and closing_time columns to vendors table
-- =========================================================

-- إضافة عمود opening_time
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS opening_time TIME DEFAULT '09:00:00';

-- إضافة عمود closing_time
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS closing_time TIME DEFAULT '23:00:00';

-- إضافة تعليقات للأعمدة
COMMENT ON COLUMN public.vendors.opening_time IS 'وقت فتح المتجر/المطعم';
COMMENT ON COLUMN public.vendors.closing_time IS 'وقت إغلاق المتجر/المطعم';

-- التحقق من الأعمدة المضافة
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'vendors'
AND column_name IN ('opening_time', 'closing_time')
ORDER BY column_name;
