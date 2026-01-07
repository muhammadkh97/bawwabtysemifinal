-- ═══════════════════════════════════════════════════════════════
-- 🔧 إضافة سياسة RLS للسماح بقبول الدعوات
-- ═══════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🛡️ الجزء 1: فحص السياسات الحالية على vendor_staff
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
    '🛡️ السياسات الحالية' as info,
    policyname as "اسم السياسة",
    cmd as "الأمر",
    qual as "شرط WHERE"
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'vendor_staff';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ الجزء 2: إضافة سياسة للسماح للمستخدمين بقبول الدعوات
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- حذف السياسة إن كانت موجودة
DROP POLICY IF EXISTS "Users can accept staff invitations" ON vendor_staff;

-- إنشاء سياسة جديدة للسماح بقبول الدعوات
CREATE POLICY "Users can accept staff invitations"
ON vendor_staff
FOR INSERT
TO public
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 
    FROM staff_invitations si
    WHERE si.email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    AND si.business_type = 'vendor'
    AND si.business_id = vendor_staff.vendor_id
    AND si.status = 'pending'
    AND si.expires_at > NOW()
  )
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📊 الجزء 3: التحقق من السياسات بعد الإضافة
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
    '✅ السياسات بعد التحديث' as info,
    policyname as "اسم السياسة",
    cmd as "الأمر",
    qual as "شرط WHERE",
    with_check as "شرط WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'vendor_staff'
ORDER BY policyname;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📝 ملاحظات:
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/*
هذه السياسة تسمح للمستخدم بإضافة نفسه كمساعد فقط إذا:
1. user_id يساوي معرف المستخدم الحالي (auth.uid())
2. يوجد دعوة معلقة لبريده الإلكتروني
3. الدعوة من نوع vendor
4. الدعوة للمتجر الصحيح (vendor_id)
5. الدعوة لم تنتهِ (expires_at > NOW())
6. الدعوة بحالة pending

هذا يضمن أن المستخدم لا يمكنه إضافة نفسه إلا إذا كان لديه دعوة صالحة.
*/
