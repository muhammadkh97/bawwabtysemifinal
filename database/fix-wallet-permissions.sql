-- ============================================
-- إصلاح صلاحيات نظام المحفظة
-- ============================================

-- 1. حذف الـ function القديم
DROP FUNCTION IF EXISTS update_vendor_wallet() CASCADE;

-- 2. إعادة إنشاء الـ function مع SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_vendor_wallet()
RETURNS TRIGGER 
SECURITY DEFINER  -- ← مهم جداً! يسمح بتنفيذ الـ function بصلاحيات المالك
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_vendor_id UUID;
  v_order_total DECIMAL(10, 2);
  v_commission_rate DECIMAL(5, 2) := 10.00; -- 10% platform commission
  v_vendor_earning DECIMAL(10, 2);
BEGIN
  -- Get vendor_id and total from the order
  v_vendor_id := NEW.vendor_id;
  v_order_total := NEW.total;
  
  -- Calculate vendor earning (90% of order total)
  v_vendor_earning := v_order_total * (1 - v_commission_rate / 100);
  
  -- Update based on order status
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Order confirmed: Add to pending_balance
    UPDATE vendor_wallets
    SET 
      pending_balance = pending_balance + v_vendor_earning,
      updated_at = NOW()
    WHERE vendor_id = v_vendor_id;
    
    -- Create transaction record
    INSERT INTO wallet_transactions (vendor_id, type, amount, status, description, order_id)
    VALUES (v_vendor_id, 'earning', v_vendor_earning, 'pending', 'أرباح من الطلب #' || NEW.order_number, NEW.id);
    
  ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Order completed: Move from pending to current balance
    UPDATE vendor_wallets
    SET 
      pending_balance = pending_balance - v_vendor_earning,
      current_balance = current_balance + v_vendor_earning,
      total_earned = total_earned + v_vendor_earning,
      updated_at = NOW()
    WHERE vendor_id = v_vendor_id;
    
    -- Update transaction status
    UPDATE wallet_transactions
    SET status = 'completed', updated_at = NOW()
    WHERE order_id = NEW.id AND type = 'earning';
    
  ELSIF NEW.status IN ('cancelled', 'refunded') AND OLD.status NOT IN ('cancelled', 'refunded') THEN
    -- Order cancelled/refunded: Remove from pending_balance
    UPDATE vendor_wallets
    SET 
      pending_balance = GREATEST(0, pending_balance - v_vendor_earning),
      updated_at = NOW()
    WHERE vendor_id = v_vendor_id;
    
    -- Update transaction status
    UPDATE wallet_transactions
    SET status = 'cancelled', updated_at = NOW()
    WHERE order_id = NEW.id AND type = 'earning';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. إعادة إنشاء الـ trigger
DROP TRIGGER IF EXISTS trigger_update_vendor_wallet ON orders;
CREATE TRIGGER trigger_update_vendor_wallet
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_vendor_wallet();

-- 4. التحقق من أن الـ function تم إنشاؤها بصلاحيات SECURITY DEFINER
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  CASE p.prosecdef 
    WHEN true THEN 'SECURITY DEFINER ✅'
    ELSE 'SECURITY INVOKER ❌'
  END AS security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'update_vendor_wallet';

-- رسالة نجاح
SELECT '✅ تم إصلاح صلاحيات نظام المحفظة!' AS status,
       'الآن يمكن للبائعين تحديث حالة الطلبات' AS message;
