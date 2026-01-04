-- ✅ إصلاح العلاقة بين products و categories
-- التاريخ: 4 يناير 2026
-- المشكلة: Foreign Key غير موجود بين products و categories

-- 1️⃣ التحقق من وجود العمود category_id
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'category_id';

-- 2️⃣ إضافة العمود category_id إذا لم يكن موجوداً
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category_id UUID;

-- 3️⃣ إضافة Foreign Key constraint
ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_category_id_fkey;

ALTER TABLE products
ADD CONSTRAINT products_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES categories(id) 
ON DELETE SET NULL
ON UPDATE CASCADE;

-- 4️⃣ إنشاء فهرس للأداء
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- 5️⃣ تحديث RLS على products لضمان الوصول الصحيح
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "products_select_public" ON products;
DROP POLICY IF EXISTS "products_select_admin" ON products;
DROP POLICY IF EXISTS "products_insert_admin" ON products;
DROP POLICY IF EXISTS "products_update_admin" ON products;
DROP POLICY IF EXISTS "products_delete_admin" ON products;

-- السياسة 1: قراءة عامة للمنتجات المعتمدة (للجميع)
CREATE POLICY "products_select_public"
ON products FOR SELECT
TO public
USING (
  status = 'approved'
);

-- السياسة 2: المدراء - قراءة كل شيء
CREATE POLICY "products_select_admin"
ON products FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- السياسة 3: المدراء - إدراج
CREATE POLICY "products_insert_admin"
ON products FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- السياسة 4: المدراء - تحديث
CREATE POLICY "products_update_admin"
ON products FOR UPDATE
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

-- السياسة 5: المدراء - حذف
CREATE POLICY "products_delete_admin"
ON products FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 6️⃣ إعادة تحميل schema cache (في supabase dashboard)
-- هذا الأمر يتم من خلال:
-- - إعادة تحميل الصفحة
-- - أو استدعاء API مرة أخرى

-- 7️⃣ التحقق من النتيجة
SELECT 
  table_constraints.constraint_name,
  table_constraints.table_name,
  key_column_usage.column_name,
  key_column_usage.foreign_table_name,
  key_column_usage.foreign_column_name
FROM information_schema.table_constraints
JOIN information_schema.key_column_usage 
  ON table_constraints.constraint_name = key_column_usage.constraint_name
WHERE table_constraints.table_name = 'products' 
  AND table_constraints.constraint_type = 'FOREIGN KEY';
