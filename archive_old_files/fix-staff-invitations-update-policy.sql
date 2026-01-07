-- ═══════════════════════════════════════════════════════════════
-- 🔧 إضافة سياسة RLS للسماح بتحديث الدعوات
-- ═══════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🛡️ فحص السياسات الحالية
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
    '🛡️ السياسات الحالية' as info,
    policyname as "اسم السياسة",
    cmd as "الأمر"
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'staff_invitations';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ إضافة سياسة للسماح بتحديث الدعوات
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- حذف السياسة إن وجدت
DROP POLICY IF EXISTS "Users can update their invitations" ON staff_invitations;

-- إنشاء سياسة جديدة
CREATE POLICY "Users can update their invitations"
ON staff_invitations
FOR UPDATE
TO public
USING (
  email IN (
    SELECT email FROM users WHERE id = auth.uid()
  )
)
WITH CHECK (
  email IN (
    SELECT email FROM users WHERE id = auth.uid()
  )
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📊 التحقق من السياسات بعد الإضافة
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
    '✅ السياسات بعد التحديث' as info,
    policyname as "اسم السياسة",
    cmd as "الأمر",
    qual as "شرط USING",
    with_check as "شرط WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'staff_invitations'
ORDER BY policyname;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🧪 اختبار يدوي: تحديث الدعوة الحالية
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- قم بإزالة التعليق لتحديث الدعوة يدوياً للاختبار:
/*
UPDATE staff_invitations
SET 
    status = 'accepted',
    accepted_at = NOW()
WHERE id = 'd43dc813-8ee9-476f-a5ac-c837ff2356dc';

SELECT '✅ تم تحديث الدعوة' as result;
*/
