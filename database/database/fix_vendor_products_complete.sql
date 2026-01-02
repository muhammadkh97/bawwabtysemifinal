-- =========================================================
-- إصلاح شامل لمشكلة vendor_id في جدول products
-- Complete fix for vendor_id issue in products table
-- =========================================================

-- الخطوة 1: التحقق من نوع بيانات vendor_id وتصحيحه إن لزم الأمر
DO $$ 
DECLARE
  column_type TEXT;
BEGIN
  -- الحصول على نوع البيانات الحالي
  SELECT data_type INTO column_type
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'vendor_id';
  
  RAISE NOTICE 'نوع بيانات vendor_id الحالي: %', column_type;
  
  -- إذا كان النوع ليس uuid، نقوم بتحويله
  IF column_type != 'uuid' THEN
    RAISE NOTICE 'تحويل vendor_id من % إلى uuid', column_type;
    
    -- حذف القيود المرتبطة مؤقتاً
    ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_vendor_id_fkey;
    
    -- تحويل النوع
    ALTER TABLE public.products ALTER COLUMN vendor_id TYPE UUID USING vendor_id::uuid;
    
    -- إعادة إضافة القيد
    ALTER TABLE public.products 
      ADD CONSTRAINT products_vendor_id_fkey 
      FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✅ تم تحويل vendor_id إلى UUID';
  ELSE
    RAISE NOTICE '✅ vendor_id هو بالفعل UUID';
  END IF;
END $$;

-- الخطوة 2: التحقق من وجود user_id في جدول vendors
DO $$ 
DECLARE
  has_user_id BOOLEAN;
  has_owner_id BOOLEAN;
BEGIN
  -- التحقق من وجود user_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vendors' 
    AND column_name = 'user_id'
  ) INTO has_user_id;
  
  -- التحقق من وجود owner_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vendors' 
    AND column_name = 'owner_id'
  ) INTO has_owner_id;
  
  IF has_user_id THEN
    RAISE NOTICE '✅ عمود user_id موجود بالفعل في جدول vendors';
    
    -- إضافة القيود إذا لم تكن موجودة
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'vendors_user_id_unique'
    ) THEN
      ALTER TABLE public.vendors ADD CONSTRAINT vendors_user_id_unique UNIQUE (user_id);
      RAISE NOTICE '✅ تم إضافة UNIQUE constraint لـ user_id';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'vendors_user_id_fkey'
    ) THEN
      ALTER TABLE public.vendors 
        ADD CONSTRAINT vendors_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
      RAISE NOTICE '✅ تم إضافة Foreign Key constraint لـ user_id';
    END IF;
    
  ELSIF has_owner_id THEN
    RAISE NOTICE 'إضافة عمود user_id ونسخ البيانات من owner_id';
    
    -- إضافة عمود user_id
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
    
    RAISE NOTICE '✅ تم إضافة عمود user_id بنجاح';
  ELSE
    RAISE EXCEPTION 'لا يوجد عمود user_id أو owner_id في جدول vendors!';
  END IF;
END $$;

-- الخطوة 3: حذف جميع السياسات القديمة
DROP POLICY IF EXISTS products_insert_own ON products;
DROP POLICY IF EXISTS products_update_own ON products;
DROP POLICY IF EXISTS products_delete_own ON products;
DROP POLICY IF EXISTS products_insert_vendor ON products;
DROP POLICY IF EXISTS products_update_vendor ON products;
DROP POLICY IF EXISTS products_delete_vendor ON products;
DROP POLICY IF EXISTS products_select_all ON products;
DROP POLICY IF EXISTS products_admin_all ON products;
DROP POLICY IF EXISTS products_restaurants_manage ON products;
DROP POLICY IF EXISTS products_vendor_manage ON products;

-- الخطوة 4: إنشاء سياسات RLS جديدة

-- سياسة SELECT: الجميع يمكنهم رؤية المنتجات
CREATE POLICY products_select_all ON products
FOR SELECT
TO public
USING (true);

-- سياسة INSERT: البائع يمكنه إضافة منتجات فقط لمتجره
CREATE POLICY products_insert_vendor ON products
FOR INSERT
TO public
WITH CHECK (
  vendor_id IN (
    SELECT id FROM vendors 
    WHERE user_id = auth.uid()
  )
);

-- سياسة UPDATE: البائع يمكنه تحديث منتجاته فقط
CREATE POLICY products_update_vendor ON products
FOR UPDATE
TO public
USING (
  vendor_id IN (
    SELECT id FROM vendors 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  vendor_id IN (
    SELECT id FROM vendors 
    WHERE user_id = auth.uid()
  )
);

-- سياسة DELETE: البائع يمكنه حذف منتجاته فقط
CREATE POLICY products_delete_vendor ON products
FOR DELETE
TO public
USING (
  vendor_id IN (
    SELECT id FROM vendors 
    WHERE user_id = auth.uid()
  )
);

-- سياسة للمدير: المدير له صلاحيات كاملة
CREATE POLICY products_admin_all ON products
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- الخطوة 5: تحديث triggers
DROP TRIGGER IF EXISTS notify_vendor_product_status_trigger ON products;
DROP TRIGGER IF EXISTS notify_wishlist_product_available_trigger ON products;

-- دالة إشعار البائع بحالة المنتج
CREATE OR REPLACE FUNCTION public.notify_vendor_product_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, title, message, type, action_url, reference_type, reference_id)
      SELECT 
        v.user_id,
        'تمت الموافقة على منتجك! ✅',
        'تمت الموافقة على منتج: ' || NEW.name,
        'product',
        '/dashboard/vendor/products/' || NEW.id::text,
        'product',
        NEW.id
      FROM public.vendors v
      WHERE v.id = NEW.vendor_id;
      
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, title, message, type, action_url, reference_type, reference_id)
      SELECT 
        v.user_id,
        'تم رفض منتجك ❌',
        'تم رفض منتج: ' || NEW.name || '. السبب: ' || COALESCE(NEW.rejection_reason, 'غير محدد'),
        'product',
        '/dashboard/vendor/products/' || NEW.id::text,
        'product',
        NEW.id
      FROM public.vendors v
      WHERE v.id = NEW.vendor_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- دالة إشعار المستخدمين عند توفر المنتج
CREATE OR REPLACE FUNCTION public.notify_wishlist_product_available()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF (OLD.stock = 0 OR OLD.stock IS NULL) AND NEW.stock > 0 THEN
    INSERT INTO public.notifications (user_id, title, message, type, action_url, reference_type, reference_id)
    SELECT 
      w.user_id,
      'المنتج متوفر الآن! 🎉',
      'المنتج "' || NEW.name || '" الذي أضفته لقائمة أمنياتك أصبح متوفراً الآن',
      'product',
      '/products/' || COALESCE(NEW.slug, NEW.id::text),
      'product',
      NEW.id
    FROM public.wishlists w
    WHERE w.product_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- إنشاء triggers
CREATE TRIGGER notify_vendor_product_status_trigger
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_vendor_product_status();

CREATE TRIGGER notify_wishlist_product_available_trigger
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_wishlist_product_available();

-- رسالة نجاح
DO $$
BEGIN
  RAISE NOTICE '✅✅✅ تم إصلاح جميع المشاكل بنجاح! ✅✅✅';
  RAISE NOTICE 'يمكنك الآن إضافة منتجات جديدة بدون مشاكل';
END $$;
