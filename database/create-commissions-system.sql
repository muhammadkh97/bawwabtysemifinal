-- ====================================
-- إنشاء سجلات العمولات وتفعيل الحساب التلقائي
-- ====================================

-- ========== 1. إنشاء سجلات عمولات للطلبات المكتملة ==========

-- إضافة سجلات عمولات للطلبات المكتملة (delivered) الموجودة
INSERT INTO commissions (
  id,
  order_id,
  vendor_id,
  commission_rate,
  commission_amount,
  order_amount,
  status,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid() as id,
  o.id as order_id,
  s.user_id as vendor_id, -- استخدام user_id من جدول stores بدلاً من vendor_id
  0.10 as commission_rate, -- 10% عمولة افتراضية
  COALESCE(o.total_amount, 0) * 0.10 as commission_amount,
  COALESCE(o.total_amount, 0) as order_amount,
  'pending' as status, -- حالة معلقة بشكل افتراضي
  o.created_at,
  NOW() as updated_at
FROM orders o
INNER JOIN stores s ON o.vendor_id = s.id
WHERE o.status = 'delivered'
  AND s.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM commissions c WHERE c.order_id = o.id
  );

-- ========== 2. إنشاء Function لحساب العمولة تلقائياً ==========

CREATE OR REPLACE FUNCTION calculate_commission_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_rate DECIMAL(5,4);
  v_commission_amount DECIMAL(10,2);
  v_vendor_user_id UUID;
BEGIN
  -- التحقق من تغيير الحالة إلى delivered
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    
    -- الحصول على نسبة العمولة من جدول financial_settings (أو استخدام 10% كافتراضي)
    SELECT COALESCE(default_commission_rate, 0.10) 
    INTO v_commission_rate
    FROM financial_settings
    LIMIT 1;
    
    -- الحصول على user_id من جدول stores
    SELECT user_id 
    INTO v_vendor_user_id
    FROM stores
    WHERE id = NEW.vendor_id;
    
    -- التحقق من وجود vendor_user_id
    IF v_vendor_user_id IS NOT NULL THEN
      -- حساب مبلغ العمولة
      v_commission_amount := COALESCE(NEW.total_amount, 0) * v_commission_rate;
      
      -- إدخال سجل العمولة (إذا لم يكن موجوداً)
      INSERT INTO commissions (
        id,
        order_id,
        vendor_id,
        commission_rate,
        commission_amount,
        order_amount,
        status,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        NEW.id,
        v_vendor_user_id, -- استخدام user_id من stores
        v_commission_rate,
        v_commission_amount,
        COALESCE(NEW.total_amount, 0),
        'pending',
        NOW(),
        NOW()
      )
      ON CONFLICT (order_id) DO NOTHING;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========== 3. إنشاء Trigger على جدول orders ==========

-- حذف الـ trigger القديم إذا كان موجوداً
DROP TRIGGER IF EXISTS trigger_calculate_commission ON orders;

-- إنشاء trigger جديد
CREATE TRIGGER trigger_calculate_commission
  AFTER INSERT OR UPDATE OF status, total_amount
  ON orders
  FOR EACH ROW
  EXECUTE FUNCTION calculate_commission_on_delivery();

-- ========== 4. التحقق من النتائج ==========

-- 4.1 عرض العمولات المُنشأة
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
ORDER BY c.created_at DESC;

-- 4.2 إحصائيات العمولات بعد الإنشاء
SELECT 
  COUNT(*) as total_commissions,
  SUM(commission_amount) as total_commission_amount,
  SUM(order_amount) as total_orders_value,
  AVG(commission_rate) as avg_rate,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count
FROM commissions;

-- 4.3 مقارنة الطلبات المكتملة مع العمولات
SELECT 
  'Verification' as check_type,
  (SELECT COUNT(*) FROM orders WHERE status = 'delivered') as delivered_orders_count,
  (SELECT COUNT(*) FROM commissions) as commissions_records_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM orders WHERE status = 'delivered') = 
         (SELECT COUNT(*) FROM commissions) 
    THEN '✅ كل الطلبات المكتملة لها عمولات'
    ELSE '⚠️ بعض الطلبات ليس لها عمولات'
  END as verification_status;

-- ========== 5. اختبار الـ Trigger ==========

-- عرض معلومات الـ Trigger
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_calculate_commission';

-- ========== 6. ملخص النتائج ==========

SELECT 
  'Commissions System Setup Complete' as status,
  json_build_object(
    'commissions_created', (SELECT COUNT(*) FROM commissions),
    'total_commission_amount', (SELECT COALESCE(SUM(commission_amount), 0) FROM commissions),
    'pending_commissions', (SELECT COUNT(*) FROM commissions WHERE status = 'pending'),
    'trigger_exists', EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'trigger_calculate_commission'
    ),
    'delivered_orders_covered', (
      SELECT COUNT(*) FROM orders o 
      WHERE o.status = 'delivered' 
      AND EXISTS (SELECT 1 FROM commissions c WHERE c.order_id = o.id)
    )
  ) as summary;
