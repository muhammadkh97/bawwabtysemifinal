-- =====================================================
-- تفعيل Row Level Security - النسخة النهائية
-- Enable Row Level Security - Final Version
-- =====================================================
-- التاريخ: 10 يناير 2026
-- الهدف: حل ثغرة DL-001 بناءً على البنية الفعلية للجداول
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

-- السماح للمستخدمين بعرض ملفهم الشخصي
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- السماح للمستخدمين بتحديث ملفهم الشخصي
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- السماح للأدمن بعرض جميع المستخدمين
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

DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can view store orders" ON public.orders;
DROP POLICY IF EXISTS "Drivers can view assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can update store orders" ON public.orders;
DROP POLICY IF EXISTS "Drivers can update assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;

-- العملاء يمكنهم عرض طلباتهم فقط
CREATE POLICY "Customers can view own orders"
ON public.orders
FOR SELECT
USING (customer_id = auth.uid());

-- التجار يمكنهم عرض طلبات متاجرهم
CREATE POLICY "Vendors can view store orders"
ON public.orders
FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- السائقون يمكنهم عرض الطلبات المعينة لهم
CREATE POLICY "Drivers can view assigned orders"
ON public.orders
FOR SELECT
USING (
  driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = auth.uid()
  )
);

-- الأدمن يمكنهم عرض جميع الطلبات
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- العملاء يمكنهم إنشاء طلبات (عبر الدالة الآمنة فقط)
CREATE POLICY "Customers can create orders"
ON public.orders
FOR INSERT
WITH CHECK (customer_id = auth.uid());

-- التجار يمكنهم تحديث طلبات متاجرهم
CREATE POLICY "Vendors can update store orders"
ON public.orders
FOR UPDATE
USING (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- السائقون يمكنهم تحديث الطلبات المعينة لهم
CREATE POLICY "Drivers can update assigned orders"
ON public.orders
FOR UPDATE
USING (
  driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = auth.uid()
  )
);

-- الأدمن يمكنهم تحديث جميع الطلبات
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
-- 3. تفعيل RLS على جدول products
-- =====================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved products" ON public.products;
DROP POLICY IF EXISTS "Vendors can view own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can create products" ON public.products;
DROP POLICY IF EXISTS "Vendors can update own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can delete own products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can update all products" ON public.products;

-- الجميع يمكنهم عرض المنتجات المعتمدة والنشطة
CREATE POLICY "Anyone can view approved products"
ON public.products
FOR SELECT
USING (approval_status = 'approved' AND is_active = true);

-- التجار يمكنهم عرض منتجاتهم
CREATE POLICY "Vendors can view own products"
ON public.products
FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- التجار يمكنهم إنشاء منتجات
CREATE POLICY "Vendors can create products"
ON public.products
FOR INSERT
WITH CHECK (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- التجار يمكنهم تحديث منتجاتهم
CREATE POLICY "Vendors can update own products"
ON public.products
FOR UPDATE
USING (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- التجار يمكنهم حذف منتجاتهم
CREATE POLICY "Vendors can delete own products"
ON public.products
FOR DELETE
USING (
  vendor_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- الأدمن يمكنهم عرض جميع المنتجات
CREATE POLICY "Admins can view all products"
ON public.products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- الأدمن يمكنهم تحديث جميع المنتجات
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
-- 4. تفعيل RLS على جدول stores
-- =====================================================

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved stores" ON public.stores;
DROP POLICY IF EXISTS "Vendors can view own stores" ON public.stores;
DROP POLICY IF EXISTS "Vendors can create stores" ON public.stores;
DROP POLICY IF EXISTS "Vendors can update own stores" ON public.stores;
DROP POLICY IF EXISTS "Admins can view all stores" ON public.stores;
DROP POLICY IF EXISTS "Admins can update all stores" ON public.stores;

-- الجميع يمكنهم عرض المتاجر المعتمدة والنشطة
CREATE POLICY "Anyone can view approved stores"
ON public.stores
FOR SELECT
USING (approval_status = 'approved' AND is_active = true);

-- التجار يمكنهم عرض متاجرهم
CREATE POLICY "Vendors can view own stores"
ON public.stores
FOR SELECT
USING (user_id = auth.uid());

-- التجار يمكنهم إنشاء متاجر
CREATE POLICY "Vendors can create stores"
ON public.stores
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- التجار يمكنهم تحديث متاجرهم
CREATE POLICY "Vendors can update own stores"
ON public.stores
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- الأدمن يمكنهم عرض جميع المتاجر
CREATE POLICY "Admins can view all stores"
ON public.stores
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- الأدمن يمكنهم تحديث جميع المتاجر
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
-- 5. تفعيل RLS على جدول vendor_wallets (إذا كان موجوداً)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_wallets') THEN
    ALTER TABLE public.vendor_wallets ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Vendors can view own wallet" ON public.vendor_wallets;
    DROP POLICY IF EXISTS "Admins can view all wallets" ON public.vendor_wallets;
    
    EXECUTE 'CREATE POLICY "Vendors can view own wallet"
    ON public.vendor_wallets
    FOR SELECT
    USING (
      vendor_id IN (
        SELECT id FROM public.stores WHERE user_id = auth.uid()
      )
    )';
    
    EXECUTE 'CREATE POLICY "Admins can view all wallets"
    ON public.vendor_wallets
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = ''admin''
      )
    )';
  END IF;
END $$;

-- =====================================================
-- 6. تفعيل RLS على جدول payout_requests (إذا كان موجوداً)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payout_requests') THEN
    ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Vendors can view own payout requests" ON public.payout_requests;
    DROP POLICY IF EXISTS "Vendors can create payout requests" ON public.payout_requests;
    DROP POLICY IF EXISTS "Admins can view all payout requests" ON public.payout_requests;
    DROP POLICY IF EXISTS "Admins can update payout requests" ON public.payout_requests;
    
    EXECUTE 'CREATE POLICY "Vendors can view own payout requests"
    ON public.payout_requests
    FOR SELECT
    USING (
      vendor_id IN (
        SELECT id FROM public.stores WHERE user_id = auth.uid()
      )
    )';
    
    EXECUTE 'CREATE POLICY "Vendors can create payout requests"
    ON public.payout_requests
    FOR INSERT
    WITH CHECK (
      vendor_id IN (
        SELECT id FROM public.stores WHERE user_id = auth.uid()
      )
    )';
    
    EXECUTE 'CREATE POLICY "Admins can view all payout requests"
    ON public.payout_requests
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = ''admin''
      )
    )';
    
    EXECUTE 'CREATE POLICY "Admins can update payout requests"
    ON public.payout_requests
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = ''admin''
      )
    )';
  END IF;
