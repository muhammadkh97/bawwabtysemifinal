-- ============================================
-- إضافة INSERT policy لجدول notifications
-- ============================================

-- السماح لأي مستخدم مسجل بإرسال إشعارات
-- (يُستخدم من الـ backend في orderHelpers)
CREATE POLICY "Allow authenticated users to insert notifications"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- أو إذا أردت أن يرسل المستخدم إشعارات فقط للآخرين:
-- WITH CHECK (user_id != auth.uid());

-- التحقق من النتيجة
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY cmd;
