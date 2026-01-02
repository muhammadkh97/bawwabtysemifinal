-- =========================================================
-- 05-loyalty-marketing.sql
-- نظام الولاء والتسويق
-- =========================================================

-- =====================================================
-- 1. جدول نقاط الولاء
-- =====================================================

CREATE TABLE public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  vendor_id UUID,
  
  points_earned INT NOT NULL DEFAULT 0,
  points_used INT NOT NULL DEFAULT 0,
  points_balance INT NOT NULL DEFAULT 0,
  
  reason VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL
);

CREATE INDEX idx_loyalty_points_customer_id ON public.loyalty_points(customer_id);

-- =====================================================
-- 2. جدول العروضات
-- =====================================================

CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  
  discount_percentage INT,
  discount_amount DECIMAL(10, 2),
  
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  view_count INT DEFAULT 0,
  claim_count INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE
);

CREATE INDEX idx_deals_vendor_id ON public.deals(vendor_id);
CREATE INDEX idx_deals_is_active ON public.deals(is_active);

-- =====================================================
-- 3. جدول الحملات التسويقية
-- =====================================================

CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  
  campaign_name VARCHAR(255) NOT NULL,
  description TEXT,
  banner_url TEXT,
  
  campaign_type VARCHAR(50), -- 'seasonal', 'flash_sale', 'loyalty', 'new_user'
  
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  target_users_count INT,
  participants_count INT DEFAULT 0,
  
  budget DECIMAL(10, 2),
  spent DECIMAL(10, 2) DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_campaigns_admin_id ON public.campaigns(admin_id);
CREATE INDEX idx_campaigns_is_active ON public.campaigns(is_active);

-- =====================================================
-- 4. Triggers
-- =====================================================

CREATE TRIGGER update_loyalty_points_timestamp BEFORE UPDATE ON public.loyalty_points
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_deals_timestamp BEFORE UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_campaigns_timestamp BEFORE UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

SELECT 'تم إنشاء نظام الولاء والتسويق بنجاح ✓' AS status;
