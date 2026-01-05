-- ====================================
-- إصلاح RPC Function - تحويل NUMERIC لـ FLOAT
-- ====================================

DROP FUNCTION IF EXISTS get_admin_dashboard_stats();

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_orders BIGINT,
  total_revenue DOUBLE PRECISION,
  avg_order_value DOUBLE PRECISION,
  total_vendors BIGINT,
  total_restaurants BIGINT,
  total_drivers BIGINT,
  total_customers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- إجمالي المستخدمين (الكل)
    (SELECT COUNT(*) FROM users)::BIGINT,
    
    -- إجمالي الطلبات
    (SELECT COUNT(*) FROM orders)::BIGINT,
    
    -- إجمالي المبيعات (تحويل لـ DOUBLE PRECISION بدلاً من NUMERIC)
    (SELECT COALESCE(SUM(total_amount::DOUBLE PRECISION), 0) FROM orders WHERE status = 'delivered')::DOUBLE PRECISION,
    
    -- متوسط قيمة الطلب
    (SELECT COALESCE(AVG(total_amount::DOUBLE PRECISION), 0) FROM orders WHERE status = 'delivered' AND total_amount IS NOT NULL)::DOUBLE PRECISION,
    
    -- عدد التجار
    (SELECT COUNT(*) FROM users WHERE role = 'vendor')::BIGINT,
    
    -- عدد المطاعم
    (SELECT COUNT(*) FROM users WHERE role = 'restaurant')::BIGINT,
    
    -- عدد السائقين
    (SELECT COUNT(*) FROM users WHERE role = 'driver')::BIGINT,
    
    -- عدد العملاء
    (SELECT COUNT(*) FROM users WHERE role = 'customer')::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- ========== اختبار الدالة ==========

SELECT * FROM get_admin_dashboard_stats();

-- ========== التحقق من النوع ==========

SELECT 
  'Type Check' as check_name,
  pg_typeof(total_revenue) as revenue_type,
  total_revenue
FROM get_admin_dashboard_stats();
