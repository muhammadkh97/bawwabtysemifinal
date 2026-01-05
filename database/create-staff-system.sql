-- ====================================
-- نظام الحسابات المساعدة للبائعين والمطاعم
-- ====================================

-- 1. جدول الحسابات المساعدة للبائعين (Vendor Staff)
CREATE TABLE IF NOT EXISTS vendor_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'removed')),
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, user_id)
);

-- 2. جدول الحسابات المساعدة للمطاعم (Restaurant Staff)
CREATE TABLE IF NOT EXISTS restaurant_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'removed')),
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, user_id)
);

-- 3. جدول الدعوات (Staff Invitations)
CREATE TABLE IF NOT EXISTS staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_code TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN ('vendor', 'restaurant')),
  business_id UUID NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id),
  permissions JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة الفهارس
CREATE INDEX IF NOT EXISTS idx_vendor_staff_vendor_id ON vendor_staff(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_staff_user_id ON vendor_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_staff_status ON vendor_staff(status);

CREATE INDEX IF NOT EXISTS idx_restaurant_staff_restaurant_id ON restaurant_staff(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_user_id ON restaurant_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_status ON restaurant_staff(status);

CREATE INDEX IF NOT EXISTS idx_staff_invitations_email ON staff_invitations(email);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_code ON staff_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_status ON staff_invitations(status);

-- تفعيل RLS
ALTER TABLE vendor_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للبائعين
CREATE POLICY "Vendors can view their staff"
  ON vendor_staff FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = vendor_staff.vendor_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can manage their staff"
  ON vendor_staff FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = vendor_staff.vendor_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view their own record"
  ON vendor_staff FOR SELECT
  USING (user_id = auth.uid());

-- سياسات RLS للمطاعم
CREATE POLICY "Restaurants can view their staff"
  ON restaurant_staff FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = restaurant_staff.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurants can manage their staff"
  ON restaurant_staff FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = restaurant_staff.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view their own record"
  ON restaurant_staff FOR SELECT
  USING (user_id = auth.uid());

-- سياسات RLS للدعوات
CREATE POLICY "Business owners can view their invitations"
  ON staff_invitations FOR SELECT
  USING (invited_by = auth.uid());

CREATE POLICY "Business owners can manage their invitations"
  ON staff_invitations FOR ALL
  USING (invited_by = auth.uid());

CREATE POLICY "Users can view invitations sent to their email"
  ON staff_invitations FOR SELECT
  USING (
    email IN (
      SELECT email FROM users WHERE id = auth.uid()
    )
  );

-- منح الصلاحيات
GRANT SELECT, INSERT, UPDATE, DELETE ON vendor_staff TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON restaurant_staff TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_invitations TO authenticated;

-- دالة لتوليد كود دعوة عشوائي
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- دالة لإنشاء دعوة مساعد
CREATE OR REPLACE FUNCTION create_staff_invitation(
  p_email TEXT,
  p_business_type TEXT,
  p_business_id UUID,
  p_invited_by UUID,
  p_permissions JSONB,
  p_expires_in_days INTEGER DEFAULT 7
)
RETURNS JSONB AS $$
DECLARE
  v_invitation_code TEXT;
  v_invitation_id UUID;
  v_user_id UUID;
BEGIN
  -- توليد كود الدعوة
  v_invitation_code := generate_invitation_code();
  
  -- التحقق من وجود المستخدم
  SELECT id INTO v_user_id FROM users WHERE email = p_email;
  
  -- إنشاء الدعوة
  INSERT INTO staff_invitations (
    invitation_code,
    email,
    business_type,
    business_id,
    invited_by,
    permissions,
    expires_at
  ) VALUES (
    v_invitation_code,
    p_email,
    p_business_type,
    p_business_id,
    p_invited_by,
    p_permissions,
    NOW() + (p_expires_in_days || ' days')::INTERVAL
  )
  RETURNING id INTO v_invitation_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'invitation_code', v_invitation_code,
    'user_exists', v_user_id IS NOT NULL,
    'user_id', v_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- التحقق من الجداول
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN ('vendor_staff', 'restaurant_staff', 'staff_invitations')
ORDER BY table_name;
