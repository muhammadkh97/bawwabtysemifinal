-- ============================================
-- Notification RPC Functions
-- وظائف قاعدة البيانات لإدارة الإشعارات
-- ============================================

-- ============================================
-- 1️⃣ Mark single notification as read
-- تحديد إشعار واحد كمقروء
-- ============================================
CREATE OR REPLACE FUNCTION mark_notification_read(notification_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
  v_count INTEGER;
BEGIN
  -- تحديث الإشعار فقط إذا كان يخص المستخدم الحالي وغير مقروء
  UPDATE notifications
  SET 
    is_read = true, 
    read_at = NOW()
  WHERE id = notification_uuid 
    AND user_id = auth.uid()
    AND is_read = false;
  
  -- التحقق من عدد الصفوف المحدثة
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_updated := v_count > 0;
  
  -- Log للتتبع (اختياري)
  IF v_updated THEN
    RAISE NOTICE 'Notification % marked as read by user %', notification_uuid, auth.uid();
  ELSE
    RAISE NOTICE 'Notification % not found or already read for user %', notification_uuid, auth.uid();
  END IF;
  
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إضافة تعليق توضيحي
COMMENT ON FUNCTION mark_notification_read(UUID) IS 
'Mark a single notification as read. Returns true if successful, false if notification not found or already read.';

-- ============================================
-- 2️⃣ Mark all notifications as read
-- تحديد كل الإشعارات كمقروءة
-- ============================================
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- تحديث كل الإشعارات غير المقروءة للمستخدم الحالي
  UPDATE notifications
  SET 
    is_read = true, 
    read_at = NOW()
  WHERE user_id = auth.uid() 
    AND is_read = false;
  
  -- الحصول على عدد الإشعارات المحدثة
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Log للتتبع
  RAISE NOTICE 'Marked % notifications as read for user %', v_count, auth.uid();
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إضافة تعليق توضيحي
COMMENT ON FUNCTION mark_all_notifications_read() IS 
'Mark all unread notifications as read for the current user. Returns the count of updated notifications.';

-- ============================================
-- 3️⃣ Create notification
-- إنشاء إشعار جديد (مع التحقق من الصلاحيات)
-- ============================================
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
  v_current_user_id UUID;
BEGIN
  -- الحصول على ID المستخدم الحالي
  v_current_user_id := auth.uid();
  
  -- التحقق من أن المستخدم مسجل دخول
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated to create notifications';
  END IF;
  
  -- التحقق من أن المستخدم المستهدف موجود
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Target user not found: %', p_user_id;
  END IF;
  
  -- التحقق من أن النوع صحيح
  IF p_type IS NULL OR LENGTH(TRIM(p_type)) = 0 THEN
    RAISE EXCEPTION 'Notification type is required';
  END IF;
  
  -- التحقق من أن العنوان صحيح
  IF p_title IS NULL OR LENGTH(TRIM(p_title)) = 0 THEN
    RAISE EXCEPTION 'Notification title is required';
  END IF;
  
  -- التحقق من أن الرسالة صحيحة
  IF p_message IS NULL OR LENGTH(TRIM(p_message)) = 0 THEN
    RAISE EXCEPTION 'Notification message is required';
  END IF;
  
  -- التحقق من Priority
  IF p_priority NOT IN ('low', 'normal', 'high', 'urgent') THEN
    RAISE EXCEPTION 'Invalid priority: %. Must be: low, normal, high, urgent', p_priority;
  END IF;
  
  -- التحقق من Category (إذا تم توفيرها)
  IF p_category IS NOT NULL AND p_category NOT IN ('orders', 'products', 'messages', 'system', 'staff', 'admin') THEN
    RAISE EXCEPTION 'Invalid category: %. Must be: orders, products, messages, system, staff, admin', p_category;
  END IF;
  
  -- إنشاء الإشعار
  INSERT INTO notifications (
    user_id, 
    type, 
    title, 
    message, 
    link, 
    data, 
    priority,
    category,
    is_read, 
    created_at
  ) VALUES (
    p_user_id, 
    p_type, 
    p_title, 
    p_message, 
    p_link, 
    p_metadata, 
    p_priority,
    p_category,
    false, 
    NOW()
  )
  RETURNING id INTO v_id;
  
  -- Log للتتبع
  RAISE NOTICE 'Created notification % for user % by user %', v_id, p_user_id, v_current_user_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إضافة تعليق توضيحي
COMMENT ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) IS 
'Create a new notification with validation. Returns the new notification ID.';

-- ============================================
-- 4️⃣ Delete old notifications (للصيانة)
-- حذف الإشعارات القديمة المقروءة
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
  v_current_user_id UUID;
BEGIN
  -- الحصول على ID المستخدم الحالي
  v_current_user_id := auth.uid();
  
  -- التحقق من أن المستخدم admin (اختياري - يمكن إزالة هذا الشرط)
  -- IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_current_user_id AND role = 'admin') THEN
  --   RAISE EXCEPTION 'Only admins can cleanup notifications';
  -- END IF;
  
  -- حذف الإشعارات القديمة المقروءة فقط
  DELETE FROM notifications
  WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
    AND is_read = true;
  
  -- الحصول على عدد الإشعارات المحذوفة
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  -- Log للتتبع
  RAISE NOTICE 'Deleted % old notifications (older than % days)', v_deleted, days_old;
  
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إضافة تعليق توضيحي
COMMENT ON FUNCTION cleanup_old_notifications(INTEGER) IS 
'Delete read notifications older than specified days. Default is 30 days. Returns count of deleted notifications.';

-- ============================================
-- 5️⃣ Get notifications with pagination
-- الحصول على الإشعارات مع pagination
-- ============================================
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
    n.id,
    n.user_id,
    n.type,
    n.title,
    n.message,
    n.link,
    n.data,
    n.priority,
    n.category,
    n.is_read,
    n.read_at,
    n.created_at
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

-- إضافة تعليق توضيحي
COMMENT ON FUNCTION get_user_notifications(INTEGER, INTEGER, BOOLEAN) IS 
'Get user notifications with pagination and optional filtering. Ordered by priority and date.';

-- ============================================
-- التحقق من النتائج
-- Verification
-- ============================================

-- عرض كل الـ Functions المتعلقة بالإشعارات
SELECT 
    proname AS function_name,
    pg_get_function_identity_arguments(oid) AS arguments,
    prosecdef AS is_security_definer
FROM pg_proc
WHERE proname LIKE '%notification%'
ORDER BY proname;
