-- =========================================================
-- سياسات الأمان - Row Level Security Policies
-- =========================================================
-- الإصدار: 2.0
-- التاريخ: 2026-01-02
-- الوصف: سياسات RLS كاملة وآمنة لجميع الجداول
-- =========================================================

-- =====================================================
-- 1. سياسات جدول profiles
-- =====================================================

-- عرض الملفات الشخصية: الكل يمكنهم رؤية الملفات النشطة فقط
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (is_active = true);

-- تحديث الملف الشخصي: المستخدم نفسه فقط
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- عرض الملف الشخصي الخاص: المستخدم نفسه أو المدير
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- =====================================================
-- 2. سياسات جدول user_settings
-- =====================================================

-- عرض وتحديث الإعدادات: المستخدم نفسه فقط
CREATE POLICY "user_settings_select_own"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_settings_update_own"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. سياسات جدول user_addresses
-- =====================================================

-- عرض العناوين: المستخدم نفسه فقط
CREATE POLICY "user_addresses_select_own"
  ON public.user_addresses FOR SELECT
  USING (auth.uid() = user_id);

-- إضافة عنوان: المستخدم نفسه فقط
CREATE POLICY "user_addresses_insert_own"
  ON public.user_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- تحديث العنوان: المستخدم نفسه فقط
CREATE POLICY "user_addresses_update_own"
  ON public.user_addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- حذف العنوان: المستخدم نفسه فقط
CREATE POLICY "user_addresses_delete_own"
  ON public.user_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. سياسات جدول favorites
-- =====================================================

-- عرض المفضلة: المستخدم نفسه فقط
CREATE POLICY "favorites_select_own"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

-- إضافة للمفضلة: المستخدم نفسه فقط
CREATE POLICY "favorites_insert_own"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- حذف من المفضلة: المستخدم نفسه فقط
CREATE POLICY "favorites_delete_own"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. سياسات جدول user_follows
-- =====================================================

-- عرض المتابعات: الكل
CREATE POLICY "user_follows_select_all"
  ON public.user_follows FOR SELECT
  USING (true);

-- إضافة متابعة: المستخدم نفسه فقط
CREATE POLICY "user_follows_insert_own"
  ON public.user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- حذف متابعة: المستخدم نفسه فقط
CREATE POLICY "user_follows_delete_own"
  ON public.user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- =====================================================
-- 6. سياسات جدول vendors
-- =====================================================

-- عرض المتاجر: المتاجر النشطة فقط للعامة
CREATE POLICY "vendors_select_public"
  ON public.vendors FOR SELECT
  USING (
    is_active = true AND status = 'approved' OR
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- إضافة متجر: أي مستخدم مسجل
CREATE POLICY "vendors_insert_authenticated"
  ON public.vendors FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- تحديث المتجر: المالك فقط
CREATE POLICY "vendors_update_owner"
  ON public.vendors FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- تحديث حالة المتجر: المدير فقط
CREATE POLICY "vendors_update_status_admin"
  ON public.vendors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- =====================================================
-- 7. سياسات جدول vendor_categories
-- =====================================================

-- عرض فئات المتجر: الكل
CREATE POLICY "vendor_categories_select_all"
  ON public.vendor_categories FOR SELECT
  USING (is_active = true);

-- إدارة الفئات: مالك المتجر فقط
CREATE POLICY "vendor_categories_manage_owner"
  ON public.vendor_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = vendor_categories.vendor_id AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = vendor_categories.vendor_id AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- 8. سياسات جدول categories
-- =====================================================

-- عرض الفئات: الكل
CREATE POLICY "categories_select_all"
  ON public.categories FOR SELECT
  USING (is_active = true);

-- إدارة الفئات: المدير فقط
CREATE POLICY "categories_manage_admin"
  ON public.categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- =====================================================
-- 9. سياسات جدول products
-- =====================================================

-- عرض المنتجات: المنتجات النشطة للكل، أو منتجات المتجر للمالك
CREATE POLICY "products_select_public"
  ON public.products FOR SELECT
  USING (
    is_active = true OR
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = products.vendor_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- إضافة منتج: مالك المتجر فقط
CREATE POLICY "products_insert_vendor_owner"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = products.vendor_id AND owner_id = auth.uid()
    )
  );

-- تحديث المنتج: مالك المتجر فقط
CREATE POLICY "products_update_vendor_owner"
  ON public.products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = products.vendor_id AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = products.vendor_id AND owner_id = auth.uid()
    )
  );

