-- =========================================================
-- إنشاء دوال لوحات التحكم المفقودة
-- Create Missing Dashboard Functions
-- =========================================================
-- تاريخ: 2026-01-01
-- الهدف: ربط لوحات التحكم بقاعدة البيانات بشكل صحيح
-- =========================================================

-- =====================================================
-- 1. دالة إحصائيات لوحة تحكم Admin
-- =====================================================

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
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE status = 'delivered')::NUMERIC as total_revenue,
    (SELECT COUNT(*) FROM public.vendors WHERE is_active = true AND approval_status = 'approved')::BIGINT as active_vendors,
    (SELECT COUNT(*) FROM public.drivers WHERE is_active = true AND approval_status = 'approved')::BIGINT as available_drivers,
    (SELECT COUNT(*) FROM public.products WHERE is_featured = true)::BIGINT as featured_products,
    (SELECT COUNT(*) FROM public.orders WHERE status = 'pending')::BIGINT as pending_orders,
    (SELECT COUNT(*) FROM public.orders WHERE status = 'delivered')::BIGINT as delivered_orders,
    (SELECT COUNT(*) FROM public.orders WHERE status = 'cancelled')::BIGINT as cancelled_orders;
END;
$$;

COMMENT ON FUNCTION public.get_admin_dashboard_stats() IS 'إحصائيات لوحة تحكم المدير';

-- =====================================================
-- 2. دالة إحصائيات لوحة تحكم Vendor
-- =====================================================

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
  -- الحصول على vendor_id من user_id
  SELECT id INTO v_vendor_id FROM public.vendors WHERE user_id = vendor_user_id LIMIT 1;
  
  IF v_vendor_id IS NULL THEN
    RAISE EXCEPTION 'Vendor not found for user %', vendor_user_id;
  END IF;
  
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.products WHERE vendor_id = v_vendor_id)::BIGINT as total_products,
    (SELECT COUNT(*) FROM public.orders WHERE vendor_id = v_vendor_id)::BIGINT as total_orders,
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE vendor_id = v_vendor_id AND status = 'delivered')::NUMERIC as total_revenue,
    (SELECT COUNT(*) FROM public.orders WHERE vendor_id = v_vendor_id AND status = 'pending')::BIGINT as pending_orders,
    (SELECT COUNT(*) FROM public.products WHERE vendor_id = v_vendor_id AND is_active = true)::BIGINT as active_products,
    (SELECT COALESCE(wallet_balance, 0) FROM public.vendors WHERE id = v_vendor_id)::NUMERIC as wallet_balance,
    (SELECT COUNT(*) FROM public.reviews r JOIN public.products p ON r.product_id = p.id WHERE p.vendor_id = v_vendor_id)::BIGINT as total_reviews,
    (SELECT COALESCE(AVG(r.rating), 0) FROM public.reviews r JOIN public.products p ON r.product_id = p.id WHERE p.vendor_id = v_vendor_id)::NUMERIC as average_rating;
END;
$$;

COMMENT ON FUNCTION public.get_vendor_dashboard_stats(UUID) IS 'إحصائيات لوحة تحكم البائع';

-- =====================================================
-- 3. دالة إحصائيات لوحة تحكم Driver
-- =====================================================

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
  -- الحصول على driver_id من user_id
  SELECT id INTO v_driver_id FROM public.drivers WHERE user_id = driver_user_id LIMIT 1;
  
  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'Driver not found for user %', driver_user_id;
  END IF;
  
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

COMMENT ON FUNCTION public.get_driver_dashboard_stats(UUID) IS 'إحصائيات لوحة تحكم السائق';

-- =====================================================
-- 4. دالة إحصائيات لوحة تحكم Restaurant
-- =====================================================

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
  -- الحصول على restaurant_id من user_id (من جدول vendors حيث vendor_type = 'restaurant')
  SELECT id INTO v_restaurant_id 
  FROM public.vendors 
  WHERE user_id = restaurant_user_id 
    AND vendor_type = 'restaurant' 
  LIMIT 1;
  
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Restaurant not found for user %', restaurant_user_id;
  END IF;
  
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = v_restaurant_id)::BIGINT as total_orders,
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE restaurant_id = v_restaurant_id AND status = 'delivered')::NUMERIC as total_revenue,
    (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = v_restaurant_id AND status = 'pending')::BIGINT as pending_orders,
    (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = v_restaurant_id AND status = 'preparing')::BIGINT as preparing_orders,
    (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = v_restaurant_id AND status = 'delivered' AND DATE(delivered_at) = CURRENT_DATE)::BIGINT as completed_today,
    (SELECT COALESCE(rating, 0) FROM public.vendors WHERE id = v_restaurant_id)::NUMERIC as average_rating,
    (SELECT COUNT(*) FROM public.products WHERE vendor_id = v_restaurant_id)::BIGINT as total_menu_items;
END;
$$;

COMMENT ON FUNCTION public.get_restaurant_dashboard_stats(UUID) IS 'إحصائيات لوحة تحكم المطعم';

-- =====================================================
-- 5. دالة تحديث موقع السائق
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_driver_location(
  driver_user_id UUID,
  new_latitude NUMERIC,
  new_longitude NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_driver_id UUID;
BEGIN
  -- الحصول على driver_id
  SELECT id INTO v_driver_id FROM public.drivers WHERE user_id = driver_user_id LIMIT 1;
  
  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'Driver not found for user %', driver_user_id;
  END IF;
  
  -- تحديث الموقع
  UPDATE public.drivers
  SET 
    current_latitude = new_latitude,
    current_longitude = new_longitude,
    last_location_update = NOW()
  WHERE id = v_driver_id;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.update_driver_location(UUID, NUMERIC, NUMERIC) IS 'تحديث موقع السائق الحالي';

-- =====================================================
-- 6. دالة تحديث مرحلة الرحلة
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_trip_stage(
  order_uuid UUID,
  new_stage TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- التحقق من أن المرحلة صحيحة
  IF new_stage NOT IN ('pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid trip stage: %', new_stage;
  END IF;
  
  -- تحديث حالة الطلب
  UPDATE public.orders
  SET 
    status = CASE 
      WHEN new_stage = 'accepted' THEN 'confirmed'
      WHEN new_stage = 'picked_up' THEN 'ready'
      WHEN new_stage = 'in_transit' THEN 'in_delivery'
      WHEN new_stage = 'delivered' THEN 'delivered'
      WHEN new_stage = 'cancelled' THEN 'cancelled'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = order_uuid;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.update_trip_stage(UUID, TEXT) IS 'تحديث مرحلة رحلة التوصيل';

-- =====================================================
-- 7. التحقق من إنشاء الدوال
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Dashboard Functions Created Successfully!';
  RAISE NOTICE '✓ get_admin_dashboard_stats()';
  RAISE NOTICE '✓ get_vendor_dashboard_stats(UUID)';
  RAISE NOTICE '✓ get_driver_dashboard_stats(UUID)';
  RAISE NOTICE '✓ get_restaurant_dashboard_stats(UUID)';
  RAISE NOTICE '✓ update_driver_location(UUID, NUMERIC, NUMERIC)';
  RAISE NOTICE '✓ update_trip_stage(UUID, TEXT)';
  RAISE NOTICE 'All dashboard functions are now connected to the database!';
END $$;
