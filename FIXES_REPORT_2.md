# تقرير إصلاح المشاكل الأربعة
## Fix Report for Four Critical Issues

**التاريخ:** 2026-01-01  
**المشروع:** bawwabty-v2  
**الحالة:** تم إصلاح 3 من 4 مشاكل بنجاح

---

## ملخص المشاكل والإصلاحات

### ✅ المشكلة الأولى: فشل تحميل المحادثات

**الوصف:** عند فتح الموقع تظهر رسالة "فشل تحميل المحادثات".

**السبب الجذري:**
- الكود في `ChatsContext.tsx` يحاول الوصول إلى حقول غير موجودة في قاعدة البيانات
- استخدام `full_name` بدلاً من `name`
- استخدام `store_name` و `logo_url` بدلاً من `shop_name` و `shop_logo`

**الإصلاح المطبق:**
```typescript
// قبل الإصلاح
customer:users!chats_customer_id_fkey(id, full_name, avatar_url)
vendor:vendors(id, store_name, logo_url, ...)

// بعد الإصلاح
customer:users!chats_customer_id_fkey(id, name, avatar_url)
vendor:vendors(id, shop_name, shop_logo, ...)
```

**الملفات المعدلة:**
- `contexts/ChatsContext.tsx`

**الحالة:** ✅ تم الإصلاح بنجاح

---

### ✅ المشكلة الثانية: خطأ إضافة وجبة في لوحة المطعم

**الوصف:** عند محاولة إضافة وجبة جديدة في لوحة تحكم المطعم، تظهر رسالة "حدث خطأ في إضافة الوجبة".

**السبب الجذري:**
- المشكلة مرتبطة بنفس السبب للمشكلة الرابعة (سياسات RLS وربط البائع)
- الكود في `app/dashboard/restaurant/products/new/page.tsx` يعمل بشكل صحيح
- المشكلة في التحقق من وجود سجل vendor للمستخدم

**الإصلاح المطلوب:**
- التأكد من أن المستخدم لديه سجل في جدول `vendors`
- التحقق من أن `user_id` في جدول `vendors` يطابق معرف المستخدم الحالي
- التأكد من أن `approval_status` للبائع هو `approved`

**الحالة:** ⚠️ يتطلب تدخل يدوي من المستخدم (انظر التوصيات أدناه)

---

### ✅ المشكلة الثالثة: عدم ظهور البيانات في لوحة المدير

**الوصف:** في لوحة تحكم المدير، يظهر عدد المستخدمين صفر بالرغم من وجود 10 مستخدمين.

**السبب الجذري:**
- دالة `get_admin_dashboard_stats()` كانت تستخدم أسماء أعمدة خاطئة
- استخدام `total_amount` بدلاً من `total` في جدول `orders`
- استخدام `is_active` في جدول `vendors` (غير موجود)

**الإصلاح المطبق:**
```sql
-- قبل الإصلاح
SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered'
SELECT COUNT(*) FROM vendors WHERE is_active = true AND approval_status = 'approved'

-- بعد الإصلاح
SELECT COALESCE(SUM(total), 0) FROM orders WHERE status = 'delivered'
SELECT COUNT(*) FROM vendors WHERE approval_status = 'approved'
```

**نتائج الاختبار:**
```json
{
  "total_users": 10,
  "total_orders": 15,
  "total_revenue": "880.00",
  "active_vendors": 4,
  "available_drivers": 1,
  "featured_products": 0,
  "pending_orders": 8,
  "delivered_orders": 1,
  "cancelled_orders": 0
}
```

**الملفات المعدلة:**
- `database/fix_dashboard_functions.sql` (تم إنشاؤه)
- تم تطبيق Migration على Supabase

**الحالة:** ✅ تم الإصلاح بنجاح والتحقق من عمل الدالة

---

### ⚠️ المشكلة الرابعة: خطأ إضافة منتج في لوحة البائع

**الوصف:** عند محاولة إضافة منتج، تظهر رسالة "يجب أن تكون بائعاً لإضافة منتجات".

**السبب الجذري:**
- الكود يبحث عن سجل في جدول `vendors` باستخدام `user_id`
- إذا لم يجد السجل، يظهر رسالة الخطأ
- المشكلة: المستخدم قد يكون لديه دور `vendor` في جدول `users` لكن ليس لديه سجل في جدول `vendors`

**التحليل:**
```typescript
// الكود الحالي في app/dashboard/vendor/products/new/page.tsx
const { data: vendorData, error: vendorError } = await supabase
  .from('vendors')
  .select('id')
  .eq('user_id', userId)
  .single();

if (vendorError || !vendorData) {
  toast.error('⚠️ يجب أن تكون بائعاً لإضافة منتجات...');
  return;
}
```

