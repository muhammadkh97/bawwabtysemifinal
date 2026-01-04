-- ============================================
-- إضافة أعمدة التوقيت لتتبع حالات الطلب
-- ============================================

-- إضافة الأعمدة الزمنية لجدول orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS processing_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS out_for_delivery_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- إضافة تعليقات توضيحية
COMMENT ON COLUMN orders.confirmed_at IS 'وقت تأكيد الطلب من البائع';
COMMENT ON COLUMN orders.processing_at IS 'وقت بدء تحضير/معالجة الطلب';
COMMENT ON COLUMN orders.ready_at IS 'وقت جاهزية الطلب للشحن/الاستلام';
COMMENT ON COLUMN orders.picked_up_at IS 'وقت استلام المندوب للطلب';
COMMENT ON COLUMN orders.shipped_at IS 'وقت شحن الطلب';
COMMENT ON COLUMN orders.out_for_delivery_at IS 'وقت خروج الطلب للتوصيل';
COMMENT ON COLUMN orders.delivered_at IS 'وقت تسليم الطلب للعميل';
COMMENT ON COLUMN orders.cancelled_at IS 'وقت إلغاء الطلب';
COMMENT ON COLUMN orders.refunded_at IS 'وقت استرجاع المبلغ';

-- إنشاء indexes للأعمدة الزمنية الأكثر استخداماً
CREATE INDEX IF NOT EXISTS idx_orders_confirmed_at ON orders(confirmed_at) WHERE confirmed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at) WHERE delivered_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_at ON orders(cancelled_at) WHERE cancelled_at IS NOT NULL;

-- عرض النتائج
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
    AND column_name LIKE '%_at'
ORDER BY ordinal_position;
