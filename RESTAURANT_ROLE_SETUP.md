# ✅ تطبيق دور Restaurant في النظام

## 📋 ملخص التغييرات

تم إضافة دور **restaurant** منفصل في النظام بدلاً من استخدام دور vendor للمطاعم.

### قبل التحديث:
- `vendor` → يشمل المتاجر والمطاعم معاً
- التمييز يتم عبر `business_type` فقط

### بعد التحديث:
- `vendor` → متاجر التجزئة فقط
- `restaurant` → المطاعم فقط ⭐
- كل منهما له لوحة تحكم خاصة

---

## 🚀 خطوات التطبيق

### الخطوة 1️⃣: تحديث قاعدة البيانات

**اختر أحد الخيارين:**

#### خيار أ: إضافة دور restaurant (موصى به) ✅
للقواعد الموجودة بدون حذف البيانات:

**الطريقة الصحيحة (بـ 3 أجزاء):**

1. افتح [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)

2. **PART 1**: انسخ محتوى الملف `database/add_restaurant_role_PART1.sql`
   - هذا يضيف restaurant إلى ENUM
   - الصق والضغط Run
   - انتظر النجاح

3. **PART 2**: انسخ محتوى الملف `database/add_restaurant_role_PART2.sql`
   - هذا يضيف RLS Policies والدوال
   - الصق والضغط Run
   - انتظر النجاح

4. **PART 3**: انسخ محتوى الملف `database/add_restaurant_role_PART3.sql`
   - هذا للتحقق والأمثلة
   - الصق والضغط Run
   - اختياري (للتحقق فقط)

#### خيار ب: إعادة بناء كاملة ⚠️
**تحذير: سيحذف جميع البيانات!**

1. افتح [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. انسخ محتوى الملف: `database/force_rebuild.sql`
3. الصق المحتوى واضغط Run

---

### الخطوة 2️⃣: إعادة تحميل Schema Cache

**مهم جداً!** بدون هذه الخطوة لن تعمل التغييرات:

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api)
2. Settings → API
3. ابحث عن "Reload schema cache"
4. اضغط على الزر
5. انتظر حتى تظهر رسالة النجاح

---

### الخطوة 3️⃣: تحديث الكود (تم بالفعل ✅)

تم تحديث الملفات التالية:
- ✅ `contexts/AuthContext.tsx` - تحديث جلب الأدوار
- ✅ `components/ProtectedRoute.tsx` - إضافة restaurant
- ✅ `app/dashboard/restaurant/layout.tsx` - موجود مسبقاً
- ✅ `database/force_rebuild.sql` - تحديث ENUM

---

### الخطوة 4️⃣: تحديث المستخدمين الحاليين (اختياري)

إذا كان لديك بائعون بمطاعم وتريد تحويلهم:

```sql
-- عرض البائعين الذين لديهم مطاعم
SELECT 
    u.id, u.email, u.full_name, u.role,
    s.name as restaurant_name, s.business_type
FROM users u
INNER JOIN stores s ON s.user_id = u.id
WHERE s.business_type = 'restaurant'
AND u.role = 'vendor';

-- تحويلهم إلى دور restaurant
UPDATE users u
SET role = 'restaurant'
FROM stores s
WHERE s.user_id = u.id
AND s.business_type = 'restaurant'
AND u.role = 'vendor';
```

**أو استخدم الأمثلة في**: `database/update_user_role.sql`

---

### الخطوة 5️⃣: البناء والاختبار

```powershell
# بناء التطبيق
npm run build

# أو تشغيل في وضع التطوير
npm run dev
```

#### اختبر تسجيل الدخول:
1. سجل دخول كـ Admin → يجب التوجيه إلى `/dashboard/admin`
2. سجل دخول كـ Vendor → يجب التوجيه إلى `/dashboard/vendor`
3. سجل دخول كـ Restaurant → يجب التوجيه إلى `/dashboard/restaurant`
4. سجل دخول كـ Driver → يجب التوجيه إلى `/dashboard/driver`

---

### الخطوة 6️⃣: Deploy

```powershell
# Push إلى Git (إذا كنت تستخدم Vercel/Netlify)
git add .
git commit -m "Add restaurant role support"
git push

# أو استخدم أمر deploy المخصص
npm run deploy
```

---

## 🔍 التحقق من النجاح

### في قاعدة البيانات:
```sql
-- التحقق من ENUM
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- يجب أن يظهر:
-- customer
-- vendor
-- driver
-- admin
-- restaurant
```

### في التطبيق:
1. افتح Console في المتصفح (F12)
2. سجل دخول كمطعم
3. يجب أن ترى:
   ```
   🎭 [AuthContext] الدور النهائي: restaurant
   ✅ [ProtectedRoute] مصرح بالدخول!
   ```

---

## 📁 الملفات المضافة/المحدثة

### ملفات قاعدة البيانات:
- 📄 `database/add_restaurant_role.sql` - إضافة دور restaurant
- 📄 `database/update_user_role.sql` - أمثلة تحديث المستخدمين
- 📄 `database/ROLES_GUIDE.md` - دليل شامل للأدوار
- 📄 `database/force_rebuild.sql` - تم تحديث ENUM

### ملفات التطبيق:
- 📄 `contexts/AuthContext.tsx` - تحديث جلب الأدوار
- 📄 `components/ProtectedRoute.tsx` - دعم restaurant
- 📄 `app/dashboard/driver/layout.tsx` - تم إنشاؤه

### سكريبتات المساعدة:
- 📄 `apply-restaurant-role.ps1` - سكريبت PowerShell
- 📄 `apply-restaurant-role.sh` - سكريبت Bash

---

## ❓ استكشاف الأخطاء

### مشكلة: خطأ "unsafe use of new value"
```
ERROR: 55P04: unsafe use of new value "restaurant" of enum type user_role
```

✅ **الحل:**
```
هذا يعني أنك تشغّل السكريبت في transaction واحد
استخدم الطريقة الصحيحة (PART 1 ثم PART 2 ثم PART 3)
أو استخدم force_rebuild.sql
```

### مشكلة: "دور غير صالح"
```
✅ الحل:
1. تأكد من تشغيل PART 1 و PART 2 بنجاح
2. أعد تحميل Schema Cache
3. حدّث الصفحة
```

### مشكلة: "لا يمكن الوصول للوحة التحكم"
```
✅ الحل:
1. افتح Console (F12)
2. ابحث عن رسائل الخطأ
3. تحقق من users.role في قاعدة البيانات:
   SELECT id, email, role FROM users WHERE email = 'your-email';
4. تأكد أن role = 'restaurant'
```

### مشكلة: "Schema cache error"
```
✅ الحل:
1. اذهب إلى Supabase Dashboard
2. Settings → API
3. Reload schema cache
4. انتظر 30 ثانية
5. حدّث التطبيق
```

---

## 📞 الدعم

للمزيد من المعلومات:
- 📖 راجع `database/ROLES_GUIDE.md`
- 📝 أمثلة SQL في `database/update_user_role.sql`
- 🔍 تتبع الأخطاء في Console المتصفح

---

## ✅ Checklist

قبل Deploy، تأكد من:

- [ ] تشغيل `add_restaurant_role.sql` على قاعدة البيانات
- [ ] إعادة تحميل Schema Cache في Supabase
- [ ] تحديث المستخدمين الحاليين (إن لزم)
- [ ] `npm run build` يعمل بنجاح
- [ ] اختبار تسجيل الدخول لكل دور
- [ ] مراجعة Console للتأكد من عدم وجود أخطاء

---

**تم! 🎉 الآن لديك دور restaurant منفصل وكامل في النظام**
