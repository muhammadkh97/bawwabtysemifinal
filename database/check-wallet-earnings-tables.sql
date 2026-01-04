-- ============================================
-- فحص جداول المحفظة والإيرادات
-- ============================================

-- 1. فحص جدول wallet_transactions
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'wallet_transactions'
ORDER BY ordinal_position;

-- 2. فحص جدول vendor_earnings أو vendor_wallet
SELECT 
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name LIKE '%wallet%' OR table_name LIKE '%earning%'
ORDER BY table_name;

-- 3. فحص الجداول المتعلقة بالدفع والعمولات
SELECT 
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (table_name LIKE '%payment%' 
         OR table_name LIKE '%commission%'
         OR table_name LIKE '%transaction%')
ORDER BY table_name;
