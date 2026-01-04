-- التحقق الكامل من نظام السلتين
SELECT 
    '✅ نتائج النقل:' as info;

SELECT * FROM migrate_restaurant_items_to_new_cart();

SELECT 
    '🛒 السلة العادية (cart_items):' as info;

SELECT 
    COUNT(DISTINCT user_id) as "عدد المستخدمين",
    COUNT(*) as "عدد المنتجات",
    SUM(quantity) as "إجمالي الكمية"
FROM cart_items;

SELECT 
    '🍽️ سلة المطاعم (restaurant_cart_items):' as info;

SELECT 
    COUNT(DISTINCT user_id) as "عدد المستخدمين",
    COUNT(*) as "عدد الوجبات",
    SUM(quantity) as "إجمالي الكمية"
FROM restaurant_cart_items;

-- عرض محتوى سلة المطاعم
SELECT 
    '📋 محتوى سلة المطاعم:' as info;

SELECT 
    rc.user_id,
    rc.quantity,
    p.name as product_name,
    s.name as restaurant_name
FROM restaurant_cart_items rc
JOIN products p ON rc.product_id = p.id
JOIN stores s ON rc.vendor_id = s.id;
