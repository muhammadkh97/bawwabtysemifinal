# تحليل المشاكل المكتشفة في مشروع بوابتي
# Issues Analysis for Bawwabty Project

تاريخ الفحص: 2026-01-01  
المشروع: bawwabty-v2  
Supabase Project ID: nrqglrpljcysxdiuxzka

---

## 🔴 المشاكل الحرجة (Critical Issues)

### 1. مشكلة إعدادات Supabase غير متطابقة

**الوصف:**
ملف `lib/supabase.ts` يحتوي على إعدادات Supabase قديمة ومختلفة عن الإعدادات الموجودة في `.env.local`

**التفاصيل:**
- في `lib/supabase.ts`:
  - URL: `https://qigqcyoggtxjtottlhpl.supabase.co`
  - Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZ3FjeW9nZ3R4anRvdHRsaHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNzg0OTQsImV4cCI6MjA4Mjg1NDQ5NH0.lFu4SgGHOgVm31VEwv0Yb1c2klJ4hxbgH5G4eE9J3vk`

- في `.env.local`:
  - URL: `https://nrqglrpljcysxdiuxzka.supabase.co`
  - Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycWdscnBsamN5c3hkaXV4emthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDUwNzksImV4cCI6MjA4MjQ4MTA3OX0.qqoqa5THBZ3BEmlYtgLxPzltKScaiLfBK7Gvm8lA2Zw`

**التأثير:**
- التطبيق يتصل بمشروع Supabase خاطئ أو غير موجود
- فشل جميع عمليات قاعدة البيانات
- عدم القدرة على تسجيل الدخول أو التسجيل

**الحل:**
إزالة القيم الافتراضية الثابتة من `lib/supabase.ts` والاعتماد فقط على متغيرات البيئة

---

### 2. Row Level Security (RLS) غير مفعل على جداول حساسة

**الوصف:**
جداول `orders` و `reviews` لديها سياسات RLS ولكن RLS غير مفعل على الجداول نفسها

**التفاصيل من Supabase Advisors:**
```
- Table `public.orders` has RLS policies but RLS is not enabled on the table
  Policies include: {restaurants_update_orders, restaurants_view_orders}

- Table `public.reviews` has RLS policies but RLS is not enabled on the table
  Policies include: {"Users can create reviews"}
