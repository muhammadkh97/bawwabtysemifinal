-- ============================================================================
-- إصلاح مشكلة numeric overflow في trigger حساب الإجمالي
-- ============================================================================

-- حذف الـ trigger القديم
DROP TRIGGER IF EXISTS trigger_calculate_order_total ON orders;

-- حذف الدالة القديمة
DROP FUNCTION IF EXISTS calculate_order_total();

-- إنشاء دالة محسنة مع معالجة للقيم NULL
CREATE OR REPLACE FUNCTION public.calculate_order_total()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- فقط حساب الإجمالي إذا كانت القيم الأساسية موجودة
  -- وتجاهل التحديث إذا كان فقط للحالة
  IF NEW.subtotal IS NOT NULL THEN
    NEW.total_amount = NEW.subtotal + COALESCE(NEW.delivery_fee, 0) + COALESCE(NEW.tax, 0) - COALESCE(NEW.discount, 0);
    NEW.total = NEW.total_amount;
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
