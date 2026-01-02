# 🛍️ منصة بوابتي - Marketplace Platform

> **منصة سوق إلكتروني متعدد البائعين متطورة - نسخة محسنة وآمنة 2.0**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 جدول المحتويات

- [نظرة عامة](#-نظرة-عامة)
- [المميزات](#-المميزات)
- [البنية التقنية](#-البنية-التقنية)
- [المتطلبات](#-المتطلبات)
- [التثبيت](#-التثبيت)
- [إعداد قاعدة البيانات](#-إعداد-قاعدة-البيانات)
- [التكوين](#-التكوين)
- [التشغيل](#-التشغيل)
- [البنية الأساسية](#-البنية-الأساسية)
- [الأمان](#-الأمان)
- [المساهمة](#-المساهمة)

---

## 🎯 نظرة عامة

**بوابتي** هي منصة سوق إلكتروني متقدمة تدعم البائعين المتعددين مع نظام إدارة كامل للطلبات والمدفوعات والتوصيل. المشروع مبني باستخدام أحدث التقنيات ويتميز بالأمان العالي والأداء المحسّن.

### ✨ ما الجديد في الإصدار 2.0؟

- ✅ **إعادة بناء كاملة** لقاعدة البيانات مع بنية منطقية ومنظمة
- ✅ **سياسات أمان شاملة** (Row Level Security) لجميع الجداول
- ✅ **إزالة جميع القيم الافتراضية** من ملف Supabase
- ✅ **نظام triggers محسّن** للتحديثات التلقائية
- ✅ **توثيق شامل** لكل جدول وعمود
- ✅ **فهرسة محسنة** لأداء أسرع
- ✅ **TypeScript typing** كامل

---

## 🚀 المميزات

### للعملاء 👥
- 🛒 تصفح المنتجات من متاجر متعددة
- 🔍 بحث متقدم وفلاتر ذكية
- ❤️ قائمة المفضلة والمتابعة
- 📦 تتبع الطلبات في الوقت الفعلي
- ⭐ نظام التقييمات والمراجعات
- 💳 طرق دفع متعددة

### للبائعين 🏪
- 📊 لوحة تحكم شاملة
- 📦 إدارة المنتجات والمخزون
- 📈 تقارير وإحصائيات مفصلة
- 🔔 إشعارات الطلبات الفورية
- 💰 إدارة المدفوعات والأرباح
- ⏰ إدارة أوقات العمل

### للسائقين 🚗
- 📍 تتبع الموقع الجغرافي
- 🗺️ خرائط تفاعلية للتوصيل
- 💵 حساب الأرباح والعمولات
- 📊 إحصائيات الأداء

### للمدراء 👨‍💼
- 🎛️ لوحة تحكم إدارية متقدمة
- ✅ الموافقة على المتاجر والمنتجات
- 📊 تقارير شاملة للمبيعات
- 👥 إدارة المستخدمين
- ⚙️ إعدادات النظام

---

## 🏗️ البنية التقنية

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React Icons
- **Animations**: Framer Motion
- **State Management**: React Hooks + Context API
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

### Backend
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Realtime**: Supabase Realtime
- **API**: Next.js API Routes

### Maps & Location
- **Maps**: Mapbox GL / Leaflet
- **Routing**: Leaflet Routing Machine
- **Geocoding**: Mapbox Geocoding API

### Tools & Libraries
- **QR Code**: HTML5 QRCode Scanner
- **Excel**: XLSX
- **Notifications**: React Hot Toast

---

## 📦 المتطلبات

- **Node.js**: 18.0 أو أحدث
- **npm**: 9.0 أو أحدث
- **حساب Supabase**: مجاني أو مدفوع
- **Mapbox Token**: (اختياري) للخرائط

---

## 🔧 التثبيت

### 1. استنساخ المشروع

```bash
git clone https://github.com/your-username/bawwabty-marketplace.git
cd bawwabty-marketplace
```

### 2. تثبيت الحزم

```bash
npm install
# أو
pnpm install
# أو
yarn install
```

### 3. إعداد متغيرات البيئة

```bash
cp .env.example .env.local
```

ثم قم بتعديل ملف `.env.local` وأضف بياناتك:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

---

## 🗄️ إعداد قاعدة البيانات

### الخطوة 1: إنشاء مشروع Supabase

1. اذهب إلى [Supabase](https://supabase.com)
2. أنشئ مشروع جديد
3. احصل على `URL` و `anon key`

### الخطوة 2: تشغيل migrations بالترتيب

اذهب إلى **SQL Editor** في Supabase Dashboard وقم بتشغيل الملفات بالترتيب:

```sql
-- 1. إنشاء الأنواع المخصصة
-- نفذ: database/migrations/001_create_enums.sql

-- 2. جداول المستخدمين
-- نفذ: database/migrations/002_create_users_tables.sql

-- 3. جداول البائعين
-- نفذ: database/migrations/003_create_vendors_tables.sql

-- 4. جداول المنتجات
-- نفذ: database/migrations/004_create_products_tables.sql

-- 5. جداول الطلبات والمدفوعات
-- نفذ: database/migrations/005_create_orders_payments_tables.sql

-- 6. سياسات الأمان (RLS)
-- نفذ: database/policies/rls_policies.sql
```

### الخطوة 3: إعداد التخزين (Storage)

```sql
-- إنشاء buckets للصور
INSERT INTO storage.buckets (id, name, public) VALUES
  ('products', 'products', true),
  ('vendors', 'vendors', true),
  ('avatars', 'avatars', true),
  ('documents', 'documents', false);
```

---

## ⚙️ التكوين

### Supabase Auth

قم بتفعيل مزودي المصادقة المطلوبين في Supabase Dashboard:

1. **Email/Password** ✅ (افتراضي)
2. **Phone** (اختياري)
3. **Google** (اختياري)
4. **Apple** (اختياري)

### Storage Policies

```sql
-- سماح برفع الصور للمستخدمين المسجلين
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('products', 'vendors', 'avatars'));
```

---

## 🚦 التشغيل

### Development Mode

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm run start
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

---

## 📁 البنية الأساسية

```
bawwabty-marketplace/
├── app/                      # Next.js App Router
│   ├── (auth)/              # صفحات المصادقة
│   ├── (dashboard)/         # لوحات التحكم
│   ├── (shop)/              # صفحات المتجر
│   └── api/                 # API Routes
├── components/              # React Components
│   ├── ui/                  # UI Components
│   ├── layout/              # Layout Components
│   └── features/            # Feature Components
├── lib/                     # Utilities & Helpers
│   ├── supabase.ts         # Supabase Client
│   ├── utils.ts            # Helper Functions
│   └── validations.ts      # Zod Schemas
├── types/                   # TypeScript Types
│   └── database.ts         # Database Types
├── database/               # Database Files
│   ├── migrations/         # SQL Migrations
│   ├── policies/           # RLS Policies
│   ├── functions/          # Database Functions
│   └── seeds/              # Seed Data
├── public/                 # Static Files
├── styles/                 # Global Styles
└── package.json           # Dependencies
```

---

## 🔒 الأمان

### Row Level Security (RLS)

جميع الجداول محمية بـ RLS policies:

- ✅ المستخدمون يرون بياناتهم فقط
- ✅ البائعون يديرون متاجرهم فقط
- ✅ السائقون يرون طلباتهم فقط
- ✅ المدراء لديهم صلاحيات كاملة

### Best Practices

- 🔐 لا توجد قيم افتراضية في الكود
- 🔐 جميع المتغيرات من البيئة فقط
- 🔐 Validation على المدخلات
- 🔐 HTTPS فقط في الإنتاج
- 🔐 Rate limiting على API

---

## 🔍 استكشاف الأخطاء

### المشكلة: "Missing environment variables"

**الحل**: تأكد من وجود ملف `.env.local` وأن جميع المتغيرات صحيحة

### المشكلة: "RLS policy violation"

**الحل**: تحقق من تشغيل ملف `rls_policies.sql` بشكل صحيح

### المشكلة: "CORS errors"

**الحل**: أضف domain الخاص بك في Supabase Dashboard > Settings > API

---

## 📝 المساهمة

نرحب بالمساهمات! يرجى اتباع الخطوات:

1. Fork المشروع
2. أنشئ فرع جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. افتح Pull Request

---

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE)

---

## 👥 الفريق

- **المطور الرئيسي**: [اسمك]
- **التصميم**: [اسم المصمم]
- **المساهمون**: [قائمة المساهمين]

---

## 📞 التواصل

- **الموقع**: [https://bawwabty.com](https://bawwabty.com)
- **البريد**: support@bawwabty.com
- **Twitter**: [@bawwabty](https://twitter.com/bawwabty)

---

## 🙏 شكر خاص

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)

---

<div align="center">
  <p>صنع بـ ❤️ في المملكة العربية السعودية</p>
  <p>© 2026 بوابتي. جميع الحقوق محفوظة.</p>
</div>
