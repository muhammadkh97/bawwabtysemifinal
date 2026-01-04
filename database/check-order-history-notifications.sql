-- ============================================
-- فحص جداول order_status_history و notifications
-- ============================================

-- 1. فحص جدول order_status_history
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'order_status_history'
ORDER BY ordinal_position;

-- 2. فحص جدول notifications
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 3. التحقق من وجود الجداول
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('order_status_history', 'notifications');
