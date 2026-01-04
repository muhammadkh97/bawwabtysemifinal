-- ============================================================
-- WALLET SYSTEM - Complete Implementation
-- ============================================================
-- This script creates:
-- 1. wallet_transactions table for tracking all transactions
-- 2. payout_requests table for withdrawal requests
-- 3. Trigger to auto-update vendor_wallets from orders
-- ============================================================

-- 1. Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('earning', 'withdrawal', 'refund', 'adjustment')),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  payout_request_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for wallet_transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_vendor ON wallet_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_order ON wallet_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON wallet_transactions(created_at DESC);

-- RLS for wallet_transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own transactions"
ON wallet_transactions FOR SELECT
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM stores WHERE user_id = auth.uid()
  )
);

-- 2. Create payout_requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  bank_name VARCHAR(255),
  account_number VARCHAR(255),
  account_holder VARCHAR(255),
  iban VARCHAR(255),
  notes TEXT,
  admin_notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id)
);

-- Indexes for payout_requests
CREATE INDEX IF NOT EXISTS idx_payout_requests_vendor ON payout_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);

-- RLS for payout_requests
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own payout requests"
ON payout_requests FOR SELECT
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM stores WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can insert own payout requests"
ON payout_requests FOR INSERT
TO authenticated
WITH CHECK (
  vendor_id IN (
    SELECT id FROM stores WHERE user_id = auth.uid()
  )
);

-- 3. Function to update vendor wallet from orders
CREATE OR REPLACE FUNCTION update_vendor_wallet()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- 4. Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_update_vendor_wallet ON orders;
CREATE TRIGGER trigger_update_vendor_wallet
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_vendor_wallet();

-- 5. Initialize existing vendor wallets with current order data
-- This will populate pending_balance with confirmed orders and current_balance with completed orders
DO $$
DECLARE
  v_store RECORD;
  v_confirmed_total DECIMAL(10, 2);
  v_completed_total DECIMAL(10, 2);
  v_commission_rate DECIMAL(5, 2) := 10.00;
BEGIN
  FOR v_store IN SELECT id FROM stores LOOP
    -- Calculate confirmed orders (pending balance)
    SELECT COALESCE(SUM(total * (1 - v_commission_rate / 100)), 0)
    INTO v_confirmed_total
    FROM orders
    WHERE vendor_id = v_store.id 
      AND status IN ('confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'in_transit');
    
    -- Calculate completed orders (current balance)
    SELECT COALESCE(SUM(total * (1 - v_commission_rate / 100)), 0)
    INTO v_completed_total
    FROM orders
    WHERE vendor_id = v_store.id AND status = 'completed';
    
    -- Insert or update vendor_wallets
    INSERT INTO vendor_wallets (vendor_id, pending_balance, current_balance, total_earned)
    VALUES (v_store.id, v_confirmed_total, v_completed_total, v_completed_total)
    ON CONFLICT (vendor_id)
    DO UPDATE SET
      pending_balance = v_confirmed_total,
      current_balance = v_completed_total,
      total_earned = GREATEST(vendor_wallets.total_earned, v_completed_total),
      updated_at = NOW();
  END LOOP;
END $$;

-- 6. Show results
SELECT 
  s.name AS store_name,
  vw.pending_balance,
  vw.current_balance,
  vw.total_earned,
  vw.updated_at
FROM vendor_wallets vw
JOIN stores s ON s.id = vw.vendor_id
ORDER BY vw.updated_at DESC;

-- Success message
SELECT '✅ Wallet system created successfully!' AS status,
       'Tables: wallet_transactions, payout_requests' AS created,
       'Trigger: update_vendor_wallet on orders' AS trigger,
       'Vendor wallets initialized from existing orders' AS initialization;
