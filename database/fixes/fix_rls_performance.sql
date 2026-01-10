-- ====================================
-- إصلاح مشاكل الأداء في سياسات RLS
-- استبدال auth.uid() بـ (SELECT auth.uid())
-- ====================================

-- ملاحظة: يجب تشغيل هذا السكريبت بعد حذف السياسات القديمة

-- جدول cart_items
DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
CREATE POLICY "Users can view own cart items" ON public.cart_items
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can manage own cart items" ON public.cart_items;
CREATE POLICY "Users can manage own cart items" ON public.cart_items
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- جدول chats
DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
CREATE POLICY "Users can view own chats" ON public.chats
  FOR SELECT USING (
    customer_id = (SELECT auth.uid()) OR
    vendor_id IN (SELECT id FROM public.stores WHERE user_id = (SELECT auth.uid()))
  );

-- جدول messages
DROP POLICY IF EXISTS "Users can view messages in own chats" ON public.messages;
CREATE POLICY "Users can view messages in own chats" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND (
        chats.customer_id = (SELECT auth.uid()) OR
        chats.vendor_id IN (SELECT id FROM public.stores WHERE user_id = (SELECT auth.uid()))
      )
    )
  );

DROP POLICY IF EXISTS "Users can send messages in own chats" ON public.messages;
CREATE POLICY "Users can send messages in own chats" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = (SELECT auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND (
        chats.customer_id = (SELECT auth.uid()) OR
        chats.vendor_id IN (SELECT id FROM public.stores WHERE user_id = (SELECT auth.uid()))
      )
    )
  );

-- جدول notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- جدول orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    customer_id = (SELECT auth.uid()) OR
    vendor_id IN (SELECT id FROM public.stores WHERE user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (customer_id = (SELECT auth.uid()));

-- جدول products
DROP POLICY IF EXISTS "Vendors can manage own products" ON public.products;
CREATE POLICY "Vendors can manage own products" ON public.products
  FOR ALL USING (
    vendor_id IN (SELECT id FROM public.stores WHERE user_id = (SELECT auth.uid()))
  );

-- جدول reviews
DROP POLICY IF EXISTS "Users can view reviews" ON public.reviews;
CREATE POLICY "Users can view reviews" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- جدول stores
DROP POLICY IF EXISTS "Vendors can manage own store" ON public.stores;
CREATE POLICY "Vendors can manage own store" ON public.stores
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- جدول wishlists
DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlists;
CREATE POLICY "Users can view own wishlist" ON public.wishlists
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlists;
CREATE POLICY "Users can manage own wishlist" ON public.wishlists
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- جدول store_followers
DROP POLICY IF EXISTS "Users can view own follows" ON public.store_followers;
CREATE POLICY "Users can view own follows" ON public.store_followers
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can manage own follows" ON public.store_followers;
CREATE POLICY "Users can manage own follows" ON public.store_followers
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- جدول addresses
DROP POLICY IF EXISTS "Users can view own addresses" ON public.addresses;
CREATE POLICY "Users can view own addresses" ON public.addresses
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
CREATE POLICY "Users can manage own addresses" ON public.addresses
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- جدول user_locations
DROP POLICY IF EXISTS "Users can view own locations" ON public.user_locations;
CREATE POLICY "Users can view own locations" ON public.user_locations
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can manage own locations" ON public.user_locations;
CREATE POLICY "Users can manage own locations" ON public.user_locations
  FOR ALL USING (user_id = (SELECT auth.uid()));
