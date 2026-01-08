-- ============================================================================
-- إصلاح trigger حساب الإجمالي ليتجنب الحسابات عند تحديث الحالة فقط
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_calculate_order_total ON orders;
DROP FUNCTION IF EXISTS calculate_order_total();

-- إنشاء دالة محسنة تتحقق من نوع التحديث
CREATE OR REPLACE FUNCTION public.calculate_order_total()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- في حالة INSERT: دائماً احسب الإجمالي
  IF TG_OP = 'INSERT' THEN
    IF NEW.subtotal IS NOT NULL THEN
      NEW.total_amount = NEW.subtotal + COALESCE(NEW.delivery_fee, 0) + COALESCE(NEW.tax, 0) - COALESCE(NEW.discount, 0);
      NEW.total = NEW.total_amount;
    END IF;
    RETURN NEW;
  END IF;

  -- في حالة UPDATE: فقط احسب إذا تغيرت القيم المالية
  IF TG_OP = 'UPDATE' THEN
    -- تحقق إذا تغيرت أي من القيم المالية
    IF (OLD.subtotal IS DISTINCT FROM NEW.subtotal) OR
       (OLD.delivery_fee IS DISTINCT FROM NEW.delivery_fee) OR
       (OLD.tax IS DISTINCT FROM NEW.tax) OR
       (OLD.discount IS DISTINCT FROM NEW.discount) THEN
      -- أعد الحساب فقط إذا تغيرت القيم المالية
      IF NEW.subtotal IS NOT NULL THEN
        NEW.total_amount = NEW.subtotal + COALESCE(NEW.delivery_fee, 0) + COALESCE(NEW.tax, 0) - COALESCE(NEW.discount, 0);
        NEW.total = NEW.total_amount;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- إعادة إنشاء الـ trigger
CREATE TRIGGER trigger_calculate_order_total
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_total();

-- التحقق من الـ trigger
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders'
  AND trigger_name = 'trigger_calculate_order_total';
