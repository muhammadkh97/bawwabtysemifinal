-- =========================================================
-- 04-financial-system.sql
-- نظام العمليات المالية
-- =========================================================

-- =====================================================
-- 1. جدول المعاملات المالية
-- =====================================================

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vendor_id UUID,
  order_id UUID,
  
  type VARCHAR(50) NOT NULL, -- 'order_payment', 'refund', 'wallet_topup', 'payout'
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50), -- 'credit_card', 'wallet', 'bank_transfer'
  payment_status payment_status DEFAULT 'pending',
  
  description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL,
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL
);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_vendor_id ON public.transactions(vendor_id);
CREATE INDEX idx_transactions_status ON public.transactions(payment_status);

-- =====================================================
-- 2. جدول طلبات الدفع للتاجر
-- =====================================================

CREATE TABLE public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'rejected'
  bank_account_details TEXT,
  
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE
);

CREATE INDEX idx_payout_requests_vendor_id ON public.payout_requests(vendor_id);
CREATE INDEX idx_payout_requests_status ON public.payout_requests(status);

-- =====================================================
-- 3. جدول النزاعات
-- =====================================================

CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  
  reason VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'rejected'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution TEXT,
  
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE
);

CREATE INDEX idx_disputes_order_id ON public.disputes(order_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);

-- =====================================================
-- 4. جدول القسائم والكوبونات
-- =====================================================

CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  vendor_id UUID,
  
  discount_type VARCHAR(50) NOT NULL, -- 'percentage', 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL,
  max_discount DECIMAL(10, 2),
  min_order_amount DECIMAL(10, 2),
  
  usage_limit INT,
  usage_count INT DEFAULT 0,
  
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE
);

CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_vendor_id ON public.coupons(vendor_id);
CREATE INDEX idx_coupons_is_active ON public.coupons(is_active);

-- =====================================================
-- 5. Triggers
-- =====================================================

CREATE TRIGGER update_transactions_timestamp BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_payout_requests_timestamp BEFORE UPDATE ON public.payout_requests
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_disputes_timestamp BEFORE UPDATE ON public.disputes
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

SELECT 'تم إنشاء النظام المالي بنجاح ✓' AS status;
