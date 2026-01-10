-- =====================================================
-- تشفير معلومات البنك في payout_requests
-- Encrypt Bank Information in Payout Requests
-- =====================================================
-- التاريخ: 10 يناير 2026
-- الهدف: حل ثغرة DL-002 (تخزين معلومات البنك كنص عادي)
-- =====================================================

-- =====================================================
-- 1. تفعيل pgcrypto extension
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 2. إضافة أعمدة مشفرة جديدة
-- =====================================================

-- إضافة أعمدة مشفرة (إذا لم تكن موجودة)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payout_requests' AND column_name = 'account_number_encrypted'
  ) THEN
    ALTER TABLE public.payout_requests
    ADD COLUMN account_number_encrypted BYTEA;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payout_requests' AND column_name = 'iban_encrypted'
  ) THEN
    ALTER TABLE public.payout_requests
    ADD COLUMN iban_encrypted BYTEA;
  END IF;
END $$;

-- =====================================================
-- 3. دوال مساعدة للتشفير وفك التشفير
-- =====================================================

-- دالة لتشفير البيانات
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(
  p_data TEXT,
  p_key TEXT DEFAULT 'your-encryption-key-here-change-this'
)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_data IS NULL OR p_data = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_encrypt(p_data, p_key);
END;
$$;

-- دالة لفك تشفير البيانات
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(
  p_encrypted_data BYTEA,
  p_key TEXT DEFAULT 'your-encryption-key-here-change-this'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_decrypt(p_encrypted_data, p_key);
END;
$$;

-- =====================================================
-- 4. دالة آمنة لإنشاء طلب سحب
-- =====================================================

CREATE OR REPLACE FUNCTION create_payout_request_secure(
  p_vendor_id UUID,
  p_amount DECIMAL(10, 2),
  p_bank_name TEXT,
  p_account_number TEXT,
  p_iban TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
  v_payout_id UUID;
  v_encryption_key TEXT := 'your-encryption-key-here-change-this'; -- يجب تغيير هذا المفتاح
BEGIN
  -- التحقق من أن المستخدم مصادق عليه
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'يجب تسجيل الدخول أولاً'
    );
  END IF;
  
  -- التحقق من أن المستخدم هو صاحب المتجر
  IF NOT EXISTS (
    SELECT 1 FROM stores
    WHERE id = p_vendor_id AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'forbidden',
      'message', 'غير مصرح لك بإنشاء طلب سحب لهذا المتجر'
    );
  END IF;
  
  -- التحقق من صحة المبلغ
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_amount',
      'message', 'المبلغ يجب أن يكون أكبر من صفر'
    );
  END IF;
  
  -- جلب بيانات المحفظة
  SELECT * INTO v_wallet
  FROM vendor_wallets
  WHERE vendor_id = p_vendor_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'wallet_not_found',
      'message', 'المحفظة غير موجودة'
    );
  END IF;
  
  -- التحقق من الرصيد المتاح
  IF v_wallet.current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_balance',
      'message', 'الرصيد غير كافي',
      'available_balance', v_wallet.current_balance
    );
  END IF;
  
  -- التحقق من الحد الأدنى للسحب (50 دينار)
  IF p_amount < 50 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'minimum_amount',
      'message', 'الحد الأدنى للسحب هو 50 دينار'
    );
  END IF;
  
  -- التحقق من الحد الأقصى للسحب (10000 دينار)
  IF p_amount > 10000 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'maximum_amount',
      'message', 'الحد الأقصى للسحب هو 10000 دينار'
    );
  END IF;
  
  -- إنشاء طلب السحب مع تشفير المعلومات الحساسة
  INSERT INTO payout_requests (
    vendor_id,
    amount,
    bank_name,
    account_number_encrypted,
    iban_encrypted,
    status,
    requested_at
  )
  VALUES (
    p_vendor_id,
    p_amount,
    p_bank_name,
    pgp_sym_encrypt(p_account_number, v_encryption_key),
    pgp_sym_encrypt(p_iban, v_encryption_key),
    'pending',
    NOW()
  )
  RETURNING id INTO v_payout_id;
  
  -- تحديث رصيد المحفظة (خصم المبلغ من current_balance)
  UPDATE vendor_wallets
  SET current_balance = current_balance - p_amount
  WHERE vendor_id = p_vendor_id;
  
  -- تسجيل المعاملة
  INSERT INTO wallet_transactions (
    vendor_id,
    type,
    amount,
    status,
    description,
    created_at
  )
  VALUES (
    p_vendor_id,
    'withdrawal',
    p_amount,
    'pending',
    'طلب سحب رقم: ' || v_payout_id::TEXT,
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'payout_id', v_payout_id,
    'amount', p_amount,
    'message', 'تم إنشاء طلب السحب بنجاح'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'internal_error',
      'message', 'حدث خطأ أثناء إنشاء طلب السحب'
    );
