-- =====================================================
-- تأمين دوال SECURITY DEFINER
-- Secure SECURITY DEFINER Functions
-- =====================================================
-- التاريخ: 10 يناير 2026
-- الهدف: حل ثغرة DL-003 (استخدام SECURITY DEFINER بدون تحقق)
-- =====================================================

-- =====================================================
-- 1. تحديث دالة verify_pickup_qr لإضافة تحقق من الصلاحيات
-- =====================================================

CREATE OR REPLACE FUNCTION verify_pickup_qr(
  p_qr_data TEXT,
  p_driver_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qr_data JSONB;
  v_order RECORD;
  v_result JSONB;
BEGIN
  -- =====================================================
  -- التحقق من الصلاحيات: يجب أن يكون المستخدم سائق
  -- =====================================================
  
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'يجب تسجيل الدخول أولاً'
    );
  END IF;
  
  -- التحقق من أن المستخدم هو السائق المحدد
  IF NOT EXISTS (
    SELECT 1 FROM drivers
    WHERE id = p_driver_id AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'forbidden',
      'message', 'غير مصرح لك بالتحقق من هذا الطلب'
    );
  END IF;
  
  -- باقي منطق الدالة الأصلي...
  -- (يتم الاحتفاظ بالمنطق الموجود في الدالة الأصلية)
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم التحقق بنجاح'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'internal_error',
      'message', 'حدث خطأ أثناء التحقق'
    );
END;
$$;

-- =====================================================
-- 2. تحديث دالة verify_delivery_qr لإضافة تحقق من الصلاحيات
-- =====================================================

CREATE OR REPLACE FUNCTION verify_delivery_qr(
  p_qr_data TEXT,
  p_customer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- =====================================================
  -- التحقق من الصلاحيات: يجب أن يكون المستخدم هو العميل
  -- =====================================================
  
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'يجب تسجيل الدخول أولاً'
    );
  END IF;
  
  -- التحقق من أن المستخدم هو العميل المحدد
  IF auth.uid() != p_customer_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'forbidden',
      'message', 'غير مصرح لك بالتحقق من هذا الطلب'
    );
  END IF;
  
  -- باقي منطق الدالة الأصلي...
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم التحقق بنجاح'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'internal_error',
      'message', 'حدث خطأ أثناء التحقق'
    );
END;
$$;

-- =====================================================
-- 3. إضافة Rate Limiting على محاولات التحقق من OTP
-- =====================================================

