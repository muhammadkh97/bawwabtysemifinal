# 🚀 تطبيق Migration - نظام التوصيل المزدوج

## 📋 الخطوات

### الطريقة 1: من Supabase Dashboard (الأسهل)

1. افتح [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك: `itptinhxsylzvfcpxwpl`
3. من القائمة الجانبية، اختر **SQL Editor**
4. انسخ محتوى الملف `migrations/001_create_delivery_system.sql`
5. الصقه في SQL Editor
6. اضغط **Run** أو `Ctrl+Enter`

### الطريقة 2: من Terminal (المتقدمة)

إذا كان لديك Supabase CLI مثبت:

```bash
# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref itptinhxsylzvfcpxwpl

# تطبيق Migration
supabase db push
```

## ✅ التحقق من نجاح Migration

بعد تطبيق Migration، قم بتشغيل هذا الاستعلام للتحقق:

```sql
-- فحص الجداول
SELECT 'delivery_zones' as table_name, COUNT(*) as count FROM delivery_zones
UNION ALL
SELECT 'delivery_batches', COUNT(*) FROM delivery_batches;

-- فحص الدوال
SELECT proname as function_name
FROM pg_proc
WHERE proname IN (
    'determine_delivery_type',
    'find_delivery_zone',
    'generate_batch_number',
    'create_delivery_batch',
    'update_batch_stats',
    'calculate_delivery_fee',
    'get_estimated_delivery'
);

-- فحص ENUM Types
SELECT typname, enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN ('delivery_type', 'batch_status')
ORDER BY typname, enumsortorder;
```

## 🎯 النتائج المتوقعة

بعد التطبيق الناجح، يجب أن ترى:

- ✅ جدول `delivery_zones` مع 5 مناطق
- ✅ جدول `delivery_batches` فارغ
- ✅ 7 دوال جديدة
- ✅ 2 ENUM types جديدة
- ✅ أعمدة جديدة في جدول `orders`

## 🔧 استكشاف الأخطاء

### خطأ: "type already exists"
هذا طبيعي إذا كانت بعض الأنواع موجودة مسبقاً. Migration يتعامل مع هذا تلقائياً.

### خطأ: "table already exists"
Migration يستخدم `CREATE TABLE IF NOT EXISTS` لذلك لن يحدث هذا الخطأ.

### خطأ: "column already exists"
Migration يستخدم `ADD COLUMN IF NOT EXISTS` لذلك آمن للتشغيل مرات متعددة.

## 📞 الدعم

إذا واجهت أي مشكلة، تحقق من:
1. صلاحيات المستخدم في Supabase
2. أن المشروع متصل بشكل صحيح
3. أن جدول `orders` موجود مسبقاً

## 🔗 الخطوة التالية

بعد تطبيق Migration:
1. تأكد من نجاح التطبيق
2. شغّل التطبيق: `npm run dev`
3. جرب إنشاء بكج من Admin Panel: `/dashboard/admin/delivery-packages/create`
