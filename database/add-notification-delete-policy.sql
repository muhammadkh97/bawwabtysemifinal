-- ============================================
-- إضافة DELETE policy لجدول notifications
-- Add DELETE policy for notifications table
-- ============================================

-- حذف Policy القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- السماح للمستخدمين بحذف إشعاراتهم فقط
CREATE POLICY "Users can delete own notifications"
ON notifications
FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- مراجعة كل الـ Policies
-- Review all policies
-- ============================================

-- التحقق من أن RLS مفعّل
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';

-- عرض كل الـ Policies على جدول notifications
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
WHERE tablename = 'notifications'
ORDER BY policyname;

-- ============================================
-- اختبار الـ Policies
-- Test policies
-- ============================================

-- يجب أن يكون لديك الآن 4 policies:
-- 1. SELECT - Users can view own notifications
-- 2. UPDATE - Users can update own notifications  
-- 3. INSERT - Allow authenticated users to insert notifications
-- 4. DELETE - Users can delete own notifications (الجديدة)

-- للتأكد من عدد الـ Policies
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'notifications';

-- يجب أن يكون الناتج: total_policies = 4
