-- =========================================================
-- إصلاح شامل لجميع الدوال المرتبطة بجدول products
-- Comprehensive fix for all functions related to products table
-- =========================================================

-- 1. إصلاح دالة notify_vendor_product_status
CREATE OR REPLACE FUNCTION public.notify_vendor_product_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.status != NEW.status THEN
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
      WHERE v.id::text = NEW.vendor_id::text;
      
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
      WHERE v.id::text = NEW.vendor_id::text;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. إصلاح دالة notify_wishlist_product_available
CREATE OR REPLACE FUNCTION public.notify_wishlist_product_available()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.stock = 0 AND NEW.stock > 0 THEN
    -- إشعار جميع من أضافوا المنتج لقائمة الأمنيات
    INSERT INTO public.notifications (user_id, title, message, type, action_url, reference_type, reference_id)
    SELECT 
      w.user_id,
      'المنتج متوفر الآن! 🎉',
      'المنتج "' || NEW.name || '" الذي أضفته لقائمة أمنياتك أصبح متوفراً الآن',
      'product',
      '/products/' || NEW.slug,
      'product',
      NEW.id
    FROM public.wishlists w
    WHERE w.product_id::text = NEW.id::text
      AND w.notify_on_restock = true;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- التحقق من الدوال المحدثة
SELECT proname, pg_get_function_identity_arguments(oid) as args
FROM pg_proc
WHERE proname IN ('notify_vendor_product_status', 'notify_wishlist_product_available')
ORDER BY proname;
