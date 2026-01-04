-- ============================================
-- إصلاح صلاحيات جدول سلة المطاعم
-- ============================================

-- تفعيل RLS على الجدول
ALTER TABLE restaurant_cart_items ENABLE ROW LEVEL SECURITY;

-- حذف جميع الـ policies القديمة إن وجدت
DROP POLICY IF EXISTS "Users can view their own restaurant cart items" ON restaurant_cart_items;
DROP POLICY IF EXISTS "Users can insert their own restaurant cart items" ON restaurant_cart_items;
DROP POLICY IF EXISTS "Users can update their own restaurant cart items" ON restaurant_cart_items;
DROP POLICY IF EXISTS "Users can delete their own restaurant cart items" ON restaurant_cart_items;

-- السماح للمستخدمين بقراءة عناصر سلتهم فقط
CREATE POLICY "Users can view their own restaurant cart items"
ON restaurant_cart_items
FOR SELECT
USING (auth.uid() = user_id);

-- السماح للمستخدمين بإضافة عناصر لسلتهم
CREATE POLICY "Users can insert their own restaurant cart items"
ON restaurant_cart_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- السماح للمستخدمين بتحديث عناصر سلتهم فقط
CREATE POLICY "Users can update their own restaurant cart items"
ON restaurant_cart_items
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- السماح للمستخدمين بحذف عناصر من سلتهم فقط
CREATE POLICY "Users can delete their own restaurant cart items"
ON restaurant_cart_items
FOR DELETE
USING (auth.uid() = user_id);

-- منح الصلاحيات الأساسية
GRANT SELECT, INSERT, UPDATE, DELETE ON restaurant_cart_items TO authenticated;
GRANT SELECT ON restaurant_cart_items TO anon;

-- التحقق من الـ policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'restaurant_cart_items'
ORDER BY policyname;

-- التحقق من RLS
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'restaurant_cart_items'
  AND schemaname = 'public';
