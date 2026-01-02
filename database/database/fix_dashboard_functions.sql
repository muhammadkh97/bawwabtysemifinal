-- =========================================================
-- إصلاح دوال لوحات التحكم مع الأعمدة الصحيحة
-- Fix Dashboard Functions with Correct Column Names
-- =========================================================

-- 1. إصلاح get_admin_dashboard_stats
DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats();
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_orders BIGINT,
  total_revenue NUMERIC,
  active_vendors BIGINT,
  available_drivers BIGINT,
  featured_products BIGINT,
  pending_orders BIGINT,
  delivered_orders BIGINT,
  cancelled_orders BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.users)::BIGINT as total_users,
    (SELECT COUNT(*) FROM public.orders)::BIGINT as total_orders,
    (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE status = 'delivered')::NUMERIC as total_revenue,
    (SELECT COUNT(*) FROM public.vendors WHERE is_active = true AND approval_status = 'approved')::BIGINT as active_vendors,
    (SELECT COUNT(*) FROM public.drivers WHERE is_active = true AND approval_status = 'approved')::BIGINT as available_drivers,
    (SELECT COUNT(*) FROM public.products WHERE is_featured = true)::BIGINT as featured_products,
    (SELECT COUNT(*) FROM public.orders WHERE status = 'pending')::BIGINT as pending_orders,
    (SELECT COUNT(*) FROM public.orders WHERE status = 'delivered')::BIGINT as delivered_orders,
    (SELECT COUNT(*) FROM public.orders WHERE status = 'cancelled')::BIGINT as cancelled_orders;
END;
$$;

-- 2. إصلاح get_vendor_dashboard_stats
DROP FUNCTION IF EXISTS public.get_vendor_dashboard_stats(UUID);
CREATE OR REPLACE FUNCTION public.get_vendor_dashboard_stats(vendor_user_id UUID)
RETURNS TABLE (
  total_products BIGINT,
  total_orders BIGINT,
  total_revenue NUMERIC,
  pending_orders BIGINT,
  active_products BIGINT,
  wallet_balance NUMERIC,
  total_reviews BIGINT,
  average_rating NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_vendor_id UUID;
BEGIN
  SELECT id INTO v_vendor_id FROM public.vendors WHERE user_id = vendor_user_id LIMIT 1;
  IF v_vendor_id IS NULL THEN RAISE EXCEPTION 'Vendor not found for user %', vendor_user_id; END IF;
  
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.products WHERE vendor_id = v_vendor_id)::BIGINT as total_products,
    (SELECT COUNT(*) FROM public.orders WHERE vendor_id = v_vendor_id)::BIGINT as total_orders,
    (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE vendor_id = v_vendor_id AND status = 'delivered')::NUMERIC as total_revenue,
    (SELECT COUNT(*) FROM public.orders WHERE vendor_id = v_vendor_id AND status = 'pending')::BIGINT as pending_orders,
    (SELECT COUNT(*) FROM public.products WHERE vendor_id = v_vendor_id AND is_active = true)::BIGINT as active_products,
    (SELECT COALESCE(wallet_balance, 0) FROM public.vendors WHERE id = v_vendor_id)::NUMERIC as wallet_balance,
    (SELECT COUNT(*) FROM public.reviews r JOIN public.products p ON r.product_id = p.id WHERE p.vendor_id = v_vendor_id)::BIGINT as total_reviews,
    (SELECT COALESCE(AVG(r.rating), 0) FROM public.reviews r JOIN public.products p ON r.product_id = p.id WHERE p.vendor_id = v_vendor_id)::NUMERIC as average_rating;
END;
$$;

-- 3. إصلاح get_driver_dashboard_stats
DROP FUNCTION IF EXISTS public.get_driver_dashboard_stats(UUID);
CREATE OR REPLACE FUNCTION public.get_driver_dashboard_stats(driver_user_id UUID)
RETURNS TABLE (
  total_deliveries BIGINT,
  total_earnings NUMERIC,
  pending_deliveries BIGINT,
  completed_today BIGINT,
  average_rating NUMERIC,
  wallet_balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_driver_id UUID;
BEGIN
  SELECT id INTO v_driver_id FROM public.drivers WHERE user_id = driver_user_id LIMIT 1;
  IF v_driver_id IS NULL THEN RAISE EXCEPTION 'Driver not found for user %', driver_user_id; END IF;
  
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.orders WHERE driver_id = v_driver_id AND status = 'delivered')::BIGINT as total_deliveries,
    (SELECT COALESCE(SUM(delivery_fee), 0) FROM public.orders WHERE driver_id = v_driver_id AND status = 'delivered')::NUMERIC as total_earnings,
    (SELECT COUNT(*) FROM public.orders WHERE driver_id = v_driver_id AND status IN ('in_delivery', 'ready'))::BIGINT as pending_deliveries,
    (SELECT COUNT(*) FROM public.orders WHERE driver_id = v_driver_id AND status = 'delivered' AND DATE(delivered_at) = CURRENT_DATE)::BIGINT as completed_today,
    (SELECT COALESCE(rating, 0) FROM public.drivers WHERE id = v_driver_id)::NUMERIC as average_rating,
    (SELECT COALESCE(w.balance, 0) FROM public.wallets w WHERE w.user_id = driver_user_id)::NUMERIC as wallet_balance;
END;
$$;

-- 4. إصلاح get_restaurant_dashboard_stats
DROP FUNCTION IF EXISTS public.get_restaurant_dashboard_stats(UUID);
CREATE OR REPLACE FUNCTION public.get_restaurant_dashboard_stats(restaurant_user_id UUID)
RETURNS TABLE (
  total_orders BIGINT,
  total_revenue NUMERIC,
  pending_orders BIGINT,
  preparing_orders BIGINT,
  completed_today BIGINT,
  average_rating NUMERIC,
  total_menu_items BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  SELECT id INTO v_restaurant_id 
  FROM public.vendors 
  WHERE user_id = restaurant_user_id 
    AND vendor_type = 'restaurant' 
  LIMIT 1;
  
  IF v_restaurant_id IS NULL THEN RAISE EXCEPTION 'Restaurant not found for user %', restaurant_user_id; END IF;
  
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = v_restaurant_id)::BIGINT as total_orders,
    (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE restaurant_id = v_restaurant_id AND status = 'delivered')::NUMERIC as total_revenue,
    (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = v_restaurant_id AND status = 'pending')::BIGINT as pending_orders,
    (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = v_restaurant_id AND status = 'preparing')::BIGINT as preparing_orders,
    (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = v_restaurant_id AND status = 'delivered' AND DATE(delivered_at) = CURRENT_DATE)::BIGINT as completed_today,
    (SELECT COALESCE(rating, 0) FROM public.vendors WHERE id = v_restaurant_id)::NUMERIC as average_rating,
    (SELECT COUNT(*) FROM public.products WHERE vendor_id = v_restaurant_id)::BIGINT as total_menu_items;
END;
$$;

-- التحقق
DO $$
BEGIN
  RAISE NOTICE 'Dashboard functions fixed successfully!';
  RAISE NOTICE '✓ get_admin_dashboard_stats() - fixed to use "total" column';
  RAISE NOTICE '✓ get_vendor_dashboard_stats(UUID) - fixed to use "total" column';
  RAISE NOTICE '✓ get_driver_dashboard_stats(UUID) - fixed';
  RAISE NOTICE '✓ get_restaurant_dashboard_stats(UUID) - fixed to use "total" column';
END $$;
