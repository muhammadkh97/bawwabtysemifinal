-- ====================================
-- إضافة RLS Policies للمدير على جداول الماليات
-- ====================================

-- ========== جدول financial_settings ==========

-- Policy للقراءة
DROP POLICY IF EXISTS "Admins can view financial settings" ON financial_settings;
CREATE POLICY "Admins can view financial settings"
ON financial_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Policy للتعديل
DROP POLICY IF EXISTS "Admins can update financial settings" ON financial_settings;
CREATE POLICY "Admins can update financial settings"
ON financial_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- ========== جدول commissions ==========

-- Policy للقراءة
DROP POLICY IF EXISTS "Admins can view all commissions" ON commissions;
CREATE POLICY "Admins can view all commissions"
ON commissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Policy للإضافة
DROP POLICY IF EXISTS "Admins can insert commissions" ON commissions;
CREATE POLICY "Admins can insert commissions"
ON commissions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Policy للتعديل
DROP POLICY IF EXISTS "Admins can update commissions" ON commissions;
CREATE POLICY "Admins can update commissions"
ON commissions
FOR UPDATE
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
WHERE tablename IN ('financial_settings', 'commissions')
AND policyname LIKE '%Admin%'
ORDER BY tablename, cmd;
