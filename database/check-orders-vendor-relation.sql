-- ============================================
-- فحص علاقة orders مع stores/vendors
-- ============================================

-- 1. فحص foreign key على orders.vendor_id
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='orders'
    AND kcu.column_name = 'vendor_id';

-- 2. فحص أعمدة جدول stores
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'stores'
    AND column_name IN ('id', 'shop_name', 'shop_name_ar', 'user_id');

-- 3. فحص أعمدة جدول vendors (إن وجد)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vendors'
    AND column_name IN ('id', 'shop_name', 'shop_name_ar', 'user_id');
