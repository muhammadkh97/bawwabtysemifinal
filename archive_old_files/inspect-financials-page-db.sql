-- استعلامات فحص صفحة الماليات (Financials Page)
-- التحقق من الجداول والعلاقات المطلوبة

-- ========================================
-- 1. فحص جدول payout_requests
-- ========================================

-- عرض بنية جدول payout_requests
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payout_requests'
ORDER BY ordinal_position;

-- ========================================
-- 2. فحص جدول vendor_wallets
-- ========================================

-- التحقق من وجود جدول vendor_wallets
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vendor_wallets'
) as vendor_wallets_exists;

-- عرض بنية جدول vendor_wallets (إن وجد)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'vendor_wallets'
ORDER BY ordinal_position;

-- ========================================
-- 3. فحص المفاتيح الأجنبية في payout_requests
-- ========================================

-- عرض جميع المفاتيح الأجنبية في جدول payout_requests
SELECT
    tc.constraint_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'payout_requests' 
  AND tc.constraint_type = 'FOREIGN KEY';

-- ========================================
-- 4. فحص العلاقات الموجودة
-- ========================================

-- هل يوجد مفتاح أجنبي من payout_requests إلى stores؟
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'payout_requests' 
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name LIKE '%store%';

-- هل يوجد مفتاح أجنبي من payout_requests إلى vendors؟
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'payout_requests' 
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name LIKE '%vendor%';

-- ========================================
-- 5. فحص البيانات
-- ========================================

-- عد السجلات في كل جدول
SELECT 
    (SELECT COUNT(*) FROM payout_requests) as payout_requests_count,
    (SELECT COUNT(*) FROM vendor_wallets) as vendor_wallets_count,
    (SELECT COUNT(*) FROM stores) as stores_count,
    (SELECT COUNT(*) FROM vendors) as vendors_count;

-- عرض عينة من payout_requests
SELECT id, vendor_id, amount, status, requested_at
FROM payout_requests
LIMIT 5;

-- ========================================
-- 6. التحقق: هل vendor_id في payout_requests يشير إلى stores أم vendors؟
-- ========================================

-- كم طلب سحب له vendor_id موجود في stores؟
SELECT COUNT(*) as payouts_with_store_vendor_id
FROM payout_requests pr
WHERE EXISTS (SELECT 1 FROM stores s WHERE s.id = pr.vendor_id);

-- كم طلب سحب له vendor_id موجود في vendors؟
SELECT COUNT(*) as payouts_with_vendors_vendor_id
FROM payout_requests pr
WHERE EXISTS (SELECT 1 FROM vendors v WHERE v.id = pr.vendor_id);

-- ========================================
-- 7. التحقق: هل vendor_wallets يحتوي على vendor_id؟
-- ========================================

-- عرض الأعمدة التي تحتوي على "vendor" في اسمها في جدول vendor_wallets
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'vendor_wallets'
  AND column_name LIKE '%vendor%';
