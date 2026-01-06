-- ============================================
-- إضافة الأعمدة المفقودة - لوحة تحكم المطعم
-- Add Missing Columns for Restaurant Dashboard
-- ============================================

-- ========================================
-- 1. إضافة أعمدة vendor_wallets
-- ========================================

ALTER TABLE vendor_wallets
ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earnings NUMERIC DEFAULT 0;

COMMENT ON COLUMN vendor_wallets.balance IS 'الرصيد الحالي المتاح';
COMMENT ON COLUMN vendor_wallets.total_earnings IS 'إجمالي الأرباح';

-- ========================================
-- 2. إضافة أعمدة reviews
-- ========================================

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS order_number TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

COMMENT ON COLUMN reviews.customer_name IS 'اسم العميل';
COMMENT ON COLUMN reviews.order_number IS 'رقم الطلب';
COMMENT ON COLUMN reviews.user_id IS 'معرف المستخدم';

-- ========================================
-- 3. إضافة أعمدة coupons
-- ========================================

ALTER TABLE coupons
ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS current_uses INTEGER DEFAULT 0;

COMMENT ON COLUMN coupons.min_order_amount IS 'الحد الأدنى لقيمة الطلب';
COMMENT ON COLUMN coupons.max_uses IS 'الحد الأقصى لعدد الاستخدامات';
COMMENT ON COLUMN coupons.current_uses IS 'عدد الاستخدامات الحالية';

-- ========================================
-- 4. إضافة أعمدة chats
-- ========================================

ALTER TABLE chats
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id);

COMMENT ON COLUMN chats.message IS 'نص الرسالة';
COMMENT ON COLUMN chats.read IS 'هل تم قراءة الرسالة';
COMMENT ON COLUMN chats.order_id IS 'معرف الطلب المرتبط';

-- ========================================
-- 5. إضافة أعمدة stores للإعدادات
-- ========================================

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS store_phone TEXT,
ADD COLUMN IF NOT EXISTS store_address TEXT,
ADD COLUMN IF NOT EXISTS store_address_ar TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT,
ADD COLUMN IF NOT EXISTS opening_time TIME,
ADD COLUMN IF NOT EXISTS closing_time TIME,
ADD COLUMN IF NOT EXISTS cover_image TEXT,
ADD COLUMN IF NOT EXISTS gallery_images TEXT[];

COMMENT ON COLUMN stores.store_phone IS 'رقم هاتف المتجر';
COMMENT ON COLUMN stores.store_address IS 'عنوان المتجر بالإنجليزية';
COMMENT ON COLUMN stores.store_address_ar IS 'عنوان المتجر بالعربية';
COMMENT ON COLUMN stores.description_ar IS 'الوصف بالعربية';
COMMENT ON COLUMN stores.opening_time IS 'وقت الافتتاح';
COMMENT ON COLUMN stores.closing_time IS 'وقت الإغلاق';
COMMENT ON COLUMN stores.cover_image IS 'صورة الغلاف';
COMMENT ON COLUMN stores.gallery_images IS 'مجموعة صور المعرض';

-- ========================================
-- 6. إضافة أعمدة vendor_staff
-- ========================================

ALTER TABLE vendor_staff
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'staff',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

COMMENT ON COLUMN vendor_staff.role IS 'دور الموظف';
COMMENT ON COLUMN vendor_staff.is_active IS 'هل الموظف نشط';

-- ========================================
-- 7. إضافة أعمدة staff_invitations
-- ========================================

ALTER TABLE staff_invitations
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES stores(id),
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'staff';

COMMENT ON COLUMN staff_invitations.vendor_id IS 'معرف المطعم/المتجر';
COMMENT ON COLUMN staff_invitations.role IS 'دور الموظف';

-- ========================================
-- 8. إنشاء دالة accept_staff_invitation
-- ========================================

CREATE OR REPLACE FUNCTION accept_staff_invitation(
  p_invitation_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
  v_result JSONB;
BEGIN
  -- الحصول على الدعوة
  SELECT * INTO v_invitation
  FROM staff_invitations
  WHERE id = p_invitation_id
  AND status = 'pending'
  AND expires_at > NOW();

  -- التحقق من صلاحية الدعوة
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'الدعوة غير موجودة أو منتهية الصلاحية'
    );
  END IF;

  -- إضافة الموظف
  INSERT INTO vendor_staff (
    vendor_id,
    user_id,
    role,
    permissions,
    is_active,
    created_at
  )
  VALUES (
    v_invitation.vendor_id,
    p_user_id,
    v_invitation.role,
    v_invitation.permissions,
    true,
    NOW()
  );

  -- تحديث حالة الدعوة
  UPDATE staff_invitations
  SET 
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = p_invitation_id;

  -- إرجاع النتيجة
  RETURN jsonb_build_object(
    'success', true,
    'vendor_id', v_invitation.vendor_id,
    'message', 'تم قبول الدعوة بنجاح'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION accept_staff_invitation TO authenticated;

COMMENT ON FUNCTION accept_staff_invitation IS 'قبول دعوة انضمام كموظف';

-- ========================================
-- 9. إضافة عمود accepted_at في staff_invitations
-- ========================================

ALTER TABLE staff_invitations
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN staff_invitations.accepted_at IS 'تاريخ قبول الدعوة';

-- ========================================
-- 10. التحقق من الأعمدة المضافة
-- ========================================

-- التحقق من vendor_wallets
SELECT 
  'vendor_wallets columns' as check_name,
  COUNT(column_name) as added_columns
FROM information_schema.columns
WHERE table_name = 'vendor_wallets'
AND column_name IN ('balance', 'total_earnings', 'pending_balance', 'vendor_id');

-- التحقق من reviews
SELECT 
  'reviews columns' as check_name,
  COUNT(column_name) as added_columns
FROM information_schema.columns
WHERE table_name = 'reviews'
AND column_name IN ('customer_name', 'order_number', 'user_id');

-- التحقق من coupons
SELECT 
  'coupons columns' as check_name,
  COUNT(column_name) as added_columns
FROM information_schema.columns
WHERE table_name = 'coupons'
AND column_name IN ('min_order_amount', 'max_uses', 'current_uses');

-- التحقق من chats
SELECT 
  'chats columns' as check_name,
  COUNT(column_name) as added_columns
FROM information_schema.columns
WHERE table_name = 'chats'
AND column_name IN ('message', 'read', 'order_id');

-- التحقق من stores
SELECT 
  'stores settings columns' as check_name,
  COUNT(column_name) as added_columns
FROM information_schema.columns
WHERE table_name = 'stores'
AND column_name IN ('store_phone', 'store_address', 'store_address_ar', 'description_ar', 'opening_time', 'closing_time', 'cover_image', 'gallery_images');

-- التحقق من vendor_staff
SELECT 
  'vendor_staff columns' as check_name,
  COUNT(column_name) as added_columns
FROM information_schema.columns
WHERE table_name = 'vendor_staff'
AND column_name IN ('role', 'is_active');

-- التحقق من staff_invitations
SELECT 
  'staff_invitations columns' as check_name,
  COUNT(column_name) as added_columns
FROM information_schema.columns
WHERE table_name = 'staff_invitations'
AND column_name IN ('vendor_id', 'role', 'accepted_at');

-- التحقق من دالة accept_staff_invitation
SELECT 
  'accept_staff_invitation' as function_name,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'accept_staff_invitation') as exists;

-- ✅ تم إضافة جميع الأعمدة والدوال المفقودة
