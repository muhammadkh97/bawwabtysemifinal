# دليل إعداد تسجيل الدخول عبر OAuth

## 📋 نظرة عامة

تم تحسين صفحة تسجيل الدخول بجميع الميزات التالية:

### ✅ الميزات المُنفذة

1. **رسائل خطأ واضحة ومحددة**
   - رسالة مخصصة لكل نوع خطأ (بيانات خاطئة، بريد غير مؤكد، حساب غير موجود، محاولات كثيرة)
   - أيقونات وتنسيق واضح للأخطاء

2. **مؤشر تحميل متقدم**
   - Spinner متحرك في زر تسجيل الدخول
   - تعطيل الزر أثناء التحميل
   - رسالة "جاري تسجيل الدخول..."

3. **خيار تذكرني**
   - Checkbox لحفظ البريد الإلكتروني
   - تخزين في localStorage
   - تحميل تلقائي عند العودة

4. **Validation في الوقت الفعلي**
   - التحقق من صحة البريد الإلكتروني فوراً
   - التحقق من طول كلمة المرور (6 أحرف على الأقل)
   - رسائل خطأ مباشرة تحت كل حقل
   - تفعيل Validation عند blur أو أثناء الكتابة بعد أول blur

5. **رسالة نجاح**
   - إشعار أخضر عند تسجيل الدخول بنجاح
   - رسالة "✅ تم تسجيل الدخول بنجاح! جاري التوجيه..."
   - تأخير قصير (1 ثانية) قبل التوجيه

6. **تكامل OAuth كامل**
   - Google Sign-In
   - Facebook Login
   - Apple Sign-In
   - رسائل خطأ مخصصة لكل منصة
   - callback handler جاهز

---

## 🔧 إعداد OAuth Providers في Supabase

### 1️⃣ Google OAuth

#### الخطوات:
1. انتقل إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروع جديد أو اختر مشروع موجود
3. فعّل Google+ API
4. انتقل إلى APIs & Services > Credentials
5. أنشئ OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins:
     ```
     https://your-project-id.supabase.co
     http://localhost:3000
     ```
   - Authorized redirect URIs:
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     ```

#### إضافة للـ Supabase:
1. اذهب إلى Supabase Dashboard
2. Authentication > Providers > Google
3. فعّل Google provider
4. أدخل Client ID و Client Secret من Google Console
5. احفظ التغييرات

---

### 2️⃣ Facebook OAuth

#### الخطوات:
1. انتقل إلى [Facebook Developers](https://developers.facebook.com/)
2. أنشئ تطبيق جديد
3. اختر "Consumer" كنوع التطبيق
4. أضف Facebook Login للتطبيق
5. في Settings > Basic:
   - احصل على App ID و App Secret
   
6. في Facebook Login > Settings:
   - Valid OAuth Redirect URIs:
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     ```

#### إضافة للـ Supabase:
1. Supabase Dashboard > Authentication > Providers > Facebook
2. فعّل Facebook provider
3. أدخل App ID و App Secret
4. احفظ التغييرات

---

### 3️⃣ Apple OAuth

