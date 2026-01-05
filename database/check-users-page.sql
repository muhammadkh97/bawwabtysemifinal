-- ====================================
-- فحص صفحة المستخدمين (admin/users)
-- ====================================

-- ========== 1. فحص جدول users (public) ==========

SELECT 
  'users table (public)' as check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') as table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users') as column_count;

-- عرض أعمدة users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- ========== 2. إحصائيات المستخدمين في public.users ==========

SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'customer' OR role IS NULL THEN 1 END) as customers,
  COUNT(CASE WHEN role = 'vendor' THEN 1 END) as vendors,
  COUNT(CASE WHEN role = 'driver' THEN 1 END) as drivers,
  COUNT(CASE WHEN role = 'restaurant' THEN 1 END) as restaurants,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
FROM users;

-- ========== 3. عرض المستخدمين (أول 10) ==========

SELECT 
  id,
  name,
  full_name,
  email,
  role,
  phone,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- ========== 4. التحقق من auth.users ==========

-- ملاحظة: هذا الاستعلام قد لا يعمل إذا لم يكن لديك صلاحيات admin
-- الكود في الصفحة يستخدم supabase.auth.admin.listUsers() وهي API function

SELECT 
  'Auth Users Check' as check_name,
  'يستخدم الكود supabase.auth.admin.listUsers() للحصول على المستخدمين من auth.users' as note,
  'يجب التحقق من صلاحيات Admin API' as requirement;

-- ========== 5. مقارنة public.users مع عدد الطلبات ==========

SELECT 
  'Data Verification' as check_type,
  (SELECT COUNT(*) FROM users) as public_users_count,
  (SELECT COUNT(DISTINCT customer_id) FROM orders WHERE customer_id IS NOT NULL) as active_customers_count,
  (SELECT COUNT(DISTINCT vendor_id) FROM stores) as active_vendors_count,
  (SELECT COUNT(*) FROM orders) as total_orders;

-- ========== 6. التحقق من المستخدمين حسب الدور ==========

SELECT 
  COALESCE(role, 'null/customer') as role,
  COUNT(*) as count,
  json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'email', email,
      'created_at', created_at
    )
  ) FILTER (WHERE role IS NOT NULL) as sample_users
FROM users
GROUP BY role
ORDER BY count DESC;

-- ========== 7. التحقق من الأعمدة المهمة ==========

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'name') THEN 'name ✅'
    ELSE 'name ❌'
  END as name_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email') THEN 'email ✅'
    ELSE 'email ❌'
  END as email_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role') THEN 'role ✅'
    ELSE 'role ❌'
  END as role_check;

-- ========== 8. ملخص النتائج ==========

SELECT 
  'Users Page Summary' as section,
  json_build_object(
    'public_users_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'),
    'total_users', (SELECT COUNT(*) FROM users),
    'customers', (SELECT COUNT(*) FROM users WHERE role = 'customer' OR role IS NULL),
    'vendors', (SELECT COUNT(*) FROM users WHERE role = 'vendor'),
    'drivers', (SELECT COUNT(*) FROM users WHERE role = 'driver'),
    'restaurants', (SELECT COUNT(*) FROM users WHERE role = 'restaurant'),
    'users_with_orders', (SELECT COUNT(DISTINCT customer_id) FROM orders WHERE customer_id IS NOT NULL),
    'code_uses_auth_admin_api', true,
    'note', 'الكود يستخدم supabase.auth.admin.listUsers() لجلب المستخدمين من auth.users وليس من public.users'
  ) as summary;
