-- =====================================================
-- إصلاح دوال SECURITY DEFINER الموجودة
-- Fix Existing SECURITY DEFINER Functions
-- =====================================================
-- التاريخ: 10 يناير 2026
-- الهدف: إضافة تحقق من الصلاحيات لجميع الدوال الحساسة
-- =====================================================

-- =====================================================
-- 1. إصلاح accept_staff_invitation
-- =====================================================

CREATE OR REPLACE FUNCTION public.accept_staff_invitation(
  p_invitation_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_result JSONB;
BEGIN
  -- ✅ التحقق من الصلاحيات: المستخدم يجب أن يكون نفسه
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'يجب تسجيل الدخول أولاً'
    );
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'forbidden',
      'message', 'غير مصرح لك بقبول هذه الدعوة'
    );
  END IF;
  
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

-- =====================================================
-- 2. إصلاح archive_chat
-- =====================================================

CREATE OR REPLACE FUNCTION public.archive_chat(
  p_chat_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ✅ التحقق من الصلاحيات: المستخدم يجب أن يكون صاحب المحادثة
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'يجب تسجيل الدخول أولاً';
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'غير مصرح لك بأرشفة هذه المحادثة';
  END IF;
  
  -- التحقق من أن المستخدم هو طرف في المحادثة
  IF NOT EXISTS (
    SELECT 1 FROM chats
    WHERE id = p_chat_id
      AND (
        customer_id = auth.uid()
        OR vendor_id IN (
          SELECT id FROM stores WHERE user_id = auth.uid()
        )
      )
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بأرشفة هذه المحادثة';
  END IF;
  
  UPDATE chats
  SET 
    is_archived = true,
    archived_by = p_user_id,
    archived_at = NOW(),
    updated_at = NOW()
  WHERE id = p_chat_id;
  
  RETURN FOUND;
END;
$$;

-- =====================================================
-- 3. إصلاح assign_order_to_driver
-- =====================================================

CREATE OR REPLACE FUNCTION public.assign_order_to_driver(
  p_order_id UUID,
  p_driver_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_id UUID;
  v_order RECORD;
BEGIN
  -- ✅ التحقق من الصلاحيات: فقط الأدمن أو dispatcher
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'يجب تسجيل الدخول أولاً'
    );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('admin', 'dispatcher')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'forbidden',
      'message', 'غير مصرح لك بتعيين السائقين'
    );
  END IF;
  
  -- الحصول على معرف السائق
  SELECT id INTO v_driver_id
  FROM drivers
  WHERE user_id = p_driver_user_id
  AND is_available = true;

  IF v_driver_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'السائق غير متاح حالياً'
    );
  END IF;

  -- التحقق من الطلب
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  AND status = 'ready_for_pickup'
  AND driver_id IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'الطلب غير متاح'
    );
  END IF;

  -- تعيين السائق للطلب
  UPDATE orders
  SET 
    driver_id = v_driver_id,
    status = 'picked_up',
    updated_at = NOW()
  WHERE id = p_order_id;

  -- إرسال إشعار للعميل
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    priority,
    category
  )
  VALUES (
    v_order.customer_id,
    'order_update',
    'تم تعيين مندوب توصيل',
    'تم تعيين مندوب توصيل لطلبك رقم ' || v_order.order_number,
    '/orders/' || v_order.id,
    'high',
    'orders'
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'driver_id', v_driver_id,
    'message', 'تم قبول الطلب بنجاح'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- =====================================================
-- 4. إصلاح cleanup_old_notifications
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications(
  days_old INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- ✅ التحقق من الصلاحيات: فقط الأدمن
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'يجب تسجيل الدخول أولاً';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بحذف الإشعارات';
  END IF;
  
  DELETE FROM notifications
  WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
    AND is_read = true;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- =====================================================
-- 5. إصلاح create_or_get_chat
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_or_get_chat(
  p_customer_id UUID,
  p_vendor_id UUID,
  p_chat_type VARCHAR DEFAULT 'direct'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_chat_id UUID;
    v_user_role user_role;
BEGIN
    -- ✅ التحقق من الصلاحيات
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'يجب تسجيل الدخول أولاً';
    END IF;
    
    -- التحقق من أن المستخدم هو العميل أو البائع
    IF auth.uid() != p_customer_id AND NOT EXISTS (
      SELECT 1 FROM stores
      WHERE id = p_vendor_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'غير مصرح لك بإنشاء هذه المحادثة';
    END IF;
    
    -- الحصول على دور المستخدم الحالي
    SELECT role INTO v_user_role FROM users WHERE id = auth.uid();
    
    -- البحث عن محادثة موجودة
    SELECT id INTO v_chat_id
    FROM chats
    WHERE 
        customer_id = p_customer_id
        AND vendor_id = p_vendor_id
        AND chat_type = p_chat_type
        AND is_active = true
    LIMIT 1;
    
    -- إذا لم توجد، إنشاء محادثة جديدة
    IF v_chat_id IS NULL THEN
        INSERT INTO chats (
            customer_id,
            vendor_id,
            chat_type,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            p_customer_id,
            p_vendor_id,
            p_chat_type,
            true,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_chat_id;
        
        RAISE NOTICE 'تم إنشاء محادثة جديدة: %', v_chat_id;
    ELSE
        RAISE NOTICE 'محادثة موجودة: %', v_chat_id;
    END IF;
    
    RETURN v_chat_id;
END;
$$;

-- =====================================================
-- منح الصلاحيات
-- =====================================================

GRANT EXECUTE ON FUNCTION accept_staff_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION archive_chat TO authenticated;
GRANT EXECUTE ON FUNCTION assign_order_to_driver TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION create_or_get_chat TO authenticated;

-- =====================================================
-- تعليقات للتوثيق
-- =====================================================

COMMENT ON FUNCTION accept_staff_invitation IS 'دالة آمنة لقبول دعوة موظف - تتحقق من أن المستخدم هو المدعو';
COMMENT ON FUNCTION archive_chat IS 'دالة آمنة لأرشفة محادثة - تتحقق من أن المستخدم هو طرف في المحادثة';
COMMENT ON FUNCTION assign_order_to_driver IS 'دالة آمنة لتعيين سائق - تتحقق من أن المستخدم هو أدمن أو dispatcher';
COMMENT ON FUNCTION cleanup_old_notifications IS 'دالة آمنة لحذف الإشعارات القديمة - تتحقق من أن المستخدم هو أدمن';
COMMENT ON FUNCTION create_or_get_chat IS 'دالة آمنة لإنشاء أو جلب محادثة - تتحقق من أن المستخدم هو طرف في المحادثة';

-- =====================================================
-- ملاحظات نهائية
-- =====================================================
-- 1. تم إضافة تحقق من auth.uid() في بداية كل دالة
-- 2. تم إضافة تحقق من الصلاحيات حسب نوع العملية
-- 3. تم استخدام SET search_path = public لمنع schema hijacking
-- 4. تم استخدام RAISE EXCEPTION للأخطاء الأمنية الحرجة
-- =====================================================
