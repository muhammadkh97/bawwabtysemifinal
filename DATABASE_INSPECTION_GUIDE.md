# 🔍 دليل فحص قاعدة البيانات من Supabase مباشرة

## 📋 الخطوات

### 1️⃣ افتح Supabase Dashboard
- اذهب إلى: https://supabase.com/dashboard
- اختر مشروعك
- اذهب إلى **SQL Editor** من القائمة الجانبية

---

## 🔎 الاستعلامات المطلوبة

### استعلام 1: بنية جدول users
```sql
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'users'
ORDER BY ordinal_position;
```

**الغرض:** معرفة جميع الأعمدة الموجودة في جدول users

---

### استعلام 2: فحص القيود (Constraints)
```sql
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name = 'users'
ORDER BY tc.constraint_type;
```

**الغرض:** معرفة Primary Keys و Foreign Keys والقيود الأخرى

---

### استعلام 3: فحص الفهارس (Indexes)
```sql
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename = 'users';
```

**الغرض:** معرفة جميع الفهارس على جدول users

---

### استعلام 4: فحص auth.users (جدول Supabase Auth)
```sql
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'auth' 
    AND table_name = 'users'
ORDER BY ordinal_position;
```

**الغرض:** معرفة بنية جدول المصادقة في Supabase

---

### استعلام 5: اختبار بيانات موجودة
```sql
-- عدد المستخدمين في public.users
SELECT COUNT(*) as total_users FROM users;

-- أول 3 مستخدمين (بدون بيانات حساسة)
SELECT 
    id,
    email,
    COALESCE(full_name, name, 'N/A') as name,
    COALESCE(role, user_role, 'N/A') as role,
    created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 3;
```

**الغرض:** معرفة أسماء الأعمدة الفعلية المستخدمة (هل name أم full_name؟ هل role أم user_role؟)

---

### استعلام 6: فحص RLS Policies
```sql
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'users'
ORDER BY policyname;
```

**الغرض:** معرفة سياسات الأمان (Row Level Security)

---

### استعلام 7: فحص الـ Triggers
```sql
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
    AND event_object_table = 'users'
ORDER BY trigger_name;
```

**الغرض:** معرفة إذا كان هناك triggers تلقائية

---

### استعلام 8: قائمة جميع الجداول
```sql
SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
       AND columns.table_name = tables.table_name) as column_count
FROM information_schema.tables tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**الغرض:** معرفة جميع الجداول الموجودة في المشروع

---

## 📊 بعد تشغيل الاستعلامات

انسخ النتائج وشاركها معي، وسأقوم بـ:

1. ✅ تحليل البنية الفعلية
2. ✅ التأكد من توافقها مع نظام تسجيل الدخول
3. ✅ إنشاء migration إذا احتجنا تعديلات
4. ✅ تحديث الكود ليتوافق مع البنية الفعلية

---

## 🎯 ما نبحث عنه

### للـ OAuth يجب أن يكون موجود:

- ✅ **id** (UUID) - معرف المستخدم
- ✅ **email** (TEXT) - البريد الإلكتروني
- ✅ **name أو full_name** (TEXT) - اسم المستخدم
- ✅ **role أو user_role** (TEXT/ENUM) - دور المستخدم
- ✅ **created_at** (TIMESTAMPTZ) - تاريخ الإنشاء

### اختياري لكن مفيد:

- 📌 **avatar_url** - صورة المستخدم من OAuth
- 📌 **phone** - رقم الهاتف
- 📌 **is_active** - حالة المستخدم
- 📌 **updated_at** - آخر تحديث

---

## 🚀 بعد الفحص

سأقوم بإنشاء:
1. **Migration script** للتعديلات المطلوبة
2. **تحديث auth.ts** ليتوافق مع البنية الفعلية
3. **تحديث callback page** للتعامل مع OAuth بشكل صحيح

---

**انتظر نتائج الاستعلامات وسأكمل التحديثات! 🎯**
