# 📊 تقرير شامل وتفصيلي لنظام الدردشة والمحادثات
## Chat System Comprehensive Analysis Report

---

**تاريخ التقرير:** 2026-01-06  
**الحالة:** تحليل كامل للنظام الحالي + خطة التطوير  
**الهدف:** تحويل النظام لنظام دردشة احترافي عالمي يدعم جميع الأدوار

---

## 📑 جدول المحتويات

1. [نظرة عامة على النظام الحالي](#1-نظرة-عامة)
2. [تحليل بنية قاعدة البيانات](#2-تحليل-بنية-قاعدة-البيانات)
3. [تحليل الكود والواجهة](#3-تحليل-الكود-والواجهة)
4. [تحليل السياسات الأمنية](#4-تحليل-السياسات-الأمنية)
5. [المشاكل الحرجة](#5-المشاكل-الحرجة)
6. [نقاط القوة](#6-نقاط-القوة)
7. [التطويرات المطلوبة](#7-التطويرات-المطلوبة)
8. [تصميم النظام الجديد](#8-تصميم-النظام-الجديد)
9. [خطة التنفيذ](#9-خطة-التنفيذ)

---

## 1. نظرة عامة على النظام الحالي

### 🎯 الوصف الحالي
نظام دردشة بسيط يربط **العملاء (Customers)** مع **البائعين/المطاعم (Vendors/Restaurants)** فقط.

### 📊 الإحصائيات الحالية
- **عدد المحادثات:** 6 محادثات
- **عدد الرسائل:** 0 رسائل (جميع المحادثات فارغة)
- **المستخدمون النشطون:** 
  - 4 عملاء
  - 2 بائعين/مطاعم
- **الرسائل غير المقروءة:** 0

### ⚠️ الوضع الحالي
```
❌ جميع المحادثات بدون رسائل
❌ النظام لا يعمل بشكل فعلي
⚠️ يدعم فقط: Customer ↔ Vendor
❌ لا يدعم: Admin, Driver, Staff
```

---

## 2. تحليل بنية قاعدة البيانات

### 📋 جدول CHATS

#### ✅ الأعمدة الموجودة
```sql
- id                    (UUID, PK)
- customer_id           (UUID, FK → users.id)
- vendor_id             (UUID, FK → stores.id, vendors.id)
- last_message          (TEXT)
- last_message_at       (TIMESTAMP)
- customer_unread_count (INTEGER, default: 0)
- vendor_unread_count   (INTEGER, default: 0)
- is_active             (BOOLEAN, default: true)
- created_at            (TIMESTAMP)
- updated_at            (TIMESTAMP)
- order_id              (UUID, FK → orders.id) ✅ ميزة جيدة
```

#### ⚠️ أعمدة غريبة/خاطئة
```sql
❌ message  (TEXT)        - يجب أن يكون في جدول messages
❌ read     (BOOLEAN)     - يجب أن يكون في جدول messages
```

#### ❌ أعمدة مفقودة مهمة
```sql
❌ last_message_sender_id  - من أرسل آخر رسالة؟
❌ is_archived             - لأرشفة المحادثات
❌ chat_type               - نوع المحادثة (1-to-1, group, support)
❌ participants            - JSONB array للمحادثات الجماعية
❌ metadata                - JSONB لبيانات إضافية
```

#### 🔗 Foreign Keys (العلاقات)
```
✅ chats_customer_id_fkey       → users.id
✅ chats_vendor_id_fkey         → stores.id
✅ chats_vendor_id_vendors_fkey → vendors.id
✅ chats_order_id_fkey          → orders.id

⚠️ مشكلة: vendor_id له FK مكرر (stores و vendors)
```

#### 📇 Indexes (الفهارس)
```
✅ chats_pkey                      (PRIMARY KEY على id)
✅ chats_customer_id_vendor_id_key (UNIQUE على customer + vendor)
✅ idx_chats_customer              (INDEX على customer_id)
✅ idx_chats_vendor                (INDEX على vendor_id)
✅ idx_chats_last_message          (INDEX على last_message_at)

📊 التقييم: ممتاز - الفهارس موجودة وصحيحة
```

---

### 📨 جدول MESSAGES

#### ✅ الأعمدة الموجودة
```sql
- id         (UUID, PK)
- chat_id    (UUID, FK → chats.id)
- sender_id  (UUID, FK → users.id)
- content    (TEXT, NOT NULL)
- is_read    (BOOLEAN, default: false)
- created_at (TIMESTAMP)
```

#### ❌ أعمدة مفقودة حرجة
```sql
❌ sender_role         - لا نعرف نوع المرسل (customer/vendor/admin/driver)
❌ read_at             - متى تم القراءة؟
❌ attachments         - JSON array للصور والملفات
❌ attachment_types    - أنواع المرفقات
❌ reply_to_id         - للرد على رسالة معينة
❌ is_reported         - للإبلاغ عن رسائل
❌ report_reason       - سبب الإبلاغ
❌ is_deleted          - للحذف الناعم
❌ deleted_at          - متى تم الحذف
❌ edited_at           - للتعديل
❌ metadata            - JSONB لبيانات إضافية
```

#### 🔗 Foreign Keys
```
✅ messages_chat_id_fkey   → chats.id
✅ messages_sender_id_fkey → users.id

📊 التقييم: صحيح لكن محدود
```

#### 📇 Indexes
```
✅ messages_pkey        (PRIMARY KEY)
✅ idx_messages_chat    (INDEX على chat_id) - ممتاز
✅ idx_messages_created (INDEX على created_at DESC) - ممتاز
✅ idx_messages_sender  (INDEX على sender_id)

📊 التقييم: ممتاز
```

---

## 3. تحليل الكود والواجهة

### 📁 الملفات الرئيسية

#### 1. `contexts/ChatsContext.tsx` (448 سطر)

##### ✅ نقاط القوة
```typescript
✅ استخدام React Context API بشكل صحيح
✅ Real-time subscriptions مع Supabase
✅ إدارة الحالة (chats, messages, loading states)
✅ دعم unread counts
✅ دالة createOrGetChat ذكية
✅ markAsRead function
✅ دعم جزئي للـ Admin و Driver في fetchChats
```

##### ❌ المشاكل
```typescript
❌ منطق معقد للتفريق بين customer/vendor
❌ استخدام stores بدلاً من vendors مباشرة
❌ لا يدعم Staff (مساعدي البائع/المطعم)
❌ لا يوجد دعم كامل للـ Admin/Driver
❌ createOrGetChat يعمل فقط للـ customer
❌ لا يوجد دعم للمحادثات الجماعية
❌ لا يوجد typing indicators
❌ لا يوجد online/offline status
```

##### 🔧 الدوال الرئيسية
```typescript
1. fetchChats()          - جلب المحادثات
2. fetchMessages()       - جلب الرسائل
3. sendMessage()         - إرسال رسالة
4. markAsRead()          - تحديد كمقروءة
5. createOrGetChat()     - إنشاء محادثة جديدة
6. subscribeToChatsChanges()    - Realtime للمحادثات
7. subscribeToMessagesChanges() - Realtime للرسائل
```

---

#### 2. `components/FloatingChatWidget.tsx` (587 سطر)

##### ✅ نقاط القوة
```typescript
✅ واجهة مستخدم جميلة مع Framer Motion
✅ Draggable widget - يمكن تحريكه
✅ حفظ الموقع في localStorage
✅ صوت للإشعارات
✅ دعم Quick Actions
✅ رابط للصفحة الكاملة
✅ عرض حالة الرسالة (✓ / ✓✓)
✅ دعم للـ Admin, Driver, Vendor, Customer
```

##### ❌ المشاكل
```typescript
❌ لا يوجد دعم للصور والمرفقات
❌ لا يوجد typing indicator
❌ لا يوجد emoji picker
❌ UX محدود على الموبايل
```

---

#### 3. `app/chats/page.tsx` (406 سطر)

##### ✅ نقاط القوة
```typescript
✅ صفحة كاملة للدردشة
✅ تصميم جميل مع gradients
✅ دعم البحث في المحادثات
✅ عرض حالة القراءة
✅ دعم فتح محادثة من URL (?vendor=xxx)
```

##### ❌ المشاكل
```typescript
❌ نفس المشاكل في ChatsContext
❌ لا يوجد دعم للمرفقات
❌ لا يوجد emoji picker
```

---

## 4. تحليل السياسات الأمنية (RLS)

### 🔐 حالة RLS
```
✅ RLS مفعّل على جدول chats
✅ RLS مفعّل على جدول messages
```

### 📋 سياسات جدول CHATS

#### ✅ السياسات الموجودة (6 سياسات)
```sql
1. Customers can view own chats     (SELECT)
   USING: customer_id = auth.uid()
   
2. Vendors can view store chats     (SELECT)
   USING: vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
   
3. Restaurants can view store chats (SELECT) [مكررة؟]
   USING: vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
   
4. Users can create chats           (INSERT)
   WITH CHECK: customer_id = auth.uid()
   
5. Users can update own chats       (UPDATE)
   USING: customer_id = auth.uid() OR vendor_id IN (...)
   
6. Restaurants can update chats     (UPDATE) [مكررة؟]
   USING: vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
```

#### ❌ السياسات المفقودة
```sql
❌ DELETE policy - لا يمكن حذف المحادثات
❌ Admin policies - المدير لا يستطيع رؤية المحادثات
❌ Driver policies - السائق محدود الصلاحيات
❌ Staff policies - لا يوجد دعم للمساعدين
```

#### ⚠️ المشاكل
```
⚠️ سياسات مكررة (Vendors و Restaurants)
⚠️ لا تفحص user_role من جدول users
⚠️ تعتمد على stores بدلاً من vendors
⚠️ معقدة وغير واضحة
```

---

### 📨 سياسات جدول MESSAGES

#### ✅ السياسات الموجودة (2 سياسات فقط!)
```sql
1. Users can view chat messages (SELECT)
   USING: chat_id IN (SELECT id FROM chats WHERE ...)
   
2. Users can send messages      (INSERT)
   WITH CHECK: sender_id = auth.uid()
```

#### ❌ السياسات المفقودة
```sql
❌ UPDATE policy - لا يمكن تعديل الرسائل
❌ DELETE policy - لا يمكن حذف الرسائل
❌ Admin policies
❌ Driver policies
❌ Staff policies
```

---

## 5. المشاكل الحرجة 🚨

### 🔴 مشاكل في قاعدة البيانات

#### 1. بنية جدول chats غير صحيحة
```sql
❌ أعمدة message و read في مكان خاطئ
❌ عدم وجود last_message_sender_id
❌ عدم وجود is_archived
❌ عدم وجود chat_type
```

#### 2. بنية جدول messages ناقصة جداً
```sql
❌ لا يوجد sender_role - حرج جداً!
❌ لا يوجد read_at
❌ لا يوجد دعم للمرفقات
❌ لا يوجد reply_to_id
❌ لا يوجد دعم للحذف/التعديل
```

#### 3. عدم وجود Functions & Triggers
```sql
❌ لا يوجد trigger لتحديث last_message تلقائياً
❌ لا يوجد trigger لتحديث updated_at
❌ لا يوجد trigger لحساب unread_count
❌ لا يوجد function للإشعارات
```

#### 4. مشاكل في العلاقات
```sql
⚠️ vendor_id له FK مزدوج (stores و vendors)
⚠️ عدم وضوح: هل نستخدم stores أم vendors؟
```

---

### 🟡 مشاكل في الكود

#### 1. منطق معقد ومكرر
```typescript
❌ كود vendor/stores متكرر في كل مكان
❌ منطق معقد لتحديد other_user_name
❌ fetchChats مختلف لكل دور
```

#### 2. دعم محدود للأدوار
```typescript
❌ Admin: دعم جزئي فقط
❌ Driver: دعم جزئي فقط
❌ Staff: لا يوجد دعم
❌ Restaurant: مخلوط مع Vendor
```

#### 3. عدم وجود مميزات أساسية
```typescript
❌ لا يوجد typing indicators
❌ لا يوجد online/offline status
❌ لا يوجد دعم للصور والمرفقات
❌ لا يوجد emoji picker
❌ لا يوجد دعم للمحادثات الجماعية
```

---

### 🟠 مشاكل في السياسات

#### 1. سياسات ناقصة
```sql
❌ لا يوجد DELETE policies
❌ UPDATE policy مفقودة للرسائل
❌ سياسات Admin مفقودة
```

#### 2. سياسات مكررة
```sql
⚠️ Vendors و Restaurants نفس الكود
⚠️ غير واضح: من يفعل ماذا؟
```

#### 3. لا تفحص الأدوار
```sql
⚠️ جميع السياسات لا تفحص users.role
⚠️ تعتمد على customer_id و vendor_id فقط
```

---

## 6. نقاط القوة ✅

### 🎯 ما يعمل بشكل جيد

#### 1. البنية الأساسية
```
✅ استخدام Supabase بشكل صحيح
✅ Real-time subscriptions تعمل
✅ React Context API منظم
✅ Indexes جيدة على الجداول
```

#### 2. UX/UI
```
✅ FloatingChatWidget جميل وعملي
✅ Draggable feature رائعة
✅ تصميم عصري مع gradients
✅ دعم RTL للعربية
```

#### 3. الأمان
```
✅ RLS مفعّل
✅ السياسات الأساسية موجودة
✅ auth.uid() يستخدم بشكل صحيح
```

#### 4. الأداء
```
✅ الفهارس موجودة
✅ Pagination يمكن إضافته بسهولة
✅ unread_count محسوب مسبقاً
```

---

## 7. التطويرات المطلوبة 🚀

### 🎯 الأولويات

#### 🔴 أولوية عالية (Critical)

1. **إصلاح بنية قاعدة البيانات**
   - إزالة `message` و `read` من chats
   - إضافة `sender_role` في messages
   - إضافة `last_message_sender_id` في chats
   - إضافة الأعمدة المفقودة الأساسية

2. **إضافة Functions & Triggers**
   - Trigger لتحديث last_message
   - Trigger لتحديث updated_at
   - Function لحساب unread_count

3. **دعم جميع الأدوار**
   - Admin: رؤية جميع المحادثات + إدارتها
   - Driver: التواصل مع Customer + Restaurant
   - Staff: نيابة عن Vendor/Restaurant
   - Customer, Vendor, Restaurant: تحسين الدعم

4. **إصلاح وتوحيد السياسات**
   - سياسات واضحة لكل دور
   - إضافة DELETE policies
   - إضافة UPDATE policy للرسائل
   - دمج السياسات المكررة

---

#### 🟡 أولوية متوسطة (Important)

5. **دعم المرفقات**
   - إضافة `attachments` في messages
   - Storage bucket للصور والملفات
   - معاينة الصور
   - تحميل الملفات

6. **ميزات UX متقدمة**
   - Typing indicators
   - Online/Offline status
   - Emoji picker
   - رد على رسالة معينة (reply)
   - تعديل الرسائل
   - حذف الرسائل

7. **الإشعارات**
   - Push notifications
   - Email notifications
   - In-app notifications badge

8. **البحث والفلترة**
   - البحث في الرسائل
   - فلترة المحادثات
   - أرشفة المحادثات

---

#### 🟢 أولوية منخفضة (Nice to Have)

9. **المحادثات الجماعية**
   - Group chats
   - إضافة/إزالة أعضاء
   - Admin للمجموعة

10. **التقارير والتحليلات**
    - Dashboard للمدير
    - إحصائيات الرسائل
    - أوقات الاستجابة

11. **ميزات متقدمة**
    - Voice messages
    - Video calls
    - Scheduled messages
    - Auto-replies

---

## 8. تصميم النظام الجديد 🏗️

### 🎨 المبادئ الأساسية

```
1. 🌐 عالمي (International-grade)
2. 🔐 آمن (Secure by default)
3. ⚡ سريع (Optimized performance)
4. 📱 متجاوب (Mobile-first)
5. ♿ سهل الاستخدام (Accessible)
6. 🔄 قابل للتوسع (Scalable)
```

---

### 📊 بنية قاعدة البيانات الجديدة

#### جدول CHATS (محسّن)
```sql
CREATE TABLE chats (
  -- الأعمدة الأساسية
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_type               VARCHAR(20) DEFAULT 'direct', -- direct, group, support
  
  -- المشاركون (للمحادثات الثنائية)
  customer_id             UUID REFERENCES users(id),
  vendor_id               UUID REFERENCES vendors(id),
  
  -- المشاركون (للمحادثات الجماعية)
  participants            JSONB DEFAULT '[]'::jsonb, -- [{user_id, role, joined_at}]
  
  -- آخر رسالة
  last_message            TEXT,
  last_message_at         TIMESTAMPTZ,
  last_message_sender_id  UUID REFERENCES users(id),
  last_message_sender_role VARCHAR(20),
  
  -- عدادات غير مقروء (لكل دور)
  customer_unread_count   INTEGER DEFAULT 0,
  vendor_unread_count     INTEGER DEFAULT 0,
  admin_unread_count      INTEGER DEFAULT 0,
  driver_unread_count     INTEGER DEFAULT 0,
  
  -- الحالة
  is_active               BOOLEAN DEFAULT true,
  is_archived             BOOLEAN DEFAULT false,
  archived_by             UUID REFERENCES users(id),
  archived_at             TIMESTAMPTZ,
  
  -- ربط بالطلب (اختياري)
  order_id                UUID REFERENCES orders(id),
  
  -- البيانات الوصفية
  metadata                JSONB DEFAULT '{}'::jsonb,
  
  -- التواريخ
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  
  -- القيود
  CONSTRAINT chats_customer_vendor_unique UNIQUE(customer_id, vendor_id),
  CONSTRAINT chats_valid_type CHECK (chat_type IN ('direct', 'group', 'support'))
);

-- الفهارس
CREATE INDEX idx_chats_customer ON chats(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_chats_vendor ON chats(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX idx_chats_last_message ON chats(last_message_at DESC NULLS LAST);
CREATE INDEX idx_chats_type ON chats(chat_type);
CREATE INDEX idx_chats_active ON chats(is_active) WHERE is_active = true;
CREATE INDEX idx_chats_participants ON chats USING GIN(participants);
```

#### جدول MESSAGES (محسّن)
```sql
CREATE TABLE messages (
  -- الأعمدة الأساسية
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id           UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  
  -- المرسل
  sender_id         UUID NOT NULL REFERENCES users(id),
  sender_role       VARCHAR(20) NOT NULL, -- customer, vendor, admin, driver, staff
  
  -- المحتوى
  content           TEXT,
  message_type      VARCHAR(20) DEFAULT 'text', -- text, image, file, voice, system
  
  -- المرفقات
  attachments       JSONB DEFAULT '[]'::jsonb,
  -- [{url, type, name, size, thumbnail}]
  
  -- الرد على رسالة
  reply_to_id       UUID REFERENCES messages(id),
  
  -- القراءة
  is_read           BOOLEAN DEFAULT false,
  read_at           TIMESTAMPTZ,
  read_by           JSONB DEFAULT '[]'::jsonb, -- [{user_id, read_at}] للمجموعات
  
  -- التعديل
  is_edited         BOOLEAN DEFAULT false,
  edited_at         TIMESTAMPTZ,
  edit_history      JSONB DEFAULT '[]'::jsonb, -- [{content, edited_at}]
  
  -- الحذف
  is_deleted        BOOLEAN DEFAULT false,
  deleted_at        TIMESTAMPTZ,
  deleted_by        UUID REFERENCES users(id),
  
  -- الإبلاغ
  is_reported       BOOLEAN DEFAULT false,
  report_reason     TEXT,
  reported_by       UUID REFERENCES users(id),
  reported_at       TIMESTAMPTZ,
  
  -- البيانات الوصفية
  metadata          JSONB DEFAULT '{}'::jsonb,
  
  -- التواريخ
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  
  -- القيود
  CONSTRAINT messages_valid_role CHECK (sender_role IN ('customer', 'vendor', 'restaurant', 'admin', 'driver', 'staff')),
  CONSTRAINT messages_valid_type CHECK (message_type IN ('text', 'image', 'file', 'voice', 'video', 'system'))
);

-- الفهارس
CREATE INDEX idx_messages_chat ON messages(chat_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(chat_id, is_read) WHERE is_read = false;
CREATE INDEX idx_messages_attachments ON messages USING GIN(attachments) WHERE attachments != '[]'::jsonb;
```

---

### 🔧 Functions & Triggers

#### 1. Trigger: تحديث last_message
```sql
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    last_message_sender_id = NEW.sender_id,
    last_message_sender_role = NEW.sender_role,
    updated_at = NOW()
  WHERE id = NEW.chat_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER messages_update_chat
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_last_message();
```

#### 2. Trigger: زيادة unread_count
```sql
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
DECLARE
  chat_record RECORD;
BEGIN
  SELECT * INTO chat_record FROM chats WHERE id = NEW.chat_id;
  
  -- زيادة العداد للطرف الآخر فقط
  IF NEW.sender_role = 'customer' THEN
    UPDATE chats SET vendor_unread_count = vendor_unread_count + 1
    WHERE id = NEW.chat_id;
  ELSIF NEW.sender_role IN ('vendor', 'restaurant') THEN
    UPDATE chats SET customer_unread_count = customer_unread_count + 1
    WHERE id = NEW.chat_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER messages_increment_unread
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION increment_unread_count();
```

#### 3. Function: إنشاء محادثة
```sql
CREATE OR REPLACE FUNCTION create_or_get_chat(
  p_customer_id UUID,
  p_vendor_id UUID,
  p_order_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_chat_id UUID;
BEGIN
  -- البحث عن محادثة موجودة
  SELECT id INTO v_chat_id
  FROM chats
  WHERE customer_id = p_customer_id
    AND vendor_id = p_vendor_id
  LIMIT 1;
  
  -- إنشاء محادثة جديدة إذا لم توجد
  IF v_chat_id IS NULL THEN
    INSERT INTO chats (customer_id, vendor_id, order_id)
    VALUES (p_customer_id, p_vendor_id, p_order_id)
    RETURNING id INTO v_chat_id;
  END IF;
  
  RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 🔒 السياسات الجديدة (RLS)

#### سياسات CHATS
```sql
-- 🔐 Enable RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- 📖 SELECT: رؤية المحادثات
CREATE POLICY "Users can view their chats"
ON chats FOR SELECT
USING (
  -- العميل
  customer_id = auth.uid()
  OR
  -- البائع/المطعم
  vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  OR
  -- المساعد
  vendor_id IN (
    SELECT v.id FROM vendors v
    JOIN vendor_staff vs ON vs.vendor_id = v.id
    WHERE vs.user_id = auth.uid() AND vs.is_active = true
  )
  OR
  -- السائق (للطلبات المرتبطة)
  id IN (
    SELECT c.id FROM chats c
    JOIN orders o ON o.id = c.order_id
    WHERE o.driver_id = auth.uid()
  )
  OR
  -- المدير (يرى كل شيء)
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ✍️ INSERT: إنشاء محادثات
CREATE POLICY "Users can create chats"
ON chats FOR INSERT
WITH CHECK (
  -- العميل فقط
  customer_id = auth.uid()
  OR
  -- المدير
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 🔄 UPDATE: تحديث المحادثات
CREATE POLICY "Users can update their chats"
ON chats FOR UPDATE
USING (
  customer_id = auth.uid()
  OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 🗑️ DELETE: حذف المحادثات (المدير فقط)
CREATE POLICY "Admins can delete chats"
ON chats FOR DELETE
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
```

#### سياسات MESSAGES
```sql
-- 🔐 Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 📖 SELECT: رؤية الرسائل
CREATE POLICY "Users can view chat messages"
ON messages FOR SELECT
USING (
  chat_id IN (
    SELECT id FROM chats
    WHERE 
      customer_id = auth.uid()
      OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
      OR vendor_id IN (
        SELECT v.id FROM vendors v
        JOIN vendor_staff vs ON vs.vendor_id = v.id
        WHERE vs.user_id = auth.uid()
      )
      OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'driver'))
  )
);

-- ✍️ INSERT: إرسال رسائل
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND
  chat_id IN (
    SELECT id FROM chats
    WHERE customer_id = auth.uid() OR vendor_id IN (...)
  )
);

-- 🔄 UPDATE: تعديل الرسائل (المرسل فقط)
CREATE POLICY "Users can edit their messages"
ON messages FOR UPDATE
USING (
  sender_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 🗑️ DELETE: حذف الرسائل (المرسل + المدير)
CREATE POLICY "Users can delete their messages"
ON messages FOR DELETE
USING (
  sender_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
```

---

## 9. خطة التنفيذ 📋

### المرحلة 1: إصلاح قاعدة البيانات (يومان)

#### اليوم الأول: تنظيف وإصلاح
```sql
✅ إزالة أعمدة message و read من chats
✅ إضافة الأعمدة المفقودة في chats
✅ إضافة الأعمدة المفقودة في messages
✅ تحديث Foreign Keys
✅ إضافة Constraints
```

#### اليوم الثاني: Functions & Triggers
```sql
✅ إنشاء trigger لـ last_message
✅ إنشاء trigger لـ unread_count
✅ إنشاء trigger لـ updated_at
✅ إنشاء function لـ create_or_get_chat
✅ اختبار جميع الـ Triggers
```

---

### المرحلة 2: تحديث السياسات (يوم واحد)

```sql
✅ حذف السياسات المكررة
✅ إنشاء السياسات الجديدة لجميع الأدوار
✅ إضافة DELETE policies
✅ إضافة UPDATE policy للرسائل
✅ اختبار السياسات لكل دور
```

---

### المرحلة 3: تحديث الكود (3 أيام)

#### اليوم الأول: ChatsContext
```typescript
✅ إعادة هيكلة fetchChats
✅ توحيد منطق الأدوار
✅ إصلاح createOrGetChat لجميع الأدوار
✅ تحديث sendMessage لإضافة sender_role
```

#### اليوم الثاني: FloatingChatWidget + Page
```typescript
✅ إضافة دعم للمرفقات
✅ إضافة Emoji Picker
✅ تحسين UX على الموبايل
✅ إضافة Typing Indicators
```

#### اليوم الثالث: ميزات جديدة
```typescript
✅ Online/Offline status
✅ Reply to message
✅ Edit message
✅ Delete message
✅ Image preview
```

---

### المرحلة 4: دعم جميع الأدوار (يومان)

#### Admin Dashboard
```typescript
✅ صفحة لرؤية جميع المحادثات
✅ إحصائيات
✅ إدارة الرسائل المبلغ عنها
```

#### Driver Chat
```typescript
✅ دردشة مع العميل
✅ دردشة مع المطعم
✅ ربط بالطلب
```

#### Staff Support
```typescript
✅ مساعدي البائع يمكنهم الرد
✅ مساعدي المطعم يمكنهم الرد
✅ عرض من رد على الرسالة
```

---

### المرحلة 5: الإشعارات (يوم واحد)

```typescript
✅ Push notifications setup
✅ Email notifications
✅ In-app badge
✅ Sound notifications
```

---

### المرحلة 6: الاختبار والتحسين (يومان)

```
✅ اختبار جميع الأدوار
✅ اختبار السياسات
✅ اختبار الأداء
✅ اختبار على Mobile
✅ إصلاح الباجات
✅ تحسين الأداء
```

---

## 📊 الخلاصة

### الوضع الحالي
```
❌ نظام بسيط جداً
❌ يدعم Customer ↔ Vendor فقط
❌ بنية قاعدة بيانات ناقصة
❌ لا توجد Functions/Triggers
❌ سياسات محدودة
❌ 0 رسائل فعلية
```

### بعد التطوير
```
✅ نظام دردشة احترافي عالمي
✅ دعم 7 أدوار (Admin, Customer, Vendor, Restaurant, Driver, Staff)
✅ بنية قاعدة بيانات متكاملة
✅ Functions & Triggers تلقائية
✅ سياسات أمان شاملة
✅ ميزات متقدمة (مرفقات، ردود، تعديل، حذف)
✅ Real-time بالكامل
✅ إشعارات متعددة
✅ UX/UI احترافي
```

### المدة الزمنية
```
📅 إجمالي: 10 أيام عمل (أسبوعان)
```

### الأولوية الأولى
```
1️⃣ إصلاح قاعدة البيانات
2️⃣ Functions & Triggers
3️⃣ تحديث السياسات
4️⃣ دعم جميع الأدوار
5️⃣ ميزات متقدمة
```

---

## 🎯 الخطوة التالية

**هل تريد أن أبدأ بتنفيذ المرحلة الأولى (إصلاح قاعدة البيانات)؟**

سأقوم بإنشاء:
1. ✅ SQL script لتحديث جدول chats
2. ✅ SQL script لتحديث جدول messages
3. ✅ SQL script للـ Functions & Triggers
4. ✅ SQL script للسياسات الجديدة

---

**📝 ملاحظة:** هذا التقرير يحتوي على تحليل شامل وخطة عمل كاملة. احفظه للرجوع إليه!

---

**التاريخ:** 2026-01-06  
**الإصدار:** 1.0  
**الحالة:** جاهز للتنفيذ
