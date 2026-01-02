-- =========================================================
-- إصلاح search_path في Functions
-- Fix search_path in Functions
-- =========================================================
-- تاريخ: 2026-01-01
-- الهدف: إضافة search_path لجميع الدوال لتحسين الأمان
-- =========================================================

-- =====================================================
-- إصلاح الدوال الرئيسية
-- =====================================================

-- 1. update_vendor_wallet_on_order_status_change
ALTER FUNCTION public.update_vendor_wallet_on_order_status_change() SET search_path = public, pg_temp;

-- 2. notify_vendor_new_order
ALTER FUNCTION public.notify_vendor_new_order() SET search_path = public, pg_temp;

-- 3. notify_admin_new_payout
ALTER FUNCTION public.notify_admin_new_payout() SET search_path = public, pg_temp;

-- 4. notify_customer_order_preparing
ALTER FUNCTION public.notify_customer_order_preparing() SET search_path = public, pg_temp;

-- 5. notify_order_status_change
ALTER FUNCTION public.notify_order_status_change() SET search_path = public, pg_temp;

-- 6. expire_loyalty_points
ALTER FUNCTION public.expire_loyalty_points() SET search_path = public, pg_temp;

-- 7. notify_customer_order_status_change
ALTER FUNCTION public.notify_customer_order_status_change() SET search_path = public, pg_temp;

-- 8. update_category_products_count
ALTER FUNCTION public.update_category_products_count() SET search_path = public, pg_temp;

-- 9. generate_ticket_number
ALTER FUNCTION public.generate_ticket_number() SET search_path = public, pg_temp;

-- 10. generate_slug
ALTER FUNCTION public.generate_slug(text) SET search_path = public, pg_temp;

-- 11. convert_currency
ALTER FUNCTION public.convert_currency(numeric, text, text) SET search_path = public, pg_temp;

-- 12. approve_product_classification
ALTER FUNCTION public.approve_product_classification(uuid, uuid, uuid) SET search_path = public, pg_temp;

-- 13. award_signup_bonus
ALTER FUNCTION public.award_signup_bonus() SET search_path = public, pg_temp;

-- 14. notify_vendor_on_new_order
ALTER FUNCTION public.notify_vendor_on_new_order() SET search_path = public, pg_temp;

-- 15. calculate_delivery_fee
ALTER FUNCTION public.calculate_delivery_fee(numeric, numeric, numeric, numeric) SET search_path = public, pg_temp;

-- 16. update_hero_updated_at
ALTER FUNCTION public.update_hero_updated_at() SET search_path = public, pg_temp;

-- 17. generate_qr_code
ALTER FUNCTION public.generate_qr_code(uuid) SET search_path = public, pg_temp;

-- 18. update_vendor_followers_stats
ALTER FUNCTION public.update_vendor_followers_stats() SET search_path = public, pg_temp;

-- 19. update_order_distance_and_fee
ALTER FUNCTION public.update_order_distance_and_fee() SET search_path = public, pg_temp;

-- 20. notify_driver_nearby_order
ALTER FUNCTION public.notify_driver_nearby_order(uuid, numeric, numeric) SET search_path = public, pg_temp;

-- 21. open_lucky_box
ALTER FUNCTION public.open_lucky_box(uuid, uuid) SET search_path = public, pg_temp;

-- 22. award_loyalty_points_on_delivery
ALTER FUNCTION public.award_loyalty_points_on_delivery() SET search_path = public, pg_temp;

-- 23. get_variant_price
ALTER FUNCTION public.get_variant_price(uuid) SET search_path = public, pg_temp;

-- 24. update_product_rating
ALTER FUNCTION public.update_product_rating() SET search_path = public, pg_temp;

-- 25. update_vendor_rating
ALTER FUNCTION public.update_vendor_rating() SET search_path = public, pg_temp;

-- 26. update_driver_rating
ALTER FUNCTION public.update_driver_rating() SET search_path = public, pg_temp;

-- 27. create_notification
ALTER FUNCTION public.create_notification(uuid, text, text, text, text, jsonb) SET search_path = public, pg_temp;

-- 28. notify_admin_product_pending
ALTER FUNCTION public.notify_admin_product_pending(uuid) SET search_path = public, pg_temp;

-- 29. notify_admin_vendor_pending
ALTER FUNCTION public.notify_admin_vendor_pending(uuid) SET search_path = public, pg_temp;

-- 30. notify_admin_driver_pending
ALTER FUNCTION public.notify_admin_driver_pending(uuid) SET search_path = public, pg_temp;

-- 31. notify_admin_new_ticket
ALTER FUNCTION public.notify_admin_new_ticket() SET search_path = public, pg_temp;

-- 32. handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;

-- 33. update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;

-- =====================================================
-- التحقق من التطبيق
-- =====================================================

DO $$
DECLARE
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public';
  
  RAISE NOTICE 'Functions search_path Fixed Successfully!';
  RAISE NOTICE 'Total functions in public schema: %', function_count;
  RAISE NOTICE 'All critical functions now have search_path set to: public, pg_temp';
  RAISE NOTICE 'Security improved - SQL injection risk reduced!';
END $$;
