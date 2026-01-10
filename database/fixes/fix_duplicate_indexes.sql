-- ====================================
-- حذف الـ Indexes المكررة لتحسين الأداء
-- ====================================

-- 1. جدول delivery_batches
-- الاحتفاظ بـ idx_delivery_batches_zone وحذف idx_batches_zone
DROP INDEX IF EXISTS public.idx_batches_zone;

-- 2. جدول drivers
-- الاحتفاظ بـ idx_drivers_location وحذف idx_drivers_current_location_gist
DROP INDEX IF EXISTS public.idx_drivers_current_location_gist;

-- 3. جدول loyalty_transactions
-- الاحتفاظ بـ idx_loyalty_transactions_user_id وحذف idx_loyalty_trans_user
DROP INDEX IF EXISTS public.idx_loyalty_trans_user;

-- 4. جدول orders
-- الاحتفاظ بـ idx_orders_delivery_location_gist وحذف idx_orders_delivery_location
DROP INDEX IF EXISTS public.idx_orders_delivery_location;

-- 5. جدول products
-- الاحتفاظ بـ idx_products_category_id وحذف idx_products_category
DROP INDEX IF EXISTS public.idx_products_category;

-- 6. جدول store_followers (حالتان)
-- الاحتفاظ بـ idx_store_followers_user_id وحذف idx_store_followers_user
DROP INDEX IF EXISTS public.idx_store_followers_user;

-- الاحتفاظ بـ idx_store_followers_vendor_id وحذف idx_store_followers_vendor
DROP INDEX IF EXISTS public.idx_store_followers_vendor;

-- 7. جدول stores
-- الاحتفاظ بـ idx_stores_location_gist وحذف idx_stores_location
DROP INDEX IF EXISTS public.idx_stores_location;

-- ====================================
-- التحقق من النتائج
-- ====================================

-- عرض جميع الـ indexes المتبقية لكل جدول
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'delivery_batches',
    'drivers',
    'loyalty_transactions',
    'orders',
    'products',
    'store_followers',
    'stores'
)
ORDER BY tablename, indexname;
