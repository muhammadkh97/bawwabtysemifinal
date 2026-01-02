-- =========================================================
-- إصلاح سياسات RLS على جدول products (خطأ uuid = text)
-- Fix RLS Policies for Products Table (uuid = text error)
-- =========================================================

-- حذف السياسة القديمة
DROP POLICY IF EXISTS "products_insert_own" ON public.products;

-- إنشاء سياسة جديدة مع cast صريح
CREATE POLICY "products_insert_own"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM vendors v
    WHERE v.id::uuid = products.vendor_id::uuid
    AND v.user_id = auth.uid()
  )
);

-- تحديث سياسة UPDATE إذا كانت موجودة
DROP POLICY IF EXISTS "products_update_own" ON public.products;

CREATE POLICY "products_update_own"
ON public.products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM vendors v
    WHERE v.id::uuid = products.vendor_id::uuid
    AND v.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM vendors v
    WHERE v.id::uuid = products.vendor_id::uuid
    AND v.user_id = auth.uid()
  )
);

-- تحديث سياسة DELETE إذا كانت موجودة
DROP POLICY IF EXISTS "products_delete_own" ON public.products;

CREATE POLICY "products_delete_own"
ON public.products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM vendors v
    WHERE v.id::uuid = products.vendor_id::uuid
    AND v.user_id = auth.uid()
  )
);

-- التحقق
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'عرض'
    WHEN cmd = 'INSERT' THEN 'إضافة'
    WHEN cmd = 'UPDATE' THEN 'تحديث'
    WHEN cmd = 'DELETE' THEN 'حذف'
  END as operation_ar
FROM pg_policies
WHERE tablename = 'products'
ORDER BY cmd, policyname;
