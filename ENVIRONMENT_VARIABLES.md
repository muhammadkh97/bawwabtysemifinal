# متغيرات البيئة المطلوبة لمشروع بوابتي

هذا المستند يحتوي على جميع متغيرات البيئة (Environment Variables) اللازمة لتشغيل مشروع `bawwabtysemifinal` بشكل كامل في بيئة الإنتاج (Production) على Vercel.

## المتغيرات الأساسية

| المتغير | الوصف | كيفية الحصول عليه |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | رابط مشروعك على Supabase. | من لوحة تحكم Supabase: `Settings > API > Project URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | مفتاح API العام (anon key) لمشروعك على Supabase. | من لوحة تحكم Supabase: `Settings > API > Project API keys > anon public` |
| `SUPABASE_SERVICE_ROLE_KEY` | مفتاح API الخاص بالخدمة (service role key) لمشروعك على Supabase. **(سري للغاية)** | من لوحة تحكم Supabase: `Settings > API > Project API keys > service_role` |
| `NEXT_PUBLIC_APP_URL` | رابط التطبيق الأساسي عند نشره. | مثال: `https://your-app-name.vercel.app` |
| `NEXT_PUBLIC_ADMIN_USER_ID` | معرف المستخدم الإداري لاستلام الإشعارات. | من جدول `users` في قاعدة بيانات Supabase. |

## خدمات الخرائط (Google Maps)

| المتغير | الوصف | كيفية الحصول عليه |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | مفتاح API الخاص بخرائط جوجل. | 1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/google/maps-apis).
2. قم بإنشاء مشروع جديد.
3. قم بتفعيل واجهات برمجة التطبيقات التالية:
    - **Maps JavaScript API**
    - **Geocoding API**
    - **Places API**
    - **Distance Matrix API**
4. قم بإنشاء مفتاح API جديد وتقييده بالنطاق الخاص بتطبيقك. |

## بوابات الدفع (Stripe)

| المتغير | الوصف | كيفية الحصول عليه |
|---|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | المفتاح العام لـ Stripe (Publishable Key). | من [لوحة تحكم Stripe](https://dashboard.stripe.com/apikeys). |
| `STRIPE_SECRET_KEY` | المفتاح السري لـ Stripe (Secret Key). **(سري للغاية)** | من [لوحة تحكم Stripe](https://dashboard.stripe.com/apikeys). |

## خدمات الرسائل القصيرة (Twilio)

| المتغير | الوصف | كيفية الحصول عليه |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | معرف حسابك على Twilio. | من [لوحة تحكم Twilio](https://www.twilio.com/console). |
| `TWILIO_AUTH_TOKEN` | رمز المصادقة الخاص بحسابك على Twilio. **(سري للغاية)** | من [لوحة تحكم Twilio](https://www.twilio.com/console). |
| `TWILIO_PHONE_NUMBER` | رقم الهاتف الذي تم شراؤه من Twilio. | من [لوحة تحكم Twilio](https://www.twilio.com/console/phone-numbers/incoming). |

## خدمات البريد الإلكتروني (SendGrid)

| المتغير | الوصف | كيفية الحصول عليه |
|---|---|---|
| `SENDGRID_API_KEY` | مفتاح API الخاص بـ SendGrid. **(سري للغاية)** | من [لوحة تحكم SendGrid](https://app.sendgrid.com/settings/api_keys). |
| `SENDGRID_FROM_EMAIL` | عنوان البريد الإلكتروني الذي ستظهر الرسائل مرسلة منه. | يجب أن يكون عنوان بريد إلكتروني تم التحقق منه في SendGrid. |
