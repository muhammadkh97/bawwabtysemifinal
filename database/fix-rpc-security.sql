-- ====================================
-- إصلاح RPC Function - تجاوز RLS للمدير
-- ====================================

-- الحل: إضافة SECURITY DEFINER لتجاوز RLS
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
) 
SECURITY DEFINER  -- هذا يجعل الدالة تعمل بصلاحيات المالك (owner) وليس المستدعي
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- إجمالي المستخدمين (الكل)
    (SELECT COUNT(*) FROM users)::BIGINT,
    
    -- إجمالي الطلبات
    (SELECT COUNT(*) FROM orders)::BIGINT,
    
    -- إجمالي المبيعات
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
$$;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO anon;

-- ========== اختبار الدالة ==========
SELECT * FROM get_admin_dashboard_stats();
