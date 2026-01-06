-- =====================================================
-- 🔒 المرحلة 4: تحديث سياسات RLS الشاملة
-- Update RLS policies to support all roles
-- =====================================================
-- التاريخ: 2026-01-06
-- الحالة: جاهز للتنفيذ
-- =====================================================

-- ==================================================
-- 🗑️ الخطوة 1: حذف السياسات القديمة
-- ==================================================

-- حذف السياسات القديمة من جدول chats
DROP POLICY IF EXISTS "Customers can view own chats" ON chats;
DROP POLICY IF EXISTS "Restaurants can update chats" ON chats;
DROP POLICY IF EXISTS "Restaurants can view store chats" ON chats;
DROP POLICY IF EXISTS "Users can create chats" ON chats;
DROP POLICY IF EXISTS "Users can update own chats" ON chats;
DROP POLICY IF EXISTS "Vendors can view store chats" ON chats;

-- حذف السياسات القديمة من جدول messages
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can view chat messages" ON messages;

-- ==================================================
-- 📋 CHATS TABLE - السياسات الجديدة الشاملة
-- ==================================================

-- 🔐 Enable RLS (تأكيد)
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 📖 SELECT: رؤية المحادثات
-- ========================================

CREATE POLICY "chats_select_policy"
ON chats FOR SELECT
USING (
  -- 1️⃣ العميل: يرى محادثاته
  (
    customer_id = auth.uid()
  )
  OR
  -- 2️⃣ البائع/المطعم: يرى محادثات متجره
  (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
    OR
    vendor_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  )
  OR
  -- 3️⃣ المساعد (Staff): يرى محادثات المتجر الذي يعمل فيه
  (
    vendor_id IN (
      SELECT vs.vendor_id 
      FROM vendor_staff vs
      WHERE vs.user_id = auth.uid() 
        AND vs.is_active = true
        AND vs.status = 'active'
    )
  )
  OR
  -- 4️⃣ السائق: يرى محادثات الطلبات المسندة له
  (
    order_id IN (
      SELECT id FROM orders WHERE driver_id = auth.uid()
    )
  )
  OR
  -- 5️⃣ المدير: يرى كل المحادثات
  (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() 
        AND role = 'admin'
    )
  )
);

-- ========================================
-- ✍️ INSERT: إنشاء محادثات
-- ========================================

