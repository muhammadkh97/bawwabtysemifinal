-- ============================================================================
-- إصلاح جميع triggers لتتجنب numeric overflow
-- ============================================================================

-- 1. إصلاح calculate_commission_on_delivery
DROP TRIGGER IF EXISTS trigger_calculate_commission ON orders;
DROP FUNCTION IF EXISTS calculate_commission_on_delivery();

CREATE OR REPLACE FUNCTION public.calculate_commission_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_commission_rate DECIMAL(5,4);
  v_commission_amount DECIMAL(10,2);
  v_vendor_user_id UUID;
BEGIN
  -- التحقق من تغيير الحالة إلى delivered فقط
  IF NEW.status = 'delivered' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'delivered') THEN
    
    -- الحصول على نسبة العمولة
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

-- 2. إصلاح update_vendor_wallet
DROP TRIGGER IF EXISTS trigger_update_vendor_wallet ON orders;
DROP FUNCTION IF EXISTS update_vendor_wallet();

CREATE OR REPLACE FUNCTION public.update_vendor_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_vendor_id UUID;
  v_order_total DECIMAL(10, 2);
  v_commission_rate DECIMAL(5, 2) := 10.00;
  v_vendor_earning DECIMAL(10, 2);
BEGIN
  -- فقط إذا تغيرت الحالة
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  v_vendor_id := NEW.vendor_id;
  v_order_total := COALESCE(NEW.total, 0);
  v_vendor_earning := v_order_total * (1 - v_commission_rate / 100);
  
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    UPDATE vendor_wallets
    SET 
      pending_balance = COALESCE(pending_balance, 0) + v_vendor_earning,
      updated_at = NOW()
    WHERE vendor_id = v_vendor_id;
    
    INSERT INTO wallet_transactions (vendor_id, type, amount, status, description, order_id)
    VALUES (v_vendor_id, 'earning', v_vendor_earning, 'pending', 'أرباح من الطلب #' || NEW.order_number, NEW.id);
    
  ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE vendor_wallets
    SET 
      pending_balance = GREATEST(0, COALESCE(pending_balance, 0) - v_vendor_earning),
      current_balance = COALESCE(current_balance, 0) + v_vendor_earning,
      total_earned = COALESCE(total_earned, 0) + v_vendor_earning,
      updated_at = NOW()
    WHERE vendor_id = v_vendor_id;
    
    UPDATE wallet_transactions
    SET status = 'completed', updated_at = NOW()
    WHERE order_id = NEW.id AND type = 'earning';
    
  ELSIF NEW.status IN ('cancelled', 'refunded') AND OLD.status NOT IN ('cancelled', 'refunded') THEN
    UPDATE vendor_wallets
    SET 
      pending_balance = GREATEST(0, COALESCE(pending_balance, 0) - v_vendor_earning),
      updated_at = NOW()
    WHERE vendor_id = v_vendor_id;
    
    UPDATE wallet_transactions
    SET status = 'cancelled', updated_at = NOW()
    WHERE order_id = NEW.id AND type = 'earning';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_vendor_wallet
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_vendor_wallet();

-- 3. إصلاح update_batch_totals
DROP TRIGGER IF EXISTS trigger_update_batch_totals ON orders;
DROP FUNCTION IF EXISTS update_batch_totals();

CREATE OR REPLACE FUNCTION public.update_batch_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- فقط إذا تغير batch_id أو total
        IF NEW.batch_id IS NOT NULL AND (
            TG_OP = 'INSERT' OR 
            OLD.batch_id IS DISTINCT FROM NEW.batch_id OR 
            OLD.total IS DISTINCT FROM NEW.total
        ) THEN
            UPDATE delivery_batches
            SET 
                total_orders = (SELECT COUNT(*) FROM orders WHERE batch_id = NEW.batch_id),
                total_amount = (SELECT COALESCE(SUM(total), 0) FROM orders WHERE batch_id = NEW.batch_id),
                updated_at = NOW()
            WHERE id = NEW.batch_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.batch_id IS NOT NULL THEN
            UPDATE delivery_batches
            SET 
                total_orders = (SELECT COUNT(*) FROM orders WHERE batch_id = OLD.batch_id),
                total_amount = (SELECT COALESCE(SUM(total), 0) FROM orders WHERE batch_id = OLD.batch_id),
                updated_at = NOW()
            WHERE id = OLD.batch_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_update_batch_totals
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_totals();

-- التحقق من النتيجة
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'orders'
  AND trigger_name IN ('trigger_calculate_commission', 'trigger_update_vendor_wallet', 'trigger_update_batch_totals')
ORDER BY trigger_name;
