-- ============================================
-- إنشاء دالة update_order_status
-- Create update_order_status Function
-- ============================================

CREATE OR REPLACE FUNCTION update_order_status(
  order_id_param UUID,
  new_status TEXT,
  vendor_id_param UUID
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  order_record RECORD;
  old_status TEXT;
BEGIN
  -- التحقق من صحة الحالة
  IF new_status NOT IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'حالة غير صالحة'
    );
  END IF;

  -- الحصول على الطلب والتحقق من الصلاحيات
  SELECT o.*, s.user_id as store_owner_id
  INTO order_record
  FROM orders o
  JOIN stores s ON o.store_id = s.id
  WHERE o.id = order_id_param
  AND s.user_id = vendor_id_param;

  -- التحقق من وجود الطلب والصلاحيات
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'الطلب غير موجود أو ليس لديك صلاحية'
    );
  END IF;

  -- حفظ الحالة القديمة
  old_status := order_record.status;

  -- منع تحديث الطلبات المكتملة أو الملغاة
  IF old_status IN ('delivered', 'cancelled') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'لا يمكن تحديث طلب مكتمل أو ملغي'
    );
  END IF;

  -- تحديث حالة الطلب
  UPDATE orders
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE id = order_id_param;

  -- إضافة إشعار للعميل
  INSERT INTO notifications (
    user_id,
    title,
    title_ar,
    message,
    message_ar,
    type,
    category,
    priority,
    link,
    data
  )
  VALUES (
    order_record.user_id,
    'Order Status Updated',
    'تم تحديث حالة الطلب',
    'Your order #' || SUBSTRING(order_id_param::TEXT, 1, 8) || ' status changed to ' || new_status,
    'تم تغيير حالة طلبك #' || SUBSTRING(order_id_param::TEXT, 1, 8) || ' إلى ' || new_status,
    'order_update',
    'order',
    CASE 
      WHEN new_status = 'cancelled' THEN 'high'
      WHEN new_status = 'delivered' THEN 'medium'
      ELSE 'normal'
    END,
    '/orders/' || order_id_param,
    jsonb_build_object(
      'order_id', order_id_param,
      'old_status', old_status,
      'new_status', new_status,
      'store_id', order_record.store_id
    )
  );

  -- إرجاع النتيجة
  RETURN jsonb_build_object(
    'success', true,
    'order_id', order_id_param,
    'old_status', old_status,
    'new_status', new_status,
    'updated_at', NOW()
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
GRANT EXECUTE ON FUNCTION update_order_status TO authenticated;

-- تعليق على الدالة
COMMENT ON FUNCTION update_order_status IS 'تحديث حالة الطلب مع إرسال إشعار للعميل';

-- ✅ تم إنشاء الدالة
