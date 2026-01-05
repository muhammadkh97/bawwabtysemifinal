-- ====================================
-- إصلاح RPC Function للوحة تحكم المدير
-- ====================================

-- ========== 1. فحص الـ RPC الحالية ==========

-- محاولة تشغيل الدالة الحالية
SELECT * FROM get_admin_dashboard_stats();

-- ========== 2. حذف الدالة القديمة وإنشاء واحدة صحيحة ==========

DROP FUNCTION IF EXISTS get_admin_dashboard_stats();

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_orders BIGINT,
  total_revenue NUMERIC,
  avg_order_value NUMERIC,
  total_vendors BIGINT,
  total_restaurants BIGINT,
  total_drivers BIGINT,
  total_customers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- إجمالي المستخدمين (الكل)
    (SELECT COUNT(*) FROM users)::BIGINT as total_users,
    
    -- إجمالي الطلبات
    (SELECT COUNT(*) FROM orders)::BIGINT as total_orders,
    
    -- إجمالي المبيعات (الطلبات المكتملة فقط)
    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered')::NUMERIC as total_revenue,
    
    -- متوسط قيمة الطلب
    (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE status = 'delivered' AND total_amount IS NOT NULL)::NUMERIC as avg_order_value,
    
    -- عدد التجار
    (SELECT COUNT(*) FROM users WHERE role = 'vendor')::BIGINT as total_vendors,
    
    -- عدد المطاعم
    (SELECT COUNT(*) FROM users WHERE role = 'restaurant')::BIGINT as total_restaurants,
    
    -- عدد السائقين
    (SELECT COUNT(*) FROM users WHERE role = 'driver')::BIGINT as total_drivers,
    
    -- عدد العملاء
    (SELECT COUNT(*) FROM users WHERE role = 'customer')::BIGINT as total_customers;
END;
$$ LANGUAGE plpgsql;

-- ========== 3. اختبار الدالة الجديدة ==========

SELECT * FROM get_admin_dashboard_stats();

-- ========== 4. التحقق من النتائج ==========

SELECT 
  'Verification' as check_name,
  (SELECT COUNT(*) FROM users) as actual_total_users,
  (SELECT total_users FROM get_admin_dashboard_stats()) as rpc_total_users,
  CASE 
    WHEN (SELECT COUNT(*) FROM users) = (SELECT total_users FROM get_admin_dashboard_stats())
    THEN '✅ الأرقام متطابقة'
    ELSE '❌ يوجد اختلاف'
  END as verification;
