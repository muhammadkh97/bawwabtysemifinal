-- ============================================
-- إضافة INSERT policy لجدول order_items
-- ============================================

-- السماح للعملاء بإضافة منتجات لطلباتهم
CREATE POLICY "Customers can create order items"
ON order_items
FOR INSERT
TO public
WITH CHECK (
  order_id IN (
    SELECT id FROM orders WHERE customer_id = auth.uid()
  )
);

-- التحقق من النتيجة
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'order_items'
  AND cmd = 'INSERT'
ORDER BY policyname;
