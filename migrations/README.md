# 🚀 دليل تنفيذ تحديثات نظام الدردشة
## Chat System Migration Guide

---

## 📋 نظرة عامة

تم إنشاء 4 ملفات SQL لتحديث نظام الدردشة بالكامل:
1. ✅ `01-migrate-chats-table.sql` - تحديث جدول chats
2. ✅ `02-migrate-messages-table.sql` - تحديث جدول messages
3. ✅ `03-create-chat-triggers.sql` - إنشاء Functions & Triggers
4. ✅ `04-update-chat-policies.sql` - تحديث سياسات RLS

---

## ⚠️ تحذير مهم

**قبل التنفيذ:**
1. ✅ عمل **Backup كامل** لقاعدة البيانات
2. ✅ اختبار على **بيئة تطوير** أولاً
3. ✅ قراءة كل ملف وفهم ما يفعله

---

## 📝 خطوات التنفيذ

### الخطوة 1: Backup قاعدة البيانات

```bash
# في Supabase Dashboard
1. اذهب إلى Database → Backups
2. اضغط "Create backup"
3. انتظر حتى ي完成
```

---

### الخطوة 2: تنفيذ الملفات بالترتيب

#### 🔧 الملف الأول: تحديث جدول CHATS

```sql
-- افتح: migrations/01-migrate-chats-table.sql
-- في Supabase SQL Editor

-- 1. انسخ المحتوى بالكامل
-- 2. الصق في SQL Editor
-- 3. اضغط RUN
-- 4. تحقق من النتائج
```

**ماذا يفعل؟**
- ✅ يزيل أعمدة `message` و `read` الخاطئة
- ✅ يضيف `last_message_sender_id` و `sender_role`
- ✅ يضيف `chat_type` و `is_archived`
- ✅ يضيف `admin_unread_count` و `driver_unread_count`
- ✅ يضيف `participants` للمحادثات الجماعية
- ✅ يضيف فهارس جديدة للأداء

**النتيجة المتوقعة:**
```
✅ Columns added successfully
✅ Indexes created successfully
✅ Constraints added successfully
```

---

#### 📨 الملف الثاني: تحديث جدول MESSAGES

```sql
-- افتح: migrations/02-migrate-messages-table.sql
-- في Supabase SQL Editor

-- 1. انسخ المحتوى بالكامل
-- 2. الصق في SQL Editor
-- 3. اضغط RUN
-- 4. تحقق من النتائج
```

**ماذا يفعل؟**
- ✅ يضيف `sender_role` (حرج جداً!)
- ✅ يضيف `read_at` لوقت القراءة
- ✅ يضيف `message_type` و `attachments`
- ✅ يضيف `reply_to_id` للردود
- ✅ يضيف `is_edited` و `edit_history`
- ✅ يضيف `is_deleted` و `is_reported`
- ✅ يضيف فهارس محسّنة

**النتيجة المتوقعة:**
```
✅ sender_role added with existing data updated
✅ All new columns added successfully
✅ Indexes created successfully
```

---

#### ⚙️ الملف الثالث: Functions & Triggers

```sql
-- افتح: migrations/03-create-chat-triggers.sql
-- في Supabase SQL Editor

-- 1. انسخ المحتوى بالكامل
-- 2. الصق في SQL Editor
-- 3. اضغط RUN
-- 4. تحقق من النتائج
```

**ماذا يفعل؟**
- ✅ Trigger لتحديث `last_message` تلقائياً
- ✅ Trigger لحساب `unread_count` تلقائياً
- ✅ Trigger لتحديث `updated_at`
- ✅ Trigger لحفظ سجل التعديلات
- ✅ Function لإنشاء/جلب محادثة
- ✅ Functions مساعدة أخرى

**النتيجة المتوقعة:**
```
✅ 10 Functions created successfully
✅ 4 Triggers created successfully
```

---

#### 🔒 الملف الرابع: تحديث السياسات

```sql
-- افتح: migrations/04-update-chat-policies.sql
-- في Supabase SQL Editor

-- 1. انسخ المحتوى بالكامل
-- 2. الصق في SQL Editor
-- 3. اضغط RUN
-- 4. تحقق من النتائج
```

**ماذا يفعل؟**
- ✅ يحذف السياسات القديمة المكررة
- ✅ ينشئ سياسات جديدة شاملة
- ✅ دعم جميع الأدوار (Admin, Driver, Staff, etc.)
- ✅ إضافة DELETE policies
- ✅ إضافة UPDATE policy للرسائل

**النتيجة المتوقعة:**
```
✅ Old policies dropped
✅ 8 new policies created (4 for chats + 4 for messages)
✅ All roles supported
```

---

## 🧪 اختبار بعد التنفيذ

### 1. اختبار البنية الأساسية

```sql
-- تحقق من وجود الأعمدة الجديدة في chats
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'chats'
  AND column_name IN (
    'last_message_sender_id', 
    'sender_role', 
    'chat_type', 
    'is_archived',
    'admin_unread_count',
    'driver_unread_count'
  );

-- النتيجة المتوقعة: 6 rows (جميع الأعمدة موجودة)
```

