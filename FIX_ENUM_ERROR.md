# ⚠️ حل مشكلة: "unsafe use of new value" في Supabase

## المشكلة

عند تشغيل `add_restaurant_role.sql` تظهر هذه الرسالة:

```
ERROR: 55P04: unsafe use of new value "restaurant" of enum type user_role
HINT: New enum values must be committed before they can be used.
```

## السبب

PostgreSQL لا يسمح باستخدام قيمة جديدة في ENUM في نفس transaction الذي تم إضافتها فيه.

Supabase يشغل كل SQL query في transaction منفصل، لكن إذا كان السكريبت يحتوي على عدة statements، قد يحاول استخدام القيمة الجديدة قبل أن تُعتمد (commit).

## الحل ✅

استخدم الطريقة الصحيحة بـ **3 أجزاء منفصلة**:

### PART 1: إضافة ENUM فقط
```sql
-- database/add_restaurant_role_PART1.sql
-- شغّل هذا أولاً ✅
```

**الخطوات:**
1. افتح Supabase SQL Editor
2. انسخ محتوى `database/add_restaurant_role_PART1.sql`
3. الصق والضغط "Run"
4. انتظر حتى تظهر رسالة النجاح: ✅

---

### PART 2: إضافة Policies والدوال
```sql
-- database/add_restaurant_role_PART2.sql
-- شغّل هذا بعد PART 1 ✅
```

**الخطوات:**
1. افتح SQL Editor (نفس الملف يمكن)
2. امسح محتوى الجزء السابق
3. انسخ محتوى `database/add_restaurant_role_PART2.sql`
4. الصق والضغط "Run"
5. انتظر حتى تظهر رسالة النجاح: ✅

---

### PART 3: التحقق والأمثلة
```sql
-- database/add_restaurant_role_PART3.sql
-- شغّل هذا بعد PART 2 (اختياري) ✅
```

**الخطوات:**
1. امسح محتوى الجزء السابق
2. انسخ محتوى `database/add_restaurant_role_PART3.sql`
3. الصق والضغط "Run"
4. ستظهر نتائج الاستعلامات

---

## بديل: استخدام force_rebuild.sql

إذا أردت إعادة بناء كاملة (وحذف البيانات):

```sql
-- database/force_rebuild.sql
-- هذا يحتوي على كل شيء في transaction واحد
-- ويعمل بدون مشاكل
```

لكن تحذير: **سيحذف جميع البيانات!**

---

## الخطوة التالية: Schema Cache

**مهم جداً!** بعد اكتمال PART 1 و PART 2:

1. اذهب إلى Supabase Dashboard
2. Settings → API
3. ابحث عن "Reload schema cache"
4. اضغط على الزر
5. انتظر حتى تظهر ✅

---

## سؤال شائع

### لماذا لا يعمل في transaction واحد؟

PostgreSQL يتعامل مع ENUM بطريقة خاصة:
- عند إضافة قيمة جديدة، PostgreSQL يقفل الـ type
- لا يمكن استخدام القيمة الجديدة إلا بعد commit الـ transaction
- Supabase عادة يعمل في transactions منفصلة

**الحل:** فصل السكريبت إلى أجزاء (transaction منفصل لكل جزء)

---

## التحقق من النجاح

### في Supabase:
```sql
-- تحقق من وجود 'restaurant' في ENUM
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- يجب أن تظهر:
-- customer
-- vendor
-- driver
-- admin
-- restaurant ← هنا! ✅
```

### في التطبيق:
```javascript
// افتح Console (F12)
// سجل دخول كمطعم
// يجب أن تظهر:
🎭 [AuthContext] الدور النهائي: restaurant ✅
```

---

## ملاحظات إضافية

1. **عدم الحاجة لحذف الملف القديم**
   - الملف `add_restaurant_role.sql` لا تزال تعمل للقراءة
   - لكن استخدم PART 1/2/3 للتنفيذ

2. **الترتيب مهم**
   - PART 1 أولاً (يجب أن ينجح)
   - ثم PART 2 (يجب أن ينجح)
   - ثم PART 3 (اختياري)

3. **لا تخلط بين السكريبتات**
   - شغّل PART 1 وحده ✅
   - ثم PART 2 وحده ✅
   - لا تشغلهم معاً ❌

---

## المراجع

- [PostgreSQL ENUM Documentation](https://www.postgresql.org/docs/current/datatype-enum.html)
- [Supabase SQL Editor Guide](https://supabase.com/docs/guides/database/sql-editor)
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
