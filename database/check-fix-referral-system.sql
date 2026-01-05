-- ====================================
-- فحص وإصلاح نظام الإحالات (Referrals)
-- ====================================

-- ========== 1. فحص جدول referrals ==========

SELECT 
  'referrals table' as check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals') as table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'referrals') as column_count;

-- عرض أعمدة referrals
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'referrals'
ORDER BY ordinal_position;

-- ========== 2. فحص referral_code في users ==========

SELECT 
  'users.referral_code' as field,
  COUNT(*) as total_users,
  COUNT(referral_code) as users_with_code,
  COUNT(*) - COUNT(referral_code) as users_without_code
FROM users;

-- عرض المستخدمين وأكواد الإحالة
SELECT 
  id,
  name,
  email,
  referral_code,
  loyalty_points,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- ========== 3. فحص بيانات referrals ==========

SELECT 
  COUNT(*) as total_referrals,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  SUM(points_awarded) as total_points_awarded
FROM referrals;

-- عرض الإحالات
SELECT 
  r.id,
  referrer.name as referrer_name,
  referred.name as referred_name,
  r.points_awarded,
  r.status,
  r.created_at
FROM referrals r
LEFT JOIN users referrer ON r.referrer_id = referrer.id
LEFT JOIN users referred ON r.referred_id = referred.id
ORDER BY r.created_at DESC
LIMIT 10;

-- ========== 4. فحص loyalty_settings ==========

SELECT 
  'loyalty_settings' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_settings') as exists;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'loyalty_settings'
ORDER BY ordinal_position;

-- عرض إعدادات الولاء
SELECT 
  id,
  points_per_currency,
  referral_bonus,
  min_redemption_points,
  is_active
FROM loyalty_settings
LIMIT 1;

-- ========== 5. إنشاء أكواد referral للمستخدمين الحاليين ==========

-- توليد كود referral لكل مستخدم ليس لديه كود
UPDATE users
SET referral_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 8))
WHERE referral_code IS NULL OR referral_code = '';

-- التحقق من التحديث
SELECT 
  'After Update' as check,
  COUNT(*) as total_users,
  COUNT(referral_code) as users_with_code
FROM users;

-- ========== 6. ملخص النتائج ==========

SELECT 
  'Referral System Summary' as section,
  json_build_object(
    'referrals_table_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals'),
    'loyalty_settings_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_settings'),
    'users_with_referral_code', (SELECT COUNT(*) FROM users WHERE referral_code IS NOT NULL),
    'total_referrals', (SELECT COUNT(*) FROM referrals),
    'referral_bonus', (SELECT referral_bonus FROM loyalty_settings LIMIT 1)
  ) as summary;
