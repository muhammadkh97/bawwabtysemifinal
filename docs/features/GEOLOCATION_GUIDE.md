# نظام الموقع الجغرافي والعناوين - Geolocation & Addresses System

## 📍 نظرة عامة
تم إضافة نظام شامل لإدارة المواقع الجغرافية والعناوين لتحسين تجربة التوصيل والطلبات.

---

## ✨ الميزات المضافة

### 1️⃣ صفحة الملف الشخصي (Profile Page)
**المسار**: `/profile`

#### المميزات:
- ✅ عرض وتعديل المعلومات الشخصية
- ✅ إدارة العناوين المحفوظة (إضافة، تعديل، حذف)
- ✅ تحديد الموقع الحالي باستخدام GPS
- ✅ تعيين عنوان افتراضي
- ✅ دعم أنواع العناوين (منزل 🏠، عمل 🏢، آخر 📍)

#### معلومات العنوان:
```typescript
{
  title: string,           // منزل، عمل، آخر
  city: string,           // المدينة
  area: string,           // المنطقة
  street: string,         // الشارع
  building: string,       // رقم البناية
  floor?: string,         // الطابق (اختياري)
  apartment?: string,     // رقم الشقة (اختياري)
  landmark?: string,      // علامة مميزة (اختياري)
  phone: string,          // رقم الهاتف
  lat?: number,           // خط العرض
  lng?: number,           // خط الطول
  is_default: boolean     // عنوان افتراضي
}
```

---

### 2️⃣ صفحة تتبع الموقع للسائق
**المسار**: `/dashboard/driver/location`

#### المميزات:
- ✅ تتبع مباشر للموقع الحالي (Real-time tracking)
- ✅ عرض الدقة والإحداثيات
- ✅ سجل المواقع (آخر 50 نقطة)
- ✅ معاينة بصرية للخريطة
- ✅ زر فتح في خرائط جوجل
- ✅ تحديث تلقائي كل ثواني

#### واجهة الاستخدام:
```typescript
interface LocationData {
  lat: number;              // خط العرض
  lng: number;              // خط الطول
  accuracy: number;         // دقة الموقع بالمتر
  timestamp: Date;          // وقت التحديث
  battery?: number;         // مستوى البطارية (اختياري)
  speed?: number;           // السرعة (اختياري)
  heading?: number;         // الاتجاه (اختياري)
}
```

---

### 3️⃣ مكتبة Geolocation الشاملة
**الملف**: `lib/geolocation.ts`

#### الدوال الرئيسية:

##### 📍 الحصول على الموقع الحالي
```typescript
const location = await getCurrentLocation({
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000
});
```

##### 👁️ تتبع الموقع المستمر
```typescript
const watchId = watchLocation(
  (location) => {
    console.log('موقع جديد:', location);
  },
  (error) => {
    console.error('خطأ:', error);
  }
);

// إيقاف التتبع
stopWatchingLocation(watchId);
```

##### 📏 حساب المسافة بين نقطتين
```typescript
const distance = calculateDistance(
  { lat: 31.9539, lng: 35.9106 }, // عمان
  { lat: 32.5568, lng: 35.8469 }  // إربد
);
// النتيجة بالكيلومتر
```

##### ⏱️ حساب وقت الوصول المتوقع (ETA)
```typescript
const eta = calculateETA(
  origin,
  destination,
  40 // متوسط السرعة بالكيلومتر/ساعة
);

console.log(eta);
// {
//   distanceKm: 5.2,
//   distanceText: "5.2 كم",
//   durationMinutes: 8,
//   durationText: "8 دقيقة",
//   estimatedArrival: Date
// }
```

##### 🔍 التحقق من وجود نقطة داخل دائرة
```typescript
const isInDeliveryZone = isPointInRadius(
  customerLocation,
  vendorLocation,
  10 // نطاق 10 كم
);
```

##### 🌐 Reverse Geocoding (من إحداثيات لعنوان)
```typescript
const address = await getAddressFromCoordinates(
  { lat: 31.9539, lng: 35.9106 },
  'YOUR_GOOGLE_MAPS_API_KEY'
);
// "عمان، الأردن"
```

