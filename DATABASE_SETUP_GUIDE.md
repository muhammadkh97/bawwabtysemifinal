# 📚 دليل إعداد قاعدة البيانات التفصيلي

## 🎯 نظرة عامة

هذا الدليل يشرح بالتفصيل كيفية إعداد قاعدة البيانات الكاملة للمشروع خطوة بخطوة.

---

## 📋 الملفات المطلوبة (بالترتيب)

### المرحلة 1: الأنواع المخصصة (ENUMs)
📄 `database/migrations/001_create_enums.sql`

**الوصف**: إنشاء جميع الأنواع المخصصة المستخدمة في النظام

**المحتويات**:
- `user_role` - أدوار المستخدمين (admin, vendor, customer, etc.)
- `vendor_type` - أنواع المتاجر (restaurant, shop, etc.)
- `vendor_status` - حالات الموافقة (pending, approved, etc.)
- `order_status` - حالات الطلبات
- `delivery_status` - حالات التوصيل
- `payment_status` - حالات الدفع
- `payment_method` - طرق الدفع
- `notification_type` - أنواع الإشعارات
- `complaint_status` - حالات الشكاوى
- `transaction_type` - أنواع المعاملات المالية

---

### المرحلة 2: جداول المستخدمين
📄 `database/migrations/002_create_users_tables.sql`

**الوصف**: إنشاء جداول الملفات الشخصية والإعدادات

**الجداول**:
1. `profiles` - الملفات الشخصية الأساسية (مرتبط بـ auth.users)
2. `user_settings` - إعدادات المستخدم (إشعارات، لغة، إلخ)
3. `user_addresses` - عناوين التوصيل
4. `favorites` - المفضلة
5. `user_follows` - المتابعة

**Features**:
- ✅ Trigger تلقائي لإنشاء profile عند التسجيل
- ✅ Trigger لتحديث `updated_at` تلقائياً
- ✅ فهرسة محسنة للبحث السريع
- ✅ قيود للتحقق من البيانات

---

### المرحلة 3: جداول البائعين
📄 `database/migrations/003_create_vendors_tables.sql`

**الوصف**: إنشاء جداول المتاجر والبائعين

**الجداول**:
1. `vendors` - معلومات المتاجر الأساسية
2. `vendor_categories` - فئات المنتجات داخل المتجر
3. `vendor_working_hours` - ساعات العمل التفصيلية
4. `vendor_statistics` - إحصائيات المتاجر
5. `vendor_delivery_zones` - مناطق التوصيل

**Features**:
- ✅ إنشاء slug تلقائي
- ✅ إنشاء إحصائيات تلقائياً
- ✅ دعم المواقع الجغرافية (GIS)
- ✅ إدارة أوقات العمل المرنة

---

### المرحلة 4: جداول المنتجات
📄 `database/migrations/004_create_products_tables.sql`

**الوصف**: إنشاء نظام المنتجات الكامل

**الجداول**:
1. `categories` - الفئات الرئيسية (هرمية)
2. `products` - المنتجات الأساسية
3. `product_variants` - متغيرات المنتجات (أحجام، ألوان)
4. `tags` - الوسوم
5. `product_tags` - ربط المنتجات بالوسوم
6. `inventory_logs` - سجل تغييرات المخزون

**Features**:
- ✅ دعم المتغيرات (variants)
- ✅ تتبع المخزون التلقائي
- ✅ نظام الوسوم (tags)
- ✅ SEO-friendly (slugs, meta tags)
- ✅ حساب عدد المنتجات في الفئة تلقائياً

---

### المرحلة 5: جداول الطلبات والمدفوعات
📄 `database/migrations/005_create_orders_payments_tables.sql`

**الوصف**: نظام الطلبات الكامل

**الجداول**:
1. `orders` - الطلبات الرئيسية
2. `order_items` - عناصر الطلب
3. `payments` - المدفوعات
4. `order_status_history` - سجل حالات الطلب
5. `deliveries` - معلومات التوصيل

**Features**:
- ✅ رقم طلب فريد تلقائياً
- ✅ تتبع حالة الطلب
- ✅ دعم طرق دفع متعددة
- ✅ سجل كامل لتغييرات الحالة
- ✅ معلومات التوصيل التفصيلية

---

### المرحلة 6: سياسات الأمان
📄 `database/policies/rls_policies.sql`

**الوصف**: سياسات Row Level Security لجميع الجداول

**الحماية**:
- ✅ المستخدمون يرون بياناتهم فقط
- ✅ البائعون يديرون متاجرهم فقط
- ✅ السائقون يرون طلباتهم فقط
- ✅ المدراء لديهم صلاحيات كاملة
- ✅ العملاء يرون المنتجات النشطة فقط

---

## 🚀 خطوات التنفيذ

