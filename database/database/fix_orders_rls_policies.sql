-- =========================================================
-- إصلاح سياسات RLS على جدول orders
-- Fix RLS Policies for Orders Table
-- =========================================================

-- إضافة سياسات للعملاء لإنشاء وعرض طلباتهم

-- 1. السماح للعملاء بإنشاء طلبات جديدة
CREATE POLICY IF NOT EXISTS "customers_insert_orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = customer_id
);

-- 2. السماح للعملاء بعرض طلباتهم الخاصة
CREATE POLICY IF NOT EXISTS "customers_view_orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = customer_id
);

-- 3. السماح للعملاء بتحديث طلباتهم (مثل الإلغاء)
CREATE POLICY IF NOT EXISTS "customers_update_orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  auth.uid() = customer_id
)
WITH CHECK (
  auth.uid() = customer_id
);

-- 4. السماح للسائقين بعرض الطلبات المعينة لهم
CREATE POLICY IF NOT EXISTS "drivers_view_orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM drivers WHERE id = orders.driver_id
  )
);

-- 5. السماح للسائقين بتحديث حالة الطلبات المعينة لهم
CREATE POLICY IF NOT EXISTS "drivers_update_orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM drivers WHERE id = orders.driver_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM drivers WHERE id = orders.driver_id
  )
);

-- 6. السماح للبائعين بعرض الطلبات الخاصة بمنتجاتهم
CREATE POLICY IF NOT EXISTS "vendors_view_orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM order_items oi
    JOIN vendors v ON v.id = oi.vendor_id
    WHERE oi.order_id = orders.id
    AND v.user_id = auth.uid()
  )
);

-- 7. السماح للبائعين بتحديث حالة الطلبات الخاصة بهم
CREATE POLICY IF NOT EXISTS "vendors_update_orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM order_items oi
    JOIN vendors v ON v.id = oi.vendor_id
    WHERE oi.order_id = orders.id
    AND v.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM order_items oi
    JOIN vendors v ON v.id = oi.vendor_id
    WHERE oi.order_id = orders.id
    AND v.user_id = auth.uid()
  )
);

-- التحقق من السياسات
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'عرض'
    WHEN cmd = 'INSERT' THEN 'إضافة'
    WHEN cmd = 'UPDATE' THEN 'تحديث'
    WHEN cmd = 'DELETE' THEN 'حذف'
  END as operation_ar
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY cmd, policyname;
