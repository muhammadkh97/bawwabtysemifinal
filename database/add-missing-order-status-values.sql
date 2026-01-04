-- ============================================
-- إضافة قيم ناقصة لـ enum order_status
-- ============================================

-- إضافة القيم الناقصة بالترتيب الصحيح
-- بعد 'ready' نضيف 'ready_for_pickup'
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'ready_for_pickup' AFTER 'ready';

-- بعد 'ready_for_pickup' نضيف 'picked_up'
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'picked_up' AFTER 'ready_for_pickup';

-- بعد 'shipped' نضيف 'in_transit'
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'in_transit' AFTER 'shipped';

-- بعد 'delivered' نضيف 'completed'
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed' AFTER 'delivered';

-- بعد 'cancelled' نضيف 'refunded'
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded' AFTER 'cancelled';

-- التحقق من النتيجة
SELECT 
    enumlabel as status_value,
    enumsortorder as sort_order
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'order_status'
ORDER BY e.enumsortorder;
