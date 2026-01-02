-- ===============================================
-- ADMIN DASHBOARD MISSING COMPONENTS
-- ===============================================
-- Run this AFTER force_rebuild.sql to add all missing tables and columns
-- for admin dashboard functionality

-- ===============================================
-- 1. ORDER ITEMS TABLE (Line items for orders)
-- ===============================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    item_total DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER,
    product_name TEXT NOT NULL,
    product_name_ar TEXT,
    product_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ===============================================
-- 2. DISPUTES TABLE (Order dispute management)
-- ===============================================
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('refund', 'complaint', 'quality_issue', 'delivery_issue', 'other')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'rejected')),
    amount DECIMAL(10, 2),
    resolution TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_disputes_order_id ON disputes(order_id);
CREATE INDEX idx_disputes_user_id ON disputes(user_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- ===============================================
-- 3. SUPPORT TICKETS TABLE (Customer support)
-- ===============================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES users(id),
    category TEXT CHECK (category IN ('technical', 'payment', 'delivery', 'account', 'other')),
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);

-- ===============================================
-- 4. PAGES TABLE (CMS for static pages)
-- ===============================================
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    title_ar TEXT,
    content TEXT NOT NULL,
    content_ar TEXT,
    meta_description TEXT,
    meta_description_ar TEXT,
    is_published BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_is_published ON pages(is_published);

-- ===============================================
-- 5. LOYALTY SETTINGS TABLE (Loyalty program config)
-- ===============================================
CREATE TABLE IF NOT EXISTS loyalty_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    points_per_currency DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    referral_bonus INTEGER NOT NULL DEFAULT 100,
    min_redemption_points INTEGER NOT NULL DEFAULT 100,
    point_expiry_days INTEGER DEFAULT 365,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default loyalty settings
INSERT INTO loyalty_settings (points_per_currency, referral_bonus, min_redemption_points)
VALUES (1.00, 100, 100)
ON CONFLICT DO NOTHING;

-- ===============================================
-- 6. LOYALTY TRANSACTIONS TABLE (Points history)
-- ===============================================
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted', 'referral_bonus')),
    reference_type TEXT CHECK (reference_type IN ('order', 'referral', 'admin_adjustment', 'signup_bonus')),
    reference_id UUID,
    description TEXT,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX idx_loyalty_transactions_type ON loyalty_transactions(transaction_type);
CREATE INDEX idx_loyalty_transactions_created_at ON loyalty_transactions(created_at);

-- ===============================================
-- 7. REFERRALS TABLE (Referral tracking)
-- ===============================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    reward_points INTEGER NOT NULL DEFAULT 100,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_referral UNIQUE (referrer_id, referred_id)
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- ===============================================
-- 8. PAYOUTS TABLE (Vendor/driver payments)
-- ===============================================
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id),
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'paypal', 'stripe', 'cash')),
    bank_name TEXT,
    account_number TEXT,
    account_holder TEXT,
    transaction_id TEXT,
    notes TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_store_id ON payouts(store_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- ===============================================
-- 9. SHIPPING SETTINGS TABLE (Shipping config)
-- ===============================================
CREATE TABLE IF NOT EXISTS shipping_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_rate DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
    per_km_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.50,
    free_shipping_threshold DECIMAL(10, 2) DEFAULT 100.00,
    max_distance_km INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default shipping settings
INSERT INTO shipping_settings (base_rate, per_km_rate, free_shipping_threshold, max_distance_km)
VALUES (5.00, 0.50, 100.00, 50)
ON CONFLICT DO NOTHING;

-- ===============================================
-- 10. ADD MISSING COLUMNS TO EXISTING TABLES
-- ===============================================

-- Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_earned_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Create unique index on referral_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;

-- Add total_amount to orders table (if not exists)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);

-- Update total_amount from total column if needed
UPDATE orders SET total_amount = total WHERE total_amount IS NULL;

-- ===============================================
-- 11. FUNCTION: Generate Referral Code
-- ===============================================
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO exists;
        
        EXIT WHEN NOT exists;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Update existing users with referral codes
