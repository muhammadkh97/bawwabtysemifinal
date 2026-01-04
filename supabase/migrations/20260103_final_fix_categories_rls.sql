-- ✅ الحل النهائي لمشكلة permission denied في جدول التصنيفات
-- التاريخ: 3 يناير 2026
-- المشكلة: تعارض السياسات وعدم عمل auth.uid() بشكل صحيح

-- 1️⃣ تعطيل RLS مؤقتاً
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- 2️⃣ حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "admin_all_access" ON categories;
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_admin_read" ON categories;
DROP POLICY IF EXISTS "categories_admin_insert" ON categories;
DROP POLICY IF EXISTS "categories_admin_update" ON categories;
DROP POLICY IF EXISTS "categories_admin_delete" ON categories;
DROP POLICY IF EXISTS "categories_vendor_read_approved" ON categories;
DROP POLICY IF EXISTS "categories_vendor_read_own_pending" ON categories;
DROP POLICY IF EXISTS "categories_vendor_create" ON categories;
DROP POLICY IF EXISTS "categories_anon_read" ON categories;
DROP POLICY IF EXISTS "allow_read_categories" ON categories;
DROP POLICY IF EXISTS "allow_admin_manage_categories" ON categories;

-- 3️⃣ إنشاء دالة مساعدة للتحقق من دور المستخدم
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- 4️⃣ إنشاء دالة للتحقق من كون المستخدم مدير
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- 5️⃣ إنشاء دالة للتحقق من كون المستخدم بائع أو مطعم
CREATE OR REPLACE FUNCTION public.is_vendor_or_restaurant()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('vendor', 'restaurant')
  );
$$;

-- 6️⃣ إنشاء السياسات الجديدة المبسطة

-- السياسة 1: قراءة عامة للتصنيفات المعتمدة (للجميع بما فيهم الزوار)
CREATE POLICY "categories_select_public"
ON categories
FOR SELECT
TO public
USING (
  is_active = true 
  AND approval_status = 'approved'
);

-- السياسة 2: المدراء - قراءة كل شيء
CREATE POLICY "categories_select_admin"
ON categories
FOR SELECT
TO authenticated
USING (
  public.is_admin()
);

-- السياسة 3: المدراء - إدراج
CREATE POLICY "categories_insert_admin"
ON categories
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
);

-- السياسة 4: المدراء - تحديث
CREATE POLICY "categories_update_admin"
ON categories
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);

-- السياسة 5: المدراء - حذف
CREATE POLICY "categories_delete_admin"
ON categories
FOR DELETE
TO authenticated
USING (
  public.is_admin()
);

-- السياسة 6: البائعين - قراءة المعتمد
CREATE POLICY "categories_select_vendor_approved"
ON categories
FOR SELECT
TO authenticated
USING (
  public.is_vendor_or_restaurant()
  AND is_active = true
  AND approval_status = 'approved'
);

-- السياسة 7: البائعين - قراءة تصنيفاتهم المعلقة
CREATE POLICY "categories_select_vendor_own"
ON categories
FOR SELECT
TO authenticated
USING (
  public.is_vendor_or_restaurant()
  AND created_by = auth.uid()
);

-- السياسة 8: البائعين - إنشاء تصنيفات معلقة
CREATE POLICY "categories_insert_vendor"
ON categories
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_vendor_or_restaurant()
  AND requires_approval = true
  AND approval_status = 'pending'
  AND created_by = auth.uid()
);

-- 7️⃣ تفعيل RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 8️⃣ التأكد من أن الجدول يسمح بالوصول العام للقراءة
GRANT SELECT ON categories TO anon;
GRANT SELECT ON categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON categories TO authenticated;

-- 9️⃣ إضافة تعليقات توثيقية
COMMENT ON FUNCTION public.get_user_role() IS 'دالة مساعدة لجلب دور المستخدم الحالي';
COMMENT ON FUNCTION public.is_admin() IS 'دالة للتحقق من كون المستخدم مدير';
COMMENT ON FUNCTION public.is_vendor_or_restaurant() IS 'دالة للتحقق من كون المستخدم بائع أو مطعم';

COMMENT ON POLICY "categories_select_public" ON categories IS 'السماح للجميع بقراءة التصنيفات المعتمدة';
COMMENT ON POLICY "categories_select_admin" ON categories IS 'المدراء يمكنهم قراءة جميع التصنيفات';
COMMENT ON POLICY "categories_insert_admin" ON categories IS 'المدراء يمكنهم إنشاء تصنيفات';
COMMENT ON POLICY "categories_update_admin" ON categories IS 'المدراء يمكنهم تحديث التصنيفات';
COMMENT ON POLICY "categories_delete_admin" ON categories IS 'المدراء يمكنهم حذف التصنيفات';
COMMENT ON POLICY "categories_select_vendor_approved" ON categories IS 'البائعين يمكنهم قراءة التصنيفات المعتمدة';
COMMENT ON POLICY "categories_select_vendor_own" ON categories IS 'البائعين يمكنهم قراءة تصنيفاتهم الخاصة';
COMMENT ON POLICY "categories_insert_vendor" ON categories IS 'البائعين يمكنهم إنشاء تصنيفات معلقة';

-- ✅ تم الإصلاح النهائي بنجاح!
-- الآن السياسات تستخدم دوال مساعدة آمنة ومبسطة
