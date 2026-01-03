-- 🔧 تطبيق هذا الملف في Supabase Dashboard -> SQL Editor

-- إصلاح سياسات RLS لجدول التصنيفات
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "allow_read_categories" ON categories;
DROP POLICY IF EXISTS "allow_admin_manage_categories" ON categories;
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_admin_all" ON categories;
DROP POLICY IF EXISTS "categories_vendor_read" ON categories;

-- 1. السماح لجميع المستخدمين بقراءة التصنيفات النشطة
CREATE POLICY "categories_public_read"
ON categories
FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- 2. السماح للمدراء بكل العمليات على التصنيفات
CREATE POLICY "categories_admin_all"
ON categories
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 3. السماح للبائعين والمطاعم بقراءة التصنيفات
CREATE POLICY "categories_vendor_read"
ON categories
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('vendor', 'restaurant')
  )
);
