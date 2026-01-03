-- إصلاح سياسات RLS لجدول التصنيفات
-- تمكين RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "allow_read_categories" ON categories;
DROP POLICY IF EXISTS "allow_admin_manage_categories" ON categories;
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_admin_all" ON categories;

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

-- تحديث وظيفة updated_at
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث updated_at تلقائياً
DROP TRIGGER IF EXISTS categories_updated_at ON categories;
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- إنشاء فهرس GIN للبحث النصي
CREATE INDEX IF NOT EXISTS idx_categories_search 
ON categories USING gin(to_tsvector('arabic', name_ar || ' ' || name));

COMMENT ON TABLE categories IS 'جدول التصنيفات الهرمي - يدعم تصنيفات أب وابن مثل ووردبريس';
