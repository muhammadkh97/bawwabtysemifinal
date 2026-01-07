-- =====================================================
-- نظام QR Code و OTP للتسليم والاستلام - كامل واحترافي
-- =====================================================

-- 1. دالة توليد أكواد الاستلام (Pickup Codes)
-- ================================================
CREATE OR REPLACE FUNCTION generate_pickup_codes(order_uuid UUID)
RETURNS TABLE (
  qr_code TEXT,
  otp VARCHAR(6),
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_otp VARCHAR(6);
  v_qr_data JSONB;
  v_expires TIMESTAMPTZ;
  v_order_number TEXT;
BEGIN
  -- التحقق من وجود الطلب
  SELECT order_number INTO v_order_number
  FROM orders
  WHERE id = order_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الطلب غير موجود: %', order_uuid;
  END IF;

  -- توليد OTP عشوائي (6 أرقام)
  v_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- تحديد وقت الانتهاء (24 ساعة من الآن)
  v_expires := NOW() + INTERVAL '24 hours';
  
  -- بناء بيانات QR Code (JSON)
  v_qr_data := jsonb_build_object(
    'type', 'pickup',
    'order_id', order_uuid::TEXT,
    'order_number', v_order_number,
    'otp', v_otp,
    'timestamp', EXTRACT(EPOCH FROM NOW())::BIGINT,
    'expires_at', EXTRACT(EPOCH FROM v_expires)::BIGINT
  );
  
  -- تحديث الطلب بالأكواد الجديدة
  UPDATE orders
  SET 
    pickup_otp = v_otp,
    pickup_qr_code = v_qr_data::TEXT,
    pickup_otp_expires_at = v_expires,
    updated_at = NOW()
  WHERE id = order_uuid;
  
  -- إرجاع النتيجة
  RETURN QUERY 
  SELECT 
    v_qr_data::TEXT AS qr_code,
    v_otp AS otp,
    v_expires AS expires_at;
END;
$$;

-- صلاحيات التنفيذ
GRANT EXECUTE ON FUNCTION generate_pickup_codes(UUID) TO authenticated;

COMMENT ON FUNCTION generate_pickup_codes IS 'توليد أكواد QR و OTP لاستلام الطلب من البائع';

-- =====================================================
-- 2. دالة توليد أكواد التسليم (Delivery Codes)
-- =====================================================
CREATE OR REPLACE FUNCTION generate_delivery_codes(order_uuid UUID)
RETURNS TABLE (
  qr_code TEXT,
  otp VARCHAR(6),
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_otp VARCHAR(6);
  v_qr_data JSONB;
  v_expires TIMESTAMPTZ;
  v_order_number TEXT;
BEGIN
  -- التحقق من وجود الطلب
  SELECT order_number INTO v_order_number
  FROM orders
  WHERE id = order_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الطلب غير موجود: %', order_uuid;
  END IF;

  -- توليد OTP عشوائي (6 أرقام)
  v_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- تحديد وقت الانتهاء (24 ساعة من الآن)
  v_expires := NOW() + INTERVAL '24 hours';
  
  -- بناء بيانات QR Code (JSON)
  v_qr_data := jsonb_build_object(
    'type', 'delivery',
    'order_id', order_uuid::TEXT,
    'order_number', v_order_number,
    'otp', v_otp,
    'timestamp', EXTRACT(EPOCH FROM NOW())::BIGINT,
    'expires_at', EXTRACT(EPOCH FROM v_expires)::BIGINT
  );
  
  -- تحديث الطلب بالأكواد الجديدة
  UPDATE orders
  SET 
    delivery_otp = v_otp,
    delivery_qr_code = v_qr_data::TEXT,
    delivery_otp_expires_at = v_expires,
    updated_at = NOW()
  WHERE id = order_uuid;
  
  -- إرجاع النتيجة
  RETURN QUERY 
  SELECT 
    v_qr_data::TEXT AS qr_code,
    v_otp AS otp,
    v_expires AS expires_at;
END;
$$;

-- صلاحيات التنفيذ
GRANT EXECUTE ON FUNCTION generate_delivery_codes(UUID) TO authenticated;

COMMENT ON FUNCTION generate_delivery_codes IS 'توليد أكواد QR و OTP لتسليم الطلب للعميل';

-- =====================================================
-- 3. دالة التحقق من OTP الاستلام (Pickup Verification)
-- =====================================================
CREATE OR REPLACE FUNCTION verify_pickup_otp(
  order_uuid UUID,
  provided_otp VARCHAR(6),
  driver_uuid UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_result JSONB;
BEGIN
  -- جلب تفاصيل الطلب
  SELECT * INTO v_order
  FROM orders
  WHERE id = order_uuid;
  
  -- التحقق من وجود الطلب
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'order_not_found',
      'message', 'الطلب غير موجود'
    );
  END IF;
  
  -- التحقق من أن السائق هو المعين للطلب
  IF v_order.driver_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_driver_assigned',
      'message', 'لم يتم تعيين سائق لهذا الطلب'
    );
  END IF;

  IF v_order.driver_id != driver_uuid THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'driver_mismatch',
      'message', 'هذا الطلب معين لسائق آخر'
    );
  END IF;
  
  -- التحقق من صلاحية OTP
  IF v_order.pickup_otp_expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'otp_expired',
      'message', 'انتهت صلاحية الرمز'
    );
  END IF;
  
  -- التحقق من OTP
  IF v_order.pickup_otp != provided_otp THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_otp',
      'message', 'الرمز غير صحيح'
    );
  END IF;
  
  -- التحقق من الحالة المناسبة
  IF v_order.status NOT IN ('ready', 'preparing', 'confirmed') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_status',
      'message', 'حالة الطلب غير مناسبة للاستلام'
    );
  END IF;
  
  -- تحديث حالة الطلب
  UPDATE orders
  SET 
    status = 'picked_up',
    picked_up_at = NOW(),
    picked_up_by = driver_uuid,
    updated_at = NOW()
  WHERE id = order_uuid;
  
  -- إنشاء سجل في تاريخ الطلب
  INSERT INTO order_status_history (order_id, status, changed_by, changed_at)
  VALUES (order_uuid, 'picked_up', driver_uuid, NOW());
  
  -- إرجاع نتيجة ناجحة
  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم تأكيد الاستلام بنجاح',
    'order_id', order_uuid,
    'order_number', v_order.order_number,
    'picked_up_at', NOW()
  );
