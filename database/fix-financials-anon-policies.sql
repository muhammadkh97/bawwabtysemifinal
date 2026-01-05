-- ====================================
-- إضافة policies للـ anon على جداول الماليات
-- ====================================

-- ========== جدول financial_settings ==========

DROP POLICY IF EXISTS "Allow anon to view financial settings" ON financial_settings;
CREATE POLICY "Allow anon to view financial settings"
ON financial_settings
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow anon to update financial settings" ON financial_settings;
CREATE POLICY "Allow anon to update financial settings"
ON financial_settings
FOR UPDATE
TO anon, authenticated
USING (true);

-- ========== جدول commissions ==========

DROP POLICY IF EXISTS "Allow anon to view commissions" ON commissions;
CREATE POLICY "Allow anon to view commissions"
ON commissions
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow anon to insert commissions" ON commissions;
CREATE POLICY "Allow anon to insert commissions"
ON commissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to update commissions" ON commissions;
CREATE POLICY "Allow anon to update commissions"
ON commissions
FOR UPDATE
TO anon, authenticated
USING (true);

-- التحقق من النتيجة
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('financial_settings', 'commissions')
ORDER BY tablename, cmd;
