-- =========================================================
-- إصلاح دالة get_driver_dashboard_stats لقبول p_driver_id
-- Fix get_driver_dashboard_stats function to accept p_driver_id
-- =========================================================

-- إنشاء دالة بديلة تقبل p_driver_id (معرف السائق مباشرة)
CREATE OR REPLACE FUNCTION public.get_driver_dashboard_stats(p_driver_id uuid)
RETURNS TABLE(
  total_deliveries bigint,
  total_earnings numeric,
  pending_deliveries bigint,
  completed_today bigint,
  average_rating numeric,
  wallet_balance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  -- الحصول على user_id من drivers table
  SELECT user_id INTO v_user_id
  FROM public.drivers
  WHERE id = p_driver_id
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Driver not found';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.orders WHERE driver_id = p_driver_id AND status = 'delivered')::BIGINT,
    (SELECT COALESCE(SUM(delivery_fee), 0) FROM public.orders WHERE driver_id = p_driver_id AND status = 'delivered')::NUMERIC,
    (SELECT COUNT(*) FROM public.orders WHERE driver_id = p_driver_id AND status IN ('in_delivery', 'ready'))::BIGINT,
    (SELECT COUNT(*) FROM public.orders WHERE driver_id = p_driver_id AND status = 'delivered' AND DATE(delivered_at) = CURRENT_DATE)::BIGINT,
    (SELECT COALESCE(rating, 0) FROM public.drivers WHERE id = p_driver_id)::NUMERIC,
    (SELECT COALESCE(w.balance, 0) FROM public.wallets w WHERE w.user_id = v_user_id)::NUMERIC;
END;
$function$;

-- التحقق من الدوال
SELECT proname, pg_get_function_identity_arguments(oid) as args
FROM pg_proc
WHERE proname = 'get_driver_dashboard_stats'
ORDER BY args;
