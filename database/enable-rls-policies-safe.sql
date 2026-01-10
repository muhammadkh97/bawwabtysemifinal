-- =====================================================
-- تفعيل Row Level Security على الجداول الحساسة (نسخة آمنة)
-- Enable Row Level Security on Sensitive Tables (Safe Version)
-- =====================================================
-- التاريخ: 10 يناير 2026
-- الهدف: حل ثغرة DL-001 (عدم وجود RLS على الجداول)
-- =====================================================

-- =====================================================
-- 1. تفعيل RLS على جدول users
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- إنشاء السياسات الجديدة
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all users"
ON public.users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 2. تفعيل RLS على جدول orders
-- =====================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can view store orders" ON public.orders;
DROP POLICY IF EXISTS "Drivers can view assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can update store orders" ON public.orders;
DROP POLICY IF EXISTS "Drivers can update assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;

CREATE POLICY "Customers can view own orders"
ON public.orders
FOR SELECT
USING (customer_id = auth.uid());

CREATE POLICY "Vendors can view store orders"
ON public.orders
FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can view assigned orders"
ON public.orders
FOR SELECT
USING (
  driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Customers can create orders"
ON public.orders
FOR INSERT
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Vendors can update store orders"
ON public.orders
FOR UPDATE
USING (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can update assigned orders"
ON public.orders
FOR UPDATE
USING (
  driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update all orders"
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 3. تفعيل RLS على جدول vendor_wallets
-- =====================================================

ALTER TABLE public.vendor_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can view own wallet" ON public.vendor_wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.vendor_wallets;

CREATE POLICY "Vendors can view own wallet"
ON public.vendor_wallets
FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all wallets"
ON public.vendor_wallets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 4. تفعيل RLS على جدول payout_requests
-- =====================================================

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can view own payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Vendors can create payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Admins can view all payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Admins can update payout requests" ON public.payout_requests;

CREATE POLICY "Vendors can view own payout requests"
ON public.payout_requests
FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can create payout requests"
ON public.payout_requests
FOR INSERT
WITH CHECK (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all payout requests"
ON public.payout_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update payout requests"
ON public.payout_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 5. تفعيل RLS على جدول notifications
-- =====================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 6. تفعيل RLS على جدول products
-- =====================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved products" ON public.products;
DROP POLICY IF EXISTS "Vendors can view own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can create products" ON public.products;
DROP POLICY IF EXISTS "Vendors can update own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can delete own products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can update all products" ON public.products;

CREATE POLICY "Anyone can view approved products"
ON public.products
FOR SELECT
USING (status = 'approved');

CREATE POLICY "Vendors can view own products"
ON public.products
FOR SELECT
USING (
  store_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can create products"
ON public.products
FOR INSERT
WITH CHECK (
  store_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can update own products"
ON public.products
FOR UPDATE
USING (
  store_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can delete own products"
ON public.products
FOR DELETE
USING (
  store_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all products"
ON public.products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all products"
ON public.products
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 7. تفعيل RLS على جدول stores
-- =====================================================

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved stores" ON public.stores;
DROP POLICY IF EXISTS "Vendors can view own stores" ON public.stores;
DROP POLICY IF EXISTS "Vendors can create stores" ON public.stores;
DROP POLICY IF EXISTS "Vendors can update own stores" ON public.stores;
DROP POLICY IF EXISTS "Admins can view all stores" ON public.stores;
DROP POLICY IF EXISTS "Admins can update all stores" ON public.stores;

CREATE POLICY "Anyone can view approved stores"
ON public.stores
FOR SELECT
USING (status = 'approved');

CREATE POLICY "Vendors can view own stores"
ON public.stores
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Vendors can create stores"
ON public.stores
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Vendors can update own stores"
ON public.stores
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all stores"
ON public.stores
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all stores"
ON public.stores
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 8. تفعيل RLS على جدول drivers
-- =====================================================

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can view own profile" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can update own profile" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can create profile" ON public.drivers;
DROP POLICY IF EXISTS "Admins can view all drivers" ON public.drivers;
DROP POLICY IF EXISTS "Admins can update all drivers" ON public.drivers;

CREATE POLICY "Drivers can view own profile"
ON public.drivers
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Drivers can update own profile"
ON public.drivers
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Drivers can create profile"
ON public.drivers
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all drivers"
ON public.drivers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all drivers"
ON public.drivers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 9. تفعيل RLS على جدول wallet_transactions
-- =====================================================

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can view own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.wallet_transactions;

CREATE POLICY "Vendors can view own transactions"
ON public.wallet_transactions
FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all transactions"
ON public.wallet_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