UPDATE users 
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- ===============================================
-- 12. FUNCTION: Admin Dashboard Statistics
-- ===============================================
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM users WHERE role = 'customer'),
        'total_vendors', (SELECT COUNT(*) FROM stores WHERE is_active = true),
        'total_drivers', (SELECT COUNT(*) FROM drivers WHERE is_active = true),
        'total_products', (SELECT COUNT(*) FROM products),
        'approved_products', (SELECT COUNT(*) FROM products WHERE approval_status = 'approved'),
        'pending_products', (SELECT COUNT(*) FROM products WHERE approval_status = 'pending'),
        'total_orders', (SELECT COUNT(*) FROM orders),
        'pending_orders', (SELECT COUNT(*) FROM orders WHERE status = 'pending'),
        'completed_orders', (SELECT COUNT(*) FROM orders WHERE status = 'delivered'),
        'open_disputes', (SELECT COUNT(*) FROM disputes WHERE status = 'open'),
        'open_tickets', (SELECT COUNT(*) FROM support_tickets WHERE status = 'open'),
        'pending_payouts', (SELECT COUNT(*) FROM payouts WHERE status = 'pending'),
        'total_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered'),
        'monthly_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered' AND created_at >= NOW() - INTERVAL '30 days'),
        'weekly_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered' AND created_at >= NOW() - INTERVAL '7 days')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================

-- Enable RLS on all new tables
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_settings ENABLE ROW LEVEL SECURITY;

-- Order Items Policies
CREATE POLICY "Admins can do everything with order_items" ON order_items FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);

CREATE POLICY "Vendors can view their order items" ON order_items FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM products p
        JOIN stores s ON p.store_id = s.id
        WHERE p.id = order_items.product_id AND s.user_id = auth.uid()
    )
);

-- Disputes Policies
CREATE POLICY "Admins can do everything with disputes" ON disputes FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Users can view and create their own disputes" ON disputes FOR SELECT TO authenticated USING (
    user_id = auth.uid()
);

CREATE POLICY "Users can create disputes" ON disputes FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
);

-- Support Tickets Policies
CREATE POLICY "Admins can do everything with support_tickets" ON support_tickets FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Users can view their own tickets" ON support_tickets FOR SELECT TO authenticated USING (
    user_id = auth.uid()
);

CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
);

-- Pages Policies (Public read, Admin write)
CREATE POLICY "Anyone can view published pages" ON pages FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can do everything with pages" ON pages FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Loyalty Settings Policies (Public read, Admin write)
CREATE POLICY "Anyone can view loyalty settings" ON loyalty_settings FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage loyalty settings" ON loyalty_settings FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Loyalty Transactions Policies
CREATE POLICY "Admins can do everything with loyalty_transactions" ON loyalty_transactions FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Users can view their own loyalty transactions" ON loyalty_transactions FOR SELECT TO authenticated USING (
    user_id = auth.uid()
);

-- Referrals Policies
CREATE POLICY "Admins can do everything with referrals" ON referrals FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Users can view their own referrals" ON referrals FOR SELECT TO authenticated USING (
    referrer_id = auth.uid() OR referred_id = auth.uid()
);

-- Payouts Policies
CREATE POLICY "Admins can do everything with payouts" ON payouts FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Vendors can view their own payouts" ON payouts FOR SELECT TO authenticated USING (
    user_id = auth.uid()
);

CREATE POLICY "Vendors can create payout requests" ON payouts FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
);

-- Shipping Settings Policies (Public read, Admin write)
CREATE POLICY "Anyone can view shipping settings" ON shipping_settings FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage shipping settings" ON shipping_settings FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- ===============================================
-- 14. TRIGGERS FOR UPDATED_AT
-- ===============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_settings_updated_at BEFORE UPDATE ON loyalty_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipping_settings_updated_at BEFORE UPDATE ON shipping_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- DONE! All admin dashboard components added.
-- ===============================================
