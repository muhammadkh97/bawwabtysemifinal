-- ============================================
-- إصلاح function sync_location_geography لجدول orders
-- ============================================

-- إنشاء function جديدة خاصة بجدول orders
CREATE OR REPLACE FUNCTION sync_orders_location_geography()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.delivery_lat IS NOT NULL AND NEW.delivery_lng IS NOT NULL THEN
    NEW.delivery_location = ST_SetSRID(ST_MakePoint(NEW.delivery_lng, NEW.delivery_lat), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- حذف الـ trigger القديم
DROP TRIGGER IF EXISTS sync_orders_location ON orders;

-- إنشاء trigger جديد يستخدم الـ function الصحيحة
CREATE TRIGGER sync_orders_location
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_orders_location_geography();

-- التحقق من النتيجة
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders'
  AND trigger_name = 'sync_orders_location';
