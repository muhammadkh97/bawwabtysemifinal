-- الحل الصحيح: إعادة المفتاح الأجنبي وإصلاح صفحة الموافقات

-- 1. إعادة المفتاح الأجنبي بين products و vendors
ALTER TABLE products 
ADD CONSTRAINT products_vendor_id_vendors_fkey 
FOREIGN KEY (vendor_id) 
REFERENCES vendors(id) 
ON DELETE CASCADE;

-- ملاحظة: الآن لدينا مفتاحان أجنبيان على vendor_id:
--   1. products_vendor_id_stores_fkey -> stores(id)
--   2. products_vendor_id_vendors_fkey -> vendors(id)
-- هذا صحيح لأن vendor_id يمكن أن يشير إلى أي من الجدولين

-- التحقق من المفاتيح الأجنبية
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
WHERE tc.table_name = 'products' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'vendor_id';
