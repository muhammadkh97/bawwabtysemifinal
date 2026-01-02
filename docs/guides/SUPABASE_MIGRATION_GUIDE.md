# دليل تحديث قاعدة بيانات Supabase

## الخطوات المطلوبة

### 1. حذف الملفات القديمة (اختياري)

الملفات القديمة التي يمكن حذفها:
- `supabase-schema.sql`
- `supabase-complete-setup.sql`
- `supabase-advanced-features.sql`
- `supabase-storage-setup.sql`
- `SETUP_DATABASE.sql`

**لحذف الملفات القديمة:**
```bash
cd "C:\Users\Mohammad AbuAlkheran\bawwabtyM"
git rm supabase-schema.sql supabase-complete-setup.sql supabase-advanced-features.sql supabase-storage-setup.sql SETUP_DATABASE.sql
git commit -m "Remove old database files"
git push origin main
```

### 2. تشغيل الملفات الجديدة في Supabase

#### طريقة 1: تشغيل يدوي في Supabase Dashboard

1. افتح Supabase Dashboard: https://supabase.com/dashboard
2. اذهب إلى **SQL Editor**
3. نفذ الملفات بالترتيب التالي:

```
01-main-schema.sql           # الجداول الرئيسية
02-orders-delivery.sql       # نظام الطلبات والتوصيل
03-financial-system.sql      # النظام المالي
04-marketing-loyalty.sql     # نظام التسويق والولاء
05-communication-support.sql # نظام التواصل والدعم
06-system-settings.sql       # إعدادات النظام
07-functions-triggers.sql    # الدوال والمحفزات
08-notification-triggers.sql # محفزات الإشعارات
09-rls-policies.sql          # سياسات الأمان
10-storage-setup.sql         # إعداد التخزين
11-initial-data.sql          # البيانات الأولية
12-views-indexes.sql         # العروض والفهارس
```

**لكل ملف:**
- انسخ محتوى الملف
- الصقه في SQL Editor
- اضغط Run

#### طريقة 2: استخدام Supabase CLI (موصى به)

```bash
# تثبيت Supabase CLI
npm install -g supabase

# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref YOUR_PROJECT_ID

# تشغيل الملفات
cd "C:\Users\Mohammad AbuAlkheran\bawwabtyM"

# تشغيل كل ملف بالترتيب
supabase db execute --file 01-main-schema.sql
supabase db execute --file 02-orders-delivery.sql
supabase db execute --file 03-financial-system.sql
supabase db execute --file 04-marketing-loyalty.sql
supabase db execute --file 05-communication-support.sql
supabase db execute --file 06-system-settings.sql
supabase db execute --file 07-functions-triggers.sql
supabase db execute --file 08-notification-triggers.sql
supabase db execute --file 09-rls-policies.sql
supabase db execute --file 10-storage-setup.sql
supabase db execute --file 11-initial-data.sql
supabase db execute --file 12-views-indexes.sql
```

#### طريقة 3: استخدام السكريبت الجاهز (Linux/Mac/WSL)

```bash
cd "C:\Users\Mohammad AbuAlkheran\bawwabtyM"
chmod +x run-all.sh
./run-all.sh
```

### 3. التحقق من نجاح التنفيذ

بعد تشغيل جميع الملفات، تحقق من:

1. **الجداول**: تأكد من وجود جميع الجداول في Database
2. **الدوال**: تحقق من Functions في SQL Editor
3. **السياسات**: راجع Policies في Authentication
4. **التخزين**: تأكد من Buckets في Storage

### 4. إزالة القاعدة القديمة (إن لزم الأمر)

إذا كنت تريد البدء من الصفر:

```sql
-- احذر! هذا سيحذف جميع البيانات
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

ثم شغل الملفات الجديدة من البداية.

## ملاحظات مهمة

⚠️ **قبل التنفيذ:**
- خذ نسخة احتياطية من قاعدة البيانات الحالية
- اختبر على بيئة تطوير أولاً
- راجع ملف `analysis.md` للتفاصيل الفنية

📝 **بعد التنفيذ:**
- راجع ملف `REPORT.md` للتحقق من التنفيذ الصحيح
- اقرأ `QUICK_START.md` للبدء في استخدام النظام

## المساعدة

إذا واجهت أي مشاكل، راجع:
- `REPORT.md` - تقرير شامل عن النظام
- `analysis.md` - تحليل تفصيلي للبنية
- `QUICK_START.md` - دليل البدء السريع
