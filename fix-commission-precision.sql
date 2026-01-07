-- ============================================================================
-- إصلاح calculate_commission_on_delivery - تصحيح precision
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_calculate_commission ON orders;
DROP FUNCTION IF EXISTS calculate_commission_on_delivery();

CREATE OR REPLACE FUNCTION public.calculate_commission_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_commission_rate DECIMAL(10,4);  -- تم التصحيح: كان 5,4 الآن 10,4
  v_commission_amount DECIMAL(10,2);
  v_vendor_user_id UUID;
BEGIN
  -- التحقق من تغيير الحالة إلى delivered فقط
  IF NEW.status = 'delivered' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'delivered') THEN
    
    -- الحصول على نسبة العمولة (أو استخدام 10% كافتراضي)
    SELECT COALESCE(default_commission_rate, 0.10) 
    INTO v_commission_rate
    FROM financial_settings
    LIMIT 1;
    
    -- الحصول على user_id من جدول stores
    SELECT user_id 
    INTO v_vendor_user_id
    FROM stores
    WHERE id = NEW.vendor_id;
    
    IF v_vendor_user_id IS NOT NULL AND NEW.total_amount IS NOT NULL THEN
      v_commission_amount := NEW.total_amount * v_commission_rate;
      
      -- إدخال سجل العمولة
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
        v_vendor_user_id,
        v_commission_rate,
        v_commission_amount,
        NEW.total_amount,
        'pending',
        NOW(),
        NOW()
      )
      ON CONFLICT (order_id) DO NOTHING;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_calculate_commission
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered')
  EXECUTE FUNCTION calculate_commission_on_delivery();

-- إعادة تفعيل trigger_calculate_order_total
ALTER TABLE orders ENABLE TRIGGER trigger_calculate_order_total;

-- اختبار التحديث
SELECT update_driver_order_status_simple(
  'a5b017a7-4308-433d-bfe5-8eb5935ab6eb',
  'delivered'
);

-- التحقق من النتيجة
SELECT 
  id, 
  order_number, 
  status, 
  delivered_at
FROM orders
WHERE id = 'a5b017a7-4308-433d-bfe5-8eb5935ab6eb';