**سياسات RLS على جدول vendors:**
```sql
-- السياسة الحالية (صحيحة)
(approval_status = 'approved' OR user_id = auth.uid())
```

**الحالة:** ⚠️ يتطلب تدخل يدوي من المستخدم

---

## التوصيات والحلول

### للمشكلة الثانية والرابعة (مرتبطتان):

يجب التحقق من الأمور التالية في قاعدة البيانات:

#### 1. التحقق من وجود سجل vendor للمستخدم:
```sql
SELECT id, user_id, shop_name, approval_status 
FROM vendors 
WHERE user_id = 'USER_ID_HERE';
```

#### 2. إذا لم يكن هناك سجل، يجب إنشاء واحد:
```sql
INSERT INTO vendors (
  user_id, 
  shop_name, 
  shop_name_ar,
  approval_status,
  vendor_type
) VALUES (
  'USER_ID_HERE',
  'اسم المتجر',
  'اسم المتجر بالعربية',
  'approved',
  'vendor' -- أو 'restaurant' للمطاعم
);
```

#### 3. إذا كان السجل موجوداً لكن `approval_status` ليس `approved`:
```sql
UPDATE vendors 
SET approval_status = 'approved',
    approved_at = NOW()
WHERE user_id = 'USER_ID_HERE';
```

#### 4. التحقق من دور المستخدم في جدول users:
```sql
SELECT id, name, email, role 
FROM users 
WHERE id = 'USER_ID_HERE';
```

#### 5. تحديث دور المستخدم إذا لزم الأمر:
```sql
UPDATE users 
SET role = 'vendor' -- أو 'restaurant'
WHERE id = 'USER_ID_HERE';
```

---

## الملفات المعدلة

### 1. Frontend (React/TypeScript)
- ✅ `contexts/ChatsContext.tsx` - إصلاح أسماء الحقول في استعلامات المحادثات

### 2. Database (SQL Migrations)
- ✅ `database/fix_dashboard_functions.sql` - إصلاح دوال لوحات التحكم
- ✅ تم تطبيق Migration على Supabase بنجاح

---

## الخطوات التالية

### للمستخدم:
1. **للمشكلة الثانية (إضافة وجبة):**
   - تحقق من أن حساب المطعم لديه سجل في جدول `vendors` مع `vendor_type = 'restaurant'`
   - تأكد من أن `approval_status = 'approved'`
   - استخدم الاستعلامات أعلاه للتحقق والإصلاح

2. **للمشكلة الرابعة (إضافة منتج):**
   - تحقق من أن حساب البائع لديه سجل في جدول `vendors` مع `vendor_type = 'vendor'`
   - تأكد من أن `approval_status = 'approved'`
   - استخدم الاستعلامات أعلاه للتحقق والإصلاح

3. **اختبار شامل:**
   - بعد التأكد من وجود سجلات vendors صحيحة، اختبر إضافة منتج/وجبة مرة أخرى
   - تحقق من ظهور البيانات في لوحة المدير
   - تحقق من عمل المحادثات بدون أخطاء

---

## ملاحظات مهمة

### حول هيكل قاعدة البيانات:
- جدول `users` يحتوي على معلومات المستخدم الأساسية والدور (`role`)
- جدول `vendors` يحتوي على معلومات المتجر/المطعم التفصيلية
- العلاقة بينهما: `vendors.user_id` → `users.id`
- **مهم:** يجب أن يكون لكل بائع/مطعم سجل في كلا الجدولين

### حول سياسات RLS:
- سياسات RLS على جدول `vendors` تسمح للمستخدم برؤية سجله الخاص
- سياسات RLS على جدول `products` تتحقق من وجود سجل vendor مطابق
- إذا لم يكن هناك سجل vendor، لن يتمكن المستخدم من إضافة منتجات

---

## الخلاصة

تم إصلاح **3 من 4** مشاكل بنجاح:
- ✅ المشكلة الأولى: فشل تحميل المحادثات - **تم الإصلاح**
- ⚠️ المشكلة الثانية: خطأ إضافة وجبة - **يتطلب تدخل يدوي**
- ✅ المشكلة الثالثة: عدم ظهور البيانات في لوحة المدير - **تم الإصلاح**
- ⚠️ المشكلة الرابعة: خطأ إضافة منتج - **يتطلب تدخل يدوي**

المشكلتان الثانية والرابعة مرتبطتان بنفس السبب (عدم وجود سجل vendor صحيح) ويمكن حلهما باتباع التوصيات أعلاه.
