-- =====================================================
-- ⚙️ المرحلة 3: إنشاء Functions & Triggers
-- Create automated functions and triggers for chat system
-- =====================================================
-- التاريخ: 2026-01-06
-- الحالة: جاهز للتنفيذ
-- =====================================================

-- ==================================================
-- 🔧 Function 1: تحديث last_message تلقائياً
-- ==================================================

CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث معلومات آخر رسالة في المحادثة
  UPDATE chats
  SET 
    last_message = CASE 
      WHEN NEW.is_deleted = true THEN '(تم حذف الرسالة)'
      WHEN NEW.message_type = 'image' THEN '📷 صورة'
      WHEN NEW.message_type = 'file' THEN '📎 ملف'
      WHEN NEW.message_type = 'voice' THEN '🎤 رسالة صوتية'
      WHEN NEW.message_type = 'video' THEN '🎥 فيديو'
      ELSE NEW.content
    END,
    last_message_at = NEW.created_at,
    last_message_sender_id = NEW.sender_id,
    last_message_sender_role = NEW.sender_role,
    updated_at = NOW()
  WHERE id = NEW.chat_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء Trigger
DROP TRIGGER IF EXISTS messages_update_chat_trigger ON messages;
CREATE TRIGGER messages_update_chat_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_last_message();

-- ==================================================
-- 🔧 Function 2: تحديث unread_count تلقائياً
-- ==================================================

CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
DECLARE
  chat_record RECORD;
BEGIN
  -- جلب معلومات المحادثة
  SELECT * INTO chat_record FROM chats WHERE id = NEW.chat_id;
  
  -- زيادة العداد للطرف الآخر حسب نوع المرسل
  IF NEW.sender_role = 'customer' THEN
    -- العميل أرسل، نزيد عداد البائع
    UPDATE chats 
    SET vendor_unread_count = vendor_unread_count + 1
    WHERE id = NEW.chat_id;
    
  ELSIF NEW.sender_role IN ('vendor', 'restaurant', 'staff') THEN
    -- البائع/المطعم/المساعد أرسل، نزيد عداد العميل
    UPDATE chats 
    SET customer_unread_count = customer_unread_count + 1
    WHERE id = NEW.chat_id;
    
  ELSIF NEW.sender_role = 'driver' THEN
    -- السائق أرسل، نزيد عداد العميل والبائع
    UPDATE chats 
    SET customer_unread_count = customer_unread_count + 1,
        vendor_unread_count = vendor_unread_count + 1
    WHERE id = NEW.chat_id;
    
  ELSIF NEW.sender_role = 'admin' THEN
    -- المدير أرسل، نزيد كل العدادات
    UPDATE chats 
    SET customer_unread_count = customer_unread_count + 1,
        vendor_unread_count = vendor_unread_count + 1
    WHERE id = NEW.chat_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء Trigger
DROP TRIGGER IF EXISTS messages_increment_unread_trigger ON messages;
CREATE TRIGGER messages_increment_unread_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION increment_unread_count();

-- ==================================================
-- 🔧 Function 3: إعادة تعيين unread_count عند القراءة
-- ==================================================

CREATE OR REPLACE FUNCTION reset_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- عند تحديد رسالة كمقروءة، نعيد حساب العداد
  IF NEW.is_read = true AND OLD.is_read = false THEN
    -- تحديث read_at إذا لم يكن موجود
    IF NEW.read_at IS NULL THEN
      NEW.read_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء Trigger
DROP TRIGGER IF EXISTS messages_mark_read_trigger ON messages;
CREATE TRIGGER messages_mark_read_trigger
BEFORE UPDATE ON messages
FOR EACH ROW
WHEN (OLD.is_read IS DISTINCT FROM NEW.is_read)
EXECUTE FUNCTION reset_unread_count();

-- ==================================================
-- 🔧 Function 4: تحديث updated_at تلقائياً
-- ==================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء Trigger على جدول chats
DROP TRIGGER IF EXISTS chats_updated_at_trigger ON chats;
CREATE TRIGGER chats_updated_at_trigger
BEFORE UPDATE ON chats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- 🔧 Function 5: حفظ سجل التعديلات
-- ==================================================

