-- =========================================================
-- 07-rls-security-policies.sql
-- سياسات الأمان وحماية الصفوف
-- =========================================================

-- =====================================================
-- تفعيل Row Level Security
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_storage ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- سياسات جدول المستخدمين
-- =====================================================

CREATE POLICY users_select_policy ON public.users FOR SELECT
  USING (auth.uid() = id OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

CREATE POLICY users_update_own_policy ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY users_insert_policy ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- سياسات جدول التجار
-- =====================================================

CREATE POLICY vendors_select_policy ON public.vendors FOR SELECT USING (true);

CREATE POLICY vendors_insert_admin_policy ON public.vendors FOR INSERT
  WITH CHECK (EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

CREATE POLICY vendors_update_policy ON public.vendors FOR UPDATE
  USING (owner_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ))
  WITH CHECK (owner_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

-- =====================================================
-- سياسات جدول السائقين
-- =====================================================

CREATE POLICY drivers_select_policy ON public.drivers FOR SELECT
  USING (user_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role IN ('admin', 'vendor')
  ));

CREATE POLICY drivers_insert_policy ON public.drivers FOR INSERT
  WITH CHECK (user_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

CREATE POLICY drivers_update_policy ON public.drivers FOR UPDATE
  USING (user_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ))
  WITH CHECK (user_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

-- =====================================================
-- سياسات جدول المنتجات
-- =====================================================

CREATE POLICY products_select_policy ON public.products FOR SELECT
  USING (is_active = true OR vendor_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

CREATE POLICY products_insert_policy ON public.products FOR INSERT
  WITH CHECK (vendor_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

CREATE POLICY products_update_policy ON public.products FOR UPDATE
  USING (vendor_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ))
  WITH CHECK (vendor_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

-- =====================================================
-- سياسات جدول التقييمات
-- =====================================================

CREATE POLICY reviews_select_policy ON public.reviews FOR SELECT USING (true);

CREATE POLICY reviews_insert_policy ON public.reviews FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY reviews_update_policy ON public.reviews FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- =====================================================
-- سياسات جدول الطلبات
-- =====================================================

CREATE POLICY orders_select_policy ON public.orders FOR SELECT
  USING (customer_id = auth.uid() OR vendor_id = auth.uid() OR 
         driver_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

CREATE POLICY orders_insert_policy ON public.orders FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY orders_update_policy ON public.orders FOR UPDATE
  USING (customer_id = auth.uid() OR vendor_id = auth.uid() OR 
         driver_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ))
  WITH CHECK (customer_id = auth.uid() OR vendor_id = auth.uid() OR 
             driver_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

-- =====================================================
-- سياسات جدول عناصر الطلب
-- =====================================================

CREATE POLICY order_items_select_policy ON public.order_items FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM public.orders WHERE id = order_id AND (
      customer_id = auth.uid() OR vendor_id = auth.uid()
    )
  ) OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

-- =====================================================
-- سياسات جدول التوصيل
-- =====================================================

CREATE POLICY deliveries_select_policy ON public.deliveries FOR SELECT
  USING (driver_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.orders WHERE id = order_id AND (
      customer_id = auth.uid() OR vendor_id = auth.uid()
    )
  ) OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

-- =====================================================
-- سياسات جدول العربة
-- =====================================================

CREATE POLICY cart_items_select_policy ON public.cart_items FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY cart_items_insert_policy ON public.cart_items FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY cart_items_update_policy ON public.cart_items FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY cart_items_delete_policy ON public.cart_items FOR DELETE
  USING (customer_id = auth.uid());

-- =====================================================
-- سياسات جدول قائمة الرغبات
-- =====================================================

CREATE POLICY wishlists_select_policy ON public.wishlists FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY wishlists_insert_policy ON public.wishlists FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY wishlists_delete_policy ON public.wishlists FOR DELETE
  USING (customer_id = auth.uid());

-- =====================================================
-- سياسات جدول المعاملات المالية
-- =====================================================

CREATE POLICY transactions_select_policy ON public.transactions FOR SELECT
  USING (user_id = auth.uid() OR vendor_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

-- =====================================================
-- سياسات جدول الإخطارات
-- =====================================================

CREATE POLICY notifications_select_policy ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY notifications_update_policy ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- سياسات جدول الرسائل
-- =====================================================

CREATE POLICY messages_select_policy ON public.messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY messages_insert_policy ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- =====================================================
-- سياسات جدول تذاكر الدعم
-- =====================================================

CREATE POLICY support_tickets_select_policy ON public.support_tickets FOR SELECT
  USING (customer_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role IN ('admin', 'vendor')
  ));

CREATE POLICY support_tickets_insert_policy ON public.support_tickets FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- =====================================================
-- سياسات جدول الأسئلة الشائعة
-- =====================================================

CREATE POLICY faqs_select_policy ON public.faqs FOR SELECT
  USING (is_active = true OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

CREATE POLICY faqs_insert_policy ON public.faqs FOR INSERT
  WITH CHECK (EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

CREATE POLICY faqs_update_policy ON public.faqs FOR UPDATE
  USING (EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ))
  WITH CHECK (EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

SELECT 'تم تطبيق سياسات الأمان بنجاح ✓' AS status;

-- =====================================================
-- سياسات جدول المطاعم
-- =====================================================

CREATE POLICY restaurants_select_policy ON public.restaurants FOR SELECT USING (true);

CREATE POLICY restaurants_insert_owner_policy ON public.restaurants FOR INSERT
  WITH CHECK (owner_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

CREATE POLICY restaurants_update_policy ON public.restaurants FOR UPDATE
  USING (owner_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ))
  WITH CHECK (owner_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

-- =====================================================
-- سياسات جدول فئات القائمة
-- =====================================================

CREATE POLICY menu_categories_select_policy ON public.menu_categories FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND is_active = true
  ) OR EXISTS(
    SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()
  ));

CREATE POLICY menu_categories_insert_policy ON public.menu_categories FOR INSERT
  WITH CHECK (EXISTS(
    SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()
  ));

CREATE POLICY menu_categories_update_policy ON public.menu_categories FOR UPDATE
  USING (EXISTS(
    SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS(
    SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()
  ));

-- =====================================================
-- سياسات جدول عناصر القائمة
-- =====================================================

CREATE POLICY menu_items_select_policy ON public.menu_items FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND is_active = true
  ) OR EXISTS(
    SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()
  ));

CREATE POLICY menu_items_insert_policy ON public.menu_items FOR INSERT
  WITH CHECK (EXISTS(
    SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()
  ));

CREATE POLICY menu_items_update_policy ON public.menu_items FOR UPDATE
  USING (EXISTS(
    SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS(
    SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()
  ));

-- =====================================================
-- سياسات جدول حالات التحضير
-- =====================================================

CREATE POLICY order_preparations_select_policy ON public.order_preparations FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM public.orders WHERE id = order_id AND (
      customer_id = auth.uid() OR vendor_id = auth.uid()
    )
  ) OR EXISTS(
    SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()
  ) OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

CREATE POLICY order_preparations_insert_policy ON public.order_preparations FOR INSERT
  WITH CHECK (EXISTS(
    SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()
  ));

CREATE POLICY order_preparations_update_policy ON public.order_preparations FOR UPDATE
  USING (EXISTS(
    SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS(
    SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()
  ));

-- =====================================================
-- سياسات جدول الملفات
-- =====================================================

CREATE POLICY file_storage_select_policy ON public.file_storage FOR SELECT
  USING (user_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));

CREATE POLICY file_storage_insert_policy ON public.file_storage FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY file_storage_delete_policy ON public.file_storage FOR DELETE
  USING (user_id = auth.uid() OR EXISTS(
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));
