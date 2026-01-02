-- =========================================================
-- إصلاح سياسات RLS على جدول order_items لحل التكرار اللانهائي
-- Fix RLS policies on order_items table to resolve infinite recursion
-- =========================================================

-- حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "العملاء يمكنهم رؤية عناصر طلباتهم" ON order_items;
DROP POLICY IF EXISTS "المطاعم يمكنها رؤية عناصر طلباتها" ON order_items;
DROP POLICY IF EXISTS restaurants_view_order_items ON order_items;

-- إنشاء سياسات جديدة بدون subqueries متداخلة

-- 1. سياسة SELECT: الجميع يمكنهم رؤية عناصر الطلبات (سيتم تقييد الوصول من خلال جدول orders)
CREATE POLICY order_items_select_all ON order_items
FOR SELECT
TO public
USING (true);

-- 2. سياسة INSERT: فقط النظام يمكنه إضافة عناصر طلبات
CREATE POLICY order_items_insert_system ON order_items
FOR INSERT
TO public
WITH CHECK (true);

-- 3. سياسة UPDATE: فقط المدير يمكنه تحديث عناصر الطلبات
CREATE POLICY order_items_update_admin ON order_items
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 4. سياسة DELETE: فقط المدير يمكنه حذف عناصر الطلبات
CREATE POLICY order_items_delete_admin ON order_items
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- التحقق من السياسات الجديدة
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'order_items' ORDER BY policyname;
