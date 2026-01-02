-- =========================================================
-- إصلاح نهائي لسياسات RLS على جدول products
-- Final fix for RLS policies on products table
-- =========================================================

-- حذف جميع السياسات القديمة
DROP POLICY IF EXISTS products_insert_own ON products;
DROP POLICY IF EXISTS products_update_own ON products;
DROP POLICY IF EXISTS products_delete_own ON products;
DROP POLICY IF EXISTS products_select_all ON products;
DROP POLICY IF EXISTS products_admin_all ON products;
DROP POLICY IF EXISTS restaurants_manage_products ON products;

-- إنشاء سياسات جديدة مع cast صريح لحل مشكلة uuid = text

-- 1. سياسة SELECT: الجميع يمكنهم رؤية المنتجات
CREATE POLICY products_select_all ON products
FOR SELECT
TO public
USING (true);

-- 2. سياسة INSERT: البائع يمكنه إضافة منتجات فقط لمتجره
CREATE POLICY products_insert_vendor ON products
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id::text = vendor_id::text
    AND v.user_id = auth.uid()
  )
);

-- 3. سياسة UPDATE: البائع يمكنه تحديث منتجاته فقط
CREATE POLICY products_update_vendor ON products
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id::text = vendor_id::text
    AND v.user_id = auth.uid()
  )
);

-- 4. سياسة DELETE: البائع يمكنه حذف منتجاته فقط
CREATE POLICY products_delete_vendor ON products
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id::text = vendor_id::text
    AND v.user_id = auth.uid()
  )
);

-- 5. سياسة للمدير: المدير له صلاحيات كاملة
CREATE POLICY products_admin_all ON products
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 6. سياسة للمطاعم: المطعم يمكنه إدارة منتجاته
CREATE POLICY products_restaurant_all ON products
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM vendors v
    INNER JOIN users u ON u.id = v.user_id
    WHERE v.id::text = vendor_id::text
    AND v.user_id = auth.uid()
    AND u.role = 'restaurant'
  )
);

-- التحقق من السياسات الجديدة
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'products'
ORDER BY policyname;
