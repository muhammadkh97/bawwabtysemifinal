-- =========================================================
-- إصلاح مشكلة vendor_id في جدول products
-- Fix vendor_id issue in products table
-- =========================================================

-- إضافة عمود user_id إلى جدول vendors إذا لم يكن موجوداً
-- Add user_id column to vendors table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vendors' 
    AND column_name = 'user_id'
  ) THEN
    -- إضافة عمود user_id كنسخة من owner_id
    ALTER TABLE public.vendors ADD COLUMN user_id UUID;
    
    -- نسخ البيانات من owner_id إلى user_id
    UPDATE public.vendors SET user_id = owner_id;
    
    -- جعل الحقل NOT NULL
    ALTER TABLE public.vendors ALTER COLUMN user_id SET NOT NULL;
    
    -- إضافة UNIQUE constraint
    ALTER TABLE public.vendors ADD CONSTRAINT vendors_user_id_unique UNIQUE (user_id);
    
    -- إضافة foreign key constraint
    ALTER TABLE public.vendors 
      ADD CONSTRAINT vendors_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    
    -- إنشاء index
    CREATE INDEX idx_vendors_user_id ON public.vendors(user_id);
    
    RAISE NOTICE 'تم إضافة عمود user_id بنجاح';
  ELSE
    RAISE NOTICE 'عمود user_id موجود بالفعل';
  END IF;
END $$;

-- حذف السياسات القديمة
DROP POLICY IF EXISTS products_insert_vendor ON products;
DROP POLICY IF EXISTS products_update_vendor ON products;
DROP POLICY IF EXISTS products_delete_vendor ON products;
DROP POLICY IF EXISTS products_select_all ON products;
DROP POLICY IF EXISTS products_admin_all ON products;
DROP POLICY IF EXISTS products_restaurants_manage ON products;

-- إنشاء سياسات RLS جديدة مع التحويل الصحيح

-- 1. سياسة SELECT: الجميع يمكنهم رؤية المنتجات
CREATE POLICY products_select_all ON products
FOR SELECT
TO public
USING (true);

-- 2. سياسة INSERT: البائع يمكنه إضافة منتجات فقط لمتجره
CREATE POLICY products_insert_vendor ON products
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_id
    AND v.user_id = auth.uid()
  )
);

-- 3. سياسة UPDATE: البائع يمكنه تحديث منتجاته فقط
CREATE POLICY products_update_vendor ON products
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_id
    AND v.user_id = auth.uid()
  )
);

-- 4. سياسة DELETE: البائع يمكنه حذف منتجاته فقط
CREATE POLICY products_delete_vendor ON products
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_id
    AND v.user_id = auth.uid()
  )
);

-- 5. سياسة للمدير: المدير له صلاحيات كاملة
CREATE POLICY products_admin_all ON products
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);

-- 6. سياسة للمطاعم: يمكنها إدارة منتجاتها
CREATE POLICY products_restaurants_manage ON products
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_id
    AND v.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_id
    AND v.user_id = auth.uid()
  )
);

-- رسالة نجاح
DO $$
BEGIN
  RAISE NOTICE '✅ تم إصلاح سياسات RLS للمنتجات بنجاح';
END $$;
