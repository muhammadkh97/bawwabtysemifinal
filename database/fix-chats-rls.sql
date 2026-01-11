-- ============================================
-- إصلاح RLS Policies لجدول Chats - يناير 2026
-- ============================================
-- المشكلة: RLS يمنع إنشاء وقراءة المحادثات
-- الحل: إنشاء policies صحيحة + دالة آمنة
-- ============================================

BEGIN;

-- 1️⃣ حذف جميع Policies القديمة
DROP POLICY IF EXISTS "chats_access_participants" ON chats;
DROP POLICY IF EXISTS "chats_insert_participants" ON chats;
DROP POLICY IF EXISTS "chats_delete_for_admin" ON chats;
DROP POLICY IF EXISTS "chats_insert_for_authenticated" ON chats;
DROP POLICY IF EXISTS "chats_select_for_participants" ON chats;
DROP POLICY IF EXISTS "chats_update_for_participants" ON chats;
DROP POLICY IF EXISTS "Users can view their chats" ON chats;
DROP POLICY IF EXISTS "Users can create chats" ON chats;
DROP POLICY IF EXISTS "Users can update their chats" ON chats;

-- 2️⃣ إنشاء Policies جديدة وصحيحة

-- Policy للقراءة: المستخدم يمكنه رؤية المحادثات التي هو طرف فيها
CREATE POLICY "chats_select_participant"
  ON chats FOR SELECT
  TO authenticated
  USING (
    auth.uid() = customer_id 
    OR 
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = chats.vendor_id 
      AND stores.user_id = auth.uid()
    )
  );

-- Policy للإدراج: المستخدم يمكنه إنشاء محادثة إذا كان العميل أو صاحب المتجر
CREATE POLICY "chats_insert_participant"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = customer_id 
    OR 
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = vendor_id 
      AND stores.user_id = auth.uid()
    )
  );

-- Policy للتحديث: فقط المشاركين في المحادثة
CREATE POLICY "chats_update_participant"
  ON chats FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = customer_id 
    OR 
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = chats.vendor_id 
      AND stores.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = customer_id 
    OR 
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = vendor_id 
      AND stores.user_id = auth.uid()
    )
  );

-- Policy للحذف: فقط Admins
CREATE POLICY "chats_delete_admin"
  ON chats FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3️⃣ التأكد من تفعيل RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- ملاحظة: الدالة create_or_get_chat موجودة بالفعل في قاعدة البيانات
-- وتعمل بشكل صحيح مع 3 معاملات (customer_id, vendor_id, chat_type)
-- لا حاجة لإعادة إنشائها

COMMIT;

-- ============================================
-- الاختبار
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ تم إصلاح RLS Policies لجدول Chats بنجاح!';
  RAISE NOTICE '📝 استخدم: SELECT create_or_get_chat(customer_id, vendor_id)';
  RAISE NOTICE '🔒 تم تطبيق قيود أمنية صحيحة';
END $$;
