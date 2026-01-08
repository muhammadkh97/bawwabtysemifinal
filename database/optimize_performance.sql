-- ============================================================
-- Supabase Performance Optimization Script for 'Bawwabty'
-- ============================================================

-- 1. Create Database Indexes for Missing Foreign Keys
-- Target tables: orders, products, notifications, and others
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_by ON public.order_status_history(created_by);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_payouts_processed_by ON public.payouts(processed_by);
CREATE INDEX IF NOT EXISTS idx_disputes_resolved_by ON public.disputes(resolved_by);
CREATE INDEX IF NOT EXISTS idx_pages_created_by ON public.pages(created_by);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_store_pickups_order_id ON public.store_pickups(order_id);
CREATE INDEX IF NOT EXISTS idx_store_pickups_vendor_id ON public.store_pickups(vendor_id);
CREATE INDEX IF NOT EXISTS idx_store_pickups_batch_id ON public.store_pickups(batch_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_driver_id ON public.delivery_tracking(driver_id);
CREATE INDEX IF NOT EXISTS idx_approvals_reviewed_by ON public.approvals(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_payout_requests_processed_by ON public.payout_requests(processed_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_order_id ON public.tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_user_id ON public.ticket_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_financial_settings_updated_by ON public.financial_settings(updated_by);
CREATE INDEX IF NOT EXISTS idx_vendor_staff_invited_by ON public.vendor_staff(invited_by);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_order_id ON public.chats(order_id);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_vendor_id ON public.staff_invitations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_invited_by ON public.restaurant_staff(invited_by);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_invited_by ON public.staff_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_chats_archived_by ON public.chats(archived_by);
CREATE INDEX IF NOT EXISTS idx_messages_deleted_by ON public.messages(deleted_by);
CREATE INDEX IF NOT EXISTS idx_messages_reported_by ON public.messages(reported_by);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON public.orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- 2. Enable RLS on missing tables
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- 3. Review and Optimize RLS Policies
-- Using (SELECT auth.uid()) instead of direct auth.uid() call for performance optimization

-- Example for commissions table
DROP POLICY IF EXISTS "Admins can view all commissions" ON public.commissions;
CREATE POLICY "Admins can view all commissions" ON public.commissions
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can insert commissions" ON public.commissions;
CREATE POLICY "Admins can insert commissions" ON public.commissions
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- Example for orders table optimization
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders" ON public.orders
FOR SELECT TO public
USING (customer_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Vendors can view store orders" ON public.orders;
CREATE POLICY "Vendors can view store orders" ON public.orders
FOR SELECT TO public
USING (vendor_id IN (SELECT id FROM public.stores WHERE user_id = (SELECT auth.uid())));

-- 4. Final Script for Supabase SQL Editor
-- This script is ready to be executed in the Supabase SQL Editor.
