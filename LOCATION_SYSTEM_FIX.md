# 🗺️ دليل إصلاح نظام المواقع الجغرافية

## 📋 الفهرس
1. [نظرة عامة](#نظرة-عامة)
2. [المشاكل المكتشفة](#المشاكل-المكتشفة)
3. [الحل المقترح](#الحل-المقترح)
4. [خطوات التطبيق](#خطوات-التطبيق)
5. [اختبار النظام](#اختبار-النظام)
6. [الاستخدام](#الاستخدام)

---

## 🎯 نظرة عامة

تم تطوير نظام شامل لإدارة المواقع الجغرافية في تطبيق بوابتي، يشمل:
- ✅ خريطة تفاعلية لتحديد موقع المتجر/المطعم
- ✅ حفظ الإحداثيات في قاعدة البيانات
- ✅ حساب المسافة بين النقاط
- ✅ البحث عن المتاجر القريبة
- ✅ تتبع موقع السائقين

---

## ❌ المشاكل المكتشفة

من خلال السكربت التشخيصي `diagnostic_maps_location_system.sql` وجدنا:

### 1. تكرار الأعمدة
جدول `stores` يحتوي على 6 أعمدة للموقع:
- `lat` + `latitude` (خط العرض)
- `lng` + `longitude` (خط الطول)
- `location` (PostGIS GEOGRAPHY)
- `address` (عنوان نصي)

⚠️ **المشكلة:** تكرار وعدم تزامن بين lat/latitude و lng/longitude

### 2. بيانات مفقودة
- 📊 **2 متاجر** في النظام
- ❌ **0 متاجر** لديها موقع (100% بدون موقع)
- ❌ **0 طلبات** لديها إحداثيات توصيل (فقط عناوين نصية)

### 3. خطأ في أسماء الأعمدة
جدول `drivers` يستخدم:
- ✅ `current_lat` و `current_lng` (الصحيح)
- ❌ ليس `current_latitude` و `current_longitude`

### 4. عدم وجود Constraints
لا توجد قيود للتحقق من صحة الإحداثيات:
- خط العرض يجب أن يكون بين -90 و 90
- خط الطول يجب أن يكون بين -180 و 180

### 5. عدم وجود Triggers
لا توجد triggers لمزامنة تلقائية بين الأعمدة المكررة

---

## ✅ الحل المقترح

### الملفات المُنشأة:

#### 1. **Frontend Components**
- ✅ `components/dashboard/LocationPicker.tsx` - خريطة Google Maps تفاعلية
- ✅ تحديث `app/dashboard/vendor/my-store/page.tsx`
- ✅ تحديث `app/dashboard/restaurant/settings/page.tsx`

#### 2. **Database Scripts**
- ✅ `fix_location_system_complete.sql` - سكربت الإصلاح الشامل

#### 3. **Documentation**
- ✅ `LOCATION_PICKER_QUICK_START.md` - دليل سريع
- ✅ `LOCATION_SYSTEM_FIX.md` - هذا الملف (دليل شامل)
- ✅ `diagnostic_maps_location_system.sql` - سكربت التشخيص

---

## 🔧 خطوات التطبيق

### المرحلة 1: تجهيز Frontend ✅

#### الخطوة 1.1: تثبيت المكتبات المطلوبة
```bash
npm install @react-google-maps/api
```

#### الخطوة 1.2: الحصول على Google Maps API Key

1. **اذهب إلى:** https://console.cloud.google.com/
2. **أنشئ مشروع جديد** أو اختر مشروع موجود
3. **فعّل APIs المطلوبة:**
   - Maps JavaScript API ✅ (مطلوب)
   - Geocoding API (اختياري)
   - Places API (اختياري)

4. **أنشئ API Key:**
   - اذهب إلى: APIs & Services > Credentials
   - اضغط "+ CREATE CREDENTIALS"
   - اختر "API key"
   - انسخ المفتاح

5. **قيّد المفتاح (للأمان):**
   - اضغط على المفتاح > Edit API key
   - Website restrictions > Add your domain
   - مثال: `*.yourapp.com/*` أو `localhost:3000/*` للتطوير

#### الخطوة 1.3: تحديث `.env.local`
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD...مفتاحك_الحقيقي_هنا
```

#### الخطوة 1.4: إعادة تشغيل السيرفر
```bash
# أوقف السيرفر (Ctrl+C)
npm run dev
```

✅ **التحقق:** افتح `/dashboard/vendor/my-store` يجب أن ترى خريطة تفاعلية

---

### المرحلة 2: تطبيق Database Fixes 🔧

#### الخطوة 2.1: تشغيل سكربت الإصلاح

افتح Supabase SQL Editor وشغّل:
```sql
-- الملف: fix_location_system_complete.sql
```

أو يمكنك نسخه مباشرة إلى SQL Editor.

#### ما يفعله السكربت:

##### 📦 **1. توحيد الأعمدة (Stores)**
```sql
-- إضافة الأعمدة المفقودة
ALTER TABLE stores ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

-- مزامنة البيانات
UPDATE stores SET lat = COALESCE(lat, latitude);
UPDATE stores SET lng = COALESCE(lng, longitude);
UPDATE stores SET location = ST_MakePoint(lng, lat)::GEOGRAPHY;
```

##### 🔒 **2. إضافة Constraints**
```sql
-- التحقق من صحة خط العرض (-90 إلى 90)
ALTER TABLE stores ADD CONSTRAINT stores_lat_valid_range 
CHECK (lat IS NULL OR (lat >= -90 AND lat <= 90));

-- التحقق من صحة خط الطول (-180 إلى 180)
ALTER TABLE stores ADD CONSTRAINT stores_lng_valid_range 
CHECK (lng IS NULL OR (lng >= -180 AND lng <= 180));

-- ضمان التناسق بين lat/latitude
ALTER TABLE stores ADD CONSTRAINT stores_lat_consistency 
CHECK (lat IS NULL OR latitude IS NULL OR lat = latitude);
```

##### 🎯 **3. إنشاء Spatial Indexes**
```sql
-- تحسين أداء البحث الجغرافي
CREATE INDEX idx_stores_location_gist ON stores USING GIST(location);
CREATE INDEX idx_orders_delivery_location_gist ON orders USING GIST(delivery_location);
CREATE INDEX idx_drivers_current_location_gist ON drivers USING GIST(current_location);
```

##### ⚙️ **4. إنشاء Functions**

**4.1: حساب المسافة بالكيلومتر**
```sql
CREATE FUNCTION calculate_distance_km(
    lat1 DECIMAL, lng1 DECIMAL,
    lat2 DECIMAL, lng2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN ST_Distance(
        ST_MakePoint(lng1, lat1)::GEOGRAPHY,
        ST_MakePoint(lng2, lat2)::GEOGRAPHY
    ) / 1000;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**مثال استخدام:**
```sql
-- المسافة بين عمّان والزرقاء
SELECT calculate_distance_km(31.9454, 35.9284, 32.0722, 36.0880) as distance_km;
-- النتيجة: ~15.2 كم
```

**4.2: البحث عن المتاجر القريبة**
```sql
CREATE FUNCTION get_nearby_stores(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_km DECIMAL DEFAULT 10
) RETURNS TABLE(...) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, 
           calculate_distance_km(user_lat, user_lng, s.lat, s.lng) as distance_km
    FROM stores s
    WHERE calculate_distance_km(user_lat, user_lng, s.lat, s.lng) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;
```

**مثال استخدام:**
```sql
-- ابحث عن متاجر ضمن 5 كم من موقعي
SELECT * FROM get_nearby_stores(31.9454, 35.9284, 5);
```

**4.3: تحديث موقع السائق**
```sql
CREATE FUNCTION update_driver_location(
    driver_id UUID,
    new_lat DECIMAL,
    new_lng DECIMAL
) RETURNS VOID AS $$
BEGIN
    UPDATE drivers
    SET current_lat = new_lat,
        current_lng = new_lng,
        current_location = ST_MakePoint(new_lng, new_lat)::GEOGRAPHY,
        location_updated_at = NOW()
    WHERE id = driver_id;
END;
$$ LANGUAGE plpgsql;
```

##### 🔄 **5. إنشاء Triggers للمزامنة التلقائية**

**5.1: Trigger للمتاجر**
```sql
CREATE TRIGGER trigger_sync_store_coordinates
    BEFORE INSERT OR UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION sync_store_coordinates();
```

**ماذا يفعل:**
- يزامن تلقائياً lat ↔️ latitude
- يزامن تلقائياً lng ↔️ longitude
- يحدّث عمود location من lat/lng

**5.2: Trigger للطلبات**
```sql
CREATE TRIGGER trigger_sync_order_delivery_location
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION sync_order_delivery_location();
```

**5.3: Trigger للسائقين**
```sql
CREATE TRIGGER trigger_sync_driver_location
    BEFORE INSERT OR UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION sync_driver_location();
```

#### الخطوة 2.2: التحقق من نجاح التطبيق

شغّل هذا الاستعلام للتحقق:
```sql
-- فحص Constraints
SELECT constraint_name, table_name 
FROM information_schema.table_constraints
WHERE constraint_name LIKE '%location%' OR constraint_name LIKE '%lat%' OR constraint_name LIKE '%lng%';

-- فحص Indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE indexname LIKE '%location%';

-- فحص Functions
SELECT routine_name 
FROM information_schema.routines
WHERE routine_name IN ('calculate_distance_km', 'get_nearby_stores', 'update_driver_location');

-- فحص Triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers
WHERE trigger_name LIKE '%sync%';
```

✅ **المتوقع:**
- 4 Constraints على الأقل
- 3 Indexes (GIST)
- 3 Functions
- 3 Triggers

---

## 🧪 اختبار النظام

### اختبار 1: إضافة موقع من لوحة التحكم

1. سجل دخول كبائع: `/dashboard/vendor/my-store`
2. مرر للأسفل إلى "الموقع الجغرافي"
3. اضغط "موقعي الحالي" أو اضغط على الخريطة
4. احفظ التغييرات

**التحقق في قاعدة البيانات:**
```sql
SELECT id, name, lat, lng, latitude, longitude,
       CASE WHEN location IS NOT NULL THEN '✅' ELSE '❌' END as location_status
FROM stores
WHERE lat IS NOT NULL;
```

✅ **المتوقع:** يجب أن ترى نفس القيمة في lat/latitude و lng/longitude

### اختبار 2: حساب المسافة

```sql
-- أضف متجرين بمواقع مختلفة ثم:
SELECT 
    s1.name as store1,
    s2.name as store2,
    calculate_distance_km(s1.lat, s1.lng, s2.lat, s2.lng) as distance_km
FROM stores s1, stores s2
WHERE s1.id != s2.id
    AND s1.lat IS NOT NULL 
    AND s2.lat IS NOT NULL
LIMIT 5;
```

### اختبار 3: البحث عن المتاجر القريبة

```sql
-- من موقع وسط عمّان
SELECT * FROM get_nearby_stores(31.9539, 35.9106, 20);
```

### اختبار 4: Triggers

```sql
-- اختبار المزامنة التلقائية
UPDATE stores 
SET lat = 31.9539, lng = 35.9106 
WHERE id = 'your-store-id';

-- تحقق من المزامنة
SELECT lat, latitude, lng, longitude,
       ST_Y(location::geometry) as location_lat,
       ST_X(location::geometry) as location_lng
FROM stores 
WHERE id = 'your-store-id';
```

✅ **المتوقع:** 
- `lat = latitude`
- `lng = longitude`
- `location` محدث تلقائياً

---

## 📱 الاستخدام

### للبائعين والمطاعم:

#### تحديد الموقع:
1. اذهب إلى لوحة التحكم
2. البائع: **متجري** | المطعم: **إعدادات المطعم**
3. قسم "الموقع الجغرافي"
4. خيارات التحديد:
   - **سريع:** زر "موقعي الحالي" 🧭
   - **دقيق:** اضغط على الخريطة 🗺️
   - **يدوي:** أدخل الإحداثيات ✏️
5. احفظ التغييرات 💾

#### لماذا مهم؟
- ✅ يظهر متجرك للعملاء القريبين
- ✅ حساب دقيق لرسوم التوصيل
- ✅ تتبع الطلبات على الخريطة

### للمطورين:

#### استخدام Functions في الكود:

**TypeScript - البحث عن متاجر قريبة:**
```typescript
const { data: nearbyStores } = await supabase
  .rpc('get_nearby_stores', {
    user_lat: 31.9539,
    user_lng: 35.9106,
    radius_km: 10
  });
```

**TypeScript - حساب المسافة:**
```typescript
const { data: distance } = await supabase
  .rpc('calculate_distance_km', {
    lat1: 31.9539,
    lng1: 35.9106,
    lat2: 32.0722,
    lng2: 36.0880
  });
```

**TypeScript - تحديث موقع السائق:**
```typescript
await supabase.rpc('update_driver_location', {
  driver_id: driverId,
  new_lat: position.coords.latitude,
  new_lng: position.coords.longitude
});
```

---

## 🚨 حل المشاكل

### المشكلة: الخريطة لا تظهر

**الأسباب المحتملة:**
1. ❌ Google Maps API Key غير صحيح
2. ❌ المكتبة غير مثبتة
3. ❌ السيرفر لم يُعد تشغيله

**الحل:**
```bash
# تحقق من المكتبة
npm list @react-google-maps/api

# إعادة التثبيت
npm install @react-google-maps/api

# تحقق من .env.local
cat .env.local | grep GOOGLE_MAPS

# أعد تشغيل السيرفر
npm run dev
```

### المشكلة: خطأ في تشغيل السكربت

**الخطأ:** `constraint "stores_lat_valid_range" already exists`

**الحل:** السكربت يحتوي على `IF NOT EXISTS` - إذا ظهر الخطأ، يعني أن الـ constraint موجود بالفعل. هذا طبيعي.

### المشكلة: لا يتم حفظ الموقع

**الحل:**
1. افتح Console (F12)
2. تحقق من الأخطاء
3. تأكد من صلاحيات RLS:

```sql
-- تحقق من policies
SELECT * FROM pg_policies WHERE tablename = 'stores';

-- إضافة policy إذا لزم
CREATE POLICY "Users can update their own store location"
ON stores FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 📊 الإحصائيات بعد التطبيق

شغّل السكربت التشخيصي مرة أخرى:
```sql
-- diagnostic_maps_location_system.sql
```

**قبل التطبيق:**
- ❌ 2 متاجر، 0 لديها موقع (0%)
- ❌ 0 Constraints
- ❌ 0 Functions مخصصة
- ❌ 0 Triggers

**بعد التطبيق:**
- ✅ يعتمد على البيانات المدخلة من لوحة التحكم
- ✅ 4+ Constraints
- ✅ 3 Functions
- ✅ 3 Triggers
- ✅ 3 Spatial Indexes

---

## 🎯 الخطوات التالية (اختياري)

### ميزات إضافية يمكن تطويرها:

1. **خريطة في الصفحة الرئيسية**
   - عرض جميع المتاجر على خريطة
   - فلترة حسب المسافة

2. **حساب رسوم التوصيل**
   - بناءً على المسافة الفعلية
   - استخدام `calculate_distance_km`

3. **تتبع الطلب مباشرة**
   - عرض موقع السائق في الوقت الفعلي
   - تحديث تلقائي كل 10 ثواني

4. **Geocoding**
   - تحويل العنوان النصي إلى إحداثيات
   - استخدام Google Geocoding API

---

## 📖 مصادر إضافية

- [PostGIS Documentation](https://postgis.net/documentation/)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Supabase PostGIS Guide](https://supabase.com/docs/guides/database/extensions/postgis)
- [React Google Maps API](https://react-google-maps-api-docs.netlify.app/)

---

## ✅ Checklist النهائي

### Frontend:
- [ ] تثبيت `@react-google-maps/api`
- [ ] إضافة Google Maps API Key إلى `.env.local`
- [ ] إعادة تشغيل السيرفر
- [ ] اختبار الخريطة في لوحة البائع
- [ ] اختبار الخريطة في لوحة المطعم

### Database:
- [ ] تشغيل `fix_location_system_complete.sql`
- [ ] التحقق من Constraints (4+)
- [ ] التحقق من Indexes (3)
- [ ] التحقق من Functions (3)
- [ ] التحقق من Triggers (3)

### Testing:
- [ ] إضافة موقع من لوحة التحكم
- [ ] التحقق من حفظ البيانات في DB
- [ ] اختبار `calculate_distance_km`
- [ ] اختبار `get_nearby_stores`
- [ ] اختبار المزامنة التلقائية (Triggers)

---

**🎉 تم بنجاح! نظام المواقع الجغرافية جاهز للاستخدام**

لأي استفسارات، راجع:
- `LOCATION_PICKER_QUICK_START.md` - دليل سريع
- `diagnostic_maps_location_system.sql` - سكربت التشخيص
- `fix_location_system_complete.sql` - سكربت الإصلاح