```sql
-- تحقق من وجود الأعمدة الجديدة في messages
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'messages'
  AND column_name IN (
    'sender_role',
    'read_at',
    'message_type',
    'attachments',
    'reply_to_id',
    'is_edited',
    'is_deleted',
    'is_reported'
  );

-- النتيجة المتوقعة: 8 rows (جميع الأعمدة موجودة)
```

---

### 2. اختبار الـ Triggers

```sql
-- اختبار: إرسال رسالة ومشاهدة تحديث last_message تلقائياً

-- 1. اختر محادثة
SELECT id, last_message, last_message_at 
FROM chats 
LIMIT 1;

-- 2. أرسل رسالة (استبدل chat_id و sender_id)
INSERT INTO messages (chat_id, sender_id, sender_role, content, message_type)
VALUES (
  'your-chat-id-here'::uuid,
  'your-user-id-here'::uuid,
  'customer',
  'رسالة تجريبية',
  'text'
);

-- 3. تحقق من تحديث last_message
SELECT id, last_message, last_message_at, last_message_sender_id
FROM chats 
WHERE id = 'your-chat-id-here'::uuid;

-- ✅ المتوقع: last_message تم تحديثه تلقائياً!
```

---

### 3. اختبار السياسات

```sql
-- تحقق من عدد السياسات
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('chats', 'messages')
GROUP BY tablename;

-- ✅ المتوقع:
-- chats: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- messages: 4 policies (SELECT, INSERT, UPDATE, DELETE)
```

---

## 📊 التحقق النهائي

```sql
-- ملخص شامل للنظام الجديد
SELECT 
  '✅ النظام الجديد' as status,
  (SELECT COUNT(*) FROM chats) as total_chats,
  (SELECT COUNT(*) FROM messages) as total_messages,
  (SELECT COUNT(*) FROM pg_proc WHERE proname LIKE '%chat%' OR proname LIKE '%message%') as total_functions,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgrelid IN ('chats'::regclass, 'messages'::regclass) AND NOT tgisinternal) as total_triggers,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('chats', 'messages')) as total_policies;
```

**النتيجة المتوقعة:**
```
status: ✅ النظام الجديد
total_chats: [عدد المحادثات]
total_messages: [عدد الرسائل]
total_functions: ~10
total_triggers: ~4
total_policies: 8
```

---

## ❌ في حالة وجود مشاكل

### المشكلة 1: خطأ في sender_role

```sql
-- إذا ظهر خطأ: column "sender_role" does not exist

-- الحل:
ALTER TABLE messages ADD COLUMN sender_role VARCHAR(20);
UPDATE messages m SET sender_role = u.role FROM users u WHERE m.sender_id = u.id;
ALTER TABLE messages ALTER COLUMN sender_role SET NOT NULL;
```

### المشكلة 2: خطأ في Foreign Key

```sql
-- إذا ظهر خطأ في vendor_id FK

-- تحقق من FKs الموجودة:
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'chats'::regclass
  AND conname LIKE '%vendor%';

-- قد تحتاج لحذف FK مكرر
```

### المشكلة 3: استعادة Backup

```bash
# في حالة فشل كامل:
1. اذهب إلى Database → Backups
2. اختر آخر backup قبل التحديث
3. اضغط "Restore"
4. أعد المحاولة بحذر
```

---

## 🎯 الخطوات التالية (بعد نجاح الـ Migration)

### 1. تحديث الكود TypeScript
```typescript
// سيتم تحديث:
- contexts/ChatsContext.tsx
- components/FloatingChatWidget.tsx
- app/chats/page.tsx
```

### 2. اختبار شامل
```
✅ اختبار جميع الأدوار
✅ اختبار إرسال الرسائل
✅ اختبار القراءة والعدادات
✅ اختبار السياسات
```

### 3. إطلاق المزايا الجديدة
```
✅ دعم المرفقات
✅ الرد على الرسائل
✅ تعديل/حذف الرسائل
✅ Typing indicators
✅ Online status
```

---

## 📞 الدعم

**إذا واجهت أي مشكلة:**
1. راجع التقرير الشامل: `CHAT_SYSTEM_COMPREHENSIVE_REPORT.md`
2. تحقق من الأخطاء في Supabase Logs
3. راجع هذا الدليل خطوة بخطوة
4. اعمل rollback إذا لزم الأمر

---

## ✅ Checklist

قبل البدء:
- [ ] Backup تم
- [ ] فهمت كل خطوة
- [ ] على بيئة تطوير

أثناء التنفيذ:
- [ ] الملف 1: تحديث chats ✅
- [ ] الملف 2: تحديث messages ✅
- [ ] الملف 3: Functions & Triggers ✅
- [ ] الملف 4: السياسات ✅

بعد التنفيذ:
- [ ] اختبار البنية ✅
- [ ] اختبار Triggers ✅
- [ ] اختبار السياسات ✅
- [ ] التحقق النهائي ✅

---

**🎉 بالتوفيق في التحديث!**

التاريخ: 2026-01-06
الإصدار: 1.0
