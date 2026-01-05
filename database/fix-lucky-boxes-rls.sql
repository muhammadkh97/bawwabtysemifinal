-- ====================================
-- فحص وإصلاح RLS Policies لجدول lucky_boxes
-- ====================================

-- 1. فحص RLS Policies الموجودة
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
WHERE tablename = 'lucky_boxes';

-- 2. إضافة policy للمدير (admin) لإضافة وتعديل صناديق الحظ
-- Policy للإضافة (INSERT)
DROP POLICY IF EXISTS "Admins can insert lucky boxes" ON lucky_boxes;
CREATE POLICY "Admins can insert lucky boxes"
ON lucky_boxes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Policy للقراءة (SELECT)
DROP POLICY IF EXISTS "Admins can view all lucky boxes" ON lucky_boxes;
CREATE POLICY "Admins can view all lucky boxes"
ON lucky_boxes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Policy للتعديل (UPDATE)
DROP POLICY IF EXISTS "Admins can update lucky boxes" ON lucky_boxes;
CREATE POLICY "Admins can update lucky boxes"
ON lucky_boxes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Policy للحذف (DELETE)
DROP POLICY IF EXISTS "Admins can delete lucky boxes" ON lucky_boxes;
CREATE POLICY "Admins can delete lucky boxes"
ON lucky_boxes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 3. التحقق من النتيجة
SELECT policyname, cmd 
FROM pg_policies
WHERE tablename = 'lucky_boxes'
ORDER BY cmd;
