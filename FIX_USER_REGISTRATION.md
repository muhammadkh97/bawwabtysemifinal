# إصلاح مشكلة تسجيل المستخدم الجديد

## المشكلة

عند محاولة تسجيل حساب جديد، كان يظهر الخطأ التالي:

```
Database error saving new user
```

### تفاصيل الخطأ من السجلات

```
ERROR: type "user_role" does not exist (SQLSTATE 42704)
failed to close prepared statement: ERROR: current transaction is aborted, 
commands ignored until end of transaction block (SQLSTATE 25P02)
```

## السبب الجذري

المشكلة كانت في دالة `handle_new_user()` التي تُستخدم كـ trigger عند إنشاء مستخدم جديد في `auth.users`. الدالة كانت تستخدم `SECURITY DEFINER` بدون تحديد `search_path` بشكل صريح، مما أدى إلى عدم قدرة PostgreSQL على إيجاد نوع `user_role` enum.

### الكود القديم (المشكلة)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, name, role, user_role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'),  -- ❌ المشكلة هنا
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;
```

## الحل

تم إصلاح المشكلة بثلاث طرق:

### 1. استخدام الاسم الكامل للنوع (Schema-qualified)

```sql
-- بدلاً من: (NEW.raw_user_meta_data->>'role')::user_role
-- استخدم: (NEW.raw_user_meta_data->>'role')::public.user_role
COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'customer'::public.user_role)
```

### 2. إضافة معالجة الأخطاء

```sql
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
```

### 3. تحديث حقل البيانات المستخدم

تم تغيير الأولوية من `full_name` إلى `name` لأن صفحة التسجيل ترسل البيانات في حقل `name`:

```sql
-- القديم: COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
-- الجديد: COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', NEW.email)
```

## الملفات المعدّلة

1. **قاعدة البيانات**: تم تحديث دالة `handle_new_user()` مباشرة في Supabase
2. **Migration**: `supabase/migrations/20260103_fix_handle_new_user_final.sql`

## التحقق من الإصلاح

يمكنك التحقق من أن الدالة تم تحديثها بنجاح باستخدام:

```sql
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

يجب أن ترى `public.user_role` في الكود بدلاً من `user_role` فقط.

## الاختبار

لاختبار الإصلاح:

1. افتح صفحة التسجيل: `/auth/register`
2. املأ البيانات المطلوبة
3. اختر نوع المستخدم (مشتري، بائع، مطعم، أو مندوب)
4. أكمل عملية التسجيل

يجب أن تتم عملية التسجيل بنجاح بدون ظهور خطأ "Database error saving new user".

## ملاحظات تقنية

### لماذا حدثت المشكلة؟

عند استخدام `SECURITY DEFINER` في PostgreSQL، يتم تنفيذ الدالة بصلاحيات المستخدم الذي أنشأها (عادةً `postgres` أو `supabase_admin`)، وليس المستخدم الذي يستدعيها. هذا يغير `search_path` الافتراضي، مما قد يؤدي إلى عدم إيجاد الأنواع المخصصة (custom types) مثل `user_role`.

### الحلول البديلة

هناك طريقتان لحل هذه المشكلة:

1. **استخدام الاسم الكامل** (ما تم تطبيقه): `public.user_role`
2. **تحديد search_path**: `SET search_path = public, auth`

تم اختيار الطريقة الأولى لأنها أكثر وضوحاً وأقل عرضة للأخطاء.

## التاريخ

- **2026-01-03**: تم تشخيص وإصلاح المشكلة
- **الحالة**: ✅ تم الحل بنجاح
