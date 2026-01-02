# 🚀 دليل النشر على Vercel

## المتطلبات الأساسية

- [ ] حساب على [Vercel](https://vercel.com)
- [ ] حساب على [Supabase](https://supabase.com)
- [ ] المشروع جاهز ومحلياً يعمل بدون مشاكل

---

## الخطوة 1: إعداد Supabase

### 1.1 إنشاء مشروع جديد

1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اضغط "New Project"
3. اختر Organization
4. أدخل:
   - **Project Name:** bawwabty-m
   - **Database Password:** كلمة مرور قوية (احفظها!)
   - **Region:** اختر الأقرب لك (مثلاً: West EU)

### 1.2 تنفيذ Schema

1. من القائمة الجانبية، اختر **SQL Editor**
2. افتح ملف `supabase-schema.sql` من المشروع
3. انسخ كامل المحتوى
4. الصقه في SQL Editor
5. اضغط **Run** أو Ctrl+Enter

### 1.3 الحصول على API Keys

1. من القائمة الجانبية، اختر **Settings** → **API**
2. ستجد:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public:** مفتاح عام
   - **service_role:** مفتاح سري (لا تشاركه!)

3. احفظ هذه المعلومات!

### 1.4 إعداد Storage

1. من القائمة الجانبية، اختر **Storage**
2. اضغط **Create bucket**
3. أدخل الاسم: `products`
4. اجعله **Public** أو اضبط سياسة الوصول

### 1.5 إنشاء مستخدم مدير

1. من القائمة الجانبية، اختر **Authentication** → **Users**
2. اضغط **Add user**
3. أدخل:
   - Email: your-admin@example.com
   - Password: كلمة مرور قوية
4. بعد الإنشاء، اذهب إلى **SQL Editor** ونفذ:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-admin@example.com';
```

---

## الخطوة 2: إعداد المشروع محلياً

### 2.1 تثبيت Vercel CLI

```bash
npm install -g vercel
```

### 2.2 إنشاء ملف .env.local

```bash
# انسخ ملف المثال
cp .env.example .env.local
```

قم بتعديل `.env.local`:

```env
# من Supabase Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# اختياري - للعمليات الإدارية
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# معلومات التطبيق
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=بوابتي
```

### 2.3 اختبار المشروع محلياً

```bash
npm install
npm run dev
```

افتح: `http://localhost:3000`

تأكد من:
- [ ] الصفحة الرئيسية تعمل
- [ ] يمكنك تسجيل الدخول
- [ ] لوحة المدير تظهر

---

## الخطوة 3: النشر على Vercel

### 3.1 تسجيل الدخول

```bash
vercel login
```

### 3.2 ربط المشروع

```bash
cd bawwabtyM
vercel
```

سيسألك:
- **Set up and deploy?** → Yes
- **Which scope?** → اختر حسابك/فريقك
- **Link to existing project?** → No
- **Project name?** → bawwabty-m (أو أي اسم تريد)
- **Directory?** → . (النقطة تعني المجلد الحالي)

### 3.3 إضافة Environment Variables

#### عبر CLI:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# الصق القيمة واضغط Enter
# اختر: Production, Preview, Development

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# الصق القيمة واضغط Enter
```

#### أو عبر Dashboard:

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. اختر مشروعك
3. **Settings** → **Environment Variables**
4. أضف جميع المتغيرات من `.env.local`:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (اختياري)
   - NEXT_PUBLIC_APP_URL (استخدم رابط Vercel)
   - NEXT_PUBLIC_APP_NAME

### 3.4 النشر

```bash
vercel --prod
```

انتظر حتى ينتهي... 🚀

---

## الخطوة 4: ما بعد النشر

### 4.1 تحديث App URL

1. بعد النشر، احصل على رابط المشروع (مثلاً: `https://bawwabty-m.vercel.app`)
2. في Vercel Dashboard:
   - Settings → Environment Variables
   - حدث `NEXT_PUBLIC_APP_URL` إلى الرابط الجديد
3. أعد النشر:

```bash
vercel --prod
```

### 4.2 تحديث Supabase Redirect URLs

1. اذهب إلى Supabase Dashboard
2. **Authentication** → **URL Configuration**
3. أضف في **Site URL**:
   ```
   https://bawwabty-m.vercel.app
   ```
4. أضف في **Redirect URLs**:
   ```
   https://bawwabty-m.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

### 4.3 اختبار الإنتاج

افتح رابط مشروعك وتأكد من:
- [ ] الصفحة الرئيسية تعمل
- [ ] تسجيل الدخول يعمل
- [ ] الصور تظهر
- [ ] لوحة المدير تعمل

---

## النشر التلقائي (CI/CD)

### ربط GitHub

1. في Vercel Dashboard → Project Settings
2. **Git** → **Connect Git Repository**
3. اختر repository الخاص بك
4. كل push للـ main branch سينشر تلقائياً!

### الفروع

- **main** → Production (https://bawwabty-m.vercel.app)
- **develop** → Preview (https://bawwabty-m-git-develop.vercel.app)
- **feature branches** → Preview URLs

---

## الأوامر المفيدة

```bash
# عرض معلومات المشروع
vercel inspect

# عرض السجلات (logs)
vercel logs

# حذف deployment معين
vercel remove [deployment-url]

# عرض جميع البيئات
vercel env ls

# سحب المتغيرات البيئية
vercel env pull .env.local
```

---

## الدومين المخصص (اختياري)

### إضافة دومين خاص

1. في Vercel Dashboard → Project Settings
2. **Domains** → **Add Domain**
3. أدخل الدومين (مثلاً: bawwabty.com)
4. اتبع التعليمات لتحديث DNS

#### إعدادات DNS المطلوبة:

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

---

## استكشاف الأخطاء

### خطأ: "Module not found"

```bash
# تأكد من تثبيت جميع المكتبات
npm install

# احذف node_modules وأعد التثبيت
rm -rf node_modules package-lock.json
npm install
```

### خطأ: "Supabase connection failed"

- تأكد من صحة `NEXT_PUBLIC_SUPABASE_URL`
- تأكد من صحة `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- تأكد من تنفيذ Schema في Supabase

### خطأ: "Build failed"

```bash
# تحقق من الأخطاء محلياً
npm run build

# إذا نجح محلياً، تحقق من Environment Variables في Vercel
```

### تعذر تسجيل الدخول

1. تحقق من Redirect URLs في Supabase
2. تحقق من `NEXT_PUBLIC_APP_URL`
3. امسح الكاش وجرب مرة أخرى

---

## المراقبة والأداء

### Vercel Analytics

1. في Vercel Dashboard → Project
2. **Analytics** → **Enable**
3. مجاني للاستخدام الشخصي

### Supabase Logs

1. Supabase Dashboard → **Logs**
2. يمكنك رؤية:
   - API Requests
   - Database Queries
   - Authentication Events

---

## النسخ الاحتياطي

### قاعدة البيانات

```bash
# من Supabase Dashboard
Settings → Database → Backup
```

يمكنك جدولة نسخ احتياطية يومية/أسبوعية

### الكود

استخدم Git:
```bash
git push origin main
```

---

## الأمان

### ✅ تم تطبيقه:
- [x] Row Level Security (RLS)
- [x] Environment Variables مشفرة
- [x] HTTPS فقط
- [x] JWT Authentication

### 🔒 توصيات إضافية:
- [ ] تفعيل Multi-Factor Authentication (MFA)
- [ ] استخدام Secrets لمفاتيح API
- [ ] مراقبة الطلبات المشبوهة
- [ ] تحديد Rate Limiting

---

## التكاليف

### Vercel (مجاني للبداية)
- ✅ Deployments غير محدودة
- ✅ Bandwidth: 100GB/month
- ✅ Serverless Functions: 100GB-Hours

### Supabase (مجاني للبداية)
- ✅ Database: 500MB
- ✅ Storage: 1GB
- ✅ Bandwidth: 2GB
- ✅ Users غير محدودين

---

## الدعم

### الوثائق الرسمية:
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

### المجتمع:
- [Vercel Discord](https://discord.gg/vercel)
- [Supabase Discord](https://discord.supabase.com)

---

## ملخص الخطوات

1. ✅ إعداد Supabase (مشروع + schema + storage)
2. ✅ إنشاء مستخدم مدير
3. ✅ إعداد .env.local محلياً
4. ✅ اختبار المشروع محلياً
5. ✅ تسجيل الدخول إلى Vercel
6. ✅ ربط المشروع
7. ✅ إضافة Environment Variables
8. ✅ النشر على Production
9. ✅ تحديث URLs في Supabase
10. ✅ اختبار الإنتاج

---

🎉 **مبروك! موقعك الآن حي على الإنترنت!**

رابط الموقع: https://bawwabty-m.vercel.app
لوحة المدير: https://bawwabty-m.vercel.app/admin

---

تم التحديث: ديسمبر 2024