CREATE POLICY "chats_insert_policy"
ON chats FOR INSERT
WITH CHECK (
  -- 1️⃣ العميل: يمكنه إنشاء محادثة (يجب أن يكون هو الـ customer)
  (
    customer_id = auth.uid()
    AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'customer')
  )
  OR
  -- 2️⃣ البائع/المطعم: يمكنه إنشاء محادثة لمتجره
  (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
    AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('vendor', 'restaurant'))
  )
  OR
  -- 3️⃣ المدير: يمكنه إنشاء أي محادثة
  (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- ========================================
-- 🔄 UPDATE: تحديث المحادثات
-- ========================================

CREATE POLICY "chats_update_policy"
ON chats FOR UPDATE
USING (
  -- نفس شروط SELECT
  (
    customer_id = auth.uid()
  )
  OR
  (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
    OR
    vendor_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  )
  OR
  (
    vendor_id IN (
      SELECT vs.vendor_id 
      FROM vendor_staff vs
      WHERE vs.user_id = auth.uid() AND vs.is_active = true
    )
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'driver')
    )
  )
)
WITH CHECK (
  -- لا يمكن تغيير customer_id أو vendor_id بعد الإنشاء
  (customer_id = auth.uid() OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ========================================
-- 🗑️ DELETE: حذف المحادثات
-- ========================================

CREATE POLICY "chats_delete_policy"
ON chats FOR DELETE
USING (
  -- فقط المدير يمكنه حذف المحادثات
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
  OR
  -- أو صاحب المحادثة (العميل)
  (
    customer_id = auth.uid()
    AND
    NOT EXISTS (SELECT 1 FROM messages WHERE chat_id = chats.id)
  )
);

-- ==================================================
-- 📨 MESSAGES TABLE - السياسات الجديدة الشاملة
-- ==================================================

-- 🔐 Enable RLS (تأكيد)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 📖 SELECT: رؤية الرسائل
-- ========================================

CREATE POLICY "messages_select_policy"
ON messages FOR SELECT
USING (
  -- يمكن رؤية الرسائل لأي شخص يمكنه رؤية المحادثة
  chat_id IN (
    SELECT id FROM chats
    WHERE 
      -- العميل
      customer_id = auth.uid()
      OR
      -- البائع/المطعم
      vendor_id IN (
        SELECT id FROM vendors WHERE user_id = auth.uid()
      )
      OR
      vendor_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
      )
      OR
      -- المساعد
      vendor_id IN (
        SELECT vs.vendor_id 
        FROM vendor_staff vs
        WHERE vs.user_id = auth.uid() AND vs.is_active = true
      )
      OR
      -- السائق
      order_id IN (
        SELECT id FROM orders WHERE driver_id = auth.uid()
      )
      OR
      -- المدير
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
      )
  )
  -- لا نعرض الرسائل المحذوفة إلا للمدير أو المرسل
  AND (
    is_deleted = false
    OR sender_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
);

-- ========================================
-- ✍️ INSERT: إرسال رسائل
-- ========================================

CREATE POLICY "messages_insert_policy"
ON messages FOR INSERT
WITH CHECK (
  -- المرسل يجب أن يكون هو المستخدم الحالي
  sender_id = auth.uid()
  AND
  -- يجب أن يكون عضو في المحادثة
  chat_id IN (
    SELECT id FROM chats
    WHERE 
      customer_id = auth.uid()
      OR
      vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
      OR
      vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
      OR
      vendor_id IN (
        SELECT vs.vendor_id 
        FROM vendor_staff vs
        WHERE vs.user_id = auth.uid() AND vs.is_active = true
      )
      OR
      order_id IN (SELECT id FROM orders WHERE driver_id = auth.uid())
      OR
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  AND
  -- sender_role يجب أن يتطابق مع دور المستخدم الفعلي
  (
    (sender_role = 'customer' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'customer'))
    OR
    (sender_role IN ('vendor', 'restaurant') AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('vendor', 'restaurant')))
    OR
    (sender_role = 'staff' AND EXISTS (
      SELECT 1 FROM vendor_staff WHERE user_id = auth.uid() AND is_active = true
    ))
    OR
    (sender_role = 'driver' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'driver'))
    OR
    (sender_role = 'admin' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  )
);

-- ========================================
-- 🔄 UPDATE: تعديل الرسائل
-- ========================================

CREATE POLICY "messages_update_policy"
ON messages FOR UPDATE
USING (
  -- المرسل الأصلي أو المدير
  sender_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  -- لا يمكن تغيير sender_id أو chat_id
  sender_id = auth.uid()
  OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ========================================
-- 🗑️ DELETE: حذف الرسائل
-- ========================================

CREATE POLICY "messages_delete_policy"
ON messages FOR DELETE
USING (
  -- المرسل الأصلي يمكنه حذف رسالته
  sender_id = auth.uid()
  OR
  -- أو المدير
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ==================================================
-- ✅ التحقق من السياسات الجديدة
-- ==================================================

-- عرض سياسات chats
SELECT 
    '✅ سياسات CHATS' as section,
    policyname,
    cmd as operation,
    roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'chats'
ORDER BY cmd, policyname;

-- عرض سياسات messages
SELECT 
    '✅ سياسات MESSAGES' as section,
    policyname,
    cmd as operation,
    roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'messages'
ORDER BY cmd, policyname;

-- ==================================================
-- 📊 ملخص السياسات
-- ==================================================

SELECT 
    '📊 ملخص السياسات' as section,
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('chats', 'messages')
GROUP BY tablename;

-- ==================================================
-- ✅ اكتمل تحديث السياسات بنجاح!
-- 
-- الآن النظام يدعم جميع الأدوار:
-- ✅ Customer (العميل)
-- ✅ Vendor (البائع)
-- ✅ Restaurant (المطعم)
-- ✅ Admin (المدير)
-- ✅ Driver (السائق)
-- ✅ Staff (المساعد)
--
-- الخطوة التالية: تحديث الكود (ChatsContext.tsx)
-- ==================================================