END;
$$;

-- صلاحيات التنفيذ
GRANT EXECUTE ON FUNCTION verify_pickup_otp(UUID, VARCHAR, UUID) TO authenticated;

COMMENT ON FUNCTION verify_pickup_otp IS 'التحقق من OTP لاستلام السائق للطلب من البائع';

-- =====================================================
-- 4. دالة التحقق من OTP التسليم (Delivery Verification)
-- =====================================================
CREATE OR REPLACE FUNCTION verify_delivery_otp(
  order_uuid UUID,
  provided_otp VARCHAR(6),
  customer_uuid UUID,
  signature_data TEXT DEFAULT NULL,
  photo_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_result JSONB;
BEGIN
  -- جلب تفاصيل الطلب
  SELECT * INTO v_order
  FROM orders
  WHERE id = order_uuid;
  
  -- التحقق من وجود الطلب
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'order_not_found',
      'message', 'الطلب غير موجود'
    );
  END IF;
  
  -- التحقق من أن العميل هو صاحب الطلب
  IF v_order.customer_id != customer_uuid THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'customer_mismatch',
      'message', 'هذا الطلب لعميل آخر'
    );
  END IF;
  
  -- التحقق من صلاحية OTP
  IF v_order.delivery_otp_expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'otp_expired',
      'message', 'انتهت صلاحية الرمز'
    );
  END IF;
  
  -- التحقق من OTP
  IF v_order.delivery_otp != provided_otp THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_otp',
      'message', 'الرمز غير صحيح'
    );
  END IF;
  
  -- التحقق من الحالة المناسبة
  IF v_order.status NOT IN ('in_transit', 'picked_up') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_status',
      'message', 'حالة الطلب غير مناسبة للتسليم'
    );
  END IF;
  
  -- تحديث حالة الطلب
  UPDATE orders
  SET 
    status = 'delivered',
    delivered_at = NOW(),
    delivery_signature = signature_data,
    delivery_photo = photo_url,
    updated_at = NOW()
  WHERE id = order_uuid;
  
  -- إنشاء سجل في تاريخ الطلب
  INSERT INTO order_status_history (order_id, status, changed_by, changed_at)
  VALUES (order_uuid, 'delivered', customer_uuid, NOW());
  
  -- إرجاع نتيجة ناجحة
  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم تأكيد التسليم بنجاح',
    'order_id', order_uuid,
    'order_number', v_order.order_number,
    'delivered_at', NOW()
  );
