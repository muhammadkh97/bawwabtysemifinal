-- =========================================================
-- إصلاح مشاكل SECURITY DEFINER في Views
-- Fix SECURITY DEFINER Views Issues
-- =========================================================
-- تاريخ: 2026-01-01
-- الهدف: تحويل Views من SECURITY DEFINER إلى SECURITY INVOKER
-- =========================================================

-- =====================================================
-- 1. View: users_with_full_name
-- =====================================================

DROP VIEW IF EXISTS public.users_with_full_name CASCADE;

CREATE VIEW public.users_with_full_name
WITH (security_invoker = true)
AS
SELECT 
  id,
  email,
  name,
  phone,
  avatar_url,
  role,
  is_active,
  created_at
FROM public.users;

COMMENT ON VIEW public.users_with_full_name IS 'عرض المستخدمين مع الأسماء الكاملة - SECURITY INVOKER';

-- =====================================================
-- 2. View: loyalty_user_stats
-- =====================================================

DROP VIEW IF EXISTS public.loyalty_user_stats CASCADE;

CREATE VIEW public.loyalty_user_stats
WITH (security_invoker = true)
AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.loyalty_points,
  u.total_earned_points,
  COUNT(lph.id) as total_transactions,
  COALESCE(SUM(CASE WHEN lph.points_change > 0 THEN lph.points_change ELSE 0 END), 0) as total_earned,
  COALESCE(SUM(CASE WHEN lph.points_change < 0 THEN ABS(lph.points_change) ELSE 0 END), 0) as total_redeemed
FROM public.users u
LEFT JOIN public.loyalty_points_history lph ON u.id = lph.user_id
GROUP BY u.id, u.email, u.name, u.loyalty_points, u.total_earned_points;

COMMENT ON VIEW public.loyalty_user_stats IS 'إحصائيات نقاط الولاء للمستخدمين - SECURITY INVOKER';

-- =====================================================
-- 3. View: v_products_need_classification_review
-- =====================================================

DROP VIEW IF EXISTS public.v_products_need_classification_review CASCADE;

CREATE VIEW public.v_products_need_classification_review
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.name,
  p.vendor_id,
  p.category_id,
  c.name as category_name,
  apc.ai_suggested_category_id,
  apc.confidence_score,
  apc.needs_review
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
LEFT JOIN public.ai_product_classifications apc ON p.id = apc.product_id
WHERE apc.needs_review = true
  AND apc.review_status = 'pending';

COMMENT ON VIEW public.v_products_need_classification_review IS 'المنتجات التي تحتاج مراجعة التصنيف - SECURITY INVOKER';

-- =====================================================
-- 4. View: v_products_with_variants
-- =====================================================

DROP VIEW IF EXISTS public.v_products_with_variants CASCADE;

CREATE VIEW public.v_products_with_variants
WITH (security_invoker = true)
AS
SELECT 
  p.*,
  json_agg(
    json_build_object(
      'id', pv.id,
      'name', pv.name,
      'sku', pv.sku,
      'price', pv.price,
      'stock', pv.stock,
      'is_active', pv.is_active
    )
  ) FILTER (WHERE pv.id IS NOT NULL) as variants
FROM public.products p
LEFT JOIN public.product_variants pv ON p.id = pv.product_id
GROUP BY p.id;

COMMENT ON VIEW public.v_products_with_variants IS 'المنتجات مع متغيراتها - SECURITY INVOKER';

-- =====================================================
-- 5. View: products_detailed
-- =====================================================

DROP VIEW IF EXISTS public.products_detailed CASCADE;

CREATE VIEW public.products_detailed
WITH (security_invoker = true)
AS
SELECT 
  p.*,
  c.name as category_name,
  c.name_ar as category_name_ar,
  v.shop_name as vendor_name,
  v.shop_name_ar as vendor_name_ar,
  v.rating as vendor_rating,
  COUNT(DISTINCT r.id) as reviews_count,
  COALESCE(AVG(r.rating), 0) as average_rating
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
LEFT JOIN public.vendors v ON p.vendor_id = v.id
LEFT JOIN public.reviews r ON p.id = r.product_id
GROUP BY p.id, c.name, c.name_ar, v.shop_name, v.shop_name_ar, v.rating;

COMMENT ON VIEW public.products_detailed IS 'تفاصيل المنتجات الكاملة - SECURITY INVOKER';

-- =====================================================
-- 6. View: nearby_restaurants
-- =====================================================

DROP VIEW IF EXISTS public.nearby_restaurants CASCADE;

CREATE VIEW public.nearby_restaurants
WITH (security_invoker = true)
AS
SELECT 
  v.id,
  v.shop_name,
  v.shop_name_ar,
  v.shop_logo,
  v.shop_description,
  v.latitude,
  v.longitude,
  v.rating,
  v.reviews_count,
  v.is_active,
  v.city,
  v.country
FROM public.vendors v
WHERE v.vendor_type = 'restaurant'
  AND v.is_active = true
  AND v.approval_status = 'approved'
  AND v.latitude IS NOT NULL
  AND v.longitude IS NOT NULL;

COMMENT ON VIEW public.nearby_restaurants IS 'المطاعم القريبة - SECURITY INVOKER';

-- =====================================================
-- 7. View: wallets_detailed
-- =====================================================

DROP VIEW IF EXISTS public.wallets_detailed CASCADE;

CREATE VIEW public.wallets_detailed
WITH (security_invoker = true)
AS
SELECT 
  w.*,
  u.name as user_name,
  u.email as user_email,
  COUNT(DISTINCT t.id) as total_transactions,
  COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0) as total_credits,
  COALESCE(SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END), 0) as total_debits
FROM public.wallets w
LEFT JOIN public.users u ON w.user_id = u.id
LEFT JOIN public.transactions t ON w.id = t.wallet_id
GROUP BY w.id, u.name, u.email;

COMMENT ON VIEW public.wallets_detailed IS 'تفاصيل المحافظ الكاملة - SECURITY INVOKER';

-- =====================================================
-- 8. View: daily_stats
-- =====================================================

DROP VIEW IF EXISTS public.daily_stats CASCADE;

CREATE VIEW public.daily_stats
WITH (security_invoker = true)
AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT CASE WHEN status = 'delivered' THEN id END) as delivered_orders,
  COUNT(DISTINCT CASE WHEN status = 'cancelled' THEN id END) as cancelled_orders,
  COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END), 0) as total_revenue,
  COUNT(DISTINCT customer_id) as unique_customers
FROM public.orders
GROUP BY DATE(created_at)
ORDER BY date DESC;

COMMENT ON VIEW public.daily_stats IS 'الإحصائيات اليومية - SECURITY INVOKER';

-- =====================================================
-- 9. التحقق من تطبيق التغييرات
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Security Definer Views Fixed:';
  RAISE NOTICE '✓ users_with_full_name';
  RAISE NOTICE '✓ loyalty_user_stats';
  RAISE NOTICE '✓ v_products_need_classification_review';
  RAISE NOTICE '✓ v_products_with_variants';
  RAISE NOTICE '✓ products_detailed';
  RAISE NOTICE '✓ nearby_restaurants';
  RAISE NOTICE '✓ wallets_detailed';
  RAISE NOTICE '✓ daily_stats';
  RAISE NOTICE 'All views converted to SECURITY INVOKER successfully!';
END $$;
