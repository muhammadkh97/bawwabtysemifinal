-- إضافة نظام الموافقات للتصنيفات
-- التاريخ: 3 يناير 2026

-- 1. إضافة الحقول الجديدة لجدول categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- 2. إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_categories_approval_status ON categories(approval_status);
CREATE INDEX IF NOT EXISTS idx_categories_created_by ON categories(created_by);
CREATE INDEX IF NOT EXISTS idx_categories_approved_by ON categories(approved_by);

-- 3. تحديث التصنيفات الموجودة لتكون معتمدة
UPDATE categories 
SET approval_status = 'approved',
    requires_approval = false
WHERE approval_status IS NULL;

-- 4. إنشاء trigger لتتبع من أنشأ التصنيف
CREATE OR REPLACE FUNCTION set_category_creator()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  
  -- إذا كان التصنيف يحتاج موافقة، اجعل حالته pending
  IF NEW.requires_approval = true AND NEW.approval_status = 'approved' THEN
    NEW.approval_status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS categories_set_creator ON categories;
CREATE TRIGGER categories_set_creator
  BEFORE INSERT ON categories
  FOR EACH ROW
  EXECUTE FUNCTION set_category_creator();

-- 5. إنشاء trigger لتتبع الموافقة
CREATE OR REPLACE FUNCTION track_category_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا تم تغيير الحالة إلى approved أو rejected
  IF NEW.approval_status != OLD.approval_status AND NEW.approval_status IN ('approved', 'rejected') THEN
    NEW.approved_by = auth.uid();
    NEW.approved_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS categories_track_approval ON categories;
CREATE TRIGGER categories_track_approval
  BEFORE UPDATE ON categories
  FOR EACH ROW
  WHEN (OLD.approval_status IS DISTINCT FROM NEW.approval_status)
  EXECUTE FUNCTION track_category_approval();

-- 6. تحديث سياسات RLS
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_admin_all" ON categories;
DROP POLICY IF EXISTS "categories_vendor_read" ON categories;
DROP POLICY IF EXISTS "categories_vendor_create" ON categories;

-- السماح بقراءة التصنيفات المعتمدة والنشطة فقط للعامة
CREATE POLICY "categories_public_read"
ON categories
FOR SELECT
TO authenticated, anon
USING (is_active = true AND approval_status = 'approved');

-- المدراء لهم كل الصلاحيات
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

-- البائعين يمكنهم قراءة التصنيفات المعتمدة
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
  AND approval_status = 'approved'
);

-- البائعين يمكنهم إنشاء تصنيفات تحتاج موافقة
CREATE POLICY "categories_vendor_create"
ON categories
FOR INSERT
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

-- البائعين يمكنهم قراءة تصنيفاتهم المعلقة
CREATE POLICY "categories_vendor_own_pending"
ON categories
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('vendor', 'restaurant')
  )
);

-- 7. ملاحظات توثيقية
COMMENT ON TABLE categories IS 'جدول التصنيفات مع نظام الموافقات - يدعم تصنيفات أب وابن ونظام موافقة المدير';
COMMENT ON COLUMN categories.approval_status IS 'حالة الموافقة: pending, approved, rejected';
COMMENT ON COLUMN categories.requires_approval IS 'هل يحتاج التصنيف موافقة من المدير';
COMMENT ON COLUMN categories.approved_by IS 'المدير الذي وافق أو رفض';
COMMENT ON COLUMN categories.approved_at IS 'تاريخ الموافقة أو الرفض';
COMMENT ON COLUMN categories.rejection_reason IS 'سبب الرفض (إن وجد)';
COMMENT ON COLUMN categories.created_by IS 'المستخدم الذي أنشأ التصنيف';
