# 🚀 دليل الإعداد والنشر - بوابتي

## 📋 ملخص المشروع

منصة تجارة إلكترونية متعددة البائعين مبنية بـ:
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Deployment**: Vercel

## ✅ الميزات المكتملة

### 🔐 نظام المصادقة متعدد الأدوار
- ✅ تسجيل دخول منفصل للمشتري والبائع والمندوب والمدير
- ✅ صفحة تسجيل بخطوات متعددة للبائعين والمناديب
- ✅ رفع الوثائق (الهوية، الرخصة التجارية، رخصة القيادة)
- ✅ نظام موافقات للمدير

### 📊 لوحات التحكم
#### المدير:
- ✅ لوحة رئيسية بالإحصائيات
- ✅ صفحة الموافقات (بائعين، منتجات، مناديب)
- ✅ الإدارة المالية (عمولات، طلبات سحب، إعدادات)

#### البائع:
- ✅ لوحة رئيسية بإحصائيات المبيعات
- ✅ إدارة المنتجات مع فلترة متقدمة
- ✅ إضافة منتج مع نظام المتغيرات (Variants)
- ✅ تنبيهات المخزون المنخفض
- ✅ المحفظة المالية

#### المندوب:
- ✅ لوحة رئيسية بالتوصيلات
- ✅ التوصيلات النشطة والمتاحة
- ✅ المحفظة والأرباح
- 🔄 خريطة Google Maps (قيد الإضافة)

### 🛍️ صفحات المنتجات والطلبات
- ✅ صفحة منتجات responsive (4 أعمدة → 2 → 1)
- ✅ نظام بحث وفلترة متقدم (حسب السعر، الفئة، البائع)
- ✅ صفحة تتبع الطلبات مع Timeline للحالة
- ✅ عرض معلومات المندوب أثناء التوصيل

### 🗄️ قاعدة البيانات Supabase
- ✅ Schema كامل مع 20+ جدول
- ✅ Triggers للإشعارات التلقائية:
  - إشعار البائع عند طلب جديد
  - إشعار المشتري عند تغيير حالة الطلب
  - إشعار المدير عند طلب سحب
  - تحديث رصيد البائع عند اكتمال التوصيل
  - تحديث متوسط التقييمات
- ✅ Row Level Security (RLS) للأمان

## 🔧 الإعداد الأولي

### 1. إعداد Supabase

```bash
# 1. إنشاء مشروع في Supabase
https://supabase.com/dashboard

# 2. تشغيل Schema
# انسخ محتوى supabase-schema.sql وشغله في SQL Editor

# 3. إنشاء Storage Buckets
- documents (للوثائق - private)
- products (للمنتجات - public)
- avatars (للصور الشخصية - public)

# 4. إعداد Storage Policies
-- للوثائق (documents)
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- للمنتجات (products)
CREATE POLICY "Anyone can view products"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

CREATE POLICY "Vendors can upload products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');
```

### 2. إعداد المشروع المحلي

```bash
# 1. استنساخ المشروع
cd Desktop/bawwabtyM

# 2. تثبيت المكتبات
npm install

# 3. إنشاء ملف .env.local
cp .env.example .env.local

# 4. تعبئة متغيرات البيئة
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. تشغيل المشروع

```bash
# التطوير
npm run dev

# البناء
npm run build

# التشغيل الإنتاجي
npm start
```

## 🌐 النشر على Vercel

### الطريقة الأولى: عبر واجهة Vercel

```bash
# 1. الدخول لـ Vercel Dashboard
https://vercel.com/dashboard

# 2. Import Git Repository
- اختر مجلد المشروع
- اربطه مع GitHub (اختياري)

# 3. إعدادات البيئة
- أضف جميع متغيرات .env.local

# 4. Deploy
- اضغط Deploy!
```

### الطريقة الثانية: عبر CLI

```bash
# 1. تثبيت Vercel CLI
npm i -g vercel

# 2. تسجيل الدخول
vercel login

# 3. النشر
vercel

# 4. للنشر الإنتاجي
vercel --prod
```

## 📝 الخطوات التالية (المهام المتبقية)

### 1. ربط Supabase Auth مع النظام
```typescript
// lib/auth.ts - تحديث الدوال للعمل مع Supabase
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export async function signIn(email, password, role) {
  const supabase = createClientComponentClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  
  // التحقق من الدور
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single()
    
  if (user.role !== role) {
    throw new Error('نوع الحساب غير صحيح')
  }
  
  return data
}
```

### 2. رفع الصور على Supabase Storage
```typescript
// lib/storage.ts
export async function uploadProductImage(file: File, productId: string) {
  const supabase = createClientComponentClient()
  
  const fileName = `${productId}/${Date.now()}-${file.name}`
  
  const { data, error } = await supabase.storage
    .from('products')
    .upload(fileName, file)
    
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('products')
    .getPublicUrl(fileName)
    
  return publicUrl
}
```

### 3. إضافة Google Maps للمناديب
```bash
# تثبيت المكتبة
npm install @react-google-maps/api

# إضافة API Key في .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key
```

### 4. نظام التقييمات
- صفحة إضافة تقييم للمنتج والبائع
- عرض التقييمات مع الصور
- إمكانية الرد من البائع

### 5. نظام الرسائل والإشعارات
- Realtime notifications مع Supabase
- صفحة الإشعارات
- نظام رسائل بين المشتري والبائع

### 6. Payment Integration
- إضافة Stripe أو PayPal
- صفحة الدفع
- معالجة المدفوعات

## 🔒 الأمان

### إعدادات مهمة:
```sql
-- تفعيل RLS على جميع الجداول
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
-- مثال: المستخدم يرى بياناته فقط
CREATE POLICY "Users view own data"
ON table_name FOR SELECT
USING (auth.uid() = user_id);
```

### متغيرات البيئة:
- ✅ لا تشارك SERVICE_ROLE_KEY أبداً
- ✅ استخدم ANON_KEY في الـ Frontend فقط
- ✅ أضف .env.local إلى .gitignore

## 🐛 استكشاف الأخطاء

### خطأ "Module not found"
```bash
npm install
rm -rf .next
npm run dev
```

### خطأ Supabase Connection
```bash
# تحقق من:
1. صحة الـ URL والـ Keys
2. تفعيل RLS Policies
3. صلاحيات الـ Storage Buckets
```

### خطأ في الـ Build على Vercel
```bash
# تحقق من:
1. إضافة جميع متغيرات البيئة
2. صحة الـ package.json
3. لا توجد أخطاء TypeScript
```

## 📊 الإحصائيات الحالية

- **الملفات المُنشأة**: 50+
- **الصفحات**: 25+
- **المكونات**: 15+
- **الأنواع (Types)**: 30+
- **Triggers**: 6
- **جداول قاعدة البيانات**: 20+

## 🤝 المساهمة

هذا المشروع خاص، لكن يمكن تطويره بإضافة:
- 📱 تطبيق موبايل بـ React Native
- 📊 لوحة تحليلات متقدمة
- 💬 دردشة مباشرة
- 🌍 دعم لغات متعددة
- 📧 نظام بريد إلكتروني
- 📱 SMS للإشعارات

## 📞 الدعم الفني

للمساعدة:
1. راجع الـ DOCUMENTATION.md
2. تحقق من console.log للأخطاء
3. راجع Supabase Logs
4. راجع Vercel Deployment Logs

---

**تم بناء المشروع بواسطة**: GitHub Copilot 🤖
**التاريخ**: ديسمبر 2024
**النسخة**: 1.0.0
