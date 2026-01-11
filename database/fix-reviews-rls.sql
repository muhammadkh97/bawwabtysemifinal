-- ============================================
-- Fix Reviews Table RLS Policies
-- إصلاح سياسات الأمان لجدول التقييمات
-- Created: 2026-01-13
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
DROP POLICY IF EXISTS "reviews_select_authenticated" ON reviews;
DROP POLICY IF EXISTS "reviews_select_own" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_customer" ON reviews;
DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
DROP POLICY IF EXISTS "reviews_select_admins" ON reviews;
DROP POLICY IF EXISTS "reviews_all_admins" ON reviews;
DROP POLICY IF EXISTS "reviews_select_vendors" ON reviews;
DROP POLICY IF EXISTS "Admins can view all reviews" ON reviews;
DROP POLICY IF EXISTS "Customers can create reviews" ON reviews;
DROP POLICY IF EXISTS "Customers can view own reviews" ON reviews;
DROP POLICY IF EXISTS "Customers can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Restaurants can view store reviews" ON reviews;
DROP POLICY IF EXISTS "Vendors can view store reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view reviews for their orders" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews for their completed orders" ON reviews;

-- Enable RLS on reviews table if not already enabled
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SELECT POLICIES
-- ============================================

-- 1. Public (unauthenticated) users can view all reviews
-- المستخدمون غير المسجلين يمكنهم مشاهدة جميع التقييمات
CREATE POLICY "reviews_select_public"
ON reviews
FOR SELECT
TO anon
USING (true);

-- 2. Authenticated users can view all reviews
-- المستخدمون المسجلين يمكنهم مشاهدة جميع التقييمات
CREATE POLICY "reviews_select_authenticated"
ON reviews
FOR SELECT
TO authenticated
USING (true);

-- 3. Admins have full access to reviews
-- المسؤولون لديهم وصول كامل للتقييمات
CREATE POLICY "reviews_all_admins"
ON reviews
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 4. Vendors can view their store reviews
-- البائعون يمكنهم مشاهدة تقييمات متاجرهم
CREATE POLICY "reviews_select_vendors"
ON reviews
FOR SELECT
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM stores
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- INSERT POLICIES
-- ============================================

-- 4. Customers can create reviews for their orders
-- العملاء يمكنهم إنشاء تقييمات لطلباتهم
CREATE POLICY "reviews_insert_customer"
ON reviews
FOR INSERT
TO authenticated
WITH CHECK (
  -- Must be the customer who placed the order
  customer_id = auth.uid()
  AND
  -- Order must exist and belong to the customer
  order_id IN (
    SELECT id FROM orders
    WHERE customer_id = auth.uid()
    AND status = 'delivered'
  )
  AND
  -- No duplicate review for the same order
  NOT EXISTS (
    SELECT 1 FROM reviews r
    WHERE r.order_id = reviews.order_id
    AND r.customer_id = auth.uid()
  )
);

-- ============================================
-- UPDATE POLICIES
-- ============================================

-- 5. Customers can update their own reviews
-- العملاء يمكنهم تعديل تقييماتهم الخاصة
CREATE POLICY "reviews_update_own"
ON reviews
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- ============================================
-- DELETE POLICIES
-- ============================================

-- 6. Customers can delete their own reviews
-- العملاء يمكنهم حذف تقييماتهم الخاصة
CREATE POLICY "reviews_delete_own"
ON reviews
FOR DELETE
TO authenticated
USING (customer_id = auth.uid());

-- ============================================
-- Verification
-- ============================================

-- Check if policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'reviews'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'reviews';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Reviews table RLS policies have been fixed successfully';
  RAISE NOTICE '✓ Total policies created: 7';
  RAISE NOTICE '  - 4 SELECT policies (public, authenticated, admins, vendors)';
  RAISE NOTICE '  - 1 INSERT policy (customers)';
  RAISE NOTICE '  - 1 UPDATE policy (own reviews)';
  RAISE NOTICE '  - 1 DELETE policy (own reviews)';
  RAISE NOTICE '';
  RAISE NOTICE 'Key changes:';
  RAISE NOTICE '  • Separate policies for anon and authenticated users';
  RAISE NOTICE '  • All authenticated users can view all reviews';
  RAISE NOTICE '  • Customers can only create reviews for delivered orders';
  RAISE NOTICE '  • Prevents duplicate reviews for the same order';
END $$;
