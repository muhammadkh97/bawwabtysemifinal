-- =========================================================
-- إضافة Indexes على Foreign Keys لتحسين الأداء
-- Add Indexes on Foreign Keys for Performance
-- =========================================================
-- تاريخ: 2026-01-01
-- الهدف: تحسين أداء الاستعلامات والـ JOINs
-- =========================================================

-- =====================================================
-- 1. ai_product_classifications
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ai_classifications_suggested_category 
  ON public.ai_product_classifications(ai_suggested_category_id);

CREATE INDEX IF NOT EXISTS idx_ai_classifications_final_category 
  ON public.ai_product_classifications(final_category_id);

CREATE INDEX IF NOT EXISTS idx_ai_classifications_reviewed_by 
  ON public.ai_product_classifications(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_ai_classifications_vendor_category 
  ON public.ai_product_classifications(vendor_category_id);

-- =====================================================
-- 2. contact_messages
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_contact_messages_replied_by 
  ON public.contact_messages(replied_by);

-- =====================================================
-- 3. disputes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_disputes_resolved_by 
  ON public.disputes(resolved_by);

-- =====================================================
-- 4. documents
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_documents_verified_by 
  ON public.documents(verified_by);

-- =====================================================
-- 5. driver_notifications
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_driver_notifications_order_id 
  ON public.driver_notifications(order_id);

CREATE INDEX IF NOT EXISTS idx_driver_notifications_restaurant_id 
  ON public.driver_notifications(restaurant_id);

-- =====================================================
-- 6. drivers
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_drivers_approved_by 
  ON public.drivers(approved_by);

-- =====================================================
-- 7. financial_reports
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_financial_reports_generated_by 
  ON public.financial_reports(generated_by);

-- =====================================================
-- 8. hero_sections
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_hero_sections_last_edited_by 
  ON public.hero_sections(last_edited_by);

-- =====================================================
-- 9. loyalty_settings
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_loyalty_settings_updated_by 
  ON public.loyalty_settings(updated_by);

-- =====================================================
-- 10. lucky_boxes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_lucky_boxes_created_by 
  ON public.lucky_boxes(created_by);

-- =====================================================
-- 11. order_handoffs
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_order_handoffs_from_user_id 
  ON public.order_handoffs(from_user_id);

-- =====================================================
-- 12. order_items
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
  ON public.order_items(product_id);

-- =====================================================
-- 13. order_status_history
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_by 
  ON public.order_status_history(changed_by);

-- =====================================================
-- 14. orders - أهم الـ indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_orders_delivered_to 
  ON public.orders(delivered_to);

CREATE INDEX IF NOT EXISTS idx_orders_delivery_address_id 
  ON public.orders(delivery_address_id);

CREATE INDEX IF NOT EXISTS idx_orders_picked_up_by 
  ON public.orders(picked_up_by);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id 
  ON public.orders(restaurant_id);

-- =====================================================
-- 15. pages
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pages_last_edited_by 
  ON public.pages(last_edited_by);

-- =====================================================
-- 16. product_classification_history
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_product_class_history_ai_classification 
  ON public.product_classification_history(ai_classification_id);

CREATE INDEX IF NOT EXISTS idx_product_class_history_changed_by 
  ON public.product_classification_history(changed_by);

CREATE INDEX IF NOT EXISTS idx_product_class_history_new_category 
  ON public.product_classification_history(new_category_id);

CREATE INDEX IF NOT EXISTS idx_product_class_history_old_category 
  ON public.product_classification_history(old_category_id);

-- =====================================================
-- 17. products
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_approved_by 
  ON public.products(approved_by);

-- =====================================================
-- 18. refunds
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_refunds_processed_by 
  ON public.refunds(processed_by);

-- =====================================================
-- 19. restaurant_reviews
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_restaurant_reviews_restaurant_id 
  ON public.restaurant_reviews(restaurant_id);

-- =====================================================
-- 20. reviews
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_reviews_product_id 
  ON public.reviews(product_id);

-- =====================================================
-- 21. support_tickets
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to 
  ON public.support_tickets(assigned_to);

CREATE INDEX IF NOT EXISTS idx_support_tickets_resolved_by 
  ON public.support_tickets(resolved_by);

-- =====================================================
-- 22. transactions
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_transactions_processed_by 
  ON public.transactions(processed_by);

-- =====================================================
-- 23. vendors
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_vendors_approved_by 
  ON public.vendors(approved_by);

-- =====================================================
-- 24. wallets
-- =====================================================

-- Index على user_id موجود مسبقاً عادةً

-- =====================================================
-- 25. التحقق من إنشاء الـ Indexes
-- =====================================================

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
  
  RAISE NOTICE 'Performance Indexes Created Successfully!';
  RAISE NOTICE 'Total indexes in public schema: %', index_count;
  RAISE NOTICE 'Foreign key indexes added for better query performance';
END $$;
