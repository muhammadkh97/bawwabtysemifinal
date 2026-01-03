-- ✅ إصلاح سياسات RLS للتصنيفات - النسخة المحسّنة
-- التاريخ: 3 يناير 2026
-- تطبيق هذا الملف في Supabase Dashboard -> SQL Editor

-- 1️⃣ تفعيل RLS على جدول categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 2️⃣ حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "allow_read_categories" ON categories;
DROP POLICY IF EXISTS "allow_admin_manage_categories" ON categories;
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_admin_all" ON categories;
DROP POLICY IF EXISTS "categories_vendor_read" ON categories;
DROP POLICY IF EXISTS "categories_vendor_create" ON categories;
DROP POLICY IF EXISTS "categories_vendor_own_pending" ON categories;
DROP POLICY IF EXISTS "categories_read_approved" ON categories;
DROP POLICY IF EXISTS "categories_admin_read" ON categories;
DROP POLICY IF EXISTS "categories_admin_insert" ON categories;
DROP POLICY IF EXISTS "categories_admin_update" ON categories;
DROP POLICY IF EXISTS "categories_admin_delete" ON categories;
DROP POLICY IF EXISTS "categories_vendor_read_approved" ON categories;
DROP POLICY IF EXISTS "categories_vendor_read_own_pending" ON categories;

-- 3️⃣ إنشاء سياسات جديدة باستخدام JWT Claims

-- السياسة 1: قراءة عامة للتصنيفات المعتمدة والنشطة (للجميع)
CREATE POLICY "categories_anon_read"
ON categories FOR SELECT
TO anon, authenticated
USING (
  is_active = true 
  AND approval_status = 'approved'
);

-- السياسة 2: المدراء - قراءة كل التصنيفات
CREATE POLICY "categories_admin_read"
ON categories FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'user_role' = 'admin'
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- السياسة 3: المدراء - إدراج (INSERT)
CREATE POLICY "categories_admin_insert"
ON categories FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'user_role' = 'admin'
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- السياسة 4: المدراء - تحديث (UPDATE)
CREATE POLICY "categories_admin_update"
ON categories FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'user_role' = 'admin'
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  auth.jwt() ->> 'user_role' = 'admin'
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- السياسة 5: المدراء - حذف (DELETE)
CREATE POLICY "categories_admin_delete"
ON categories FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'user_role' = 'admin'
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- السياسة 6: البائعين - قراءة التصنيفات المعتمدة
CREATE POLICY "categories_vendor_read_approved"
ON categories FOR SELECT
TO authenticated
USING (
  (
    auth.jwt() ->> 'user_role' IN ('vendor', 'restaurant')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('vendor', 'restaurant')
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('vendor', 'restaurant')
    )
  )
  AND approval_status = 'approved'
);

-- السياسة 7: البائعين - قراءة تصنيفاتهم المعلقة
CREATE POLICY "categories_vendor_read_own_pending"
ON categories FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  AND (
    auth.jwt() ->> 'user_role' IN ('vendor', 'restaurant')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('vendor', 'restaurant')
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('vendor', 'restaurant')
    )
  )
);

-- السياسة 8: البائعين - إنشاء تصنيفات
CREATE POLICY "categories_vendor_create"
ON categories FOR INSERT
TO authenticated
WITH CHECK (
  (
    auth.jwt() ->> 'user_role' IN ('vendor', 'restaurant')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('vendor', 'restaurant')
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('vendor', 'restaurant')
    )
  )
);

-- ✅ تم بنجاح!
-- الآن سياسات RLS الجديدة جاهزة للعمل
