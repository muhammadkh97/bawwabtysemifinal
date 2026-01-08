-- ============================================================================
-- إصلاح دالة تحديث حالة الطلب من قبل السائق
-- ============================================================================

-- حذف الدالة القديمة وإنشاء نسخة محدثة
DROP FUNCTION IF EXISTS update_order_status_by_driver(uuid, text, uuid);

CREATE OR REPLACE FUNCTION public.update_order_status_by_driver(
  p_order_id uuid, 
  p_new_status text, 
  p_driver_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_driver_id UUID;
  v_order RECORD;
  v_status_messages JSONB;
  v_new_status order_status;
BEGIN
  -- تحويل النص إلى نوع order_status
  v_new_status := p_new_status::order_status;

  -- رسائل الحالات
  v_status_messages := jsonb_build_object(
    'picked_up', 'تم استلام الطلب من المتجر',
    'in_transit', 'الطلب في الطريق إليك',
    'out_for_delivery', 'الطلب في طريقه للتوصيل',
    'delivered', 'تم توصيل الطلب بنجاح'
  );

  -- الحصول على معرف السائق
  SELECT id INTO v_driver_id
  FROM drivers
  WHERE user_id = p_driver_user_id;

  IF v_driver_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'السائق غير موجود'
    );
  END IF;

  -- التحقق من الطلب
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  AND driver_id = v_driver_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'الطلب غير موجود أو غير مخصص لك'
    );
  END IF;

  -- تحديث حالة الطلب (فقط الحقول الضرورية لتجنب numeric overflow)
  UPDATE orders
  SET 
    status = v_new_status,
    delivered_at = CASE WHEN v_new_status = 'delivered' THEN NOW() ELSE delivered_at END,
    out_for_delivery_at = CASE WHEN v_new_status = 'out_for_delivery' AND out_for_delivery_at IS NULL THEN NOW() ELSE out_for_delivery_at END,
    updated_at = NOW()
  WHERE id = p_order_id;

  -- إرسال إشعار للعميل
  IF v_status_messages ? p_new_status THEN
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
      'تحديث حالة الطلب',
      v_status_messages->>p_new_status || ' - رقم الطلب: ' || v_order.order_number,
      '/orders/' || v_order.id,
      CASE WHEN v_new_status = 'delivered' THEN 'high' ELSE 'normal' END,
      'orders'
    );
  END IF;

  -- إرسال إشعار للبائع/المطعم
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    priority,
    category
  )
  SELECT
    s.user_id,
    'order_update',
    'تحديث حالة الطلب',
    v_status_messages->>p_new_status || ' - رقم الطلب: ' || v_order.order_number,
    '/dashboard/restaurant/orders',
    'normal',
    'orders'
  FROM stores s
  WHERE s.id = v_order.vendor_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'new_status', v_new_status,
    'message', 'تم تحديث حالة الطلب بنجاح'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- التحقق من الدالة
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosrc AS source_code
FROM pg_proc p
WHERE p.proname = 'update_order_status_by_driver';
