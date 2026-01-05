-- ====================================
-- تقارير العمولات الصحيحة (استخدام commission_amount)
-- ====================================

-- ========== 1. إجمالي العمولات ==========

SELECT 
  COUNT(*) as total_commissions,
  SUM(CASE WHEN commission_amount IS NOT NULL THEN commission_amount ELSE 0 END) as total_amount,
  AVG(CASE WHEN commission_amount IS NOT NULL THEN commission_amount ELSE 0 END) as avg_commission,
  SUM(CASE WHEN order_amount IS NOT NULL THEN order_amount ELSE 0 END) as total_orders_amount
FROM commissions;

-- ========== 2. العمولات حسب الحالة ==========

SELECT 
  status,
  COUNT(*) as count,
  SUM(CASE WHEN commission_amount IS NOT NULL THEN commission_amount ELSE 0 END) as total_commission,
  SUM(CASE WHEN order_amount IS NOT NULL THEN order_amount ELSE 0 END) as total_orders_value,
  AVG(commission_rate) as avg_rate
FROM commissions
GROUP BY status
ORDER BY count DESC;

-- ========== 3. العمولات الشهرية ==========

SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as commissions_count,
  SUM(CASE WHEN commission_amount IS NOT NULL THEN commission_amount ELSE 0 END) as monthly_commissions,
  SUM(CASE WHEN order_amount IS NOT NULL THEN order_amount ELSE 0 END) as monthly_orders_value
FROM commissions
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC
LIMIT 12;

-- ========== 4. عمولات البائعين ==========

SELECT 
  c.vendor_id,
  s.name as store_name,
  s.name_ar as store_name_ar,
  COUNT(*) as total_commissions,
  SUM(CASE WHEN c.commission_amount IS NOT NULL THEN c.commission_amount ELSE 0 END) as total_commission_paid,
  SUM(CASE WHEN c.order_amount IS NOT NULL THEN c.order_amount ELSE 0 END) as total_orders_value,
  AVG(c.commission_rate) as avg_commission_rate
FROM commissions c
LEFT JOIN stores s ON c.vendor_id = s.id
GROUP BY c.vendor_id, s.name, s.name_ar
ORDER BY total_commission_paid DESC
LIMIT 10;

-- ========== 5. العمولات المعلقة (Pending) ==========

SELECT 
  c.id,
  c.order_id,
  o.order_number,
  c.vendor_id,
  s.name_ar as store_name,
  c.order_amount,
  c.commission_rate,
  c.commission_amount,
  c.status,
  c.created_at
FROM commissions c
LEFT JOIN orders o ON c.order_id = o.id
LEFT JOIN stores s ON c.vendor_id = s.id
WHERE c.status = 'pending'
ORDER BY c.created_at DESC
LIMIT 20;

-- ========== 6. العمولات المدفوعة (Paid) ==========

SELECT 
  c.id,
  c.order_id,
  c.vendor_id,
  s.name_ar as store_name,
  c.commission_amount,
  c.paid_at,
  c.created_at
FROM commissions c
LEFT JOIN stores s ON c.vendor_id = s.id
WHERE c.status = 'paid'
ORDER BY c.paid_at DESC
LIMIT 20;

-- ========== 7. التقرير المالي الشامل (صحيح) ==========

SELECT 
  'Financial Summary - CORRECTED' as report_name,
  json_build_object(
    'total_revenue', (
      SELECT COALESCE(SUM(total_amount), 0) 
      FROM orders 
      WHERE status = 'delivered' AND total_amount IS NOT NULL
    ),
    'delivered_orders', (
      SELECT COUNT(*) 
      FROM orders 
      WHERE status = 'delivered'
    ),
    'total_commissions', (
      SELECT COALESCE(SUM(commission_amount), 0) 
      FROM commissions 
      WHERE commission_amount IS NOT NULL
    ),
    'pending_commissions', (
      SELECT COALESCE(SUM(commission_amount), 0) 
      FROM commissions 
      WHERE status = 'pending' AND commission_amount IS NOT NULL
    ),
    'paid_commissions', (
      SELECT COALESCE(SUM(commission_amount), 0) 
      FROM commissions 
      WHERE status = 'paid' AND commission_amount IS NOT NULL
    ),
    'avg_order_value', (
      SELECT COALESCE(AVG(total_amount), 0) 
      FROM orders 
      WHERE status = 'delivered' AND total_amount IS NOT NULL
    ),
    'avg_commission_rate', (
      SELECT COALESCE(AVG(commission_rate), 0) 
      FROM commissions
    ),
    'commissions_records_count', (
      SELECT COUNT(*) 
      FROM commissions
    )
  ) as summary;

-- ========== 8. إحصائيات مفصلة ==========

SELECT 
  'Detailed Stats' as report_section,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'delivered') as delivered_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'picked_up') as picked_up_orders,
  (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered') as delivered_revenue,
  (SELECT COUNT(*) FROM commissions) as total_commissions_records,
  (SELECT COALESCE(SUM(commission_amount), 0) FROM commissions) as total_commissions_amount,
  (SELECT COUNT(*) FROM commissions WHERE status = 'pending') as pending_commissions_count,
  (SELECT COUNT(*) FROM commissions WHERE status = 'paid') as paid_commissions_count;

-- ========== 9. ملخص النتائج (صحيح) ==========

SELECT 
  'Reports Summary - FINAL' as section,
  json_build_object(
    'orders_table_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders'),
    'commissions_table_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commissions'),
    'total_orders', (SELECT COUNT(*) FROM orders),
    'delivered_orders', (SELECT COUNT(*) FROM orders WHERE status = 'delivered'),
    'total_revenue', (
      SELECT COALESCE(SUM(total_amount), 0) 
      FROM orders 
      WHERE status = 'delivered' AND total_amount IS NOT NULL
    ),
    'total_commissions_records', (SELECT COUNT(*) FROM commissions),
    'commissions_amount', (
      SELECT COALESCE(SUM(commission_amount), 0) 
      FROM commissions 
      WHERE commission_amount IS NOT NULL
    ),
    'pending_commissions_value', (
      SELECT COALESCE(SUM(commission_amount), 0) 
      FROM commissions 
      WHERE status = 'pending' AND commission_amount IS NOT NULL
    ),
    'paid_commissions_value', (
      SELECT COALESCE(SUM(commission_amount), 0) 
      FROM commissions 
      WHERE status = 'paid' AND commission_amount IS NOT NULL
    )
  ) as summary;
