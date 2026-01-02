# 🔧 دليل إصلاح وإعداد قاعدة البيانات

> **تم التحديث:** 25 ديسمبر 2025  
> **الإصدار:** 2.0 - البنية الجديدة المعيارية

---

## 🚨 المشكلة
```
Could not find the table 'public.users' in the schema cache
```

هذا الخطأ يعني أن قاعدة البيانات غير معدّة بشكل صحيح.

---

## ✅ الحل الجديد (الإصدار 2.0)

### ⚠️ تنبيه مهم
**الملفات القديمة (supabase-*.sql و SETUP_DATABASE.sql) تم استبدالها!**

استخدم الآن **12 ملف معياري جديد** بدلاً من الملفات القديمة.

---

## 📋 الخطوة 1: الدخول إلى Supabase Dashboard

1. افتح [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. اختر مشروعك: **bawwabtyM**
3. انتقل إلى **SQL Editor** من القائمة الجانبية

---

## 🔄 الخطوة 2: تنفيذ الملفات الجديدة بالترتيب

> 📖 **للحصول على الدليل الكامل المفصل، راجع:**  
> 👉 **[SQL_EXECUTION_ORDER.md](./SQL_EXECUTION_ORDER.md)**

### الملفات الجديدة (نفذها بالترتيب):

1. ✅ `01-main-schema.sql` - الجداول الأساسية
2. ✅ `02-orders-delivery.sql` - الطلبات والتوصيل
3. ✅ `03-financial-system.sql` - النظام المالي
4. ✅ `04-marketing-loyalty.sql` - التسويق والولاء
5. ✅ `05-communication-support.sql` - التواصل والدعم
6. ✅ `06-system-settings.sql` - الإعدادات
7. ✅ `07-functions-triggers.sql` - الدوال والمحفزات
8. ✅ `08-notification-triggers.sql` - محفزات الإشعارات
9. ✅ `09-rls-policies.sql` - سياسات الأمان
10. ✅ `10-storage-setup.sql` - التخزين السحابي
11. ✅ `11-initial-data.sql` - البيانات الأولية
12. ✅ `12-views-indexes.sql` - Views والفهارس

### خطوات التنفيذ:

1. افتح الملف `SETUP_DATABASE.sql` في VS Code
2. انسخ المحتوى بالكامل (Ctrl+A ثم Ctrl+C)
3. في Supabase SQL Editor، الصق الكود (Ctrl+V)
4. اضغط على **RUN** أو **F5**
5. انتظر حتى تظهر رسالة "Success"

### الخطوة 3: تأكيد إنشاء الجداول

في SQL Editor، نفذ هذا الاستعلام للتأكد:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

يجب أن تظهر الجداول التالية:
- users
- vendors
- drivers
- categories
- products
- orders
---

## 📝 كيفية تنفيذ الملفات

### لكل ملف، اتبع هذه الخطوات:

1. افتح الملف في VS Code (مثلاً: `01-main-schema.sql`)
2. انسخ المحتوى بالكامل (`Ctrl + A` ثم `Ctrl + C`)
3. في Supabase SQL Editor، الصق الكود (`Ctrl + V`)
4. اضغط **RUN** أو `F5`
5. ✅ انتظر رسالة "Success" قبل الانتقال للملف التالي

**⚠️ مهم:** لا تقفز بين الملفات! نفذها بالترتيب المحدد.

---

## 🔍 الخطوة 3: التحقق من نجاح الإعداد

نفذ هذا الاستعلام في SQL Editor للتأكد:

```sql
-- التحقق من الجداول
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

يجب أن تظهر أكثر من 50 جدول، منها:
- ✅ users
- ✅ vendors
- ✅ drivers
- ✅ categories
- ✅ products
- ✅ orders
- ✅ wallets
- ✅ transactions
- وغيرها...

---

## 🔄 الخطوة 4: إعادة تشغيل التطبيق

```bash
# أوقف التطبيق (Ctrl+C في Terminal)
# ثم شغله من جديد
pnpm dev
```

---

## ✅ الخطوة 5: اختبار التطبيق

الآن جرب:
1. ✅ إنشاء حساب جديد
2. ✅ تسجيل الدخول
3. ✅ تصفح المنتجات
4. ✅ إضافة منتج للسلة

---

## 🗑️ تنظيف الملفات القديمة

بعد التأكد من نجاح الإعداد، احذف الملفات القديمة:

```powershell
# في Terminal:
.\remove-old-files.ps1
```

أو احذف يدوياً:
- ❌ `supabase-schema.sql`
- ❌ `supabase-complete-setup.sql`
- ❌ `supabase-advanced-features.sql`
- ❌ `supabase-storage-setup.sql`
- ❌ `supabase-loyalty-and-rls.sql`
- ❌ `SETUP_DATABASE.sql`

---

## 🔧 في حال حدوث خطأ

### خطأ: "relation already exists"
✅ **طبيعي** - الملفات الجديدة تحتوي على `IF NOT EXISTS`

### خطأ: "could not find table"
❌ تأكد أنك نفذت الملفات بالترتيب الصحيح

### خطأ: "permission denied"
❌ تأكد أنك مسجل دخول كمالك المشروع

### خطأ: RLS منع الإدراج
```sql
-- حل مؤقت لاختبار:
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- حل مؤقت لاختبار:
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

لكن الأفضل إضافة Policy صحيحة (موجودة في `09-rls-policies.sql`)

---

## 🆘 Trigger للمستخدمين الجدد

الملفات الجديدة تحتوي على Trigger محسّن:

```sql
-- موجود في: 07-functions-triggers.sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📚 موارد إضافية

- 📖 [SQL_EXECUTION_ORDER.md](./SQL_EXECUTION_ORDER.md) - الدليل الشامل
- 🚀 [QUICKSTART.md](./QUICKSTART.md) - دليل البدء السريع
- 📊 [FEATURES_SUMMARY.md](./FEATURES_SUMMARY.md) - ملخص الميزات

---

## ✅ قائمة التحقق

- [ ] تم تنفيذ الملفات الـ 12 بالترتيب
- [ ] ظهرت جميع الجداول في قاعدة البيانات
- [ ] تم اختبار التطبيق بنجاح
- [ ] تم حذف الملفات القديمة
- [ ] تم عمل Git Commit

---

**🎉 تم! قاعدة البيانات جاهزة الآن!**

> **ملاحظة:** الملفات الجديدة أكثر تنظيماً وأسهل في الصيانة من الملفات القديمة.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- تعطيل RLS للسماح بالإدراج
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- أو إضافة Policy
CREATE POLICY "Enable all operations for authenticated users" 
ON public.users 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
```

بعد تنفيذ هذا الكود، جرب إنشاء الحساب مرة أخرى.
