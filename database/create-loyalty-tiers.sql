-- ====================================
-- إنشاء جدول loyalty_tiers
-- ====================================

CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL,
  tier_name_ar TEXT NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0,
  max_points INTEGER,
  icon TEXT DEFAULT 'Gift',
  color TEXT DEFAULT 'from-gray-400 to-gray-600',
  bg_pattern TEXT DEFAULT 'bg-gradient-to-br from-gray-500/20 to-gray-300/20',
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  free_shipping_threshold NUMERIC(10,2) DEFAULT 0,
  priority_support BOOLEAN DEFAULT FALSE,
  exclusive_deals BOOLEAN DEFAULT FALSE,
  birthday_bonus INTEGER DEFAULT 0,
  tier_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إدراج المستويات الافتراضية
INSERT INTO loyalty_tiers (tier_name, tier_name_ar, min_points, max_points, icon, color, bg_pattern, discount_percentage, free_shipping_threshold, priority_support, exclusive_deals, birthday_bonus, tier_order, is_active)
VALUES
  ('Bronze', 'برونزي', 0, 999, 'Gift', 'from-orange-400 to-orange-600', 'bg-gradient-to-br from-orange-500/20 to-orange-300/20', 0, 0, false, false, 0, 1, true),
  ('Silver', 'فضي', 1000, 4999, 'Star', 'from-gray-400 to-gray-600', 'bg-gradient-to-br from-gray-500/20 to-gray-300/20', 5, 200, false, true, 50, 2, true),
  ('Gold', 'ذهبي', 5000, 9999, 'Award', 'from-yellow-400 to-yellow-600', 'bg-gradient-to-br from-yellow-500/20 to-yellow-300/20', 10, 150, true, true, 100, 3, true),
  ('Platinum', 'بلاتيني', 10000, NULL, 'Crown', 'from-purple-400 to-purple-600', 'bg-gradient-to-br from-purple-500/20 to-purple-300/20', 15, 100, true, true, 200, 4, true)
ON CONFLICT DO NOTHING;

-- إنشاء indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_points ON loyalty_tiers(min_points, max_points);
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_order ON loyalty_tiers(tier_order);
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_active ON loyalty_tiers(is_active);

-- التحقق
SELECT 
  tier_name_ar,
  min_points,
  max_points,
  discount_percentage,
  free_shipping_threshold,
  tier_order
FROM loyalty_tiers
ORDER BY tier_order;