END;
$$;

-- =====================================================
-- 5. دالة للأدمن لعرض معلومات البنك المشفرة
-- =====================================================

CREATE OR REPLACE FUNCTION get_payout_request_details_admin(
  p_payout_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payout RECORD;
  v_encryption_key TEXT := 'your-encryption-key-here-change-this';
  v_result JSONB;
BEGIN
  -- التحقق من أن المستخدم هو أدمن
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'forbidden',
      'message', 'غير مصرح لك بعرض هذه المعلومات'
    );
  END IF;
  
  -- جلب بيانات طلب السحب
  SELECT * INTO v_payout
  FROM payout_requests
  WHERE id = p_payout_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_found',
      'message', 'طلب السحب غير موجود'
    );
  END IF;
  
  -- فك تشفير المعلومات الحساسة
  v_result := jsonb_build_object(
    'success', true,
    'id', v_payout.id,
    'vendor_id', v_payout.vendor_id,
    'amount', v_payout.amount,
    'bank_name', v_payout.bank_name,
    'account_number', pgp_sym_decrypt(v_payout.account_number_encrypted, v_encryption_key),
    'iban', pgp_sym_decrypt(v_payout.iban_encrypted, v_encryption_key),
    'status', v_payout.status,
    'requested_at', v_payout.requested_at
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'internal_error',
      'message', 'حدث خطأ أثناء جلب البيانات'
    );
END;
$$;

-- =====================================================
-- 6. منح الصلاحيات
-- =====================================================

GRANT EXECUTE ON FUNCTION encrypt_sensitive_data TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_sensitive_data TO authenticated;
GRANT EXECUTE ON FUNCTION create_payout_request_secure TO authenticated;
GRANT EXECUTE ON FUNCTION get_payout_request_details_admin TO authenticated;

-- =====================================================
-- 7. تعليقات للتوثيق
-- =====================================================

COMMENT ON FUNCTION encrypt_sensitive_data IS 'دالة لتشفير البيانات الحساسة باستخدام pgcrypto';
COMMENT ON FUNCTION decrypt_sensitive_data IS 'دالة لفك تشفير البيانات الحساسة';
COMMENT ON FUNCTION create_payout_request_secure IS 'دالة آمنة لإنشاء طلب سحب مع تشفير معلومات البنك';
COMMENT ON FUNCTION get_payout_request_details_admin IS 'دالة للأدمن لعرض معلومات البنك المشفرة';

-- =====================================================
-- ملاحظات مهمة:
-- =====================================================
-- 1. يجب تغيير مفتاح التشفير 'your-encryption-key-here-change-this'
--    إلى مفتاح قوي وفريد ويجب تخزينه في متغيرات البيئة
-- 2. يجب ترحيل البيانات القديمة من account_number و iban
--    إلى account_number_encrypted و iban_encrypted
-- 3. بعد الترحيل، يمكن حذف الأعمدة القديمة:
--    ALTER TABLE payout_requests DROP COLUMN account_number;
--    ALTER TABLE payout_requests DROP COLUMN iban;
-- =====================================================
