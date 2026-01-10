-- ====================================
-- إصلاح search_path للدوال
-- إضافة SET search_path = '' لجميع الدوال
-- ====================================

-- 1. update_delivery_assignments_updated_at
CREATE OR REPLACE FUNCTION public.update_delivery_assignments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. update_vendor_wallets_updated_at
CREATE OR REPLACE FUNCTION public.update_vendor_wallets_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. update_offers_updated_at
CREATE OR REPLACE FUNCTION public.update_offers_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4. trigger_save_rate_history
CREATE OR REPLACE FUNCTION public.trigger_save_rate_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.exchange_rates_history (
    from_currency,
    to_currency,
    rate,
    recorded_at
  ) VALUES (
    NEW.from_currency,
    NEW.to_currency,
    NEW.rate,
    now()
  );
  RETURN NEW;
END;
$$;

-- 5. update_chat_last_message
CREATE OR REPLACE FUNCTION public.update_chat_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.chats
  SET 
    last_message_at = NEW.created_at,
    last_message_sender_id = NEW.sender_id
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;

-- 6. increment_unread_count
CREATE OR REPLACE FUNCTION public.increment_unread_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.chats
  SET unread_count = COALESCE(unread_count, 0) + 1
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;

-- 7. generate_invitation_code
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.staff_invitations WHERE invitation_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;

-- ملاحظة: الدوال الأخرى تحتاج إلى مراجعة يدوية لأنها معقدة
-- يمكن تطبيق نفس المبدأ عليها بإضافة SET search_path = ''

-- قائمة الدوال المتبقية التي تحتاج إلى إصلاح:
-- - get_vendor_wallet_summary
-- - sync_order_status_with_assignment
-- - get_vendor_transactions
-- - get_estimated_delivery
-- - calculate_order_total
-- - get_products_by_currency
-- - mark_stale_exchange_rates
-- - verify_delivery_otp
-- - calculate_commission_on_delivery
-- - get_unread_count
-- - find_delivery_zone
-- - update_driver_location
-- - create_order_with_delivery
-- - update_driver_order_status_simple
-- - migrate_restaurant_items_to_new_cart

-- يرجى مراجعة كل دالة وإضافة SET search_path = '' بعد SECURITY DEFINER
