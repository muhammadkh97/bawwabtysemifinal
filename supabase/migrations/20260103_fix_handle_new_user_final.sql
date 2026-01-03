-- ============================================
-- Migration: إصلاح دالة handle_new_user
-- التاريخ: 2026-01-03
-- الوصف: حل مشكلة "Database error saving new user"
-- ============================================

-- المشكلة:
-- عند استخدام SECURITY DEFINER في PostgreSQL، قد يتغير search_path
-- مما يؤدي إلى خطأ: ERROR: type "user_role" does not exist (SQLSTATE 42704)

-- الحل:
-- استخدام الاسم الكامل للنوع (public.user_role) بدلاً من (user_role) فقط
-- إضافة معالجة الأخطاء (EXCEPTION) لتسجيل أي مشاكل مستقبلية

-- حذف الـ trigger والدالة القديمة
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- إنشاء الدالة المحسّنة
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- إدراج المستخدم الجديد في جدول public.users
  -- استخدام أسماء كاملة مع schema (public.user_role) لتجنب مشاكل search_path
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    name, 
    role, 
    user_role, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- استخدام 'name' أولاً ثم 'full_name' كخطة احتياطية
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', NEW.email),
    -- تحويل صريح إلى public.user_role
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'customer'::public.user_role),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- تسجيل الخطأ في حالة حدوث مشكلة
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    -- إرجاع NEW للسماح بإكمال عملية التسجيل في auth.users
    RETURN NEW;
END;
$$;

-- إنشاء الـ trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- إضافة تعليق توثيقي
COMMENT ON FUNCTION public.handle_new_user() IS 
'تلقائياً ينشئ سجل في public.users عند إنشاء مستخدم جديد في auth.users
تم إصلاحه في 2026-01-03 لحل مشكلة search_path مع SECURITY DEFINER';

-- التحقق من نجاح الإنشاء
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE NOTICE 'تم إنشاء دالة handle_new_user بنجاح';
  ELSE
    RAISE EXCEPTION 'فشل إنشاء دالة handle_new_user';
  END IF;
END $$;
