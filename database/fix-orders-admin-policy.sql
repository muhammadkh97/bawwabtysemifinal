-- ====================================
-- إضافة RLS Policy للمدير على جدول orders
-- ====================================

-- Policy للقراءة - المدير يرى جميع الطلبات
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders"
ON orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- التحقق من النتيجة
SELECT tablename, policyname, cmd 
FROM pg_policies
WHERE tablename = 'orders'
AND policyname LIKE '%Admin%'
ORDER BY cmd;
