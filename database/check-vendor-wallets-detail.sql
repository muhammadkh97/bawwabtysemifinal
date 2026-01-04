-- ============================================
-- فحص جدول vendor_wallets بالتفصيل
-- ============================================

-- 1. أعمدة جدول vendor_wallets
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'vendor_wallets'
ORDER BY ordinal_position;

-- 2. فحص البيانات الموجودة
SELECT 
    id,
    vendor_id,
    available_balance,
    pending_balance,
    total_earned,
    total_withdrawn,
    created_at,
    updated_at
FROM vendor_wallets
LIMIT 5;

-- 3. فحص علاقة order_items مع العمولات
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'order_items'
    AND column_name IN ('commission_rate', 'commission_amount', 'vendor_earning', 'price', 'total');
