# 🚀 تعليمات تنفيذ تطوير نظام الإشعارات

## 📋 الخطوات السريعة

### 1️⃣ تنفيذ السكريبت الشامل (موصى به)

في Supabase SQL Editor، نفّذ:

```sql
\i database/execute-notifications-upgrade.sql
```

أو انسخ محتوى الملف كاملاً والصقه في SQL Editor.

**الوقت المتوقع:** 2-3 دقائق  
**النتيجة:** نظام إشعارات متطور بالكامل ✅

---

### 2️⃣ أو التنفيذ خطوة بخطوة

إذا أردت التحكم الكامل، نفّذ الملفات بالترتيب:

```sql
-- 1. إضافة الحقول
\i database/add-notification-fields.sql

-- 2. إنشاء Functions
\i database/create-notification-functions.sql

-- 3. إضافة DELETE Policy
\i database/add-notification-delete-policy.sql
```

---

### 3️⃣ التحقق من النجاح

بعد التنفيذ، شغّل سكريبت الفحص:

```sql
\i database/check-notifications-system.sql
```

**النتيجة المتوقعة:**
- ✅ 12 حقل في جدول notifications
- ✅ 6 RPC Functions
- ✅ 4 RLS Policies (SELECT, UPDATE, INSERT, DELETE)
- ✅ 8 Indexes

---

## 🎯 ما الذي سيتم إضافته؟

### حقول جديدة (4):
- `link` - رابط للانتقال عند الضغط على الإشعار
- `read_at` - وقت قراءة الإشعار
- `priority` - الأولوية (low, normal, high, urgent)
- `category` - الفئة (orders, products, messages, system, staff, admin)

### RPC Functions (5 جديدة):
- `mark_notification_read(uuid)` - تحديد إشعار كمقروء
- `mark_all_notifications_read()` - تحديد الكل كمقروء
- `create_notification(...)` - إنشاء إشعار مع validations
- `cleanup_old_notifications(days)` - حذف الإشعارات القديمة
- `get_user_notifications(limit, offset, unread_only)` - جلب مع pagination

### Policies (1 جديدة):
- DELETE Policy - السماح بحذف الإشعارات

### Indexes محسّنة (5):
- Composite index للأداء
- Type filtering
- Cleanup optimization
- Category filtering
- Priority sorting

---

## ⚠️ ملاحظات مهمة

1. **لن يتم حذف أي بيانات موجودة** - كل الإشعارات الـ 12 الحالية ستبقى
2. **الـ Functions القديمة ستبقى** - `get_unread_count` موجودة ولن تتأثر
3. **Indexes القديمة ستبقى** - لن نحذف `idx_notifications_user` و `idx_notifications_read`

---

## 🐛 حل المشاكل

### إذا ظهر خطأ: "column already exists"
```sql
-- تجاهل الخطأ، الحقل موجود بالفعل ✅
```

### إذا ظهر خطأ: "constraint already exists"
```sql
-- تجاهل الخطأ، الـ constraint موجود ✅
```

### إذا فشل التنفيذ
```sql
-- تحقق من الأخطاء:
SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction';

-- إلغاء أي معاملات معلقة:
ROLLBACK;

-- أعد التنفيذ
```

---

## ✅ بعد التنفيذ

### 1. اختبر الـ Functions:

```sql
-- اختبار mark_notification_read
SELECT mark_notification_read('notification-id-here');

-- اختبار mark_all_notifications_read
SELECT mark_all_notifications_read();

-- اختبار get_user_notifications
SELECT * FROM get_user_notifications(10, 0, false);
```

### 2. تحديث الإشعارات الموجودة:

```sql
-- إضافة priority للإشعارات الموجودة
UPDATE notifications 
SET priority = 'normal' 
WHERE priority IS NULL;

-- إضافة category للإشعارات الموجودة
UPDATE notifications 
SET category = CASE 
  WHEN type LIKE '%order%' THEN 'orders'
  WHEN type LIKE '%message%' THEN 'messages'
  ELSE 'system'
END
WHERE category IS NULL;
```

---

## 🎉 الخطوة التالية

بعد نجاح التنفيذ، انتقل إلى **المرحلة 2** في التقرير:
- إضافة إشعارات للـ Admin
- إضافة إشعارات للـ Vendor
- إضافة إشعارات للـ Driver
- تحسين إشعارات الطلبات

راجع: `NOTIFICATIONS_SYSTEM_AUDIT_REPORT.md` - القسم 5 (خطة العمل)

---

## 📞 دعم

إذا واجهت أي مشاكل، أرسل نتائج هذا السكريبت:

```sql
-- سكريبت تشخيصي
SELECT 
  'Columns' as type, 
  COUNT(*)::text as count 
FROM information_schema.columns 
WHERE table_name = 'notifications'
UNION ALL
SELECT 
  'Functions', 
  COUNT(*)::text 
FROM pg_proc 
WHERE proname LIKE '%notification%'
UNION ALL
SELECT 
  'Policies', 
  COUNT(*)::text 
FROM pg_policies 
WHERE tablename = 'notifications'
UNION ALL
SELECT 
  'Indexes', 
  COUNT(*)::text 
FROM pg_indexes 
WHERE tablename = 'notifications';
```

---

**تم التحضير بواسطة:** GitHub Copilot  
**التاريخ:** 2026-01-05  
**الحالة:** ✅ جاهز للتنفيذ
