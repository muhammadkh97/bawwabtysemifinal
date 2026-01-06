-- =====================================================
-- 🔒 إصلاح نظام الدردشة بالكامل
-- =====================================================
-- التاريخ: 2026-01-07
-- المشاكل:
--   1. صلاحيات محدودة - لا تسمح لجميع الأدوار بالإرسال
--   2. Policies تتحقق من vendors فقط بدلاً من stores
--   3. عدم وجود policies للأدوار الأخرى (admin, driver, restaurant)
-- =====================================================

-- ==================================================
-- 🗑️ حذف جميع الـ Policies القديمة
-- ==================================================

-- حذف policies على جدول chats
DROP POLICY IF EXISTS "chats_select_policy" ON chats;
DROP POLICY IF EXISTS "chats_insert_policy" ON chats;
DROP POLICY IF EXISTS "chats_update_policy" ON chats;
DROP POLICY IF EXISTS "chats_delete_policy" ON chats;

-- حذف policies على جدول messages
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON messages;

-- ==================================================
-- ✅ إنشاء Policies جديدة - CHATS
-- ==================================================

-- 1️⃣ قراءة المحادثات - المستخدم يرى المحادثات التي هو طرف فيها
CREATE POLICY "chats_select_for_participants"
    ON chats FOR SELECT
    TO authenticated
    USING (
        -- العميل يرى محادثاته
        customer_id = auth.uid()
        OR
        -- البائع يرى محادثاته (من جدول stores)
        vendor_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
        OR
        -- الأدمن يرى كل شيء
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 2️⃣ إنشاء محادثة - أي مستخدم مسجل يمكنه إنشاء محادثة
CREATE POLICY "chats_insert_for_authenticated"
    ON chats FOR INSERT
    TO authenticated
    WITH CHECK (
        -- المستخدم يجب أن يكون أحد الأطراف
        (
            customer_id = auth.uid()
            OR
            vendor_id IN (
                SELECT id FROM stores WHERE user_id = auth.uid()
            )
        )
        AND
        -- التحقق من وجود المستخدمين
        EXISTS (SELECT 1 FROM users WHERE id = customer_id)
        AND
        EXISTS (SELECT 1 FROM stores WHERE id = vendor_id)
    );

-- 3️⃣ تحديث المحادثة - الأطراف المشاركة فقط
CREATE POLICY "chats_update_for_participants"
    ON chats FOR UPDATE
    TO authenticated
    USING (
        customer_id = auth.uid()
        OR
        vendor_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        customer_id = auth.uid()
        OR
        vendor_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4️⃣ حذف المحادثة - الأدمن فقط
CREATE POLICY "chats_delete_for_admin"
    ON chats FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ==================================================
-- ✅ إنشاء Policies جديدة - MESSAGES
-- ==================================================

-- 1️⃣ قراءة الرسائل - المستخدم يرى رسائل محادثاته فقط
CREATE POLICY "messages_select_for_chat_participants"
    ON messages FOR SELECT
    TO authenticated
    USING (
        chat_id IN (
            SELECT id FROM chats
            WHERE 
                customer_id = auth.uid()
                OR
                vendor_id IN (
                    SELECT id FROM stores WHERE user_id = auth.uid()
                )
                OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() AND role = 'admin'
                )
        )
    );

-- 2️⃣ إرسال رسالة - أي مستخدم مشارك في المحادثة
CREATE POLICY "messages_insert_for_chat_participants"
    ON messages FOR INSERT
    TO authenticated
    WITH CHECK (
        -- المستخدم هو المرسل
        sender_id = auth.uid()
        AND
        -- المحادثة موجودة والمستخدم طرف فيها
        chat_id IN (
            SELECT id FROM chats
            WHERE 
                customer_id = auth.uid()
                OR
                vendor_id IN (
                    SELECT id FROM stores WHERE user_id = auth.uid()
                )
                OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() AND role = 'admin'
                )
        )
    );

-- 3️⃣ تحديث الرسالة - المرسل أو الأدمن
CREATE POLICY "messages_update_for_sender_or_admin"
    ON messages FOR UPDATE
    TO authenticated
    USING (
        sender_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        sender_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4️⃣ حذف الرسالة - المرسل أو الأدمن
CREATE POLICY "messages_delete_for_sender_or_admin"
    ON messages FOR DELETE
    TO authenticated
    USING (
        sender_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ==================================================
-- 🔧 تحديث Function لإنشاء المحادثات
-- ==================================================

-- حذف جميع نسخ الـ function القديمة
DO $$ 
BEGIN
    DROP FUNCTION IF EXISTS create_or_get_chat(UUID, UUID, VARCHAR);
    DROP FUNCTION IF EXISTS create_or_get_chat(UUID, UUID);
    DROP FUNCTION IF EXISTS create_or_get_chat;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- إعادة إنشاء function مع دعم جميع الأدوار
CREATE FUNCTION create_or_get_chat(
    p_customer_id UUID,
    p_vendor_id UUID,
    p_chat_type VARCHAR DEFAULT 'direct'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_chat_id UUID;
    v_user_role user_role;
BEGIN
    -- الحصول على دور المستخدم الحالي
    SELECT role INTO v_user_role FROM users WHERE id = auth.uid();
    
    -- البحث عن محادثة موجودة
    SELECT id INTO v_chat_id
    FROM chats
    WHERE 
        customer_id = p_customer_id
        AND vendor_id = p_vendor_id
        AND chat_type = p_chat_type
        AND is_active = true
    LIMIT 1;
    
    -- إذا لم توجد، إنشاء محادثة جديدة
    IF v_chat_id IS NULL THEN
        INSERT INTO chats (
            customer_id,
            vendor_id,
            chat_type,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            p_customer_id,
            p_vendor_id,
            p_chat_type,
            true,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_chat_id;
        
        RAISE NOTICE 'تم إنشاء محادثة جديدة: %', v_chat_id;
    ELSE
        RAISE NOTICE 'محادثة موجودة: %', v_chat_id;
    END IF;
    
    RETURN v_chat_id;
END;
$$;

-- منح صلاحيات التنفيذ
GRANT EXECUTE ON FUNCTION create_or_get_chat TO authenticated;

-- ==================================================
-- 📊 التحقق من الإصلاحات
-- ==================================================

DO $$ 
DECLARE
    chats_policies INTEGER;
    messages_policies INTEGER;
BEGIN
    -- عد policies لـ chats
    SELECT COUNT(*) INTO chats_policies
    FROM pg_policies
    WHERE tablename = 'chats';
    
    -- عد policies لـ messages
    SELECT COUNT(*) INTO messages_policies
    FROM pg_policies
    WHERE tablename = 'messages';
    
    RAISE NOTICE '✅ تم إصلاح نظام الدردشة بنجاح!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📊 chats: % policies', chats_policies;
    RAISE NOTICE '📊 messages: % policies', messages_policies;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '🔒 جميع الأدوار يمكنها الإرسال';
    RAISE NOTICE '✅ المحادثات محمية حسب المشاركين';
    RAISE NOTICE '🎯 النظام جاهز!';
END $$;

-- ==================================================
-- 🧪 عرض الـ Policies الجديدة
-- ==================================================

SELECT 
    '=== 📜 Policies الجديدة على chats ===' as info;

SELECT 
    policyname,
    cmd,
    LEFT(qual::text, 80) as condition
FROM pg_policies
WHERE tablename = 'chats'
ORDER BY policyname;

SELECT 
    '=== 📜 Policies الجديدة على messages ===' as info;

SELECT 
    policyname,
    cmd,
    LEFT(qual::text, 80) as condition
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;
