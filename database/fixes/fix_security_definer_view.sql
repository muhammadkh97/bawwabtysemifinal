-- ====================================
-- إصلاح مشكلة SECURITY DEFINER في View
-- ====================================

-- حذف View القديم
DROP VIEW IF EXISTS public.restaurant_cart_with_details;

-- إعادة إنشاء View بدون SECURITY DEFINER
CREATE VIEW public.restaurant_cart_with_details AS
SELECT 
    rci.id,
    rci.user_id,
    rci.vendor_id,
    rci.meal_id,
    rci.quantity,
    rci.special_instructions,
    rci.created_at,
    rci.updated_at,
    -- معلومات المتجر/المطعم
    s.name as vendor_name,
    s.name_ar as vendor_name_ar,
    s.logo_url as vendor_logo,
    -- معلومات الوجبة
    p.name as meal_name,
    p.name_ar as meal_name_ar,
    p.price as meal_price,
    p.featured_image as meal_image,
    p.original_currency as meal_currency,
    -- الحسابات
    (rci.quantity * p.price) as item_total
FROM public.restaurant_cart_items rci
LEFT JOIN public.stores s ON s.id = rci.vendor_id
LEFT JOIN public.products p ON p.id = rci.meal_id
WHERE rci.user_id = auth.uid();

-- إضافة تعليق توضيحي
COMMENT ON VIEW public.restaurant_cart_with_details IS 
'View لعرض تفاصيل سلة المطاعم مع معلومات المتجر والوجبة. 
تم إزالة SECURITY DEFINER لأسباب أمنية.
يتم تطبيق RLS تلقائياً على الجداول الأساسية.';