##### 🗺️ Geocoding (من عنوان لإحداثيات)
```typescript
const coords = await getCoordinatesFromAddress(
  'عمان، الجبيهة، شارع الجامعة',
  'YOUR_GOOGLE_MAPS_API_KEY'
);
// { lat: 32.0157, lng: 35.8706 }
```

##### 🧭 فتح في تطبيقات الخرائط
```typescript
// فتح في خرائط جوجل
openInGoogleMaps({ lat: 31.9539, lng: 35.9106 });

// فتح في خرائط أبل
openInAppleMaps({ lat: 31.9539, lng: 35.9106 });

// فتح اتجاهات (Directions)
openDirections(origin, destination);
```

##### 💾 حفظ الموقع في قاعدة البيانات
```typescript
await saveLocationToDatabase(
  driverId,
  location,
  orderId // اختياري
);
```

---

## 🗄️ قاعدة البيانات

### جدول العناوين (user_addresses)
```sql
CREATE TABLE public.user_addresses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  full_address TEXT NOT NULL,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  street TEXT,
  building TEXT,
  floor TEXT,
  apartment TEXT,
  landmark TEXT,
  postal_code TEXT,
  phone TEXT NOT NULL,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### جدول مواقع السائقين (driver_locations)
**موجود بالفعل في المشروع**:
```sql
CREATE TABLE public.driver_locations (
  id UUID PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id),
  order_id UUID REFERENCES orders(id),
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(10,2),
  battery_level INTEGER,
  created_at TIMESTAMP
);
```

### Trigger: عنوان افتراضي واحد
```sql
CREATE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE user_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🚀 حالات الاستخدام

### 1. إضافة عنوان للعميل
```typescript
// في صفحة /profile
1. العميل يضغط "إضافة عنوان"
2. يملأ البيانات (المدينة، المنطقة، إلخ)
3. يضغط "تحديد موقعي الحالي" للحصول على GPS
4. يحفظ العنوان
5. يتم حفظه في جدول user_addresses
```

### 2. تتبع موقع السائق أثناء التوصيل
```typescript
// في صفحة /dashboard/driver/location
1. السائق يفتح الصفحة
2. يضغط "بدء التتبع"
3. يُطلب منه السماح بالوصول للموقع
4. يتم تتبع موقعه كل ثواني
5. يُحفظ في driver_locations
6. العميل يمكنه رؤية الموقع على الخريطة
```

### 3. حساب تكلفة التوصيل بناءً على المسافة
```typescript
import { calculateDistance } from '@/lib/geolocation';

const distance = calculateDistance(
  vendorAddress,
  customerAddress
);

const shippingCost = calculateShippingCost(distance);
```

### 4. تحديد منطقة التوصيل المتاحة
```typescript
import { isPointInRadius } from '@/lib/geolocation';

const canDeliver = isPointInRadius(
  customerAddress,
  vendorAddress,
  vendorDeliveryRadius // مثلاً 15 كم
);

if (!canDeliver) {
  alert('عذراً، خارج نطاق التوصيل');
}
```

---

## 📱 صلاحيات المتصفح

### طلب صلاحية الموقع
```typescript
import { requestLocationPermission } from '@/lib/geolocation';

const hasPermission = await requestLocationPermission();
if (!hasPermission) {
  alert('يرجى السماح بالوصول للموقع');
}
```

### التحقق من الدعم
```typescript
import { isGeolocationSupported } from '@/lib/geolocation';

if (!isGeolocationSupported()) {
  alert('المتصفح لا يدعم خاصية الموقع');
}
```

---

## 🎯 التكامل مع Google Maps API

### إعداد API Key
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. قم بتفعيل:
   - Geocoding API
   - Geolocation API
   - Maps JavaScript API
3. أنشئ API Key
4. أضفه في `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### استخدام في الكود
```typescript
const address = await getAddressFromCoordinates(
  location,
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
);
```

---

## ⚡ الأداء والتحسينات

### 1. تقليل استهلاك البطارية
```typescript
// استخدم timeout أطول
const watchId = watchLocation(callback, errorCallback, {
  maximumAge: 60000, // 1 دقيقة
  timeout: 10000
});
```

### 2. تقليل طلبات الخادم
```typescript
let lastSaveTime = 0;
const SAVE_INTERVAL = 30000; // 30 ثانية

