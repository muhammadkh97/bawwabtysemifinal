-- ==========================================
-- إصلاح سياسات RLS للمنتجات
-- Fix Product RLS Policies
-- ==========================================
-- الغرض: السماح للبائعين برؤية وإضافة وتعديل منتجاتهم بغض النظر عن حالة الموافقة
-- Purpose: Allow vendors to view, add, and modify their products regardless of approval status
-- ==========================================

-- الخطوة 1: حذف السياسات القديمة
DROP POLICY IF EXISTS "Anyone can view approved products" ON products;
DROP POLICY IF EXISTS "Vendors can manage own products" ON products;

-- الخطوة 2: إنشاء السياسات الجديدة

-- سياسة 1: يمكن للعامة رؤية المنتجات المعتمدة فقط
CREATE POLICY "public_view_approved_products" ON products 
  FOR SELECT 
  USING (status = 'approved' AND is_active = true);

-- سياسة 2: البائعون يمكنهم رؤية جميع منتجاتهم (بغض النظر عن الحالة)
CREATE POLICY "vendor_view_own_products" ON products 
  FOR SELECT 
  USING (vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- سياسة 3: البائعون يمكنهم إضافة منتجات لمتجرهم
CREATE POLICY "vendor_insert_products" ON products 
  FOR INSERT 
  WITH CHECK (vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- سياسة 4: البائعون يمكنهم تعديل منتجاتهم الخاصة
CREATE POLICY "vendor_update_own_products" ON products 
  FOR UPDATE 
  USING (vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- سياسة 5: البائعون يمكنهم حذف منتجاتهم
CREATE POLICY "vendor_delete_own_products" ON products 
  FOR DELETE 
  USING (vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- سياسة 6: المسؤولون يمكنهم إدارة جميع المنتجات
CREATE POLICY "admin_manage_all_products" ON products 
  FOR ALL 
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- ==========================================
-- التحقق من السياسات المطبقة
-- ==========================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'products'
ORDER BY policyname;

-- ==========================================
-- ✅ انتهى الإصلاح
-- ==========================================
-- الآن البائعون يجب أن يتمكنوا من:
-- 1. إضافة منتجات جديدة
-- 2. رؤية جميع منتجاتهم (حتى لو كانت draft أو pending)
-- 3. تعديل منتجاتهم
-- 4. حذف منتجاتهم
-- ==========================================
