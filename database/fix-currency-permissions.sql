-- ============================================
-- FIX: Currency System Permissions
-- المشكلة: permission denied for table currencies/exchange_rates
-- الحل: السماح للجميع بقراءة بيانات العملات (للزوار والمستخدمين)
-- ============================================

-- 1. تفعيل RLS على جداول العملات
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- 2. حذف أي policies قديمة قد تتعارض
DROP POLICY IF EXISTS "Anyone can read active currencies" ON currencies;
DROP POLICY IF EXISTS "Anyone can read exchange rates" ON currencies;
DROP POLICY IF EXISTS "Public read access to currencies" ON currencies;
DROP POLICY IF EXISTS "Public read access to exchange rates" ON exchange_rates;

-- 3. السماح للجميع (بما فيهم الزوار) بقراءة العملات
CREATE POLICY "Anyone can read currencies"
ON currencies
FOR SELECT
TO public
USING (true);

-- 4. السماح للجميع بقراءة أسعار الصرف
CREATE POLICY "Anyone can read exchange_rates"
ON exchange_rates
FOR SELECT
TO public
USING (true);

-- 5. السماح للمسؤولين فقط بالتعديل
CREATE POLICY "Admins can manage currencies"
ON currencies
FOR ALL
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

CREATE POLICY "Admins can manage exchange_rates"
ON exchange_rates
FOR ALL
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

-- 6. السماح بتنفيذ دالة convert_currency للجميع
GRANT EXECUTE ON FUNCTION convert_currency TO public, anon, authenticated;

-- 7. التحقق من الصلاحيات
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('currencies', 'exchange_rates')
ORDER BY tablename, policyname;

-- ملاحظة: بيانات العملات وأسعار الصرف هي بيانات عامة
-- يجب أن تكون متاحة للقراءة للجميع لأن الموقع يعتمد عليها في عرض الأسعار
