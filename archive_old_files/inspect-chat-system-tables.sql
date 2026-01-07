-- =====================================================
-- 🔍 سكريبت فحص شامل لنظام الدردشة والمحادثات
-- Chat System Comprehensive Database Inspection
-- =====================================================
-- التاريخ: 2026-01-06
-- الهدف: فحص كامل للجداول، الأعمدة، العلاقات، والبيانات
-- ملاحظة: نسخ كل استعلام وتشغيله في Supabase SQL Editor
-- =====================================================

-- ==================================================
-- 📊 1. فحص جدول المحادثات (CHATS TABLE)
-- ==================================================

-- 1.1 بنية جدول chats
SELECT 
    '📋 بنية جدول CHATS' as section,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'chats'
ORDER BY ordinal_position;

-- 1.2 عدد السجلات في جدول chats
SELECT 
    '📊 إحصائيات جدول CHATS' as section,
    COUNT(*) as total_chats,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_chats,
    COUNT(CASE WHEN is_archived = true THEN 1 END) as archived_chats
FROM chats;

-- 1.3 توزيع المحادثات حسب آخر رسالة
SELECT 
    '📅 توزيع المحادثات حسب النشاط' as section,
    CASE 
        WHEN last_message_at IS NULL THEN 'لا توجد رسائل'
        WHEN last_message_at > NOW() - INTERVAL '1 day' THEN 'خلال 24 ساعة'
        WHEN last_message_at > NOW() - INTERVAL '7 days' THEN 'خلال أسبوع'
        WHEN last_message_at > NOW() - INTERVAL '30 days' THEN 'خلال شهر'
        ELSE 'أقدم من شهر'
    END as activity_period,
    COUNT(*) as count
FROM chats
GROUP BY activity_period
ORDER BY 
    CASE activity_period
        WHEN 'خلال 24 ساعة' THEN 1
        WHEN 'خلال أسبوع' THEN 2
        WHEN 'خلال شهر' THEN 3
        WHEN 'أقدم من شهر' THEN 4
        ELSE 5
    END;

-- 1.4 إحصائيات الرسائل غير المقروءة
SELECT 
    '📬 إحصائيات الرسائل غير المقروءة' as section,
    ROUND(AVG(customer_unread_count)::numeric, 2) as avg_customer_unread,
    MAX(customer_unread_count) as max_customer_unread,
    ROUND(AVG(vendor_unread_count)::numeric, 2) as avg_vendor_unread,
    MAX(vendor_unread_count) as max_vendor_unread
FROM chats
WHERE is_active = true;

-- ==================================================
-- 📨 2. فحص جدول الرسائل (MESSAGES TABLE)
-- ==================================================

-- 2.1 بنية جدول messages
SELECT 
    '📋 بنية جدول MESSAGES' as section,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'messages'
ORDER BY ordinal_position;

-- 2.2 عدد السجلات في جدول messages
SELECT 
    '📊 إحصائيات جدول MESSAGES' as section,
    COUNT(*) as total_messages,
    COUNT(CASE WHEN is_read = true THEN 1 END) as read_messages,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_messages,
    COUNT(CASE WHEN attachments IS NOT NULL THEN 1 END) as messages_with_attachments,
    COUNT(CASE WHEN is_reported = true THEN 1 END) as reported_messages,
    COUNT(CASE WHEN reply_to_id IS NOT NULL THEN 1 END) as reply_messages
FROM messages;

-- 2.3 توزيع الرسائل حسب نوع المرسل (sender_role)
SELECT 
    '👥 توزيع الرسائل حسب المرسل' as section,
    sender_role,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM messages
GROUP BY sender_role
ORDER BY count DESC;

-- 2.4 إحصائيات الرسائل خلال الفترات الزمنية
SELECT 
    '⏰ الرسائل خلال الفترات الزمنية' as section,
    CASE 
        WHEN created_at > NOW() - INTERVAL '1 hour' THEN 'آخر ساعة'
        WHEN created_at > NOW() - INTERVAL '24 hours' THEN 'آخر 24 ساعة'
        WHEN created_at > NOW() - INTERVAL '7 days' THEN 'آخر أسبوع'
        WHEN created_at > NOW() - INTERVAL '30 days' THEN 'آخر شهر'
        ELSE 'أقدم'
    END as time_period,
    COUNT(*) as message_count
FROM messages
GROUP BY time_period
ORDER BY 
    CASE time_period
        WHEN 'آخر ساعة' THEN 1
        WHEN 'آخر 24 ساعة' THEN 2
        WHEN 'آخر أسبوع' THEN 3
        WHEN 'آخر شهر' THEN 4
        ELSE 5
    END;

-- 2.5 متوسط وقت القراءة للرسائل
SELECT 
    '⏱️ متوسط وقت قراءة الرسائل' as section,
    ROUND(AVG(EXTRACT(EPOCH FROM (read_at - created_at))) / 60, 2) as avg_read_time_minutes,
    ROUND(MIN(EXTRACT(EPOCH FROM (read_at - created_at))) / 60, 2) as min_read_time_minutes,
    ROUND(MAX(EXTRACT(EPOCH FROM (read_at - created_at))) / 60, 2) as max_read_time_minutes
FROM messages
WHERE read_at IS NOT NULL AND is_read = true;

-- ==================================================
-- 🔗 3. فحص العلاقات والمفاتيح (RELATIONSHIPS)
-- ==================================================