### الخطوة 1: تسجيل الدخول إلى Supabase

1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك أو أنشئ مشروعاً جديداً
3. اذهب إلى **SQL Editor**

### الخطوة 2: تشغيل الملفات بالترتيب

#### 2.1 تشغيل ENUMs

```sql
-- افتح: database/migrations/001_create_enums.sql
-- انسخ المحتوى والصقه في SQL Editor
-- اضغط RUN
```

**✅ التحقق من النجاح**:
```sql
SELECT typname FROM pg_type WHERE typname IN (
  'user_role', 'vendor_type', 'order_status'
);
-- يجب أن ترى 10 أنواع
```

#### 2.2 تشغيل جداول المستخدمين

```sql
-- افتح: database/migrations/002_create_users_tables.sql
-- انسخ والصق في SQL Editor
-- اضغط RUN
```

**✅ التحقق من النجاح**:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_settings', 'user_addresses');
-- يجب أن ترى 5 جداول
```

#### 2.3 تشغيل جداول البائعين

```sql
-- افتح: database/migrations/003_create_vendors_tables.sql
-- انسخ والصق
-- اضغط RUN
```

**✅ التحقق**:
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'vendor%';
-- يجب أن ترى 5 جداول
```

#### 2.4 تشغيل جداول المنتجات

```sql
-- افتح: database/migrations/004_create_products_tables.sql
-- اضغط RUN
```

**✅ التحقق**:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('products', 'categories', 'product_variants');
-- يجب أن ترى 6 جداول
```

#### 2.5 تشغيل جداول الطلبات

```sql
-- افتح: database/migrations/005_create_orders_payments_tables.sql
-- اضغط RUN
```

**✅ التحقق**:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'order_items', 'payments', 'deliveries');
-- يجب أن ترى 5 جداول
```

#### 2.6 تطبيق سياسات الأمان

```sql
-- افتح: database/policies/rls_policies.sql
-- اضغط RUN
```

**✅ التحقق من RLS**:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
-- يجب أن ترى جميع الجداول مع rowsecurity = true
```

---

## 🔍 التحقق النهائي

### 1. التحقق من عدد الجداول

```sql
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';
-- يجب أن يكون العدد حوالي 20-25 جدول
```

### 2. التحقق من الـ Triggers

```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
-- يجب أن ترى عدة triggers
```

### 3. التحقق من الـ Functions

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';
-- يجب أن ترى functions مثل update_updated_at_column
```

### 4. التحقق من RLS Policies

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
-- يجب أن ترى عدة policies لكل جدول
```

---

## 🎨 إعداد Storage Buckets

بعد إعداد الجداول، قم بإنشاء Buckets للصور:

```sql
-- اذهب إلى Storage في Supabase Dashboard
-- أنشئ Buckets التالية:

-- 1. للمنتجات (عام)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true);

-- 2. للمتاجر (عام)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendors', 'vendors', true);

-- 3. للصور الشخصية (عام)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- 4. للمستندات (خاص)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);
```

### Storage Policies

```sql
-- سماح برفع الصور للمستخدمين المسجلين
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('products', 'vendors', 'avatars'));

-- سماح بحذف الصور لمالكيها
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🐛 استكشاف الأخطاء الشائعة

### خطأ: "relation already exists"

**السبب**: الجدول موجود مسبقاً

**الحل**:
```sql
-- حذف الجدول القديم
DROP TABLE IF EXISTS table_name CASCADE;
-- ثم إعادة تشغيل migration
```

### خطأ: "type already exists"

**السبب**: النوع موجود مسبقاً

**الحل**:
```sql
-- حذف النوع القديم
DROP TYPE IF EXISTS type_name CASCADE;
-- ثم إعادة تشغيل migration
```

### خطأ: "foreign key constraint fails"

**السبب**: ترتيب تشغيل الملفات خاطئ

**الحل**: تأكد من تشغيل الملفات بالترتيب الصحيح (001, 002, 003...)

---

## ✅ قائمة التحقق النهائية

- [ ] تم تشغيل جميع migrations بنجاح
- [ ] RLS مفعّل على جميع الجداول
- [ ] Policies موجودة وتعمل
- [ ] Triggers تعمل بشكل صحيح
- [ ] Storage buckets منشأة
- [ ] لا توجد أخطاء في الـ logs

---

## 🎉 تهانينا!

قاعدة البيانات الآن جاهزة للاستخدام! 🚀

يمكنك الآن:
1. تشغيل التطبيق: `npm run dev`
2. التسجيل كمستخدم جديد
3. البدء في اختبار الميزات

---

**ملاحظة**: احتفظ بهذا الدليل للرجوع إليه عند الحاجة لإعادة الإعداد أو استكشاف الأخطاء.