#### الخطوات:
1. انتقل إلى [Apple Developer](https://developer.apple.com/)
2. Certificates, Identifiers & Profiles > Identifiers
3. أنشئ App ID جديد
4. فعّل Sign In with Apple capability
5. أنشئ Service ID:
   - Enable as primary App ID
   - Configure Return URLs:
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     ```

6. أنشئ Private Key:
   - Enable Sign In with Apple
   - حمّل الملف .p8

#### إضافة للـ Supabase:
1. Supabase Dashboard > Authentication > Providers > Apple
2. فعّل Apple provider
3. أدخل:
   - Services ID
   - Team ID (من Membership)
   - Key ID
   - Private Key (محتوى ملف .p8)
4. احفظ التغييرات

---

## 🧪 اختبار التكامل

### اختبار محلي (localhost):

```bash
# 1. تأكد من تشغيل المشروع
npm run dev

# 2. افتح المتصفح على
http://localhost:3000/auth/login

# 3. اختبر كل provider:
- اضغط على زر Google
- اضغط على زر Facebook  
- اضغط على زر Apple
```

### اختبار الإنتاج:

1. تأكد من إضافة redirect URIs للإنتاج في كل provider
2. تأكد من تطابق الدومين في جميع الإعدادات
3. اختبر كل provider على الدومين المباشر

---

## 🔍 التحقق من التكامل

### ✅ قائمة التحقق:

- [ ] **Google:**
  - [ ] Client ID و Client Secret مُضافين في Supabase
  - [ ] Authorized redirect URIs صحيحة
  - [ ] تسجيل دخول تجريبي يعمل

- [ ] **Facebook:**
  - [ ] App ID و App Secret مُضافين في Supabase
  - [ ] Valid OAuth Redirect URIs صحيحة
  - [ ] التطبيق في وضع Live (إذا كان للإنتاج)
  - [ ] تسجيل دخول تجريبي يعمل

- [ ] **Apple:**
  - [ ] Services ID مُضاف في Supabase
  - [ ] Team ID و Key ID صحيحين
  - [ ] Private Key محمّل بشكل صحيح
  - [ ] Return URLs مُسجلة
  - [ ] تسجيل دخول تجريبي يعمل

---

## 🐛 استكشاف الأخطاء الشائعة

### خطأ: "Redirect URI mismatch"
**الحل:** تأكد من تطابق redirect URIs في:
- Google/Facebook/Apple Console
- Supabase Dashboard
- الكود (auth/callback)

### خطأ: "Invalid client"
**الحل:** تحقق من:
- Client ID/App ID صحيح
- Client Secret/App Secret صحيح
- لا توجد مسافات زائدة

### خطأ: "Access denied"
**الحل:**
- تأكد من أن التطبيق في وضع Live (Facebook)
- تأكد من تفعيل Sign In في Google+/Apple
- تحقق من الصلاحيات المطلوبة

### خطأ في الـ Callback:
**الحل:**
- تحقق من وجود `/auth/callback/page.tsx`
- تحقق من إنشاء سجل المستخدم في قاعدة البيانات
- راجع console logs

---

## 📝 ملاحظات مهمة

### 1. متطلبات قاعدة البيانات:
تأكد من أن جدول `users` يحتوي على:
```sql
- id (UUID, Primary Key)
- email (TEXT)
- name/full_name (TEXT)
- role (TEXT)
- created_at (TIMESTAMPTZ)
```

### 2. Environment Variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Callback Page:
ملف `/app/auth/callback/page.tsx` موجود ويعمل على:
- التحقق من الجلسة
- إنشاء سجل المستخدم إذا لم يكن موجوداً
- التوجيه حسب الدور

---

## 🎨 تحسينات التصميم

### الألوان:
- خلفية متدرجة من purple إلى pink
- تأثيرات blur وشفافية
- أيقونات ملونة لكل provider

### الحركات:
- Framer Motion للانتقالات السلسة
- Hover effects على الأزرار
- Loading spinners متحركة
- رسائل الخطأ والنجاح تظهر بـ fade-in

### Responsive:
- يعمل بشكل مثالي على جميع الأجهزة
- تصميم متجاوب للموبايل
- أزرار كبيرة وواضحة

---

## 🚀 الخطوات التالية

1. **إعداد OAuth Providers** في Supabase Dashboard
2. **اختبار كل provider** على localhost
3. **إضافة redirect URIs للإنتاج** عند النشر
4. **مراقبة الأخطاء** في console
5. **تحسين UX** حسب feedback المستخدمين

---

## 📞 الدعم

إذا واجهت مشاكل:
1. راجع [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
2. راجع console logs في المتصفح
3. تحقق من Supabase Dashboard > Authentication > Logs
4. اطّلع على [OAuth Provider Documentation](https://supabase.com/docs/guides/auth/social-login)

---

**✨ تم تحديث صفحة تسجيل الدخول بنجاح مع جميع الميزات المطلوبة!**