```

**التأثير:**
- **خطر أمني كبير**: أي مستخدم يمكنه الوصول إلى جميع الطلبات والمراجعات
- تجاوز سياسات الأمان المعرفة
- انتهاك خصوصية البيانات

**الحل:**
تفعيل RLS على الجدولين:
```sql
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
```

---

### 3. جدول product_variants لديه RLS مفعل بدون سياسات

**الوصف:**
جدول `product_variants` لديه RLS مفعل ولكن لا توجد أي سياسات معرفة

**التأثير:**
- لا يمكن لأي مستخدم (حتى المسموح لهم) الوصول إلى بيانات المتغيرات
- فشل عرض تفاصيل المنتجات التي لها متغيرات (مقاسات، ألوان، إلخ)

**الحل:**
إضافة سياسات RLS مناسبة أو تعطيل RLS إذا لم يكن مطلوباً

---

## ⚠️ المشاكل الأمنية (Security Issues)

### 4. Views مع SECURITY DEFINER

**الوصف:**
8 Views معرفة بخاصية `SECURITY DEFINER` وهذا يشكل خطراً أمنياً

**Views المتأثرة:**
1. `users_with_full_name`
2. `loyalty_user_stats`
3. `v_products_need_classification_review`
4. `v_products_with_variants`
5. `products_detailed`
6. `nearby_restaurants`
7. `wallets_detailed`
8. `daily_stats`

**التأثير:**
- تنفذ الاستعلامات بصلاحيات منشئ الـ View وليس المستخدم الحالي
- تجاوز محتمل لسياسات RLS
- خطر أمني في حالة استغلال الـ Views

**الحل:**
مراجعة كل View وإزالة `SECURITY DEFINER` أو استبداله بـ `SECURITY INVOKER`

---

### 5. Functions بدون search_path محدد

**الوصف:**
30+ دالة معرفة بدون تحديد `search_path` مما يجعلها عرضة لهجمات

**أمثلة على الدوال المتأثرة:**
- `update_vendor_wallet_on_order_status_change`
- `notify_vendor_new_order`
- `notify_admin_new_payout`
- `calculate_delivery_fee`
- `generate_qr_code`
- وغيرها الكثير...

**التأثير:**
- إمكانية حقن كود SQL ضار
- تغيير سلوك الدوال بشكل غير متوقع

**الحل:**
إضافة `SET search_path = public, pg_temp` لكل دالة

---

## 📊 مشاكل الأداء (Performance Issues)

### 6. Foreign Keys بدون Indexes

**الوصف:**
أكثر من 50 Foreign Key بدون indexes مما يؤثر على الأداء

**أمثلة:**
- `ai_product_classifications.ai_suggested_category_id`
- `ai_product_classifications.reviewed_by`
- `contact_messages.replied_by`
- `disputes.resolved_by`
- `orders.delivery_address_id`
- `orders.restaurant_id`
- وغيرها الكثير...

**التأثير:**
- بطء في الاستعلامات التي تستخدم JOIN
- بطء في عمليات DELETE و UPDATE بسبب فحص Foreign Keys
- استهلاك عالي للموارد

**الحل:**
إضافة indexes على جميع أعمدة Foreign Keys

---

## 🔧 مشاكل التكوين (Configuration Issues)

### 7. عدم وجود Migrations مطبقة

**الوصف:**
قاعدة البيانات لا تحتوي على أي migrations مسجلة رغم وجود ملفات SQL في مجلد `database/`

**التأثير:**
- صعوبة تتبع التغييرات على قاعدة البيانات
- عدم القدرة على إعادة بناء قاعدة البيانات بسهولة
- مشاكل في النشر والتحديثات

**الحل:**
تطبيق الـ migrations بشكل صحيح أو تحويل ملفات SQL إلى migrations

---

### 8. تحذيرات ESLint في الكود

**الوصف:**
عدة تحذيرات في الكود تتعلق بـ React Hooks dependencies

**أمثلة:**
- `FloatingChatWidget.tsx`: missing dependency 'markAsRead'
- `Header.tsx`: missing dependency 'checkAuthStatus'
- `LocationPicker.tsx`: missing dependencies
- `TrackOrderMap.tsx`: missing dependency 'fetchTrackingData'

**التأثير:**
- سلوك غير متوقع للمكونات
- مشاكل في إعادة التحميل
- Bugs محتملة

**الحل:**
إصلاح dependencies في useEffect hooks

---

### 9. ثغرات أمنية في الحزم (npm audit)

**الوصف:**
4 ثغرات أمنية عالية الخطورة في الحزم المثبتة

**التأثير:**
- خطر أمني على التطبيق
- إمكانية استغلال الثغرات

**الحل:**
تشغيل `npm audit fix` أو تحديث الحزم المتأثرة

---

### 10. استخدام صور `<img>` بدلاً من `<Image>`

**الوصف:**
استخدام تاغ `<img>` HTML العادي بدلاً من مكون Next.js `<Image>`

**التأثير:**
- أداء أبطأ في تحميل الصور
- استهلاك bandwidth أعلى
- LCP (Largest Contentful Paint) أبطأ

**الحل:**
استبدال `<img>` بـ `<Image>` من `next/image`

---

## 📝 ملخص الإحصائيات

### مشاكل الأمان:
- **2** مشاكل حرجة في RLS
- **8** Views مع SECURITY DEFINER
- **30+** Functions بدون search_path
- **4** ثغرات أمنية في npm packages

### مشاكل الأداء:
- **50+** Foreign Keys بدون indexes

### مشاكل التكوين:
- **1** مشكلة في إعدادات Supabase
- **0** Migrations مطبقة
- **10+** تحذيرات ESLint

---

## 🎯 الأولويات للإصلاح

### أولوية قصوى (P0):
1. ✅ إصلاح إعدادات Supabase في `lib/supabase.ts`
2. ✅ تفعيل RLS على جداول orders و reviews
3. ✅ إضافة سياسات RLS لجدول product_variants أو تعطيل RLS

### أولوية عالية (P1):
4. إصلاح Views مع SECURITY DEFINER
5. إضافة search_path للـ Functions
6. إصلاح ثغرات npm

### أولوية متوسطة (P2):
7. إضافة Indexes على Foreign Keys
8. إصلاح تحذيرات ESLint
9. استبدال `<img>` بـ `<Image>`

### أولوية منخفضة (P3):
10. تطبيق نظام Migrations بشكل صحيح

---

## 📌 ملاحظات إضافية

1. **مفتاح Google Maps**: القيمة الحالية هي `your_google_maps_api_key_here` - يجب تحديثها
2. **متغيرات البيئة**: ملف `.env.local` يحتوي على مفاتيح حقيقية - يجب التأكد من عدم رفعه لـ GitHub
3. **Database Schema**: يوجد تعارض بين ملفات SQL في مجلد `database/` وبين البنية الفعلية في Supabase

---

**تم إنشاء هذا التقرير بواسطة:** Manus AI Agent  
**التاريخ:** 2026-01-01  
**الحالة:** جاهز للإصلاح
