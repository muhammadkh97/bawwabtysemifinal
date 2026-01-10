-- ====================================
-- إصلاح سياسات RLS للجداول المفقودة
-- ====================================

-- 1. جدول approvals
CREATE POLICY "Users can view approvals" ON public.approvals
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage approvals" ON public.approvals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- 2. جدول coupon_usage
CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own coupon usage" ON public.coupon_usage
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- 3. جدول exchange_rates_history
CREATE POLICY "Everyone can view exchange rates history" ON public.exchange_rates_history
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage exchange rates history" ON public.exchange_rates_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- 4. جدول exchange_rates_old
CREATE POLICY "Everyone can view old exchange rates" ON public.exchange_rates_old
  FOR SELECT USING (true);

-- 5. جدول loyalty_points
CREATE POLICY "Users can view own loyalty points" ON public.loyalty_points
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- 6. جدول loyalty_tiers
CREATE POLICY "Everyone can view loyalty tiers" ON public.loyalty_tiers
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage loyalty tiers" ON public.loyalty_tiers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- 7. جدول order_status_history
CREATE POLICY "Users can view order status history" ON public.order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_status_history.order_id
      AND (
        orders.customer_id = (SELECT auth.uid())
        OR orders.vendor_id IN (
          SELECT id FROM public.stores WHERE user_id = (SELECT auth.uid())
        )
      )
    )
  );

CREATE POLICY "System can insert order status history" ON public.order_status_history
  FOR INSERT WITH CHECK (true);

-- 8. جدول restaurants
CREATE POLICY "Everyone can view active restaurants" ON public.restaurants
  FOR SELECT USING (is_active = true);

CREATE POLICY "Restaurant owners can manage own restaurant" ON public.restaurants
  FOR ALL USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can manage all restaurants" ON public.restaurants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- 9. جدول ticket_messages
CREATE POLICY "Users can view own ticket messages" ON public.ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND tickets.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert own ticket messages" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND tickets.user_id = (SELECT auth.uid())
    )
  );

-- 10. جدول tickets
CREATE POLICY "Users can view own tickets" ON public.tickets
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create tickets" ON public.tickets
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tickets" ON public.tickets
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all tickets" ON public.tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all tickets" ON public.tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );
