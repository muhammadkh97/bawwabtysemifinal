-- ===================================================================
-- إضافة سياسات RLS لـ bucket profiles للسماح برفع الصور
-- ===================================================================

-- 1. حذف السياسات القديمة إن وجدت (تجنب التكرار)
DROP POLICY IF EXISTS "User insert profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profiles" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- 2. سياسة: السماح للمستخدمين المسجلين برفع الصور في bucket profiles
CREATE POLICY "Users can upload profile images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
    bucket_id = 'profiles' AND
    auth.role() = 'authenticated'
);

-- 3. سياسة: السماح للمستخدمين بتحديث الصور في bucket profiles
CREATE POLICY "Users can update profile images"
ON storage.objects
FOR UPDATE
TO public
USING (
    bucket_id = 'profiles' AND
    auth.role() = 'authenticated'
)
WITH CHECK (
    bucket_id = 'profiles' AND
    auth.role() = 'authenticated'
);

-- 4. سياسة: السماح للجميع بمشاهدة الصور في bucket profiles (لأن bucket عام)
CREATE POLICY "Public can view profile images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- 5. سياسة: السماح للمستخدمين بحذف الصور في bucket profiles
CREATE POLICY "Users can delete profile images"
ON storage.objects
FOR DELETE
TO public
USING (
    bucket_id = 'profiles' AND
    auth.role() = 'authenticated'
);

-- ===================================================================
-- التحقق من إضافة السياسات بنجاح
-- ===================================================================

SELECT 
    '✅ السياسات المضافة على bucket profiles:' as info;

SELECT 
    schemaname as "Schema",
    tablename as "الجدول",
    policyname as "اسم السياسة",
    permissive as "نوع السياسة",
    roles as "الأدوار",
    cmd as "الأمر"
FROM pg_policies
WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname ILIKE '%profile%'
ORDER BY policyname;

-- ===================================================================
-- ✅ تم إضافة السياسات بنجاح
-- ===================================================================
