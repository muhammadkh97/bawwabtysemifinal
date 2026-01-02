-- =========================================================
-- 01-drop-old-tables.sql
-- حذف الجداول القديمة
-- =========================================================

-- حذف الجداول بحذر
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.faqs CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.deals CASCADE;
DROP TABLE IF EXISTS public.loyalty_points CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.disputes CASCADE;
DROP TABLE IF EXISTS public.payout_requests CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.wishlists CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.deliveries CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.drivers CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.order_preparations CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.menu_categories CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;
DROP TABLE IF EXISTS public.file_storage CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.static_pages CASCADE;

-- حذف الأنواع المخصصة
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.vendor_type CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.delivery_status CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;

-- حذف الدوال
DROP FUNCTION IF EXISTS public.update_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.search_products(TEXT, UUID, DECIMAL, DECIMAL, INT, INT) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_loyalty_points(DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS public.apply_coupon(VARCHAR, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS public.get_vendor_total_revenue(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_vendor_order_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_average_rating(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_product_stock(UUID, INT) CASCADE;
DROP FUNCTION IF EXISTS public.create_notification(UUID, VARCHAR, VARCHAR, TEXT, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.update_product_rating() CASCADE;
DROP FUNCTION IF EXISTS public.update_review_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_product_stock() CASCADE;
DROP FUNCTION IF EXISTS public.add_loyalty_points() CASCADE;
DROP FUNCTION IF EXISTS public.log_transaction() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_orphaned_files() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_restaurant_dashboard_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_vendor_dashboard_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_driver_dashboard_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_customer_dashboard_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_top_restaurants(INT) CASCADE;
DROP FUNCTION IF EXISTS public.get_top_menu_items(UUID, INT) CASCADE;

SELECT 'تم حذف الجداول والدوال القديمة بنجاح ✓' AS status;
