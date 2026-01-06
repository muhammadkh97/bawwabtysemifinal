-- =====================================================
-- 🔧 المرحلة 2: تحديث جدول MESSAGES
-- Migrate MESSAGES table to professional structure
-- =====================================================
-- التاريخ: 2026-01-06
-- الحالة: جاهز للتنفيذ
-- ⚠️ تأكد من عمل backup قبل التنفيذ!
-- =====================================================

-- ==================================================
-- ➕ الخطوة 1: إضافة أعمدة المرسل المحسّنة
-- ==================================================

-- 1.1 إضافة sender_role (حرج جداً!)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS sender_role VARCHAR(20);

-- 1.2 تحديث sender_role للرسائل الموجودة
-- نحاول تحديد الـ role من جدول users
UPDATE messages m
SET sender_role = u.role
FROM users u
WHERE m.sender_id = u.id
  AND m.sender_role IS NULL;

-- 1.3 جعل sender_role إلزامي بعد تحديث البيانات
ALTER TABLE messages 
ALTER COLUMN sender_role SET NOT NULL;

-- ==================================================
-- ➕ الخطوة 2: إضافة أعمدة القراءة المحسّنة
-- ==================================================

-- 2.1 إضافة read_at (متى تم قراءة الرسالة)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 2.2 إضافة read_by للمحادثات الجماعية
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_by JSONB DEFAULT '[]'::jsonb;

-- 2.3 تحديث read_at للرسائل المقروءة
UPDATE messages 
SET read_at = created_at + INTERVAL '1 minute'
WHERE is_read = true AND read_at IS NULL;

-- ==================================================
-- ➕ الخطوة 3: إضافة دعم المرفقات
-- ==================================================

-- 3.1 إضافة نوع الرسالة
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text';

-- 3.2 إضافة المرفقات (صور، ملفات، صوت)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- ==================================================
-- ➕ الخطوة 4: إضافة ميزة الرد على رسالة
-- ==================================================

-- 4.1 إضافة reply_to_id
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- ==================================================
-- ➕ الخطوة 5: إضافة دعم التعديل
-- ==================================================

-- 5.1 إضافة حالة التعديل
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- 5.2 إضافة سجل التعديلات
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;

-- ==================================================
-- ➕ الخطوة 6: إضافة دعم الحذف الناعم
-- ==================================================

-- 6.1 إضافة حالة الحذف
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

-- ==================================================
-- ➕ الخطوة 7: إضافة نظام الإبلاغ
-- ==================================================

-- 7.1 إضافة حالة الإبلاغ
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS report_reason TEXT,
ADD COLUMN IF NOT EXISTS reported_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reported_at TIMESTAMPTZ;

-- ==================================================
-- ➕ الخطوة 8: إضافة بيانات وصفية
-- ==================================================

-- 8.1 إضافة metadata
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ==================================================
-- 🔒 الخطوة 9: إضافة القيود (Constraints)
-- ==================================================

-- 9.1 قيد على sender_role
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'messages_valid_sender_role'
    ) THEN
        ALTER TABLE messages
        ADD CONSTRAINT messages_valid_sender_role
        CHECK (sender_role IN ('customer', 'vendor', 'restaurant', 'admin', 'driver', 'staff'));
    END IF;
END $$;

-- 9.2 قيد على message_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'messages_valid_type'
    ) THEN
        ALTER TABLE messages
        ADD CONSTRAINT messages_valid_type
        CHECK (message_type IN ('text', 'image', 'file', 'voice', 'video', 'system'));
    END IF;
END $$;

-- 9.3 قيد: content أو attachments يجب أن يكون موجود
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'messages_has_content'
    ) THEN
        ALTER TABLE messages
        ADD CONSTRAINT messages_has_content
        CHECK (
          (content IS NOT NULL AND content != '') 
          OR 
          (attachments IS NOT NULL AND attachments != '[]'::jsonb)
        );
    END IF;
