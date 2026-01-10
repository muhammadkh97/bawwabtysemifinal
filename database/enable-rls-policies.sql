-- =====================================================
-- تفعيل Row Level Security على الجداول الحساسة
-- Enable Row Level Security on Sensitive Tables
-- =====================================================
-- التاريخ: 10 يناير 2026
-- الهدف: حل ثغرة DL-001 (عدم وجود RLS على الجداول)
-- =====================================================

-- =====================================================
-- 1. تفعيل RLS على جدول users
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- السماح للمستخدمين برؤية بياناتهم فقط
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- السماح للمستخدمين بتحديث بياناتهم فقط
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- السماح للأدمن برؤية جميع المستخدمين
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- السماح للأدمن بتحديث جميع المستخدمين
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

-- السماح للعملاء برؤية طلباتهم فقط
CREATE POLICY "Customers can view own orders"
ON public.orders
FOR SELECT
USING (customer_id = auth.uid());

-- السماح للبائعين برؤية طلبات متاجرهم فقط
CREATE POLICY "Vendors can view store orders"
ON public.orders
FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- السماح للسائقين برؤية طلباتهم المعينة فقط
CREATE POLICY "Drivers can view assigned orders"
ON public.orders
FOR SELECT
USING (
  driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = auth.uid()
  )
);

-- السماح للأدمن برؤية جميع الطلبات
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- السماح للعملاء بإنشاء طلبات
CREATE POLICY "Customers can create orders"
ON public.orders
FOR INSERT
WITH CHECK (customer_id = auth.uid());

-- السماح للبائعين بتحديث طلبات متاجرهم
CREATE POLICY "Vendors can update store orders"
ON public.orders
FOR UPDATE
USING (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- السماح للسائقين بتحديث طلباتهم المعينة
CREATE POLICY "Drivers can update assigned orders"
ON public.orders
FOR UPDATE
USING (
  driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = auth.uid()
  )
);

-- السماح للأدمن بتحديث جميع الطلبات
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

-- السماح للبائعين برؤية محافظهم فقط
CREATE POLICY "Vendors can view own wallet"
ON public.vendor_wallets
FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- السماح للأدمن برؤية جميع المحافظ
CREATE POLICY "Admins can view all wallets"
ON public.vendor_wallets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- منع التحديث اليدوي للمحافظ (يتم التحديث عبر Triggers فقط)
-- لا نحتاج لسياسة UPDATE لأن التحديثات تتم عبر Triggers

-- =====================================================
-- 4. تفعيل RLS على جدول payout_requests
-- =====================================================

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- السماح للبائعين برؤية طلبات السحب الخاصة بهم فقط
CREATE POLICY "Vendors can view own payout requests"
ON public.payout_requests
FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- السماح للبائعين بإنشاء طلبات سحب
CREATE POLICY "Vendors can create payout requests"
ON public.payout_requests
FOR INSERT
WITH CHECK (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- السماح للأدمن برؤية جميع طلبات السحب
CREATE POLICY "Admins can view all payout requests"
ON public.payout_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- السماح للأدمن بتحديث طلبات السحب
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

-- السماح للمستخدمين برؤية إشعاراتهم فقط
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

-- السماح للمستخدمين بتحديث إشعاراتهم (مثل تعليمها كمقروءة)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- السماح للنظام بإنشاء إشعارات (عبر service_role)
-- لا نحتاج لسياسة INSERT للمستخدمين العاديين

-- =====================================================
-- 6. تفعيل RLS على جدول products
-- =====================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- السماح للجميع برؤية المنتجات المعتمدة
CREATE POLICY "Anyone can view approved products"
ON public.products
FOR SELECT
USING (status = 'approved');

-- السماح للبائعين برؤية منتجاتهم (حتى غير المعتمدة)
CREATE POLICY "Vendors can view own products"
ON public.products
FOR SELECT
USING (
  store_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- السماح للبائعين بإنشاء منتجات في متاجرهم
CREATE POLICY "Vendors can create products"
ON public.products
FOR INSERT
WITH CHECK (
  store_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- السماح للبائعين بتحديث منتجاتهم
CREATE POLICY "Vendors can update own products"
ON public.products
FOR UPDATE
USING (
  store_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- السماح للبائعين بحذف منتجاتهم
CREATE POLICY "Vendors can delete own products"
ON public.products
FOR DELETE
USING (
  store_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- السماح للأدمن برؤية وتحديث جميع المنتجات
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

-- السماح للجميع برؤية المتاجر المعتمدة
CREATE POLICY "Anyone can view approved stores"
ON public.stores
FOR SELECT
USING (status = 'approved');

-- السماح للبائعين برؤية متاجرهم (حتى غير المعتمدة)
CREATE POLICY "Vendors can view own stores"
ON public.stores
FOR SELECT
USING (user_id = auth.uid());

-- السماح للبائعين بإنشاء متاجر
CREATE POLICY "Vendors can create stores"
ON public.stores
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- السماح للبائعين بتحديث متاجرهم
CREATE POLICY "Vendors can update own stores"
ON public.stores
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- السماح للأدمن برؤية وتحديث جميع المتاجر
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

-- السماح للسائقين برؤية بياناتهم فقط
CREATE POLICY "Drivers can view own profile"
ON public.drivers
FOR SELECT
USING (user_id = auth.uid());

-- السماح للسائقين بتحديث بياناتهم
CREATE POLICY "Drivers can update own profile"
ON public.drivers
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- السماح للسائقين بإنشاء ملفاتهم
CREATE POLICY "Drivers can create profile"
ON public.drivers
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- السماح للأدمن برؤية جميع السائقين
CREATE POLICY "Admins can view all drivers"
ON public.drivers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- السماح للأدمن بتحديث جميع السائقين
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

-- السماح للبائعين برؤية معاملات محافظهم فقط
CREATE POLICY "Vendors can view own transactions"
ON public.wallet_transactions
FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- السماح للأدمن برؤية جميع المعاملات
CREATE POLICY "Admins can view all transactions"
ON public.wallet_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- تعليقات للتوثيق
-- =====================================================

COMMENT ON POLICY "Users can view own profile" ON public.users IS 'يسمح للمستخدمين برؤية ملفاتهم الشخصية فقط';
COMMENT ON POLICY "Admins can view all users" ON public.users IS 'يسمح للأدمن برؤية جميع المستخدمين';
COMMENT ON POLICY "Customers can view own orders" ON public.orders IS 'يسمح للعملاء برؤية طلباتهم فقط';
COMMENT ON POLICY "Vendors can view store orders" ON public.orders IS 'يسمح للبائعين برؤية طلبات متاجرهم فقط';