END;
$$;

-- صلاحيات التنفيذ
GRANT EXECUTE ON FUNCTION verify_delivery_otp(UUID, VARCHAR, UUID, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION verify_delivery_otp IS 'التحقق من OTP لتسليم الطلب للعميل';

-- =====================================================
-- 5. دالة التحقق من QR الاستلام (Pickup QR Verification)
-- =====================================================
CREATE OR REPLACE FUNCTION verify_pickup_qr(
  qr_json_data TEXT,
  driver_uuid UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_qr_data JSONB;
  v_order_uuid UUID;
  v_otp VARCHAR(6);
  v_type TEXT;
  v_expires_timestamp BIGINT;
BEGIN
  -- تحويل النص إلى JSON
  BEGIN
    v_qr_data := qr_json_data::JSONB;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_qr_format',
      'message', 'تنسيق QR غير صحيح'
    );
  END;
  
  -- استخراج البيانات من QR
  v_type := v_qr_data->>'type';
  v_order_uuid := (v_qr_data->>'order_id')::UUID;
  v_otp := v_qr_data->>'otp';
  v_expires_timestamp := (v_qr_data->>'expires_at')::BIGINT;
  
  -- التحقق من نوع الرمز
  IF v_type != 'pickup' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'wrong_qr_type',
      'message', 'هذا الرمز ليس لاستلام الطلب'
    );
  END IF;
  
  -- التحقق من الصلاحية باستخدام timestamp
  IF v_expires_timestamp < EXTRACT(EPOCH FROM NOW())::BIGINT THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'qr_expired',
      'message', 'انتهت صلاحية الرمز'
    );
  END IF;
  
  -- استخدام دالة التحقق من OTP
  RETURN verify_pickup_otp(v_order_uuid, v_otp, driver_uuid);
END;
$$;

-- صلاحيات التنفيذ
GRANT EXECUTE ON FUNCTION verify_pickup_qr(TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION verify_pickup_qr IS 'التحقق من QR Code لاستلام السائق للطلب';

-- =====================================================
-- 6. دالة التحقق من QR التسليم (Delivery QR Verification)
-- =====================================================
CREATE OR REPLACE FUNCTION verify_delivery_qr(
  qr_json_data TEXT,
  customer_uuid UUID,
  signature_data TEXT DEFAULT NULL,
  photo_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_qr_data JSONB;
  v_order_uuid UUID;
  v_otp VARCHAR(6);
  v_type TEXT;
  v_expires_timestamp BIGINT;
BEGIN
  -- تحويل النص إلى JSON
  BEGIN
    v_qr_data := qr_json_data::JSONB;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_qr_format',
      'message', 'تنسيق QR غير صحيح'
    );
  END;
  
  -- استخراج البيانات من QR
  v_type := v_qr_data->>'type';
  v_order_uuid := (v_qr_data->>'order_id')::UUID;
  v_otp := v_qr_data->>'otp';
  v_expires_timestamp := (v_qr_data->>'expires_at')::BIGINT;
  
  -- التحقق من نوع الرمز
  IF v_type != 'delivery' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'wrong_qr_type',
      'message', 'هذا الرمز ليس لتسليم الطلب'
    );
  END IF;
  
  -- التحقق من الصلاحية باستخدام timestamp
  IF v_expires_timestamp < EXTRACT(EPOCH FROM NOW())::BIGINT THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'qr_expired',
      'message', 'انتهت صلاحية الرمز'
    );
  END IF;
  
  -- استخدام دالة التحقق من OTP
  RETURN verify_delivery_otp(v_order_uuid, v_otp, customer_uuid, signature_data, photo_url);
