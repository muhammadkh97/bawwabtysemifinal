-- استعلامات فحص بنية الجداول والعلاقات في قاعدة البيانات (Supabase)
-- لعرض بنية جدول المنتجات
select * from information_schema.columns where table_name = 'products';

-- لعرض بنية جدول المتاجر
select * from information_schema.columns where table_name = 'stores';

-- لعرض جميع المفاتيح الأجنبية في جدول المنتجات
select
    tc.constraint_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
from 
    information_schema.table_constraints AS tc 
    join information_schema.key_column_usage AS kcu
      on tc.constraint_name = kcu.constraint_name
    join information_schema.constraint_column_usage AS ccu
      on ccu.constraint_name = tc.constraint_name
where tc.table_name = 'products' and tc.constraint_type = 'FOREIGN KEY';

-- لعرض بنية جدول السائقين
select * from information_schema.columns where table_name = 'drivers';

-- لعرض جميع الأعمدة في جدول السائقين (اختياري للتأكد)

-- 1. حذف المفتاح الأجنبي الزائد بين products و vendors (إن لم يكن مطلوبًا)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_vendor_id_vendors_fkey;

-- 2. ملاحظة: يجب تعديل استعلام السائقين في الكود ليستخدم vehicle_number بدل vehicle_plate
-- مثال (في الكود):
-- select ... vehicle_number ... from drivers ...
