-- =========================================================
-- سكريبت تعيين حسابات البائع والمطعم
-- Setup Vendor and Restaurant Accounts Script
-- =========================================================
-- التاريخ: 2026-01-01
-- الوصف: تعيين mdadkh1@gmail.com كمطعم و muhmdakh@gmail.com كبائع
-- =========================================================

-- معرفات المستخدمين من قاعدة البيانات:
-- mdadkh1@gmail.com (محمد خيران) = eae9e223-5098-4be0-9a49-7ed99d4bae44 [role: restaurant]
-- muhmdakh@gmail.com (مريم مريم) = 8383a676-703d-4c01-ab52-3f17e0734b16 [role: vendor]

-- =========================================================
-- 1. تحديث دور المستخدمين في جدول users (إذا لزم الأمر)
-- =========================================================

-- تأكيد أن mdadkh1@gmail.com لديه دور restaurant
UPDATE public.users
SET role = 'restaurant'
WHERE email = 'mdadkh1@gmail.com';

-- تأكيد أن muhmdakh@gmail.com لديه دور vendor
UPDATE public.users
SET role = 'vendor'
WHERE email = 'muhmdakh@gmail.com';

-- =========================================================
-- 2. إنشاء أو تحديث سجل vendor لحساب المطعم (mdadkh1@gmail.com)
-- =========================================================

-- التحقق من وجود السجل وتحديثه أو إنشاء جديد
INSERT INTO public.vendors (
  user_id,
  shop_name,
  shop_name_ar,
  shop_slug,
  approval_status,
  vendor_type,
  approved_at,
  contact_email,
  contact_phone,
  city,
  country,
  is_verified,
  auto_accept_orders,
  min_order_amount,
  created_at,
  updated_at
)
VALUES (
  'eae9e223-5098-4be0-9a49-7ed99d4bae44', -- user_id لـ mdadkh1@gmail.com
  'مطعم محمد خيران',
  'مطعم محمد خيران',
  'restaurant-mohammad-khairan',
  'approved',
  'restaurant',
  NOW(),
  'mdadkh1@gmail.com',
  NULL,
  'الرياض',
  'السعودية',
  true,
  true,
  0,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET
  shop_name = EXCLUDED.shop_name,
  shop_name_ar = EXCLUDED.shop_name_ar,
  approval_status = 'approved',
  vendor_type = 'restaurant',
  approved_at = COALESCE(vendors.approved_at, NOW()),
  is_verified = true,
  updated_at = NOW();

-- =========================================================
-- 3. إنشاء أو تحديث سجل vendor لحساب البائع (muhmdakh@gmail.com)
-- =========================================================

INSERT INTO public.vendors (
  user_id,
  shop_name,
  shop_name_ar,
  shop_slug,
  approval_status,
  vendor_type,
  approved_at,
  contact_email,
  contact_phone,
  city,
  country,
  is_verified,
  auto_accept_orders,
  min_order_amount,
  created_at,
  updated_at
)
VALUES (
  '8383a676-703d-4c01-ab52-3f17e0734b16', -- user_id لـ muhmdakh@gmail.com
  'متجر مريم',
  'متجر مريم',
  'shop-mariam',
  'approved',
  'retail_store',
  NOW(),
  'muhmdakh@gmail.com',
  NULL,
  'الرياض',
  'السعودية',
  true,
  true,
  0,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET
  shop_name = EXCLUDED.shop_name,
  shop_name_ar = EXCLUDED.shop_name_ar,
  approval_status = 'approved',
  vendor_type = 'retail_store',
  approved_at = COALESCE(vendors.approved_at, NOW()),
  is_verified = true,
  updated_at = NOW();

-- =========================================================
-- 4. التحقق من النتائج
-- =========================================================

-- عرض معلومات الحسابين بعد التحديث
SELECT 
  u.email,
  u.name,
  u.role as user_role,
  v.shop_name,
  v.vendor_type,
  v.approval_status,
  v.is_verified,
  v.id as vendor_id
FROM public.users u
LEFT JOIN public.vendors v ON v.user_id = u.id
WHERE u.email IN ('mdadkh1@gmail.com', 'muhmdakh@gmail.com')
ORDER BY u.email;

-- =========================================================
-- ملاحظات مهمة:
-- =========================================================
-- 1. تم استخدام ON CONFLICT لتحديث السجل إذا كان موجوداً أو إنشاء جديد
-- 2. تم تعيين approval_status = 'approved' لكلا الحسابين
-- 3. تم تعيين is_verified = true لتفعيل الحسابين
-- 4. يمكن تعديل shop_name و shop_slug حسب الحاجة
-- 5. يمكن إضافة معلومات إضافية مثل العنوان والهاتف لاحقاً

-- =========================================================
-- الخلاصة:
-- =========================================================
-- ✅ mdadkh1@gmail.com → مطعم (restaurant) - معتمد
-- ✅ muhmdakh@gmail.com → بائع (vendor) - معتمد
-- =========================================================