CREATE OR REPLACE FUNCTION save_message_edit_history()
RETURNS TRIGGER AS $$
BEGIN
  -- عند تعديل محتوى الرسالة
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    NEW.is_edited = true;
    NEW.edited_at = NOW();
    
    -- إضافة المحتوى القديم للسجل
    NEW.edit_history = OLD.edit_history || 
      jsonb_build_object(
        'content', OLD.content,
        'edited_at', NOW()
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء Trigger
DROP TRIGGER IF EXISTS messages_edit_history_trigger ON messages;
CREATE TRIGGER messages_edit_history_trigger
BEFORE UPDATE ON messages
FOR EACH ROW
WHEN (OLD.content IS DISTINCT FROM NEW.content)
EXECUTE FUNCTION save_message_edit_history();

-- ==================================================
-- 🔧 Function 6: إنشاء أو جلب محادثة
-- ==================================================

CREATE OR REPLACE FUNCTION create_or_get_chat(
  p_customer_id UUID,
  p_vendor_id UUID,
  p_order_id UUID DEFAULT NULL,
  p_chat_type VARCHAR(20) DEFAULT 'direct'
)
RETURNS UUID AS $$
DECLARE
  v_chat_id UUID;
BEGIN
  -- البحث عن محادثة موجودة
  SELECT id INTO v_chat_id
  FROM chats
  WHERE customer_id = p_customer_id
    AND vendor_id = p_vendor_id
    AND is_active = true
  LIMIT 1;
  
  -- إنشاء محادثة جديدة إذا لم توجد
  IF v_chat_id IS NULL THEN
    INSERT INTO chats (
      customer_id, 
      vendor_id, 
      order_id,
      chat_type,
      is_active
    )
    VALUES (
      p_customer_id, 
      p_vendor_id, 
      p_order_id,
      p_chat_type,
      true
    )
    RETURNING id INTO v_chat_id;
  END IF;
  
  RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- 🔧 Function 7: حساب عدد الرسائل غير المقروءة
-- ==================================================

CREATE OR REPLACE FUNCTION get_unread_count(
  p_chat_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_user_role VARCHAR(20);
BEGIN
  -- جلب دور المستخدم
  SELECT role INTO v_user_role FROM users WHERE id = p_user_id;
  
  -- حساب الرسائل غير المقروءة التي لم يرسلها المستخدم
  SELECT COUNT(*) INTO v_count
  FROM messages
  WHERE chat_id = p_chat_id
    AND is_read = false
    AND is_deleted = false
    AND sender_id != p_user_id;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- 🔧 Function 8: أرشفة محادثة
-- ==================================================

CREATE OR REPLACE FUNCTION archive_chat(
  p_chat_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE chats
  SET 
    is_archived = true,
    archived_by = p_user_id,
    archived_at = NOW(),
    updated_at = NOW()
  WHERE id = p_chat_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- 🔧 Function 9: إلغاء أرشفة محادثة
-- ==================================================

CREATE OR REPLACE FUNCTION unarchive_chat(
  p_chat_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE chats
  SET 
    is_archived = false,
    archived_by = NULL,
    archived_at = NULL,
    updated_at = NOW()
  WHERE id = p_chat_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- 🔧 Function 10: حذف رسالة (حذف ناعم)
-- ==================================================

CREATE OR REPLACE FUNCTION delete_message(
  p_message_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE messages
  SET 
    is_deleted = true,
    deleted_at = NOW(),
    deleted_by = p_user_id
  WHERE id = p_message_id
    AND (sender_id = p_user_id OR 
         EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND role = 'admin'));
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- ✅ التحقق من Functions & Triggers
-- ==================================================

-- عرض جميع الـ Functions المنشأة
SELECT 
    '✅ Functions المنشأة' as section,
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname LIKE '%chat%' 
   OR proname LIKE '%message%'
   OR proname LIKE '%unread%'
ORDER BY proname;

-- عرض جميع الـ Triggers المنشأة
SELECT 
    '✅ Triggers المنشأة' as section,
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE c.relname IN ('chats', 'messages')
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- ==================================================
-- 🧪 اختبار Functions
-- ==================================================

-- اختبار 1: إنشاء محادثة
-- SELECT create_or_get_chat(
--   'customer-uuid-here'::uuid,
--   'vendor-uuid-here'::uuid
-- );

-- اختبار 2: حساب غير المقروء
-- SELECT get_unread_count(
--   'chat-uuid-here'::uuid,
--   'user-uuid-here'::uuid
-- );

-- ==================================================
-- ✅ اكتمل إنشاء Functions & Triggers بنجاح!
-- الخطوة التالية: تحديث السياسات (RLS)
-- ==================================================