END $$;

-- =====================================================
-- 7. تفعيل RLS على جدول notifications (إذا كان موجوداً)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
    
    EXECUTE 'CREATE POLICY "Users can view own notifications"
    ON public.notifications
    FOR SELECT
    USING (user_id = auth.uid())';
    
    EXECUTE 'CREATE POLICY "Users can update own notifications"
    ON public.notifications
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid())';
  END IF;
END $$;

-- =====================================================
-- 8. تفعيل RLS على جدول drivers (إذا كان موجوداً)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') THEN
    ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Drivers can view own profile" ON public.drivers;
    DROP POLICY IF EXISTS "Drivers can update own profile" ON public.drivers;
    DROP POLICY IF EXISTS "Drivers can create profile" ON public.drivers;
    DROP POLICY IF EXISTS "Admins can view all drivers" ON public.drivers;
    DROP POLICY IF EXISTS "Admins can update all drivers" ON public.drivers;
    
    EXECUTE 'CREATE POLICY "Drivers can view own profile"
    ON public.drivers
    FOR SELECT
    USING (user_id = auth.uid())';
    
    EXECUTE 'CREATE POLICY "Drivers can update own profile"
    ON public.drivers
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid())';
    
    EXECUTE 'CREATE POLICY "Drivers can create profile"
    ON public.drivers
    FOR INSERT
    WITH CHECK (user_id = auth.uid())';
    
    EXECUTE 'CREATE POLICY "Admins can view all drivers"
    ON public.drivers
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = ''admin''
      )
    )';
    
    EXECUTE 'CREATE POLICY "Admins can update all drivers"
    ON public.drivers
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = ''admin''
      )
    )';
  END IF;
END $$;

-- =====================================================
-- 9. تفعيل RLS على جدول wallet_transactions (إذا كان موجوداً)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions') THEN
    ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Vendors can view own transactions" ON public.wallet_transactions;
    DROP POLICY IF EXISTS "Admins can view all transactions" ON public.wallet_transactions;
    
    EXECUTE 'CREATE POLICY "Vendors can view own transactions"
    ON public.wallet_transactions
    FOR SELECT
    USING (
      vendor_id IN (
        SELECT id FROM public.stores WHERE user_id = auth.uid()
      )
    )';
    
    EXECUTE 'CREATE POLICY "Admins can view all transactions"
    ON public.wallet_transactions
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = ''admin''
      )
    )';
  END IF;
END $$;

-- =====================================================
-- ملاحظات نهائية
-- =====================================================
-- 1. تم استخدام DO blocks للجداول الاختيارية
-- 2. تم التحقق من وجود الجداول قبل تطبيق السياسات
-- 3. جميع السياسات تستخدم auth.uid() للتحقق من الهوية
-- 4. الأدمن لديهم صلاحيات كاملة على جميع الجداول
-- =====================================================
