-- ============================================
-- فحص شامل للصفحات المتبقية - لوحة تحكم المطعم
-- Complete Restaurant Dashboard Pages Check
-- ============================================

-- ========================================
-- 1. صفحة المحفظة (Wallet)
-- ========================================

-- فحص جدول vendor_wallets
SELECT 
  'vendor_wallets' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_wallets') as exists;

-- فحص أعمدة vendor_wallets
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vendor_wallets'
AND column_name IN ('vendor_id', 'balance', 'pending_balance', 'total_earnings')
ORDER BY column_name;

-- فحص جدول transactions للمحفظة
SELECT 
  'wallet_transactions' as check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name IN ('transactions', 'wallet_transactions')) as exists;

-- ========================================
-- 2. صفحة التقييمات (Reviews)  
-- ========================================

-- فحص جدول reviews
SELECT 
  'reviews' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') as exists;

-- فحص أعمدة reviews
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reviews'
AND column_name IN ('id', 'vendor_id', 'rating', 'comment', 'created_at', 'customer_name', 'order_number', 'user_id')
ORDER BY column_name;

-- إحصائيات التقييمات
SELECT 
  COUNT(*) as total_reviews,
  AVG(rating) as average_rating
FROM reviews;

-- ========================================
-- 3. صفحة العروض والكوبونات (Promotions)
-- ========================================

-- فحص جدول coupons
SELECT 
  'coupons' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coupons') as exists;

-- فحص أعمدة coupons
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'coupons'
AND column_name IN (
  'id', 'code', 'discount_type', 'discount_value', 
  'min_order_amount', 'max_uses', 'current_uses', 
  'start_date', 'end_date', 'is_active', 'vendor_id'
)
ORDER BY column_name;

-- عدد الكوبونات
SELECT 
  'Total coupons' as stat_name,
  COUNT(*) as count
FROM coupons;

-- ========================================
-- 4. صفحة الرسائل (Messages)
-- ========================================

-- فحص جدول chats
SELECT 
  'chats' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chats') as exists;

-- فحص أعمدة chats
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chats'
AND column_name IN ('id', 'vendor_id', 'customer_id', 'message', 'created_at', 'read', 'order_id')
ORDER BY column_name;

-- عدد الرسائل
SELECT 
  'Total messages' as stat_name,
  COUNT(*) as count
FROM chats;

-- ========================================
-- 5. صفحة الإعدادات (Settings)
-- ========================================

-- فحص أعمدة stores للإعدادات
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'stores'
AND column_name IN (
  'shop_name', 'shop_name_ar', 'store_phone', 'store_address', 
  'store_address_ar', 'description', 'description_ar',
  'opening_time', 'closing_time', 'is_online', 
  'logo_url', 'shop_logo', 'banner_url', 'cover_image', 'gallery_images'
)
ORDER BY column_name;

-- ========================================
-- 6. نظام الحسابات المساعدة (Staff)
-- ========================================

-- فحص جدول vendor_staff
SELECT 
  'vendor_staff' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_staff') as exists;

-- فحص أعمدة vendor_staff
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vendor_staff'
AND column_name IN ('id', 'vendor_id', 'user_id', 'role', 'permissions', 'is_active', 'created_at')
ORDER BY column_name;

-- فحص جدول staff_invitations
SELECT 
  'staff_invitations' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_invitations') as exists;

-- فحص أعمدة staff_invitations
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'staff_invitations'
AND column_name IN ('id', 'vendor_id', 'email', 'role', 'permissions', 'status', 'expires_at')
ORDER BY column_name;

-- عدد الموظفين
SELECT 
  'Total staff' as stat_name,
  COUNT(*) as count
FROM vendor_staff;

-- عدد الدعوات
SELECT 
  'Total invitations' as stat_name,
  COUNT(*) as count
FROM staff_invitations;

-- ========================================
-- 7. دوال RPC المطلوبة
-- ========================================

-- فحص دالة create_staff_invitation
SELECT 
  'create_staff_invitation' as function_name,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_staff_invitation') as exists;

-- فحص دالة accept_staff_invitation
SELECT 
  'accept_staff_invitation' as function_name,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'accept_staff_invitation') as exists;

-- ========================================
-- 8. الملخص النهائي
-- ========================================

SELECT 
  'الجداول الأساسية للصفحات' as category,
  COUNT(CASE WHEN table_name IN (
    'vendor_wallets', 'reviews', 'coupons', 'chats', 
    'stores', 'vendor_staff', 'staff_invitations'
  ) THEN 1 END) as found,
  7 as required
FROM information_schema.tables
WHERE table_name IN (
  'vendor_wallets', 'reviews', 'coupons', 'chats', 
  'stores', 'vendor_staff', 'staff_invitations'
);

-- تم الفحص ✅
