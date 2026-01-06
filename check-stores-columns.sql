-- ========================================
-- 🔍 فحص أعمدة جدول stores
-- ========================================

SELECT 
    '=== 📊 أعمدة جدول stores ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'stores'
ORDER BY ordinal_position;

-- عرض أول 3 صفوف من البيانات
SELECT 
    '=== 📝 عينة من البيانات ===' as info;

SELECT *
FROM stores
LIMIT 3;
