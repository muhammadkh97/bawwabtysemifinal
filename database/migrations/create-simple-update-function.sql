-- ============================================================================
-- حل نهائي - دالة بسيطة جداً لتحديث حالة الطلب فقط
-- ============================================================================

DROP FUNCTION IF EXISTS update_driver_order_status_simple(uuid, text);

CREATE OR REPLACE FUNCTION public.update_driver_order_status_simple(
  p_order_id uuid,
  p_new_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result INTEGER;
  v_new_status order_status;
BEGIN
  -- تحويل النص إلى نوع order_status
  BEGIN
    v_new_status := p_new_status::order_status;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'حالة غير صالحة: ' || p_new_status
      );
  END;

  -- تحديث بسيط جداً - فقط الحالة والتاريخ
  UPDATE orders
  SET 
    status = v_new_status,
    delivered_at = CASE WHEN v_new_status = 'delivered'::order_status THEN CURRENT_TIMESTAMP ELSE delivered_at END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_order_id;
  
  GET DIAGNOSTICS v_result = ROW_COUNT;
  
  IF v_result = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'الطلب غير موجود'
    );
  END IF;

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
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- منح صلاحيات التنفيذ
GRANT EXECUTE ON FUNCTION update_driver_order_status_simple(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_driver_order_status_simple(uuid, text) TO anon;

-- اختبار الدالة
SELECT update_driver_order_status_simple(
  'a5b017a7-4308-433d-bfe5-8eb5935ab6eb',
  'delivered'
);
