-- ============================================
-- إضافة أعمدة التحقق (OTP & QR) للطلبات
-- ============================================

-- إضافة أعمدة التحقق لجدول orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS pickup_otp VARCHAR(6),
ADD COLUMN IF NOT EXISTS pickup_otp_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pickup_qr_code TEXT,
ADD COLUMN IF NOT EXISTS delivery_otp VARCHAR(6),
ADD COLUMN IF NOT EXISTS delivery_otp_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_qr_code TEXT;

-- إضافة تعليقات توضيحية
COMMENT ON COLUMN orders.pickup_otp IS 'كود OTP للمندوب لاستلام الطلب من البائع (6 أرقام)';
COMMENT ON COLUMN orders.pickup_otp_expires_at IS 'وقت انتهاء صلاحية كود استلام الطلب';
COMMENT ON COLUMN orders.pickup_qr_code IS 'كود QR للمندوب لاستلام الطلب من البائع';
COMMENT ON COLUMN orders.delivery_otp IS 'كود OTP للعميل لاستلام الطلب من المندوب (6 أرقام)';
COMMENT ON COLUMN orders.delivery_otp_expires_at IS 'وقت انتهاء صلاحية كود تسليم الطلب';
COMMENT ON COLUMN orders.delivery_qr_code IS 'كود QR للعميل لاستلام الطلب من المندوب';

-- إنشاء indexes للبحث السريع
CREATE INDEX IF NOT EXISTS idx_orders_pickup_otp ON orders(pickup_otp) WHERE pickup_otp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_delivery_otp ON orders(delivery_otp) WHERE delivery_otp IS NOT NULL;

-- عرض النتائج
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
    AND column_name IN (
        'pickup_otp', 'pickup_otp_expires_at', 'pickup_qr_code',
        'delivery_otp', 'delivery_otp_expires_at', 'delivery_qr_code'
    )
ORDER BY ordinal_position;