END $$;

-- ==================================================
-- 📇 الخطوة 10: إضافة فهارس جديدة للأداء
-- ==================================================

-- 10.1 فهرس على sender_role
CREATE INDEX IF NOT EXISTS idx_messages_sender_role 
ON messages(sender_role);

-- 10.2 فهرس على الرسائل غير المقروءة (محسّن)
CREATE INDEX IF NOT EXISTS idx_messages_unread_by_chat 
ON messages(chat_id, is_read, created_at DESC) 
WHERE is_read = false AND is_deleted = false;

-- 10.3 فهرس على reply_to_id
CREATE INDEX IF NOT EXISTS idx_messages_reply 
ON messages(reply_to_id) 
WHERE reply_to_id IS NOT NULL;

-- 10.4 فهرس على المرفقات (GIN للبحث في JSONB)
CREATE INDEX IF NOT EXISTS idx_messages_attachments 
ON messages USING GIN(attachments) 
WHERE attachments != '[]'::jsonb;

-- 10.5 فهرس على message_type
CREATE INDEX IF NOT EXISTS idx_messages_type 
ON messages(message_type);

-- 10.6 فهرس على الرسائل المحذوفة
CREATE INDEX IF NOT EXISTS idx_messages_deleted 
ON messages(is_deleted, deleted_at) 
WHERE is_deleted = true;

-- 10.7 فهرس على الرسائل المبلغ عنها
CREATE INDEX IF NOT EXISTS idx_messages_reported 
ON messages(is_reported, reported_at) 
WHERE is_reported = true;

-- ==================================================
-- 🔄 الخطوة 11: تحديث البيانات الموجودة
-- ==================================================

-- 11.1 تعيين message_type للرسائل الحالية
UPDATE messages 
SET message_type = 'text'
WHERE message_type IS NULL;

-- 11.2 التأكد من وجود قيمة في content
UPDATE messages 
SET content = '(رسالة فارغة)'
WHERE (content IS NULL OR content = '') 
  AND (attachments IS NULL OR attachments = '[]'::jsonb);

-- ==================================================
-- ✅ الخطوة 12: التحقق من النتائج
-- ==================================================

-- 12.1 عرض بنية الجدول الجديدة
SELECT 
    '📋 جدول MESSAGES المحدث' as status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'messages'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 12.2 عرض الفهارس الجديدة
SELECT 
    '📇 الفهارس الجديدة' as status,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'messages'
  AND schemaname = 'public'
ORDER BY indexname;

-- 12.3 عرض القيود الجديدة
SELECT
    '🔒 القيود الجديدة' as status,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'messages'::regclass
  AND conname LIKE 'messages_valid%';

-- ==================================================
-- 📊 إحصائيات بعد التحديث
-- ==================================================

SELECT 
    '📊 إحصائيات بعد التحديث' as section,
    COUNT(*) as total_messages,
    COUNT(CASE WHEN sender_role IS NOT NULL THEN 1 END) as messages_with_role,
    COUNT(CASE WHEN message_type = 'text' THEN 1 END) as text_messages,
    COUNT(CASE WHEN message_type = 'image' THEN 1 END) as image_messages,
    COUNT(CASE WHEN attachments != '[]'::jsonb THEN 1 END) as messages_with_attachments,
    COUNT(CASE WHEN reply_to_id IS NOT NULL THEN 1 END) as reply_messages,
    COUNT(CASE WHEN is_edited = true THEN 1 END) as edited_messages,
    COUNT(CASE WHEN is_deleted = true THEN 1 END) as deleted_messages,
    COUNT(CASE WHEN is_reported = true THEN 1 END) as reported_messages
FROM messages;

-- ==================================================
-- ✅ اكتمل تحديث جدول MESSAGES بنجاح!
-- الخطوة التالية: إنشاء Functions & Triggers
-- ==================================================