END;
$$;

-- صلاحيات التنفيذ
GRANT EXECUTE ON FUNCTION verify_delivery_qr(TEXT, UUID, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION verify_delivery_qr IS 'التحقق من QR Code لتسليم الطلب للعميل';

-- =====================================================
-- 7. Trigger لتوليد الأكواد تلقائياً
-- =====================================================
CREATE OR REPLACE FUNCTION auto_generate_verification_codes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- عند تأكيد الطلب، نولد أكواد الاستلام والتسليم
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- توليد أكواد الاستلام
    PERFORM generate_pickup_codes(NEW.id);
    
    -- توليد أكواد التسليم
    PERFORM generate_delivery_codes(NEW.id);
    
    RAISE NOTICE 'تم توليد أكواد QR و OTP للطلب: %', NEW.order_number;
  END IF;
  
  -- عند جاهزية الطلب، نولد أكواد الاستلام إن لم تكن موجودة
  IF NEW.status = 'ready' AND (NEW.pickup_otp IS NULL OR NEW.pickup_qr_code IS NULL) THEN
    PERFORM generate_pickup_codes(NEW.id);
    RAISE NOTICE 'تم توليد أكواد الاستلام للطلب: %', NEW.order_number;
  END IF;
  
  -- عند استلام السائق للطلب، نولد أكواد التسليم إن لم تكن موجودة
  IF NEW.status = 'picked_up' AND (NEW.delivery_otp IS NULL OR NEW.delivery_qr_code IS NULL) THEN
    PERFORM generate_delivery_codes(NEW.id);
    RAISE NOTICE 'تم توليد أكواد التسليم للطلب: %', NEW.order_number;
  END IF;
  
  RETURN NEW;
END;
$$;

-- حذف Trigger القديم إن وجد
DROP TRIGGER IF EXISTS trigger_auto_generate_codes ON orders;

-- إنشاء Trigger جديد
CREATE TRIGGER trigger_auto_generate_codes
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_verification_codes();

COMMENT ON TRIGGER trigger_auto_generate_codes ON orders IS 'توليد أكواد QR و OTP تلقائياً عند تحديث حالة الطلب';

-- =====================================================
-- 8. دالة إعادة توليد الأكواد (Regenerate Codes)
-- =====================================================
CREATE OR REPLACE FUNCTION regenerate_verification_codes(
  order_uuid UUID,
  code_type TEXT -- 'pickup' or 'delivery'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- التحقق من وجود الطلب
  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = order_uuid) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'order_not_found',
      'message', 'الطلب غير موجود'
    );
  END IF;

  IF code_type = 'pickup' THEN
    -- إعادة توليد أكواد الاستلام
    SELECT * INTO v_result FROM generate_pickup_codes(order_uuid);
    
    RETURN jsonb_build_object(
      'success', true,
      'type', 'pickup',
      'qr_code', v_result.qr_code,
      'otp', v_result.otp,
      'expires_at', v_result.expires_at
    );
    
  ELSIF code_type = 'delivery' THEN
    -- إعادة توليد أكواد التسليم
    SELECT * INTO v_result FROM generate_delivery_codes(order_uuid);
    
    RETURN jsonb_build_object(
      'success', true,
      'type', 'delivery',
      'qr_code', v_result.qr_code,
      'otp', v_result.otp,
      'expires_at', v_result.expires_at
    );
    
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_type',
      'message', 'نوع الكود غير صحيح. استخدم pickup أو delivery'
    );
  END IF;
END;
$$;

