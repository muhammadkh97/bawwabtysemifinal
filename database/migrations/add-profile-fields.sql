-- ===================================================================
-- إضافة حقول الملف الشخصي إلى جدول users
-- تاريخ الميلاد، الجنس، البلد
-- ===================================================================

-- 1. إضافة عمود تاريخ الميلاد
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 2. إضافة عمود الجنس
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

-- 3. إضافة عمود البلد
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS country TEXT;

-- 4. إضافة تعليقات توضيحية
COMMENT ON COLUMN public.users.date_of_birth IS 'تاريخ ميلاد المستخدم';
COMMENT ON COLUMN public.users.gender IS 'جنس المستخدم: male أو female';
COMMENT ON COLUMN public.users.country IS 'بلد المستخدم';

-- ===================================================================
-- التحقق من إضافة الأعمدة بنجاح
-- ===================================================================

SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    CASE 
        WHEN is_nullable = 'YES' THEN '✅ نعم'
        ELSE '❌ لا'
    END as "يقبل NULL؟",
    column_default as "القيمة الافتراضية"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'users'
    AND column_name IN ('date_of_birth', 'gender', 'country')
ORDER BY column_name;

-- ===================================================================
-- ✅ تم إضافة الأعمدة بنجاح
-- ===================================================================
