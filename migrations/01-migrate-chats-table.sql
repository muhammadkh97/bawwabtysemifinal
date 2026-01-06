-- =====================================================
-- 🔧 المرحلة 1: تحديث جدول CHATS
-- Migrate CHATS table to professional structure
-- =====================================================
-- التاريخ: 2026-01-06
-- الحالة: جاهز للتنفيذ
-- ⚠️ تأكد من عمل backup قبل التنفيذ!
-- =====================================================

-- ==================================================
-- 🗑️ الخطوة 1: إزالة الأعمدة الخاطئة
-- ==================================================

-- 1.1 إزالة عمود message (يجب أن يكون في جدول messages)
ALTER TABLE chats DROP COLUMN IF EXISTS message;

-- 1.2 إزالة عمود read (يجب أن يكون في جدول messages)
ALTER TABLE chats DROP COLUMN IF EXISTS read;

-- ==================================================
-- ➕ الخطوة 2: إضافة الأعمدة الجديدة المطلوبة
-- ==================================================

-- 2.1 إضافة معلومات آخر رسالة
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS last_message_sender_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS last_message_sender_role VARCHAR(20);

-- 2.2 إضافة نوع المحادثة
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS chat_type VARCHAR(20) DEFAULT 'direct';

-- 2.3 إضافة حالة الأرشفة
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 2.4 إضافة عدادات غير مقروء للأدوار الجديدة
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS admin_unread_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS driver_unread_count INTEGER DEFAULT 0;

-- 2.5 إضافة مشاركين للمحادثات الجماعية
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS participants JSONB DEFAULT '[]'::jsonb;

-- 2.6 إضافة بيانات وصفية
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ==================================================
-- 🔒 الخطوة 3: إضافة القيود (Constraints)
-- ==================================================

-- 3.1 قيد على chat_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chats_valid_type'
    ) THEN
        ALTER TABLE chats 
        ADD CONSTRAINT chats_valid_type 
        CHECK (chat_type IN ('direct', 'group', 'support'));
    END IF;
END $$;

-- 3.2 قيد على sender_role
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chats_valid_sender_role'
    ) THEN
        ALTER TABLE chats
        ADD CONSTRAINT chats_valid_sender_role
        CHECK (last_message_sender_role IS NULL OR 
               last_message_sender_role IN ('customer', 'vendor', 'restaurant', 'admin', 'driver', 'staff'));
    END IF;
END $$;

-- ==================================================
-- 📇 الخطوة 4: إضافة فهارس جديدة للأداء
-- ==================================================

-- 4.1 فهرس على chat_type
CREATE INDEX IF NOT EXISTS idx_chats_type 
ON chats(chat_type);

-- 4.2 فهرس على is_archived
CREATE INDEX IF NOT EXISTS idx_chats_archived 
ON chats(is_archived) WHERE is_archived = false;

-- 4.3 فهرس على participants (GIN للبحث في JSONB)
CREATE INDEX IF NOT EXISTS idx_chats_participants 
ON chats USING GIN(participants);

-- 4.4 فهرس على last_message_sender_id
CREATE INDEX IF NOT EXISTS idx_chats_last_sender 
ON chats(last_message_sender_id) WHERE last_message_sender_id IS NOT NULL;

-- ==================================================
-- 🔄 الخطوة 5: تحديث البيانات الموجودة
-- ==================================================

-- 5.1 تعيين chat_type للمحادثات الحالية
UPDATE chats 
SET chat_type = 'direct'
WHERE chat_type IS NULL;

-- 5.2 تعيين القيم الافتراضية للعدادات الجديدة
UPDATE chats 
SET admin_unread_count = 0,
    driver_unread_count = 0
WHERE admin_unread_count IS NULL 
   OR driver_unread_count IS NULL;

-- ==================================================
-- 🔧 الخطوة 6: تحديث Foreign Key لـ vendor_id
-- ==================================================

-- ملاحظة: vendor_id له FK مزدوج (stores و vendors)
-- نحتاج لتوحيده، لكن هذا يتطلب قرار:
-- هل نستخدم stores.id أم vendors.id؟

-- إذا قررنا استخدام vendors.id فقط:
-- ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_vendor_id_fkey;
-- ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_vendor_id_vendors_fkey;
-- ALTER TABLE chats ADD CONSTRAINT chats_vendor_id_fkey 
-- FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;

-- ==================================================
-- ✅ الخطوة 7: التحقق من النتائج
-- ==================================================

-- 7.1 عرض بنية الجدول الجديدة
SELECT 
    'جدول CHATS المحدث' as status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'chats'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7.2 عرض الفهارس
SELECT 
    'الفهارس الجديدة' as status,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'chats'
  AND schemaname = 'public'
ORDER BY indexname;

-- 7.3 عرض القيود
SELECT
    'القيود الجديدة' as status,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'chats'::regclass
  AND conname LIKE 'chats_valid%';

-- ==================================================
-- 📊 إحصائيات بعد التحديث
-- ==================================================

SELECT 
    '📊 إحصائيات بعد التحديث' as section,
    COUNT(*) as total_chats,
    COUNT(CASE WHEN chat_type = 'direct' THEN 1 END) as direct_chats,
    COUNT(CASE WHEN chat_type = 'group' THEN 1 END) as group_chats,
    COUNT(CASE WHEN is_archived = true THEN 1 END) as archived_chats,
    COUNT(CASE WHEN last_message_sender_id IS NOT NULL THEN 1 END) as chats_with_sender_info
FROM chats;

-- ==================================================
-- ✅ اكتمل تحديث جدول CHATS بنجاح!
-- الخطوة التالية: تحديث جدول MESSAGES
-- ==================================================