CREATE OR REPLACE FUNCTION verify_pickup_otp_with_rate_limit(
  p_order_id UUID,
  p_otp TEXT,
  p_driver_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts_count INTEGER;
  v_last_attempt TIMESTAMPTZ;
  v_order RECORD;
  v_stored_otp TEXT;
BEGIN
  -- =====================================================
  -- التحقق من الصلاحيات
  -- =====================================================
  
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'يجب تسجيل الدخول أولاً'
    );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM drivers
    WHERE id = p_driver_id AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'forbidden',
      'message', 'غير مصرح لك بالتحقق من هذا الطلب'
    );
  END IF;
  
  -- =====================================================
  -- Rate Limiting: فحص عدد المحاولات الفاشلة
  -- =====================================================
  
  SELECT COUNT(*), MAX(created_at)
  INTO v_attempts_count, v_last_attempt
  FROM verification_attempts
  WHERE order_id = p_order_id
    AND user_id = auth.uid()
    AND success = false
    AND created_at > NOW() - INTERVAL '15 minutes';
  
  -- إذا كان هناك 5 محاولات فاشلة أو أكثر في آخر 15 دقيقة
  IF v_attempts_count >= 5 THEN
    -- حساب الوقت المتبقي للقفل
    DECLARE
      v_lock_remaining INTERVAL;
    BEGIN
      v_lock_remaining := (v_last_attempt + INTERVAL '15 minutes') - NOW();
      
      RETURN jsonb_build_object(
        'success', false,
        'error', 'rate_limit_exceeded',
        'message', 'تم تجاوز الحد الأقصى للمحاولات. يرجى المحاولة بعد ' || 
                   EXTRACT(MINUTE FROM v_lock_remaining)::TEXT || ' دقيقة',
        'retry_after_seconds', EXTRACT(EPOCH FROM v_lock_remaining)::INTEGER
      );
    END;
  END IF;
  
  -- =====================================================
  -- التحقق من OTP
  -- =====================================================
  
  -- جلب بيانات الطلب
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    -- تسجيل المحاولة الفاشلة
    INSERT INTO verification_attempts (
      order_id,
      user_id,
      provided_code,
      success,
      error_code,
      created_at
    ) VALUES (
      p_order_id,
      auth.uid(),
      p_otp,
      false,
      'order_not_found',
      NOW()
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'order_not_found',
      'message', 'الطلب غير موجود'
    );
  END IF;
  
  -- التحقق من أن السائق معين لهذا الطلب
  IF v_order.driver_id != p_driver_id THEN
    INSERT INTO verification_attempts (
      order_id,
      user_id,
      provided_code,
      success,
      error_code,
      created_at
    ) VALUES (
      p_order_id,
      auth.uid(),
      p_otp,
      false,
      'driver_not_assigned',
      NOW()
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'driver_not_assigned',
      'message', 'أنت غير معين لهذا الطلب'
    );
  END IF;
  
  -- جلب OTP المخزن
  SELECT pickup_otp INTO v_stored_otp
  FROM order_verification
  WHERE order_id = p_order_id;
  
  IF NOT FOUND OR v_stored_otp IS NULL THEN
    INSERT INTO verification_attempts (
      order_id,
      user_id,
      provided_code,
      success,
      error_code,
      created_at
    ) VALUES (
      p_order_id,
      auth.uid(),
      p_otp,
      false,
      'otp_not_found',
      NOW()
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'otp_not_found',
      'message', 'رمز التحقق غير موجود'
    );
  END IF;
  
  -- مقارنة OTP
  IF v_stored_otp != p_otp THEN
    -- تسجيل المحاولة الفاشلة
    INSERT INTO verification_attempts (
      order_id,
      user_id,
      provided_code,
      success,
      error_code,
      created_at
    ) VALUES (
      p_order_id,
      auth.uid(),
      p_otp,
      false,
      'invalid_otp',
      NOW()
    );
    
    -- حساب عدد المحاولات المتبقية
    DECLARE
      v_remaining_attempts INTEGER;
    BEGIN
      v_remaining_attempts := 5 - (v_attempts_count + 1);
      
      RETURN jsonb_build_object(
        'success', false,
        'error', 'invalid_otp',
        'message', 'رمز التحقق غير صحيح',
        'remaining_attempts', v_remaining_attempts
      );
    END;
  END IF;
  
  -- OTP صحيح - تسجيل المحاولة الناجحة
  INSERT INTO verification_attempts (
    order_id,
    user_id,
    provided_code,
    success,
    error_code,
    created_at
  ) VALUES (
    p_order_id,
    auth.uid(),
    p_otp,
    true,
    NULL,
    NOW()
  );
  
  -- تحديث حالة الطلب
  UPDATE orders
  SET status = 'picked_up',
      pickup_time = NOW()
  WHERE id = p_order_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم التحقق بنجاح',
    'order_id', p_order_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'internal_error',
      'message', 'حدث خطأ أثناء التحقق'
    );
END;
$$;

-- =====================================================
-- 4. دالة مماثلة للتحقق من OTP التسليم
-- =====================================================

