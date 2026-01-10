-- =====================================================
-- نظام Audit Logging للعمليات الحساسة
-- Audit Logging System for Sensitive Operations
-- =====================================================
-- التاريخ: 10 يناير 2026
-- الهدف: تسجيل جميع العمليات الحساسة لأغراض المراجعة والأمان
-- =====================================================

-- =====================================================
-- 1. إنشاء جدول audit_log
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,
  status TEXT CHECK (status IN ('success', 'failure', 'error')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء indexes للبحث السريع
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_status ON public.audit_log(status);

-- إضافة تعليق
COMMENT ON TABLE public.audit_log IS 'سجل المراجعة لجميع العمليات الحساسة';

-- =====================================================
-- 2. دالة لتسجيل العمليات
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_audit(
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_status TEXT DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_id UUID;
  v_user_id UUID;
BEGIN
  -- الحصول على معرف المستخدم الحالي
  v_user_id := auth.uid();
  
  -- إدراج السجل
  INSERT INTO audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    status,
    error_message,
    metadata,
    created_at
  )
  VALUES (
    v_user_id,
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values,
    p_status,
    p_error_message,
    p_metadata,
    NOW()
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

GRANT EXECUTE ON FUNCTION log_audit TO authenticated;

-- =====================================================
-- 3. Triggers للتسجيل التلقائي
-- =====================================================

-- دالة Trigger عامة
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_values JSONB;
  v_new_values JSONB;
  v_action TEXT;
BEGIN
  -- تحديد نوع العملية
  IF TG_OP = 'INSERT' THEN
    v_action := 'insert';
    v_old_values := NULL;
    v_new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_old_values := to_jsonb(OLD);
    v_new_values := NULL;
  END IF;
  
  -- تسجيل العملية
  PERFORM log_audit(
    v_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_old_values,
    v_new_values,
    'success',
    NULL,
    jsonb_build_object('trigger', TG_NAME)
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- =====================================================
-- 4. تطبيق Triggers على الجداول الحساسة
-- =====================================================

-- Trigger على جدول orders
DROP TRIGGER IF EXISTS audit_orders_trigger ON public.orders;
CREATE TRIGGER audit_orders_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

-- Trigger على جدول payout_requests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payout_requests') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_payout_requests_trigger ON public.payout_requests';
    EXECUTE 'CREATE TRIGGER audit_payout_requests_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.payout_requests
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function()';
  END IF;
END $$;

-- Trigger على جدول vendor_wallets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_wallets') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_vendor_wallets_trigger ON public.vendor_wallets';
    EXECUTE 'CREATE TRIGGER audit_vendor_wallets_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.vendor_wallets
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function()';
  END IF;
END $$;

-- Trigger على جدول users (فقط للتحديثات الحساسة)
DROP TRIGGER IF EXISTS audit_users_trigger ON public.users;
CREATE TRIGGER audit_users_trigger
AFTER UPDATE OF role, is_active ON public.users
FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- 5. دوال للاستعلام عن السجلات
-- =====================================================

-- دالة لجلب سجلات المستخدم
CREATE OR REPLACE FUNCTION public.get_user_audit_logs(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  action TEXT,
  table_name TEXT,
  record_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- التحقق من الصلاحيات
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'يجب تسجيل الدخول أولاً';
  END IF;
  
  -- المستخدم يمكنه عرض سجلاته فقط، الأدمن يمكنه عرض سجلات أي مستخدم
  IF auth.uid() != p_user_id AND NOT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض هذه السجلات';
  END IF;
  
  RETURN QUERY
  SELECT 
    al.id,
    al.action,
    al.table_name,
    al.record_id,
    al.status,
    al.created_at
  FROM audit_log al
  WHERE al.user_id = p_user_id
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_audit_logs TO authenticated;

-- دالة لجلب سجلات جدول معين (للأدمن فقط)
CREATE OR REPLACE FUNCTION public.get_table_audit_logs(
  p_table_name TEXT,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  action TEXT,
  record_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- التحقق من الصلاحيات: فقط الأدمن
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض هذه السجلات';
  END IF;
  
  RETURN QUERY
  SELECT 
    al.id,
    al.user_id,
    al.action,
    al.record_id,
    al.status,
    al.created_at
  FROM audit_log al
  WHERE al.table_name = p_table_name
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_table_audit_logs TO authenticated;

-- =====================================================
-- 6. دالة لحذف السجلات القديمة
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(
  days_old INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- التحقق من الصلاحيات: فقط الأدمن
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بحذف السجلات';
  END IF;
  
  DELETE FROM audit_log
  WHERE created_at < NOW() - (days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs TO authenticated;

-- =====================================================
-- 7. View للإحصائيات (للأدمن)
-- =====================================================

CREATE OR REPLACE VIEW public.audit_log_stats AS
SELECT 
  action,
  table_name,
  status,
  COUNT(*) as count,
  DATE_TRUNC('day', created_at) as day
FROM audit_log
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY action, table_name, status, DATE_TRUNC('day', created_at)
ORDER BY day DESC, count DESC;

-- =====================================================
-- 8. RLS على جدول audit_log
-- =====================================================

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- المستخدمون يمكنهم عرض سجلاتهم فقط
CREATE POLICY "Users can view own audit logs"
ON public.audit_log
FOR SELECT
USING (user_id = auth.uid());

-- الأدمن يمكنهم عرض جميع السجلات
CREATE POLICY "Admins can view all audit logs"
ON public.audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- لا أحد يمكنه تعديل أو حذف السجلات مباشرة
-- (فقط عبر الدوال المخصصة)

-- =====================================================
-- تعليقات للتوثيق
-- =====================================================

COMMENT ON FUNCTION log_audit IS 'دالة لتسجيل العمليات في سجل المراجعة';
COMMENT ON FUNCTION get_user_audit_logs IS 'دالة لجلب سجلات المراجعة لمستخدم معين';
COMMENT ON FUNCTION get_table_audit_logs IS 'دالة لجلب سجلات المراجعة لجدول معين (للأدمن فقط)';
COMMENT ON FUNCTION cleanup_old_audit_logs IS 'دالة لحذف سجلات المراجعة القديمة (للأدمن فقط)';

-- =====================================================
-- ملاحظات نهائية
-- =====================================================
-- 1. يتم تسجيل جميع العمليات على الجداول الحساسة تلقائياً
-- 2. يمكن استخدام log_audit() يدوياً لتسجيل عمليات إضافية
-- 3. السجلات محمية بـ RLS ولا يمكن تعديلها أو حذفها مباشرة
-- 4. يجب تنظيف السجلات القديمة بشكل دوري (مثلاً كل 90 يوم)
-- =====================================================
