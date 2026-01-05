-- ============================================
-- 🚀 تنفيذ شامل لتطوير نظام الإشعارات
-- Complete Notifications System Upgrade
-- ============================================
-- التاريخ: 2026-01-05
-- المرحلة: 1 - الإصلاحات الحرجة
-- الوقت المتوقع: 2-3 دقائق
-- ============================================

DO $$ BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '🚀 بدء تطوير نظام الإشعارات';
  RAISE NOTICE '============================================';
END $$;

-- ============================================
-- STEP 1: إضافة الحقول المفقودة
-- ============================================

DO $$ BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📝 STEP 1/3: إضافة حقول جديدة للجدول...';
END $$;

-- 1. إضافة حقل link
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS link TEXT;

-- 2. إضافة حقل read_at
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 3. إضافة حقل priority
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';

-- 4. إضافة حقل category
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS category TEXT;

-- إضافة Constraints
DO $$ 
BEGIN
  -- Priority constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'notifications_priority_check'
  ) THEN
    ALTER TABLE notifications 
    ADD CONSTRAINT notifications_priority_check 
    CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    RAISE NOTICE '✅ Priority constraint added';
  ELSE
    RAISE NOTICE '⚠️ Priority constraint already exists';
  END IF;

  -- Category constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'notifications_category_check'
  ) THEN
    ALTER TABLE notifications 
    ADD CONSTRAINT notifications_category_check 
    CHECK (category IN ('orders', 'products', 'messages', 'system', 'staff', 'admin'));
    RAISE NOTICE '✅ Category constraint added';
  ELSE
    RAISE NOTICE '⚠️ Category constraint already exists';
  END IF;
END $$;

-- إضافة Comments
COMMENT ON COLUMN notifications.link IS 'URL to navigate when notification is clicked';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp when notification was marked as read';
COMMENT ON COLUMN notifications.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN notifications.category IS 'Category: orders, products, messages, system, staff, admin';

DO $$ BEGIN
  RAISE NOTICE '✅ STEP 1 Complete: تم إضافة 4 حقول جديدة';
END $$;

-- ============================================
-- STEP 2: إنشاء RPC Functions
-- ============================================

DO $$ BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⚙️ STEP 2/3: إنشاء RPC Functions...';
END $$;

-- Function 1: mark_notification_read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET 
    is_read = true, 
    read_at = NOW()
  WHERE id = notification_uuid 
    AND user_id = auth.uid()
    AND is_read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_notification_read(UUID) IS 
'Mark a single notification as read. Returns true if successful.';

DO $$ BEGIN
  RAISE NOTICE '  ✅ mark_notification_read created';
END $$;

-- Function 2: mark_all_notifications_read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET 
    is_read = true, 
    read_at = NOW()
  WHERE user_id = auth.uid() 
    AND is_read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_all_notifications_read() IS 
'Mark all unread notifications as read. Returns count of updated notifications.';

DO $$ BEGIN
  RAISE NOTICE '  ✅ mark_all_notifications_read created';
END $$;

-- Function 3: create_notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_priority TEXT DEFAULT 'normal',
  p_category TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Validations
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  IF p_priority NOT IN ('low', 'normal', 'high', 'urgent') THEN
    RAISE EXCEPTION 'Invalid priority';
  END IF;
  
  -- Create notification
  INSERT INTO notifications (
    user_id, type, title, message, link, data, 
    priority, category, is_read, created_at
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_link, p_metadata,
    p_priority, p_category, false, NOW()
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) IS 
'Create a new notification with validation. Returns notification ID.';

DO $$ BEGIN
  RAISE NOTICE '  ✅ create_notification created';
END $$;

-- Function 4: cleanup_old_notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
    AND is_read = true;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_notifications(INTEGER) IS 
'Delete read notifications older than specified days. Returns count deleted.';

DO $$ BEGIN
  RAISE NOTICE '  ✅ cleanup_old_notifications created';
END $$;