-- حذف المنتج: مالك المتجر فقط
CREATE POLICY "products_delete_vendor_owner"
  ON public.products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = products.vendor_id AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- 10. سياسات جدول product_variants
-- =====================================================

-- عرض المتغيرات: الكل للمنتجات النشطة
CREATE POLICY "product_variants_select_public"
  ON public.product_variants FOR SELECT
  USING (
    is_active = true OR
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.vendors v ON p.vendor_id = v.id
      WHERE p.id = product_variants.product_id AND v.owner_id = auth.uid()
    )
  );

-- إدارة المتغيرات: مالك المتجر فقط
CREATE POLICY "product_variants_manage_vendor_owner"
  ON public.product_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.vendors v ON p.vendor_id = v.id
      WHERE p.id = product_variants.product_id AND v.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.vendors v ON p.vendor_id = v.id
      WHERE p.id = product_variants.product_id AND v.owner_id = auth.uid()
    )
  );

-- =====================================================
-- 11. سياسات جدول orders
-- =====================================================

-- عرض الطلبات: العميل، البائع، السائق، أو المدير
CREATE POLICY "orders_select_involved_users"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = customer_id OR
    auth.uid() = driver_id OR
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = orders.vendor_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- إنشاء طلب: العميل فقط
CREATE POLICY "orders_insert_customer"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- تحديث الطلب: البائع، السائق، أو المدير
CREATE POLICY "orders_update_involved_users"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = orders.vendor_id AND owner_id = auth.uid()
    ) OR
    auth.uid() = driver_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- =====================================================
-- 12. سياسات جدول order_items
-- =====================================================

-- عرض عناصر الطلب: من يمكنه رؤية الطلب نفسه
CREATE POLICY "order_items_select_with_order"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND (
        auth.uid() = o.customer_id OR
        auth.uid() = o.driver_id OR
        EXISTS (
          SELECT 1 FROM public.vendors
          WHERE id = o.vendor_id AND owner_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND user_role = 'admin'
        )
      )
    )
  );

-- إضافة عناصر: عند إنشاء الطلب فقط
CREATE POLICY "order_items_insert_with_order"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id AND customer_id = auth.uid()
    )
  );

-- =====================================================
-- 13. سياسات جدول payments
-- =====================================================

-- عرض المدفوعات: العميل، البائع، أو المدير
CREATE POLICY "payments_select_involved_users"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id AND (
        auth.uid() = o.customer_id OR
        EXISTS (
          SELECT 1 FROM public.vendors
          WHERE id = o.vendor_id AND owner_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND user_role = 'admin'
        )
      )
    )
  );

-- إضافة دفعة: النظام أو المدير فقط
CREATE POLICY "payments_insert_system"
  ON public.payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- =====================================================
-- 14. سياسات جدول deliveries
-- =====================================================

-- عرض التوصيلات: السائق، البائع، العميل، أو المدير
CREATE POLICY "deliveries_select_involved_users"
  ON public.deliveries FOR SELECT
  USING (
    auth.uid() = driver_id OR
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = deliveries.order_id AND (
        auth.uid() = o.customer_id OR
        EXISTS (
          SELECT 1 FROM public.vendors
          WHERE id = o.vendor_id AND owner_id = auth.uid()
        )
      )
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- تحديث التوصيل: السائق أو المدير
CREATE POLICY "deliveries_update_driver_or_admin"
  ON public.deliveries FOR UPDATE
  USING (
    auth.uid() = driver_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- =====================================================
-- 15. سياسات جدول tags
-- =====================================================

-- عرض الوسوم: الكل
CREATE POLICY "tags_select_all"
  ON public.tags FOR SELECT
  USING (true);

-- إدارة الوسوم: المدير فقط
CREATE POLICY "tags_manage_admin"
  ON public.tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- =====================================================
-- 16. سياسات جدول inventory_logs
-- =====================================================

-- عرض سجل المخزون: مالك المتجر أو المدير
CREATE POLICY "inventory_logs_select_vendor_or_admin"
  ON public.inventory_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.vendors v ON p.vendor_id = v.id
      WHERE p.id = inventory_logs.product_id AND v.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- إضافة سجل: النظام فقط (عبر triggers)
CREATE POLICY "inventory_logs_insert_system"
  ON public.inventory_logs FOR INSERT
  WITH CHECK (true);

-- =========================================================
-- نهاية ملف سياسات الأمان
-- =========================================================
