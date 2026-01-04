-- ✅ إصلاح سياسات RLS للتصنيفات - حل مشكلة permission denied
-- التاريخ: 3 يناير 2026
-- المشكلة: permission denied for table categories عند محاولة المدراء إنشاء تصنيفات جديدة

-- 1️⃣ حذف السياسة القديمة المعطلة
DROP POLICY IF EXISTS "admin_all_access" ON categories;

-- 2️⃣ حذف أي سياسات قديمة أخرى
DROP POLICY IF EXISTS "allow_read_categories" ON categories;
DROP POLICY IF EXISTS "allow_admin_manage_categories" ON categories;
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_admin_all" ON categories;
DROP POLICY IF EXISTS "categories_admin_read" ON categories;
DROP POLICY IF EXISTS "categories_admin_insert" ON categories;
DROP POLICY IF EXISTS "categories_admin_update" ON categories;
DROP POLICY IF EXISTS "categories_admin_delete" ON categories;
DROP POLICY IF EXISTS "categories_vendor_read" ON categories;
DROP POLICY IF EXISTS "categories_vendor_create" ON categories;
DROP POLICY IF EXISTS "categories_vendor_own_pending" ON categories;
DROP POLICY IF EXISTS "categories_vendor_read_approved" ON categories;
DROP POLICY IF EXISTS "categories_vendor_read_own_pending" ON categories;
DROP POLICY IF EXISTS "categories_anon_read" ON categories;

-- 3️⃣ إنشاء سياسات RLS جديدة محسّنة

-- السياسة 1: قراءة عامة للتصنيفات المعتمدة والنشطة (للجميع بما فيهم الزوار)
CREATE POLICY "categories_public_read"
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
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- السياسة 3: المدراء - إدراج تصنيفات جديدة (INSERT)
CREATE POLICY "categories_admin_insert"
ON categories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- السياسة 4: المدراء - تحديث التصنيفات (UPDATE)
CREATE POLICY "categories_admin_update"
ON categories FOR UPDATE
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

-- السياسة 5: المدراء - حذف التصنيفات (DELETE)
CREATE POLICY "categories_admin_delete"
ON categories FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- السياسة 6: البائعين والمطاعم - قراءة التصنيفات المعتمدة
CREATE POLICY "categories_vendor_read_approved"
ON categories FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('vendor', 'restaurant')
  )
  AND approval_status = 'approved'
  AND is_active = true
);

-- السياسة 7: البائعين والمطاعم - قراءة تصنيفاتهم المعلقة
CREATE POLICY "categories_vendor_read_own_pending"
ON categories FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('vendor', 'restaurant')
  )
);

-- السياسة 8: البائعين والمطاعم - إنشاء تصنيفات (تحتاج موافقة)
CREATE POLICY "categories_vendor_create"
ON categories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('vendor', 'restaurant')
  )
  AND requires_approval = true
  AND approval_status = 'pending'
);

-- 4️⃣ التأكد من تفعيل RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 5️⃣ إضافة تعليقات توثيقية
COMMENT ON POLICY "categories_public_read" ON categories IS 'السماح للجميع بقراءة التصنيفات المعتمدة والنشطة';
COMMENT ON POLICY "categories_admin_read" ON categories IS 'المدراء يمكنهم قراءة جميع التصنيفات';
COMMENT ON POLICY "categories_admin_insert" ON categories IS 'المدراء يمكنهم إنشاء تصنيفات جديدة';
COMMENT ON POLICY "categories_admin_update" ON categories IS 'المدراء يمكنهم تحديث التصنيفات';
COMMENT ON POLICY "categories_admin_delete" ON categories IS 'المدراء يمكنهم حذف التصنيفات';
COMMENT ON POLICY "categories_vendor_read_approved" ON categories IS 'البائعين يمكنهم قراءة التصنيفات المعتمدة';
COMMENT ON POLICY "categories_vendor_read_own_pending" ON categories IS 'البائعين يمكنهم قراءة تصنيفاتهم المعلقة';
COMMENT ON POLICY "categories_vendor_create" ON categories IS 'البائعين يمكنهم إنشاء تصنيفات تحتاج موافقة';

-- ✅ تم الإصلاح بنجاح!
-- الآن المدراء يمكنهم إنشاء وتعديل وحذف التصنيفات بدون مشاكل
