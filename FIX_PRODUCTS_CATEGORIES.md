# 🔧 حل مشكلة تحميل المنتجات والفئات

## 📋 المشكلة
```
Error: Could not find a relationship between 'products' and 'categories' in the schema cache
```

## 🔍 السبب
جدول `products` **لا يحتوي على Foreign Key** يشير إلى جدول `categories`، وبالتالي API Supabase لا يستطيع عمل JOIN بين الجداول.

## ✅ الحل

### الخطوة 1: تطبيق migration جديد
1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك
3. اذهب إلى **SQL Editor**
4. انسخ محتوى الملف:
   ```
   supabase/migrations/20260104_fix_products_categories_fk.sql
   ```
5. ألصقه في SQL Editor وقم بتنفيذه (Run)

### الخطوة 2: انتظر إعادة تحميل Schema Cache
- قد تحتاج إلى الانتظار 30 ثانية
- أو قم بإعادة تحميل صفحة Supabase

### الخطوة 3: اختبار الحل
افتح المتصفح وجرب:
1. صفحة المنتجات
2. صفحة الفئات/التصنيفات

## 📝 ما تم إصلاحه

✅ إضافة عمود `category_id` إذا لم يكن موجوداً  
✅ إضافة Foreign Key `products_category_id_fkey`  
✅ إنشاء فهرس للأداء `idx_products_category_id`  
✅ تحديث RLS policies لـ products  

## 🚀 النتيجة المتوقعة
- تحميل المنتجات بنجاح ✅
- ظهور الفئات بشكل صحيح ✅
- عدم ظهور أخطاء في الكونسول ✅

## ⚠️ ملاحظات إذا لم ينجح الحل

إذا استمرت المشكلة:
1. تحقق من أن جدول `categories` موجود ولديه بيانات
2. تحقق من أن العمود `id` في جدول `categories` موجود
3. قد تحتاج إلى إعادة بناء المشروع:
   ```bash
   npm run build
   npm run dev
   ```
4. امسح cache المتصفح (Ctrl+Shift+Delete)

## 📚 ملفات ذات صلة
- [20260103_final_fix_categories_rls.sql](../migrations/20260103_final_fix_categories_rls.sql)
- [20260103_fix_categories_rls_permissions.sql](../migrations/20260103_fix_categories_rls_permissions.sql)
- [add_categories_approval_system.sql](../migrations/add_categories_approval_system.sql)