watchLocation((location) => {
  const now = Date.now();
  if (now - lastSaveTime >= SAVE_INTERVAL) {
    saveLocationToDatabase(driverId, location);
    lastSaveTime = now;
  }
});
```

### 3. استخدام Cache للعناوين
```typescript
// حفظ العناوين في localStorage
localStorage.setItem('savedAddresses', JSON.stringify(addresses));
```

---

## 🔐 الأمان والخصوصية

### ✅ الممارسات الجيدة:
1. **طلب الصلاحية بوضوح**: اشرح للمستخدم لماذا تحتاج الموقع
2. **إيقاف التتبع**: امنح المستخدم خيار إيقاف التتبع
3. **تشفير البيانات**: احفظ المواقع بشكل آمن
4. **حذف البيانات القديمة**: احذف مواقع السائقين القديمة دورياً
5. **HTTPS فقط**: لا تعمل Geolocation API إلا على HTTPS

### مثال: حذف المواقع القديمة
```sql
-- حذف مواقع أقدم من 7 أيام
DELETE FROM driver_locations
WHERE created_at < NOW() - INTERVAL '7 days';
```

---

## 📊 التقارير والإحصائيات

### 1. إجمالي المسافات المقطوعة
```sql
SELECT
  driver_id,
  COUNT(*) as total_deliveries,
  -- حساب إجمالي المسافة يحتاج دالة مخصصة
FROM driver_locations
GROUP BY driver_id;
```

### 2. متوسط وقت التوصيل
```typescript
const deliveries = await getDeliveries();
const avgTime = deliveries.reduce((sum, d) => 
  sum + (d.delivered_at - d.started_at), 0
) / deliveries.length;
```

---

## 🧪 الاختبار

### اختبار الموقع محلياً
```typescript
// استخدم إحداثيات ثابتة للتطوير
const MOCK_LOCATION = { lat: 31.9539, lng: 35.9106 };

if (process.env.NODE_ENV === 'development') {
  return MOCK_LOCATION;
} else {
  return await getCurrentLocation();
}
```

### اختبار على أجهزة حقيقية
- اختبر على هاتف (GPS أكثر دقة من الكمبيوتر)
- جرّب في مواقع مختلفة
- اختبر مع Wi-Fi وبدونه

---

## 🚨 معالجة الأخطاء

```typescript
try {
  const location = await getCurrentLocation();
} catch (error) {
  if (error.message.includes('PERMISSION_DENIED')) {
    // المستخدم رفض الصلاحية
    showPermissionInstructions();
  } else if (error.message.includes('POSITION_UNAVAILABLE')) {
    // GPS غير متاح
    useFallbackMethod();
  } else if (error.message.includes('TIMEOUT')) {
    // انتهت المهلة
    retryWithLongerTimeout();
  }
}
```

---

## 📝 TODO - التطويرات المستقبلية

- [ ] إضافة خريطة تفاعلية (Leaflet أو Google Maps)
- [ ] Offline support (حفظ المواقع محلياً)
- [ ] Push notifications عند اقتراب السائق
- [ ] Heat map لمناطق التوصيل الأكثر طلباً
- [ ] Route optimization (أفضل مسار للسائق)
- [ ] Integration مع Waze API
- [ ] دعم Multiple stops (عدة طلبات)
- [ ] Geofencing (تنبيهات عند دخول/خروج من منطقة)

---

## 📞 المساعدة والدعم

### مشاكل شائعة:

**1. "المتصفح لا يدعم الموقع"**
- تأكد من استخدام HTTPS
- جرّب متصفح حديث (Chrome, Firefox, Safari)

**2. "الدقة منخفضة جداً"**
- فعّل GPS في الجهاز
- استخدم `enableHighAccuracy: true`
- اخرج للخارج (إشارة أفضل)

**3. "بطء في الحصول على الموقع"**
- زد قيمة `timeout`
- استخدم `maximumAge` أكبر
- تحقق من اتصال الإنترنت

---

## 📚 مراجع مفيدة

- [MDN: Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Google Maps Geocoding API](https://developers.google.com/maps/documentation/geocoding)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)
- [PostGIS for PostgreSQL](https://postgis.net/)

---

**آخر تحديث**: 2024-12-24  
**الإصدار**: 1.0.0  
**الحالة**: ✅ جاهز للاستخدام
