-- ═══════════════════════════════════════════════════════════════
-- 🔧 تحديث دالة get_current_user لدعم المساعدين
-- ═══════════════════════════════════════════════════════════════

-- حذف الدالة القديمة
DROP FUNCTION IF EXISTS get_current_user();

-- إنشاء الدالة المحدثة
CREATE OR REPLACE FUNCTION public.get_current_user()
RETURNS TABLE(
  id uuid, 
  email text, 
  full_name text, 
  role user_role, 
  user_role_text text, 
  phone text, 
  avatar_url text, 
  name text,
  is_vendor_staff boolean,
  is_restaurant_staff boolean,
  staff_vendor_id uuid,
  staff_restaurant_id uuid,
  staff_permissions jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_vendor_staff_id uuid;
  v_restaurant_staff_id uuid;
  v_staff_permissions jsonb;
BEGIN
  -- فحص إذا كان المستخدم مساعد vendor نشط
  SELECT vs.vendor_id, vs.permissions 
  INTO v_vendor_staff_id, v_staff_permissions
  FROM vendor_staff vs
  WHERE vs.user_id = auth.uid() 
    AND vs.status = 'active'
  LIMIT 1;
  
  -- فحص إذا كان المستخدم مساعد restaurant نشط
  IF v_vendor_staff_id IS NULL THEN
    SELECT rs.restaurant_id, rs.permissions 
    INTO v_restaurant_staff_id, v_staff_permissions
    FROM restaurant_staff rs
    WHERE rs.user_id = auth.uid() 
      AND rs.status = 'active'
    LIMIT 1;
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.user_role,
    u.phone,
    u.avatar_url,
    u.name,
    (v_vendor_staff_id IS NOT NULL) as is_vendor_staff,
    (v_restaurant_staff_id IS NOT NULL) as is_restaurant_staff,
    v_vendor_staff_id as staff_vendor_id,
    v_restaurant_staff_id as staff_restaurant_id,
    v_staff_permissions as staff_permissions
  FROM users u
  WHERE u.id = auth.uid();
END;
$function$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📊 اختبار الدالة الجديدة
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- اختبار للمستخدم المساعد
SELECT 
    '✅ اختبار الدالة' as info,
    *
FROM get_current_user()
WHERE id = '390e50d6-50de-4376-bddc-f394323284d8';
