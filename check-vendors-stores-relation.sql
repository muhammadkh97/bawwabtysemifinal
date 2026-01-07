-- فحص العلاقة بين products و vendors و stores

-- 1. هل يوجد جدول vendors؟
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vendors'
) as vendors_table_exists;

-- 2. عرض أعمدة جدول vendors (إن وجد)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendors' 
ORDER BY ordinal_position;

-- 3. عد السجلات في كل جدول
SELECT 
    (SELECT COUNT(*) FROM vendors) as vendors_count,
    (SELECT COUNT(*) FROM stores) as stores_count,
    (SELECT COUNT(*) FROM products) as products_count;

-- 4. تحقق من بيانات vendor_id في products - هل تشير إلى vendors أم stores؟
SELECT 
    COUNT(*) as total_products,
    COUNT(DISTINCT vendor_id) as unique_vendor_ids
FROM products;

-- 5. تحقق: كم منتج له vendor_id موجود في stores؟
SELECT COUNT(*) as products_with_store_vendor_id
FROM products p
WHERE EXISTS (SELECT 1 FROM stores s WHERE s.id = p.vendor_id);

-- 6. تحقق: كم منتج له vendor_id موجود في vendors؟
SELECT COUNT(*) as products_with_vendors_vendor_id
FROM products p
WHERE EXISTS (SELECT 1 FROM vendors v WHERE v.id = p.vendor_id);