-- صلاحيات التنفيذ
GRANT EXECUTE ON FUNCTION regenerate_verification_codes(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION regenerate_verification_codes IS 'إعادة توليد أكواد QR و OTP للطلب';

-- =====================================================
-- 9. دالة الحصول على حالة الأكواد (Get Codes Status)
-- =====================================================
CREATE OR REPLACE FUNCTION get_verification_codes_status(order_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_result JSONB;
BEGIN
  -- جلب تفاصيل الطلب
  SELECT 
    id,
    order_number,
    status,
    pickup_otp,
    pickup_otp_expires_at,
    delivery_otp,
    delivery_otp_expires_at,
    picked_up_at,
    delivered_at
  INTO v_order
  FROM orders
  WHERE id = order_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'order_not_found'
    );
  END IF;
  
  -- بناء النتيجة
  v_result := jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'pickup', jsonb_build_object(
      'otp', v_order.pickup_otp,
      'expires_at', v_order.pickup_otp_expires_at,
      'is_expired', (v_order.pickup_otp_expires_at < NOW()),
      'verified_at', v_order.picked_up_at
    ),
    'delivery', jsonb_build_object(
      'otp', v_order.delivery_otp,
      'expires_at', v_order.delivery_otp_expires_at,
      'is_expired', (v_order.delivery_otp_expires_at < NOW()),
      'verified_at', v_order.delivered_at
    )
  );
  
  RETURN v_result;
END;
$$;

-- صلاحيات التنفيذ
GRANT EXECUTE ON FUNCTION get_verification_codes_status(UUID) TO authenticated;

COMMENT ON FUNCTION get_verification_codes_status IS 'الحصول على حالة أكواد التحقق للطلب';

-- =====================================================
-- 10. جدول تسجيل محاولات التحقق (Verification Attempts Log)
-- =====================================================
CREATE TABLE IF NOT EXISTS verification_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('pickup', 'delivery')),
  method VARCHAR(10) NOT NULL CHECK (method IN ('qr', 'otp')),
  attempted_by UUID REFERENCES users(id),
  provided_code VARCHAR(6),
  success BOOLEAN NOT NULL DEFAULT false,
  error_code VARCHAR(50),
  error_message TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_verification_attempts_order ON verification_attempts(order_id);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_user ON verification_attempts(attempted_by);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_date ON verification_attempts(attempted_at);

-- RLS Policies
ALTER TABLE verification_attempts ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بإنشاء محاولات
CREATE POLICY "Users can log verification attempts"
  ON verification_attempts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- السماح بقراءة المحاولات الخاصة بالمستخدم
CREATE POLICY "Users can view their own attempts"
  ON verification_attempts FOR SELECT
  TO authenticated
  USING (attempted_by = auth.uid());

-- السماح للإدارة بعرض جميع المحاولات
CREATE POLICY "Admins can view all attempts"
  ON verification_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

COMMENT ON TABLE verification_attempts IS 'سجل محاولات التحقق من QR و OTP';

-- =====================================================
-- 11. دالة تسجيل المحاولات (Log Verification Attempt)
-- =====================================================
CREATE OR REPLACE FUNCTION log_verification_attempt(
  p_order_id UUID,
  p_type TEXT,
  p_method TEXT,
  p_user_id UUID,
  p_code TEXT,
  p_success BOOLEAN,
  p_error_code TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO verification_attempts (
    order_id,
    verification_type,
    method,
    attempted_by,
    provided_code,
    success,
    error_code,
    error_message
  ) VALUES (
    p_order_id,
    p_type,
    p_method,
    p_user_id,
    p_code,
    p_success,
    p_error_code,
    p_error_message
  );
END;
$$;

GRANT EXECUTE ON FUNCTION log_verification_attempt TO authenticated;

-- =====================================================
-- النهاية - System Ready!
-- =====================================================

-- عرض ملخص الدوال المنشأة
DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ تم إنشاء نظام QR/OTP بنجاح!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'الدوال المتاحة:';
  RAISE NOTICE '1. generate_pickup_codes(order_uuid)';
  RAISE NOTICE '2. generate_delivery_codes(order_uuid)';
  RAISE NOTICE '3. verify_pickup_otp(order_uuid, otp, driver_id)';
  RAISE NOTICE '4. verify_delivery_otp(order_uuid, otp, customer_id)';
  RAISE NOTICE '5. verify_pickup_qr(qr_json, driver_id)';
  RAISE NOTICE '6. verify_delivery_qr(qr_json, customer_id)';
  RAISE NOTICE '7. regenerate_verification_codes(order_uuid, type)';
  RAISE NOTICE '8. get_verification_codes_status(order_uuid)';
  RAISE NOTICE '====================================';
END $$;