-- 3.1 Foreign Keys على جدول chats
SELECT
    '🔗 Foreign Keys على جدول CHATS' as section,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'chats';

-- 3.2 Foreign Keys على جدول messages
SELECT
    '🔗 Foreign Keys على جدول MESSAGES' as section,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'messages';

-- ==================================================
-- 📇 4. فحص الفهارس (INDEXES)
-- ==================================================

-- 4.1 Indexes على جدول chats
SELECT
    '📇 Indexes على جدول CHATS' as section,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'chats'
  AND schemaname = 'public'
ORDER BY indexname;

-- 4.2 Indexes على جدول messages
SELECT
    '📇 Indexes على جدول MESSAGES' as section,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'messages'
  AND schemaname = 'public'
ORDER BY indexname;

-- ==================================================
-- 👥 5. تحليل العلاقات مع المستخدمين
-- ==================================================

-- 5.1 المستخدمين الأكثر نشاطاً (كعملاء)
SELECT 
    '👥 المستخدمين الأكثر نشاطاً (كعملاء)' as section,
    u.id,
    u.full_name,
    u.role,
    COUNT(c.id) as total_chats,
    SUM(c.customer_unread_count) as total_unread
FROM users u
LEFT JOIN chats c ON c.customer_id = u.id
GROUP BY u.id, u.full_name, u.role
HAVING COUNT(c.id) > 0
ORDER BY total_chats DESC
LIMIT 10;

-- 5.2 البائعين الأكثر نشاطاً
SELECT 
    '🏪 البائعين الأكثر نشاطاً' as section,
    v.id,
    v.store_name,
    u.full_name as owner_name,
    COUNT(c.id) as total_chats,
    SUM(c.vendor_unread_count) as total_unread
FROM vendors v
LEFT JOIN chats c ON c.vendor_id = v.id
LEFT JOIN users u ON u.id = v.user_id
GROUP BY v.id, v.store_name, u.full_name
HAVING COUNT(c.id) > 0
ORDER BY total_chats DESC
LIMIT 10;

-- ==================================================
-- 🔍 6. تحليل جودة البيانات
-- ==================================================

-- 6.1 المحادثات بدون رسائل
SELECT 
    '⚠️ محادثات بدون رسائل' as section,
    c.id,
    c.created_at,
    c.last_message,
    c.last_message_at
FROM chats c
LEFT JOIN messages m ON m.chat_id = c.id
WHERE m.id IS NULL;

-- 6.2 رسائل يتيمة (بدون محادثات)
SELECT 
    '⚠️ رسائل يتيمة (بدون محادثات)' as section,
    m.id,
    m.chat_id,
    m.created_at
FROM messages m
LEFT JOIN chats c ON c.id = m.chat_id
WHERE c.id IS NULL
LIMIT 5;

-- 6.3 محادثات مع عملاء أو بائعين محذوفين
SELECT 
    '⚠️ محادثات مع مستخدمين محذوفين' as section,
    c.id,
    c.customer_id,
    c.vendor_id,
    CASE WHEN u.id IS NULL THEN 'عميل محذوف' ELSE 'موجود' END as customer_status,
    CASE WHEN v.id IS NULL THEN 'بائع محذوف' ELSE 'موجود' END as vendor_status
FROM chats c
LEFT JOIN users u ON u.id = c.customer_id
LEFT JOIN vendors v ON v.id = c.vendor_id
WHERE u.id IS NULL OR v.id IS NULL;

-- ==================================================
-- 📊 7. إحصائيات متقدمة
-- ==================================================

-- 7.1 متوسط عدد الرسائل لكل محادثة
SELECT 
    '📊 متوسط عدد الرسائل لكل محادثة' as section,
    ROUND(AVG(message_count)::numeric, 2) as avg_messages_per_chat,
    MIN(message_count) as min_messages,
    MAX(message_count) as max_messages,
    ROUND(STDDEV(message_count)::numeric, 2) as stddev_messages
FROM (
    SELECT 
        chat_id,
        COUNT(*) as message_count
    FROM messages
    GROUP BY chat_id
) as chat_stats;

-- 7.2 توزيع المحادثات حسب عدد الرسائل
SELECT 
    '📊 توزيع المحادثات حسب عدد الرسائل' as section,
    CASE 
        WHEN message_count = 0 THEN '0 رسائل'
        WHEN message_count BETWEEN 1 AND 5 THEN '1-5 رسائل'
        WHEN message_count BETWEEN 6 AND 10 THEN '6-10 رسائل'
        WHEN message_count BETWEEN 11 AND 50 THEN '11-50 رسالة'
        WHEN message_count > 50 THEN 'أكثر من 50 رسالة'
    END as message_range,
    COUNT(*) as chat_count
FROM (
    SELECT 
        c.id,
        COUNT(m.id) as message_count
    FROM chats c
    LEFT JOIN messages m ON m.chat_id = c.id
    GROUP BY c.id
) as chat_message_counts
GROUP BY message_range
ORDER BY 
    CASE message_range
        WHEN '0 رسائل' THEN 1
        WHEN '1-5 رسائل' THEN 2
        WHEN '6-10 رسائل' THEN 3
        WHEN '11-50 رسالة' THEN 4
        ELSE 5
    END;

-- ==================================================
-- ✅ اكتمل الفحص
-- نسخ النتائج وأرسلها للمطور
-- ==================================================
