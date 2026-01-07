-- =========================================================
-- حل بديل: RLS بسيط بدون التحقق من الصلاحيات
-- =========================================================
-- استخدم هذا السكربت إذا استمر خطأ جدول users/profiles

-- 7.3: سياسات التعديل (مفتوحة للجميع مؤقتاً)
DROP POLICY IF EXISTS "Only admins can modify currencies" ON currencies;
CREATE POLICY "Only admins can modify currencies"
    ON currencies FOR ALL
    USING (auth.uid() IS NOT NULL);  -- أي مستخدم مسجل دخول

DROP POLICY IF EXISTS "Only admins can modify exchange rates" ON exchange_rates;
CREATE POLICY "Only admins can modify exchange rates"
    ON exchange_rates FOR ALL
    USING (auth.uid() IS NOT NULL);  -- أي مستخدم مسجل دخول

-- ملاحظة: يمكنك تشديد الصلاحيات لاحقاً بعد إضافة نظام الأدوار