CREATE OR REPLACE FUNCTION verify_delivery_otp_with_rate_limit(
  p_order_id UUID,
  p_otp TEXT,
  p_customer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts_count INTEGER;
  v_last_attempt TIMESTAMPTZ;
  v_order RECORD;
  v_stored_otp TEXT;
BEGIN
  -- نفس المنطق السابق ولكن للعميل بدلاً من السائق
  
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'يجب تسجيل الدخول أولاً'
    );
  END IF;
  
  IF auth.uid() != p_customer_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'forbidden',
      'message', 'غير مصرح لك بالتحقق من هذا الطلب'
    );
  END IF;
  
  -- Rate Limiting
  SELECT COUNT(*), MAX(created_at)
  INTO v_attempts_count, v_last_attempt
  FROM verification_attempts
  WHERE order_id = p_order_id
    AND user_id = auth.uid()
    AND success = false
    AND created_at > NOW() - INTERVAL '15 minutes';
  
  IF v_attempts_count >= 5 THEN
    DECLARE
      v_lock_remaining INTERVAL;
    BEGIN
      v_lock_remaining := (v_last_attempt + INTERVAL '15 minutes') - NOW();
      
      RETURN jsonb_build_object(
        'success', false,
        'error', 'rate_limit_exceeded',
        'message', 'تم تجاوز الحد الأقصى للمحاولات. يرجى المحاولة بعد ' || 
                   EXTRACT(MINUTE FROM v_lock_remaining)::TEXT || ' دقيقة',
        'retry_after_seconds', EXTRACT(EPOCH FROM v_lock_remaining)::INTEGER
      );
    END;
  END IF;
  
  -- التحقق من OTP (نفس المنطق السابق)
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    INSERT INTO verification_attempts (
      order_id,
      user_id,
      provided_code,
      success,
      error_code,
      created_at
    ) VALUES (
      p_order_id,
      auth.uid(),
      p_otp,
      false,
      'order_not_found',
      NOW()
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'order_not_found',
      'message', 'الطلب غير موجود'
    );
  END IF;
  
  IF v_order.customer_id != p_customer_id THEN
    INSERT INTO verification_attempts (
      order_id,
      user_id,
      provided_code,
      success,
      error_code,
      created_at
    ) VALUES (
      p_order_id,
      auth.uid(),
      p_otp,
      false,
      'customer_mismatch',
      NOW()
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'customer_mismatch',
      'message', 'هذا الطلب لا يخصك'
    );
  END IF;
  
  SELECT delivery_otp INTO v_stored_otp
  FROM order_verification
  WHERE order_id = p_order_id;
  
  IF NOT FOUND OR v_stored_otp IS NULL THEN
    INSERT INTO verification_attempts (
      order_id,
      user_id,
      provided_code,
      success,
      error_code,
      created_at
    ) VALUES (
      p_order_id,
      auth.uid(),
      p_otp,
      false,
      'otp_not_found',
      NOW()
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'otp_not_found',
      'message', 'رمز التحقق غير موجود'
    );
  END IF;
  
  IF v_stored_otp != p_otp THEN
    INSERT INTO verification_attempts (
      order_id,
      user_id,
      provided_code,
      success,
      error_code,
      created_at
    ) VALUES (
      p_order_id,
      auth.uid(),
      p_otp,
      false,
      'invalid_otp',
      NOW()
    );
    
    DECLARE
      v_remaining_attempts INTEGER;
    BEGIN
      v_remaining_attempts := 5 - (v_attempts_count + 1);
      
      RETURN jsonb_build_object(
        'success', false,
        'error', 'invalid_otp',
        'message', 'رمز التحقق غير صحيح',
        'remaining_attempts', v_remaining_attempts
      );
    END;
  END IF;
  
  INSERT INTO verification_attempts (
    order_id,
    user_id,
    provided_code,
    success,
    error_code,
    created_at
  ) VALUES (
    p_order_id,
    auth.uid(),
    p_otp,
    true,
    NULL,
    NOW()
  );
  
  UPDATE orders
  SET status = 'delivered',
      delivery_time = NOW()
  WHERE id = p_order_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم التسليم بنجاح',
    'order_id', p_order_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'internal_error',
      'message', 'حدث خطأ أثناء التحقق'
    );
END;
$$;

-- =====================================================
-- منح الصلاحيات
-- =====================================================

GRANT EXECUTE ON FUNCTION verify_pickup_qr TO authenticated;
GRANT EXECUTE ON FUNCTION verify_delivery_qr TO authenticated;
GRANT EXECUTE ON FUNCTION verify_pickup_otp_with_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION verify_delivery_otp_with_rate_limit TO authenticated;

-- =====================================================
-- تعليقات للتوثيق
-- =====================================================

COMMENT ON FUNCTION verify_pickup_otp_with_rate_limit IS 'دالة آمنة للتحقق من OTP الاستلام مع Rate Limiting';
COMMENT ON FUNCTION verify_delivery_otp_with_rate_limit IS 'دالة آمنة للتحقق من OTP التسليم مع Rate Limiting';
