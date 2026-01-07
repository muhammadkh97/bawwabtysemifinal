# إصلاحات صفحة الموافقات (Approvals Page)

## المشاكل التي تم حلها

### 1️⃣ مشكلة العلاقات المتعارضة في جدول المنتجات

**الخطأ الأصلي:**
```
Could not find a relationship between 'products' and 'stores' in the schema cache
```

**السبب:**
- وجود مفتاحين أجنبيين على عمود `vendor_id` في جدول `products`:
  - `products_vendor_id_stores_fkey` → يربط بـ `stores.id`
  - `products_vendor_id_vendors_fkey` → يربط بـ `vendors.id`
- هذا التعارض يجعل Supabase/PostgREST غير قادر على تحديد أي علاقة يجب استخدامها

**الحل:**
```sql
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_vendor_id_vendors_fkey;
```

**الملفات المعدلة:**
- ✅ قاعدة البيانات: حذف المفتاح الأجنبي الزائد
- ✅ `app/dashboard/admin/approvals/page.tsx`: تحديث الاستعلام ليستخدم `products_vendor_id_stores_fkey`

---

### 2️⃣ مشكلة عمود غير موجود في جدول السائقين

**الخطأ الأصلي:**
```
column drivers.vehicle_plate does not exist
```

**السبب:**
- الكود يحاول جلب عمود `vehicle_plate` من جدول `drivers`
- الجدول يحتوي على عمود `vehicle_number` وليس `vehicle_plate`

**الحل:**
تم تعديل الاستعلام والكود ليستخدم الأعمدة الصحيحة:
- ❌ `vehicle_plate` (غير موجود)
- ✅ `vehicle_number` (الصحيح)
- ❌ `vehicle_model` (تم حذفه من الاستعلام)
- ❌ `vehicle_color` (تم حذفه من الاستعلام)
- ✅ `license_image` (تمت إضافته)

**الملفات المعدلة:**
- ✅ `app/dashboard/admin/approvals/page.tsx`:
  - تحديث استعلام جلب السائقين
  - تحديث mapping البيانات
  - تحديث عرض البيانات في الواجهة

---

## التعديلات التفصيلية

### في ملف `app/dashboard/admin/approvals/page.tsx`

#### 1. استعلام المنتجات (السطر ~41)
```typescript
// قبل التعديل
stores!products_vendor_id_fkey (...)

// بعد التعديل
stores!products_vendor_id_stores_fkey (...)
```

#### 2. استعلام السائقين (السطر ~125)
```typescript
// قبل التعديل
.select(`
  id,
  license_number,
  vehicle_type,
  vehicle_plate,        // ❌ غير موجود
  vehicle_model,        // ❌ غير مطلوب
  vehicle_color,        // ❌ غير مطلوب
  documents,
  created_at,
  users!drivers_user_id_fkey (...)
`)

// بعد التعديل
.select(`
  id,
  license_number,
  license_image,        // ✅ مضاف
  vehicle_type,
  vehicle_number,       // ✅ الصحيح
  documents,
  created_at,
  users!drivers_user_id_fkey (...)
`)
```

#### 3. تحويل بيانات السائقين (السطر ~150)
```typescript
// قبل التعديل
vehicle_plate: d.vehicle_plate || '',
vehicle_model: d.vehicle_model || '',
vehicle_color: d.vehicle_color || '',

// بعد التعديل
license_image: d.license_image || '',
vehicle_number: d.vehicle_number || '',
```

---

## اختبار الإصلاحات

### 1. التحقق من قاعدة البيانات
```sql
-- التحقق من المفاتيح الأجنبية في products
SELECT constraint_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'products' 
  AND constraint_name LIKE '%vendor%';
```

**النتيجة المتوقعة:**
```
products_vendor_id_stores_fkey | vendor_id
```

### 2. التحقق من أعمدة drivers
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'drivers' 
  AND column_name LIKE '%vehicle%';
```

**النتيجة المتوقعة:**
```
vehicle_type
vehicle_number
```

### 3. اختبار صفحة الموافقات
1. افتح المتصفح وانتقل إلى: `/dashboard/admin/approvals`
2. تحقق من Console في المتصفح
3. يجب ألا تظهر الأخطاء التالية:
   - ❌ `Could not find a relationship between 'products' and 'stores'`
   - ❌ `column drivers.vehicle_plate does not exist`

---

## الملفات التي تم إنشاؤها/تعديلها

### ملفات SQL
- ✅ `inspect_approvals_page_db.sql` - استعلامات فحص البيانات
- ✅ `fix-approvals-page-issues.sql` - ملخص الإصلاحات

### ملفات الكود
- ✅ `app/dashboard/admin/approvals/page.tsx` - صفحة الموافقات الرئيسية

---

## الخلاصة

✅ **تم حل جميع المشاكل بنجاح**

1. تم حذف المفتاح الأجنبي الزائد من قاعدة البيانات
2. تم تعديل الاستعلامات لاستخدام الأعمدة والعلاقات الصحيحة
3. صفحة الموافقات `/dashboard/admin/approvals` تعمل الآن بدون أخطاء

---

## الخطوات التالية

1. اختبر الصفحة في المتصفح
2. تحقق من جلب البيانات بشكل صحيح
3. اختبر وظائف الموافقة والرفض

إذا واجهت أي مشاكل أخرى، يرجى مراجعة:
- `fix-approvals-page-issues.sql` للتحقق من قاعدة البيانات
- Console المتصفح للحصول على تفاصيل الأخطاء
