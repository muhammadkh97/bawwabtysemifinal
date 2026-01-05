-- ============================================
-- إضافة حقول مفقودة لجدول notifications
-- Add missing fields to notifications table
-- تاريخ: 2026-01-05
-- الحالة: جدول notifications موجود بـ 8 حقول أساسية
-- المطلوب: إضافة 4 حقول جديدة
-- ============================================

-- 1. إضافة حقل link (مطلوب في Frontend - يُستخدم في NotificationDropdown)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS link TEXT;

COMMENT ON COLUMN notifications.link IS 'URL to navigate when notification is clicked';

-- 2. إضافة حقل read_at (لتتبع وقت القراءة بدقة)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

COMMENT ON COLUMN notifications.read_at IS 'Timestamp when notification was marked as read';

-- 3. إضافة حقل priority (لتحديد أهمية الإشعار: low, normal, high, urgent)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';

-- إضافة constraint للتحقق من القيم المسموحة
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'notifications_priority_check'
  ) THEN
    ALTER TABLE notifications 
    ADD CONSTRAINT notifications_priority_check 
    CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
  END IF;
END $$;

COMMENT ON COLUMN notifications.priority IS 'Priority level: low, normal, high, urgent';

-- 4. إضافة حقل category (لتصنيف الإشعارات حسب النوع)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS category TEXT;

-- إضافة constraint للتحقق من القيم المسموحة
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'notifications_category_check'
  ) THEN
    ALTER TABLE notifications 
    ADD CONSTRAINT notifications_category_check 
    CHECK (category IN ('orders', 'products', 'messages', 'system', 'staff', 'admin'));
  END IF;
END $$;

COMMENT ON COLUMN notifications.category IS 'Category: orders, products, messages, system, staff, admin';

-- ============================================
-- تحديث Indexes لتحسين الأداء
-- Update indexes for better performance
-- ============================================

-- الـ Indexes الحالية:
-- ✅ idx_notifications_user (user_id)
-- ✅ idx_notifications_read (is_read)
-- سنضيف indexes جديدة محسّنة

-- 1. Composite index محسّن (user_id + is_read + created_at)
-- يُستخدم في: getNotifications(), getUnreadCount()
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_date 
ON notifications(user_id, is_read, created_at DESC);

-- 2. Index للبحث حسب النوع (للإشعارات غير المقروءة فقط)
-- يُستخدم في: تصفية الإشعارات حسب النوع
CREATE INDEX IF NOT EXISTS idx_notifications_type_unread 
ON notifications(type) WHERE is_read = false;

-- 3. Index للتنظيف التلقائي (للإشعارات المقروءة القديمة)
-- يُستخدم في: cleanup_old_notifications()
CREATE INDEX IF NOT EXISTS idx_notifications_old_read 
ON notifications(created_at) WHERE is_read = true;

-- 4. Index للبحث حسب الفئة (category)
-- يُستخدم في: تصفية الإشعارات في NotificationDropdown
CREATE INDEX IF NOT EXISTS idx_notifications_category 
ON notifications(category) WHERE category IS NOT NULL;

-- 5. Index للبحث حسب الأولوية العالية
-- يُستخدم في: عرض الإشعارات المهمة أولاً
CREATE INDEX IF NOT EXISTS idx_notifications_priority_high 
ON notifications(user_id, priority, created_at DESC) 
WHERE priority IN ('high', 'urgent');

-- ============================================
-- التحقق من النتائج
-- Verification
-- ============================================

-- عرض بنية الجدول الجديدة
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable,
    CASE 
        WHEN column_name IN ('link', 'read_at', 'priority', 'category') THEN '🆕 NEW'
        ELSE ''
    END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notifications'
ORDER BY ordinal_position;

-- عرض الـ Indexes الجديدة
SELECT 
    indexname as "Index Name",
    CASE 
        WHEN indexname LIKE '%_user_read_date' THEN '🆕 NEW'
        WHEN indexname LIKE '%_type_unread' THEN '🆕 NEW'
        WHEN indexname LIKE '%_old_read' THEN '🆕 NEW'
        WHEN indexname LIKE '%_category' THEN '🆕 NEW'
        WHEN indexname LIKE '%_priority_high' THEN '🆕 NEW'
        ELSE '✅ OLD'
    END as status
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'notifications'
ORDER BY indexname;

-- عرض الـ Constraints
SELECT
    conname AS "Constraint Name",
    pg_get_constraintdef(oid) AS "Definition"
FROM pg_constraint
WHERE conrelid = 'public.notifications'::regclass
  AND conname LIKE '%priority%' OR conname LIKE '%category%'
ORDER BY conname;