-- Function 5: get_user_notifications (مع pagination و filtering)
CREATE OR REPLACE FUNCTION get_user_notifications(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_unread_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  link TEXT,
  data JSONB,
  priority TEXT,
  category TEXT,
  is_read BOOLEAN,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id, n.user_id, n.type, n.title, n.message, n.link, n.data,
    n.priority, n.category, n.is_read, n.read_at, n.created_at
  FROM notifications n
  WHERE n.user_id = auth.uid()
    AND (NOT p_unread_only OR n.is_read = false)
  ORDER BY 
    CASE n.priority 
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'normal' THEN 3
      WHEN 'low' THEN 4
      ELSE 5
    END,
    n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_notifications(INTEGER, INTEGER, BOOLEAN) IS 
'Get user notifications with pagination. Ordered by priority and date.';

DO $$ BEGIN
  RAISE NOTICE '  ✅ get_user_notifications created';
  RAISE NOTICE '';
  RAISE NOTICE '✅ STEP 2 Complete: تم إنشاء 5 functions جديدة';
END $$;

-- ============================================
-- STEP 3: إضافة DELETE Policy
-- ============================================

DO $$ BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔐 STEP 3/3: إضافة DELETE Policy...';
END $$;

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

CREATE POLICY "Users can delete own notifications"
ON notifications
FOR DELETE
USING (user_id = auth.uid());

DO $$ BEGIN
  RAISE NOTICE '✅ STEP 3 Complete: DELETE policy added';
END $$;

-- ============================================
-- STEP 4: تحسين Indexes
-- ============================================

DO $$ BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📈 STEP 4/3 (Bonus): تحسين Indexes...';
END $$;

-- Composite index محسّن
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_date 
ON notifications(user_id, is_read, created_at DESC);

-- Index للنوع
CREATE INDEX IF NOT EXISTS idx_notifications_type_unread 
ON notifications(type) WHERE is_read = false;

-- Index للتنظيف
CREATE INDEX IF NOT EXISTS idx_notifications_old_read 
ON notifications(created_at) WHERE is_read = true;

-- Index للفئة
CREATE INDEX IF NOT EXISTS idx_notifications_category 
ON notifications(category) WHERE category IS NOT NULL;

-- Index للأولوية العالية
CREATE INDEX IF NOT EXISTS idx_notifications_priority_high 
ON notifications(user_id, priority, created_at DESC) 
WHERE priority IN ('high', 'urgent');

DO $$ BEGIN
  RAISE NOTICE '  ✅ Composite index created';
  RAISE NOTICE '  ✅ Type index created';
  RAISE NOTICE '  ✅ Cleanup index created';
  RAISE NOTICE '  ✅ Category index created';
  RAISE NOTICE '  ✅ Priority index created';
  RAISE NOTICE '';
  RAISE NOTICE '✅ STEP 4 Complete: تم إضافة 5 indexes محسّنة';
END $$;

-- ============================================
-- التحقق النهائي
-- ============================================

DO $$ BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '🔍 التحقق النهائي من التحديثات';
  RAISE NOTICE '============================================';
END $$;

-- عرض الإحصائيات
SELECT 
  'Columns' as "Type",
  COUNT(*)::text as "Count"
FROM information_schema.columns
WHERE table_name = 'notifications'
UNION ALL
SELECT 
  'Functions',
  COUNT(*)::text
FROM pg_proc
WHERE proname LIKE '%notification%'
UNION ALL
SELECT 
  'Policies',
  COUNT(*)::text
FROM pg_policies
WHERE tablename = 'notifications'
UNION ALL
SELECT 
  'Indexes',
  COUNT(*)::text
FROM pg_indexes
WHERE tablename = 'notifications';

DO $$ BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ اكتمل التطوير بنجاح!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 الإضافات:';
  RAISE NOTICE '  • 4 حقول جديدة (link, read_at, priority, category)';
  RAISE NOTICE '  • 5 RPC Functions';
  RAISE NOTICE '  • 1 DELETE Policy';
  RAISE NOTICE '  • 5 Indexes محسّنة';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 الخطوة التالية:';
  RAISE NOTICE '  راجع NOTIFICATIONS_SYSTEM_AUDIT_REPORT.md - المرحلة 2';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
