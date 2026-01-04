# تقرير تحليل المشاكل

## تاريخ التحليل
2026-01-03

## المشاكل المكتشفة

### 1. مشكلة صفحة متجري (Vendor not found)

**الموقع:** `/app/dashboard/vendor/my-store/page.tsx` - السطر 174

**السبب:**
- الكود يحاول جلب بيانات المتجر من جدول `stores` باستخدام `user_id`
- إذا لم يتم العثور على سجل في جدول `stores` للمستخدم، يتم رفع خطأ "Vendor not found"
- المشكلة تحدث عندما يكون المستخدم مسجلاً كـ vendor لكن لا يوجد له سجل في جدول stores

**الكود الحالي (السطور 167-174):**
```typescript
// Get vendor ID
const { data: vendorData } = await supabase
  .from('stores')
  .select('id')
  .eq('user_id', userId)
  .single();

if (!vendorData) throw new Error('Vendor not found');
```

**الحل المقترح:**
- إنشاء سجل تلقائي في جدول `stores` إذا لم يكن موجوداً
- أو تحديث السجل الموجود بدلاً من رفع خطأ

---

### 2. مشكلة الكوبونات (permission denied for table coupons)

**الموقع:** `/app/dashboard/vendor/promotions/page.tsx`

**السبب:**
المشكلة تحدث بسبب سياسات RLS (Row Level Security) على جدول `coupons`. التحليل أظهر:

1. **حالة RLS:** مفعّلة على جدول `coupons` (`rowsecurity: true`)

2. **السياسات الموجودة:**
   - `coupons_select_authenticated`: تسمح للمستخدمين المصادق عليهم بالقراءة
   - `coupons_insert_authenticated`: تسمح للمستخدمين المصادق عليهم بالإدراج
   - `coupons_update_authenticated`: تسمح للمستخدمين المصادق عليهم بالتحديث
   - `coupons_delete_authenticated`: تسمح للمستخدمين المصادق عليهم بالحذف
   - `coupons_select_public`: تسمح للعامة بقراءة الكوبونات النشطة فقط

3. **المشكلة الفعلية:**
   - السياسات الحالية تستخدم `qual: true` و `with_check: true` وهي عامة جداً
   - لا تتحقق من أن المستخدم هو صاحب المتجر (vendor)
   - قد تكون هناك مشكلة في المصادقة أو في الصلاحيات

**الأخطاء المسجلة:**
```
GET https://itptinhxsylzvfcpxwpl.supabase.co/rest/v1/coupons?select=*&vendor_id=eq.6186f1a0-7f95-4d54-ac70-391127079a3f&order=created_at.desc 403 (Forbidden)
Error: {code: '42501', details: null, hint: null, message: 'permission denied for table coupons'}
```

**الحل المقترح:**
1. تحديث سياسات RLS لتكون أكثر تحديداً للبائعين
2. التأكد من أن المستخدم مصادق عليه بشكل صحيح
3. إضافة شرط للتحقق من أن `vendor_id` في الكوبون يطابق متجر المستخدم الحالي

---

## الخطوات التالية

1. إصلاح مشكلة "Vendor not found" بإضافة منطق إنشاء أو تحديث السجل
2. تحديث سياسات RLS لجدول `coupons` لتسمح للبائعين بإدارة كوبوناتهم فقط
3. اختبار الحلول
4. رفع التعديلات إلى GitHub
