-- =====================================================
-- 🚗 إنشاء حساب سائق لـ mkhiran9700@gmail.com
-- =====================================================

-- الخطوة 1: تحديث role في auth.users
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "driver"}'::jsonb
WHERE email = 'mkhiran9700@gmail.com';

-- الخطوة 2: إضافة سجل في جدول drivers
INSERT INTO drivers (
  user_id,
  vehicle_type,
  vehicle_number,
  license_number,
  approval_status,
  status,
  is_available,
  is_active,
  rating,
  total_deliveries,
  wallet_balance
)
SELECT 
  id,
  'سيارة',
  'ABC-1234',
  'LIC-001',
  'approved',
  'idle',
  true,
  true,
  5.0,
  0,
  0.0
FROM auth.users
WHERE email = 'mkhiran9700@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- الخطوة 3: التحقق من النتيجة
SELECT 
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'role' as user_role,
  d.id as driver_id,
  d.vehicle_type,
  d.approval_status,
  d.status,
  d.is_available,
  d.created_at
FROM auth.users u
LEFT JOIN drivers d ON d.user_id = u.id
WHERE u.email = 'mkhiran9700@gmail.com';
