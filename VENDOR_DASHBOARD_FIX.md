# إصلاح مشكلة لوحة تحكم البائع وصفحة إضافة المنتج

## المشاكل التي تم إصلاحها:

### 1. مشكلة إعادة التوجيه إلى صفحة 404
**السبب**: عندما لا يجد النظام بيانات البائع في جدول `vendors`، كان يقوم بإعادة التوجيه إلى `/dashboard` والذي لا يوجد.

**الحل**: 
- تم تغيير مسار إعادة التوجيه من `/dashboard` إلى `/dashboard/vendor`
- تمت إضافة console.error لتسجيل الأخطاء لتسهيل التشخيص

### 2. مشكلة التصميم غير المندمج
**السبب**: صفحة إضافة المنتج كانت تحتوي على تصميمها الكامل المستقل، ولم يكن Layout يحتوي على `VendorSidebar`.

**الحل**:
- تمت إضافة `VendorSidebar` إلى `app/dashboard/vendor/layout.tsx`
- تم تبسيط تصميم صفحة إضافة المنتج لإزالة التصميم المكرر
- الآن الصفحة تعرض القائمة الجانبية بشكل صحيح

## خطوات إصلاح قاعدة البيانات (مهم جداً):

لكي تعمل صفحة إضافة المنتج بدون إعادة توجيه، يجب تنفيذ الخطوات التالية:

### الخطوة 1: تنفيذ SQL Script
1. افتح Supabase Dashboard
2. اذهب إلى **SQL Editor**
3. افتح الملف `database/force_rebuild.sql`
4. انسخ **كل** المحتوى والصقه في SQL Editor
5. اضغط **Run** لتنفيذ الاستعلام

⚠️ **تحذير**: هذا سيقوم بحذف جميع البيانات الموجودة! استخدمه فقط في بيئة التطوير.

### الخطوة 2: إعادة تحميل Schema Cache
1. في Supabase Dashboard، اذهب إلى **Settings** → **API**
2. ابحث عن زر **"Reload schema cache"**
3. اضغط على الزر وانتظر حتى تكتمل العملية

### الخطوة 3: التحقق من البيانات
افتح SQL Editor وقم بتنفيذ:

```sql
-- تحقق من وجود جدول vendors كـ TABLE وليس VIEW
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'vendors';
-- يجب أن يظهر: vendors | BASE TABLE

-- تحقق من Foreign Keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('products', 'chats', 'order_items')
AND ccu.table_name = 'vendors';
-- يجب أن تظهر 3 foreign keys: products, chats, order_items → vendors
```

### الخطوة 4: إنشاء بيانات اختبار للبائع
إذا كنت تريد اختبار النظام، قم بتنفيذ:

```sql
-- أولاً: تأكد من أنك قمت بتسجيل الدخول كمستخدم
-- ثم قم بترقية دور المستخدم إلى vendor
UPDATE users 
SET role = 'vendor', user_role = 'vendor' 
WHERE email = 'your-email@example.com';  -- استبدل بإيميلك

-- ثانياً: أنشئ متجر للبائع
INSERT INTO stores (
  user_id,
  name,
  name_ar,
  description,
  business_type,
  category,
  phone,
  email,
  address,
  lat,
  lng,
  is_active,
  approval_status
)
VALUES (
  (SELECT id FROM users WHERE email = 'your-email@example.com'),  -- استبدل بإيميلك
  'My Test Store',
  'متجري التجريبي',
  'A test store for development',
  'retail',
  'Electronics',
  '+966500000000',
  'store@example.com',
  'Riyadh, Saudi Arabia',
  24.7136,
  46.6753,
  true,
  'approved'
);

-- سيتم نسخ البيانات تلقائياً إلى جدول vendors عبر Trigger
```

### الخطوة 5: اختبار صفحة إضافة المنتج
1. سجل الدخول كبائع
2. اذهب إلى `/dashboard/vendor/products/new`
3. يجب أن تظهر الصفحة مع VendorSidebar
4. لا يجب أن يحدث أي إعادة توجيه تلقائية

## التحقق من نجاح الإصلاح:

افتح Browser Console (F12) وتحقق من:

✅ **لا توجد أخطاء 400/406** من `/rest/v1/vendors`
✅ **لا توجد أخطاء PGRST200** حول "Could not find a relationship"
✅ **الصفحة تعرض VendorSidebar** على الجانب الأيمن
✅ **لا يحدث redirect تلقائي** إلى صفحة 404

## ملاحظات مهمة:

1. **جدول vendors الآن جدول حقيقي** (BASE TABLE) وليس VIEW
2. **يتم المزامنة تلقائياً** بين stores و vendors عبر Triggers
3. **Foreign Keys تعمل بشكل صحيح** مع PostgREST
4. **الـ Layout يستخدم VendorSidebar** لكل صفحات `/dashboard/vendor/*`

## في حال استمرار المشكلة:

إذا ما زالت صفحة 404 تظهر:

1. تحقق من Console في المتصفح للأخطاء
2. تحقق من Supabase Logs في Dashboard
3. تأكد من أن `force_rebuild.sql` تم تنفيذه بالكامل بدون أخطاء
4. تأكد من reload schema cache
5. امسح cache المتصفح (Ctrl+Shift+Delete)
6. أعد تشغيل dev server: `npm run dev`

## الملفات التي تم تعديلها:

1. ✅ `app/dashboard/vendor/layout.tsx` - إضافة VendorSidebar
2. ✅ `app/dashboard/vendor/products/new/page.tsx` - تصحيح redirect ومن التصميم
3. ✅ `database/force_rebuild.sql` - تحويل vendors إلى TABLE مع Foreign Keys
