-- =========================================================
-- 11-dashboards-views.sql
-- عرض البيانات والإحصائيات للـ Dashboards
-- =========================================================

-- =====================================================
-- 1. Admin Dashboard Statistics
-- =====================================================

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_vendors BIGINT,
  total_restaurants BIGINT,
  total_drivers BIGINT,
  total_customers BIGINT,
  total_orders BIGINT,
  total_revenue DECIMAL,
  avg_order_value DECIMAL,
  pending_approvals BIGINT,
  total_transactions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.users),
    (SELECT COUNT(*) FROM public.vendors),
    (SELECT COUNT(*) FROM public.restaurants),
    (SELECT COUNT(*) FROM public.drivers),
    (SELECT COUNT(*) FROM public.users WHERE user_role = 'customer'),
    (SELECT COUNT(*) FROM public.orders),
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE status = 'delivered'),
    (SELECT COALESCE(AVG(total_amount), 0) FROM public.orders),
    (SELECT COUNT(*) FROM public.vendors WHERE is_active = false UNION ALL SELECT COUNT(*) FROM public.restaurants WHERE is_active = false),
    (SELECT COUNT(*) FROM public.transactions);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. Restaurant Dashboard Statistics
-- =====================================================

CREATE OR REPLACE FUNCTION get_restaurant_dashboard_stats(p_restaurant_id UUID)
RETURNS TABLE (
  total_orders BIGINT,
  today_orders BIGINT,
  pending_orders BIGINT,
  total_revenue DECIMAL,
  today_revenue DECIMAL,
  avg_rating DECIMAL,
  total_menu_items BIGINT,
  available_items BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = p_restaurant_id),
    (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = p_restaurant_id AND DATE(created_at) = CURRENT_DATE),
    (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = p_restaurant_id AND status IN ('pending', 'confirmed', 'preparing')),
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE restaurant_id = p_restaurant_id AND status = 'delivered'),
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE restaurant_id = p_restaurant_id AND status = 'delivered' AND DATE(created_at) = CURRENT_DATE),
    (SELECT COALESCE(AVG(rating), 0) FROM public.reviews JOIN public.orders o ON reviews.order_id = o.id WHERE o.restaurant_id = p_restaurant_id),
    (SELECT COUNT(*) FROM public.menu_items WHERE restaurant_id = p_restaurant_id),
    (SELECT COUNT(*) FROM public.menu_items WHERE restaurant_id = p_restaurant_id AND is_available = true);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. Vendor Dashboard Statistics
-- =====================================================

CREATE OR REPLACE FUNCTION get_vendor_dashboard_stats(p_vendor_id UUID)
RETURNS TABLE (
  total_orders BIGINT,
  today_orders BIGINT,
  pending_orders BIGINT,
  total_revenue DECIMAL,
  today_revenue DECIMAL,
  avg_rating DECIMAL,
  total_products BIGINT,
  active_products BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.orders WHERE vendor_id = p_vendor_id),
    (SELECT COUNT(*) FROM public.orders WHERE vendor_id = p_vendor_id AND DATE(created_at) = CURRENT_DATE),
    (SELECT COUNT(*) FROM public.orders WHERE vendor_id = p_vendor_id AND status IN ('pending', 'confirmed', 'preparing')),
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE vendor_id = p_vendor_id AND status = 'delivered'),
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE vendor_id = p_vendor_id AND status = 'delivered' AND DATE(created_at) = CURRENT_DATE),
    (SELECT COALESCE(AVG(rating), 0) FROM public.reviews JOIN public.products p ON reviews.product_id = p.id WHERE p.vendor_id = p_vendor_id),
    (SELECT COUNT(*) FROM public.products WHERE vendor_id = p_vendor_id),
    (SELECT COUNT(*) FROM public.products WHERE vendor_id = p_vendor_id AND is_active = true);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. Driver Dashboard Statistics
-- =====================================================

CREATE OR REPLACE FUNCTION get_driver_dashboard_stats(p_driver_id UUID)
RETURNS TABLE (
  total_deliveries BIGINT,
  today_deliveries BIGINT,
  pending_deliveries BIGINT,
  total_earnings DECIMAL,
  today_earnings DECIMAL,
  avg_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.orders WHERE driver_id = p_driver_id),
    (SELECT COUNT(*) FROM public.orders WHERE driver_id = p_driver_id AND DATE(created_at) = CURRENT_DATE),
    (SELECT COUNT(*) FROM public.orders WHERE driver_id = p_driver_id AND status IN ('in_delivery')),
    (SELECT COALESCE(SUM(total_amount * 0.1), 0) FROM public.orders WHERE driver_id = p_driver_id AND status = 'delivered'),
    (SELECT COALESCE(SUM(total_amount * 0.1), 0) FROM public.orders WHERE driver_id = p_driver_id AND status = 'delivered' AND DATE(created_at) = CURRENT_DATE),
    (SELECT COALESCE(AVG(rating), 0) FROM public.drivers WHERE id = p_driver_id);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. Customer Dashboard Statistics
-- =====================================================

CREATE OR REPLACE FUNCTION get_customer_dashboard_stats(p_customer_id UUID)
RETURNS TABLE (
  total_orders BIGINT,
  total_spent DECIMAL,
  loyalty_points INT,
  favorite_restaurant UUID,
  favorite_vendor UUID,
  pending_orders BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.orders WHERE customer_id = p_customer_id),
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE customer_id = p_customer_id AND status = 'delivered'),
    (SELECT COALESCE(points_balance, 0) FROM public.loyalty_points WHERE customer_id = p_customer_id LIMIT 1),
    (SELECT restaurant_id FROM public.orders WHERE customer_id = p_customer_id GROUP BY restaurant_id ORDER BY COUNT(*) DESC LIMIT 1),
    (SELECT vendor_id FROM public.orders WHERE customer_id = p_customer_id GROUP BY vendor_id ORDER BY COUNT(*) DESC LIMIT 1),
    (SELECT COUNT(*) FROM public.orders WHERE customer_id = p_customer_id AND status IN ('pending', 'confirmed', 'preparing', 'ready', 'in_delivery'));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. Top Restaurants View
-- =====================================================

CREATE OR REPLACE FUNCTION get_top_restaurants(p_limit INT DEFAULT 10)
RETURNS TABLE (
  restaurant_id UUID,
  restaurant_name VARCHAR,
  cuisine_type VARCHAR,
  average_rating DECIMAL,
  total_orders BIGINT,
  city VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.restaurant_name,
    r.cuisine_type,
    r.average_rating,
    r.total_orders,
    r.city
  FROM public.restaurants r
  WHERE r.is_active = true
  ORDER BY r.average_rating DESC, r.total_orders DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. Top Menu Items View
-- =====================================================

CREATE OR REPLACE FUNCTION get_top_menu_items(p_restaurant_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (
  item_id UUID,
  item_name VARCHAR,
  price DECIMAL,
  rating DECIMAL,
  order_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.price,
    m.rating,
    m.order_count
  FROM public.menu_items m
  WHERE m.restaurant_id = p_restaurant_id AND m.is_available = true
  ORDER BY m.order_count DESC, m.rating DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

SELECT 'تم إعداد عرض الإحصائيات والـ Dashboard بنجاح ✓' AS status;
