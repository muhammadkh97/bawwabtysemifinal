-- =========================================================
-- إصلاح دالة update_category_products_count
-- Fix update_category_products_count function
-- =========================================================

CREATE OR REPLACE FUNCTION public.update_category_products_count()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.categories
    SET products_count = products_count + 1
    WHERE id::text = NEW.category_id::text;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.categories
    SET products_count = products_count - 1
    WHERE id::text = OLD.category_id::text AND products_count > 0;
  ELSIF TG_OP = 'UPDATE' AND OLD.category_id::text != NEW.category_id::text THEN
    UPDATE public.categories
    SET products_count = products_count - 1
    WHERE id::text = OLD.category_id::text AND products_count > 0;
    
    UPDATE public.categories
    SET products_count = products_count + 1
    WHERE id::text = NEW.category_id::text;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- التحقق من الدالة
SELECT proname, pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'update_category_products_count';
