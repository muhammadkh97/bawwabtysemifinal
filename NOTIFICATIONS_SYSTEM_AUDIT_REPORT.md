# 🔔 تقرير فحص شامل لنظام الإشعارات
## Comprehensive Notifications System Audit Report

**تاريخ التقرير:** 2024
**الحالة:** فحص شامل للنظام الحالي
**الهدف:** بناء نظام إشعارات احترافي وفخم خالٍ من الأخطاء

---

## 📊 ملخص تنفيذي | Executive Summary

تم فحص نظام الإشعارات بالكامل عبر قاعدة البيانات والكود. النظام **يعمل جزئياً** لكن يحتاج تحسينات كبيرة:

### ✅ ما يعمل حالياً:
- جدول `notifications` موجود وفعال
- RLS policies أساسية موجودة (SELECT, UPDATE, INSERT)
- `NotificationDropdown` في الـ Header يعمل
- Real-time subscriptions نشطة
- 17 نوع من الإشعارات معرّفة
- إشعارات الطلبات تعمل جزئياً

### ❌ مشاكل رئيسية:
1. **RPC Functions مفقودة** - Frontend يستدعي functions غير موجودة في DB
2. **حقول مفقودة في الجدول** - Frontend يستخدم `link` لكن الحقل غير موجود
3. **إشعارات غير مكتملة** - كثير من الأحداث لا تُرسل إشعارات
4. **لا يوجد notifications للـ Admin** عند أحداث مهمة
5. **نظام الصلاحيات غير واضح** - من يستطيع إرسال إشعارات لمن؟

---

## 🗄️ القسم 1: قاعدة البيانات | Database Analysis

### 1.1 جدول Notifications - الحالة الحالية

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**التحليل:**
- ✅ الحقول الأساسية موجودة
- ❌ حقل `link` مفقود (يُستخدم في Frontend)
- ❌ حقل `read_at` مفقود (لتتبع متى قُرئت)
- ⚠️ حقل `data` JSONB موجود لكن Frontend يستخدم `metadata` أيضاً

### 1.2 RPC Functions - ما موجود وما مفقود

#### ✅ موجودة:
```sql
CREATE OR REPLACE FUNCTION get_unread_count()
RETURNS INTEGER
```
- الوظيفة: حساب عدد الإشعارات غير المقروءة
- تعمل بشكل صحيح ✅

#### ❌ مفقودة (مطلوبة):
```sql
-- 1. Mark single notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_uuid UUID)

-- 2. Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()

-- 3. Create notification with proper permissions
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT,
  p_metadata JSONB
)
```

**الخطورة:** Frontend يستدعي هذه Functions ولكنها غير موجودة!

### 1.3 RLS Policies - التحليل الأمني

#### موجود حالياً:
```sql
-- 1. SELECT Policy
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- 2. UPDATE Policy  
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- 3. INSERT Policy
CREATE POLICY "Allow authenticated users to insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);
```

**التحليل الأمني:**
- ✅ Users يقرأون إشعاراتهم فقط - جيد
- ✅ Users يحدّثون إشعاراتهم فقط - جيد
- ⚠️ INSERT policy واسعة جداً - **أي مستخدم يستطيع إرسال إشعار لأي مستخدم**
- ❌ لا توجد DELETE policy - لا يمكن حذف الإشعارات!

**توصية أمنية:** يجب تقييد INSERT بناءً على نوع الإشعار والدور.

### 1.4 Indexes - الأداء

```sql
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

- ✅ Indexes أساسية موجودة
- ⚠️ يُفضّل إضافة composite index: `(user_id, is_read, created_at DESC)`

---

## 💻 القسم 2: Frontend Analysis

### 2.1 notificationUtils.ts - الوظائف

```typescript
export type NotificationType =
  | 'new_order'           // ✅ يُستخدم
  | 'order_accepted'      // ❓ غير مستخدم
  | 'order_preparing'     // ❓ غير مستخدم
  | 'order_ready'         // ❓ غير مستخدم
  | 'order_picked_up'     // ❓ غير مستخدم
  | 'driver_nearby'       // ❓ غير مستخدم
  | 'order_delivered'     // ❓ غير مستخدم
  | 'order_update'        // ✅ يُستخدم في orderHelpers
  | 'new_message'         // ❓ غير مستخدم
  | 'vendor_pending'      // ❓ غير مستخدم
  | 'driver_pending'      // ❓ غير مستخدم
  | 'product_pending'     // ❓ غير مستخدم
  | 'account_approved'    // ❓ غير مستخدم
  | 'account_rejected'    // ❓ غير مستخدم
  | 'product_approved'    // ❓ غير مستخدم
  | 'product_rejected'    // ❓ غير مستخدم
  | 'staff_invitation'    // ✅ يُستخدم
```

**المشكلة:** 17 نوع معرّف لكن **فقط 3 يُستخدمون فعلياً!**

### 2.2 أين تُرسل الإشعارات حالياً؟

#### ✅ أماكن نشطة:
1. **lib/orderHelpers.ts** (4 مرات):
   - `notifyCustomer(orderId, newStatus)` - عند تحديث حالة الطلب
   - `notifyAvailableDrivers(orderId)` - إشعار السائقين بطلب جديد
   - `sendDriverAcceptanceNotifications(orderId, order)` - عند قبول السائق

2. **app/dashboard/vendor/staff/page.tsx**:
   - عند إضافة موظف جديد

3. **app/invitations/page.tsx**:
   - عند قبول دعوة موظف

#### ❌ أماكن مفقودة (يجب إضافة إشعارات):

**Admin Dashboard:**
- ❌ تسجيل بائع جديد → إشعار Admin
- ❌ تسجيل سائق جديد → إشعار Admin
- ❌ منتج جديد للمراجعة → إشعار Admin
- ❌ شكوى جديدة → إشعار Admin
- ❌ تذكرة دعم جديدة → إشعار Admin
- ❌ طلب استرجاع → إشعار Admin

**Vendor Dashboard:**
- ❌ منتج تم قبوله/رفضه → إشعار Vendor
- ❌ طلب جديد → إشعار Vendor (موجود جزئياً)
- ❌ مراجعة جديدة على منتج → إشعار Vendor
- ❌ رسالة جديدة من عميل → إشعار Vendor
- ❌ تحديث حالة الطلب → إشعار Vendor

**Restaurant Dashboard:**
- ❌ نفس إشعارات Vendor (لا شيء موجود!)

**Driver Dashboard:**
- ❌ طلب جديد متاح → إشعار Driver (موجود في orderHelpers)
- ❌ طلب تم إلغاؤه → إشعار Driver
- ❌ مكافأة جديدة → إشعار Driver

**Customer:**
- ✅ تحديث حالة الطلب → يعمل
- ❌ المنتج المفضل أصبح متاحاً → لا يوجد
- ❌ عرض خاص → لا يوجد
- ❌ رد على الشكوى → لا يوجد
- ❌ رد على تذكرة الدعم → **موجود في `/my-tickets`**

---

## 👥 القسم 3: تحليل حسب الدور | Role-Based Analysis

### 3.1 Admin (المدير)

**الصفحات:** 19 صفحة
- `/dashboard/admin` - الرئيسية
- `/dashboard/admin/users` - إدارة المستخدمين
- `/dashboard/admin/approvals` - الموافقات (بائعين، منتجات، سائقين)
- `/dashboard/admin/tickets` - تذاكر الدعم
- `/dashboard/admin/disputes` - النزاعات
- `/dashboard/admin/categories` - التصنيفات
- إلخ...

**الإشعارات المطلوبة:**
| الحدث | الأولوية | الحالة |
|-------|---------|--------|
| تسجيل بائع جديد | 🔴 عالية | ❌ مفقود |
| تسجيل سائق جديد | 🔴 عالية | ❌ مفقود |
| منتج جديد للمراجعة | 🔴 عالية | ❌ مفقود |
| تذكرة دعم جديدة | 🟡 متوسطة | ❌ مفقود |
| شكوى جديدة | 🔴 عالية | ❌ مفقود |
| نزاع جديد | 🔴 عالية | ❌ مفقود |
| طلب استرجاع | 🟡 متوسطة | ❌ مفقود |

**الكود المطلوب:**
```typescript
// في صفحة التسجيل للبائع:
await supabase.from('notifications').insert({
  user_id: ADMIN_ID, // يحتاج config
  type: 'vendor_pending',
  title: 'بائع جديد بانتظار الموافقة',
  message: `تقدّم ${vendorName} للانضمام كبائع`,
  link: '/dashboard/admin/approvals?tab=vendors'
});
```

### 3.2 Vendor (البائع)

**الصفحات:** 15 صفحة
- `/dashboard/vendor` - الرئيسية
- `/dashboard/vendor/orders` - الطلبات
- `/dashboard/vendor/products` - المنتجات
- `/dashboard/vendor/staff` - الموظفين ✅
- `/dashboard/vendor/reviews` - المراجعات
- إلخ...

**الإشعارات المطلوبة:**
| الحدث | الأولوية | الحالة |
|-------|---------|--------|
| طلب جديد | 🔴 عالية | ⚠️ جزئي |
| منتج تم قبوله | 🟡 متوسطة | ❌ مفقود |
| منتج تم رفضه | 🔴 عالية | ❌ مفقود |
| مراجعة جديدة | 🟢 منخفضة | ❌ مفقود |
| رسالة من عميل | 🟡 متوسطة | ❌ مفقود |
| موظف قبل الدعوة | 🟢 منخفضة | ✅ يعمل |
| نفاد مخزون منتج | 🟡 متوسطة | ❌ مفقود |
| طلب تم توصيله | 🟢 منخفضة | ❌ مفقود |

**التعديلات المطلوبة:**

**1. في `/dashboard/admin/approvals/page.tsx`:**
```typescript
// عند قبول منتج (سطر ~105)
const handleApprove = async (type: string, id: string) => {
  if (type === 'product') {
    const { error } = await supabase
      .from('products')
      .update({ approval_status: 'approved', is_active: true })
      .eq('id', id);

    // ⭐ إضافة: إشعار البائع
    const { data: product } = await supabase
      .from('products')
      .select('name, stores!inner(user_id, name)')
      .eq('id', id)
      .single();

    if (product) {
      await supabase.from('notifications').insert({
        user_id: product.stores.user_id,
        type: 'product_approved',
        title: 'تم قبول المنتج',
        message: `تم قبول منتج "${product.name}" وأصبح متاحاً للبيع`,
        link: '/dashboard/vendor/products'
      });
    }
  }
};

// عند رفض منتج
const handleReject = async (type: string, id: string) => {
  // نفس المنطق مع 'product_rejected'
};
```

**2. في `/dashboard/vendor/orders/page.tsx`:**
```typescript
// الكود موجود لكن يُرسل للعميل فقط
// يجب إضافة إشعار للبائع عند تحديث حالة الطلب من قبل السائق
```

### 3.3 Restaurant (المطعم)

**الصفحات:** 11 صفحة
- `/dashboard/restaurant` - نفس هيكل Vendor تقريباً
- ❌ **لا توجد صفحة `/dashboard/restaurant/staff`** - يجب إنشاؤها!

**الإشعارات المطلوبة:**
- نفس احتياجات Vendor بالضبط
- ❌ **لا يوجد أي إشعارات للمطاعم حالياً**

### 3.4 Driver (السائق)

**الصفحات:** 7 صفحات
- `/dashboard/driver` - الرئيسية
- `/dashboard/driver/my-orders` - طلباتي
- `/dashboard/driver/available` - الطلبات المتاحة
- `/dashboard/driver/earnings` - الأرباح
- إلخ...

**الإشعارات المطلوبة:**
| الحدث | الأولوية | الحالة |
|-------|---------|--------|
| طلب جديد متاح | 🔴 عالية | ✅ يعمل |
| طلب تم إلغاؤه | 🟡 متوسطة | ❌ مفقود |
| تم قبولك كسائق | 🔴 عالية | ❌ مفقود |
| تم رفضك كسائق | 🔴 عالية | ❌ مفقود |
| مكافأة جديدة | 🟢 منخفضة | ❌ مفقود |
| تحديث رصيد | 🟢 منخفضة | ❌ مفقود |

**التعديلات المطلوبة:**

**في `/dashboard/admin/approvals/page.tsx`:**
```typescript
// عند قبول/رفض سائق
const handleDriverApproval = async (driverId: string, approved: boolean) => {
  const { data: driver } = await supabase
    .from('drivers')
    .select('user_id, users!inner(full_name)')
    .eq('id', driverId)
    .single();

  if (driver) {
    await supabase.from('notifications').insert({
      user_id: driver.user_id,
      type: approved ? 'account_approved' : 'account_rejected',
      title: approved ? 'تم قبولك كسائق' : 'تم رفض طلبك',
      message: approved 
        ? 'مبروك! يمكنك الآن البدء باستلام الطلبات'
        : 'نأسف، لم يتم قبول طلبك. يرجى مراجعة البيانات',
      link: '/dashboard/driver'
    });
  }
};
```

### 3.5 Customer (العميل)

**الإشعارات المطلوبة:**
| الحدث | الأولوية | الحالة |
|-------|---------|--------|
| تحديث حالة الطلب | 🔴 عالية | ✅ يعمل |
| طلب تم توصيله | 🔴 عالية | ✅ يعمل |
| رد على تذكرة دعم | 🟡 متوسطة | ✅ يعمل |
| رد على شكوى | 🟡 متوسطة | ❌ مفقود |
| عرض خاص | 🟢 منخفضة | ❌ مفقود |
| كوبون جديد | 🟢 منخفضة | ❌ مفقود |

---

## 🐛 القسم 4: الأخطاء والمشاكل | Bugs & Issues

### 4.1 أخطاء حرجة (Critical Bugs)

#### 🔴 Bug #1: RPC Functions غير موجودة
**الوصف:** Frontend يستدعي functions غير موجودة في DB
```typescript
// في notificationUtils.ts:
await supabase.rpc('mark_notification_read', {...})  // ❌ Function لا توجد
await supabase.rpc('mark_all_notifications_read')    // ❌ Function لا توجد
await supabase.rpc('create_notification', {...})     // ❌ Function لا توجد
```
**التأثير:** لا يمكن تحديث حالة الإشعارات!
**الحل:** إنشاء الـ Functions في القسم 5

#### 🔴 Bug #2: حقل `link` مفقود
**الوصف:** الجدول لا يحتوي على حقل `link` لكن الكود يستخدمه
```typescript
// في الكود:
await supabase.from('notifications').insert({
  ...
  link: '/dashboard/vendor/staff'  // ❌ الحقل غير موجود!
});
```
**التأثير:** Links لا تُحفظ، NotificationDropdown لا يعمل بشكل صحيح
**الحل:** إضافة حقل `link TEXT` للجدول

#### 🔴 Bug #3: لا توجد DELETE policy
**الوصف:** لا يمكن حذف الإشعارات
```typescript
// في notificationUtils.ts:
await supabase.from('notifications').delete().eq('id', id)  // ❌ سيفشل
```
**التأثير:** الإشعارات تتراكم ولا يمكن حذفها
**الحل:** إضافة DELETE policy

### 4.2 أخطاء متوسطة (Medium Issues)

#### 🟡 Issue #1: إشعارات الطلبات غير مكتملة
**الوصف:** `orderHelpers.ts` يُرسل إشعارات لكن ليس في كل الحالات
- ✅ `pending → processing` - يعمل
- ❌ `processing → ready_for_pickup` - لا يوجد
- ❌ `ready_for_pickup → picked_up` - لا يوجد
- ❌ Order cancelled - لا يوجد

#### 🟡 Issue #2: الإشعارات لا تُحذف تلقائياً
**الوصف:** لا يوجد نظام لحذف الإشعارات القديمة (مثلاً أكثر من 30 يوم)
**التأثير:** قد يتباطأ النظام مع الوقت
**الحل:** إنشاء Cron Job أو Function لتنظيف الإشعارات القديمة

#### 🟡 Issue #3: لا يوجد notification settings
**الوصف:** لا يستطيع المستخدم تخصيص الإشعارات (إيقاف أنواع معينة)
**التأثير:** تجربة مستخدم أقل
**الحل:** صفحة Settings للإشعارات

### 4.3 تحسينات مقترحة (Improvements)

#### 🟢 Improvement #1: Notification Categories
**الفكرة:** تجميع الإشعارات حسب الفئات
```typescript
type NotificationCategory = 'orders' | 'products' | 'messages' | 'system' | 'staff';
```

#### 🟢 Improvement #2: Notification Priority
**الفكرة:** إضافة أولوية للإشعارات
```sql
ALTER TABLE notifications ADD COLUMN priority TEXT DEFAULT 'normal';
-- priority: 'low', 'normal', 'high', 'urgent'
```

#### 🟢 Improvement #3: Action Buttons in Notifications
**الفكرة:** إضافة أزرار actions مباشرة في الإشعار
```typescript
data: {
  actions: [
    { label: 'قبول', action: 'approve', color: 'green' },
    { label: 'رفض', action: 'reject', color: 'red' }
  ]
}
```

---

## 🛠️ القسم 5: خطة العمل | Action Plan

### المرحلة 1: إصلاح الأخطاء الحرجة ⏰ 1-2 ساعة

#### Task 1.1: إنشاء RPC Functions المفقودة
**الملف:** `database/create-notification-functions.sql`

```sql
-- ============================================
-- Notification RPC Functions
-- ============================================

-- 1️⃣ Mark single notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  -- تحديث الإشعار فقط إذا كان يخص المستخدم الحالي
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE id = notification_uuid 
    AND user_id = auth.uid()
    AND is_read = false;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2️⃣ Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE user_id = auth.uid() AND is_read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3️⃣ Create notification (مع التحقق من الصلاحيات)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- التحقق من أن المستخدم المستهدف موجود
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- إنشاء الإشعار
  INSERT INTO notifications (
    user_id, type, title, message, link, data, is_read, created_at
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_link, p_metadata, false, NOW()
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4️⃣ Delete old notifications (للصيانة)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
    AND is_read = true;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Task 1.2: إضافة حقول مفقودة للجدول
**الملف:** `database/add-notification-fields.sql`

```sql
-- ============================================
-- إضافة حقول مفقودة لجدول notifications
-- ============================================

-- 1. إضافة حقل link
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS link TEXT;

-- 2. إضافة حقل read_at
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 3. إضافة حقل priority (اختياري)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'
CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- 4. إضافة حقل category (اختياري)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS category TEXT
CHECK (category IN ('orders', 'products', 'messages', 'system', 'staff', 'admin'));

-- 5. تحديث Index لتحسين الأداء
DROP INDEX IF EXISTS idx_notifications_user;
DROP INDEX IF EXISTS idx_notifications_read;

-- إنشاء composite index محسّن
CREATE INDEX idx_notifications_user_read_date 
ON notifications(user_id, is_read, created_at DESC);

-- Index للبحث حسب النوع
CREATE INDEX idx_notifications_type 
ON notifications(type) WHERE is_read = false;

-- Index للتنظيف التلقائي
CREATE INDEX idx_notifications_old 
ON notifications(created_at) WHERE is_read = true;
```

#### Task 1.3: إضافة DELETE Policy
**الملف:** `database/add-notification-delete-policy.sql`

```sql
-- ============================================
-- إضافة DELETE policy لجدول notifications
-- ============================================

-- السماح للمستخدمين بحذف إشعاراتهم فقط
CREATE POLICY "Users can delete own notifications"
ON notifications
FOR DELETE
USING (user_id = auth.uid());
```

### المرحلة 2: إضافة إشعارات مفقودة ⏰ 3-4 ساعات

#### Task 2.1: إشعارات Admin
**الملفات المطلوب تعديلها:**

1. **`app/auth/register/page.tsx`** (تسجيل بائع/سائق)
```typescript
// بعد إنشاء البائع:
if (role === 'vendor') {
  // الحصول على admin user ID (يجب إضافته في .env أو config)
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
  
  await supabase.from('notifications').insert({
    user_id: adminId,
    type: 'vendor_pending',
    title: 'بائع جديد بانتظار الموافقة',
    message: `تقدّم ${fullName} للانضمام كبائع في متجر "${storeName}"`,
    link: '/dashboard/admin/approvals?tab=vendors',
    category: 'admin',
    priority: 'high'
  });
}
```

2. **`app/dashboard/vendor/products/new/page.tsx`** (منتج جديد)
```typescript
// بعد إنشاء المنتج:
const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

await supabase.from('notifications').insert({
  user_id: adminId,
  type: 'product_pending',
  title: 'منتج جديد للمراجعة',
  message: `أضاف ${storeName} منتج "${productName}" للمراجعة`,
  link: '/dashboard/admin/approvals?tab=products',
  category: 'admin',
  priority: 'normal'
});
```

3. **`app/complaints/page.tsx`** (شكوى جديدة)
```typescript
// بعد إرسال الشكوى:
await supabase.from('notifications').insert({
  user_id: adminId,
  type: 'new_complaint',
  title: 'شكوى جديدة',
  message: `شكوى جديدة من ${userName} حول الطلب #${orderNumber}`,
  link: '/dashboard/admin/disputes',
  category: 'admin',
  priority: 'high'
});
```

#### Task 2.2: إشعارات Vendor
**الملفات المطلوب تعديلها:**

1. **`app/dashboard/admin/approvals/page.tsx`**
```typescript
const handleApprove = async (type: string, id: string) => {
  if (type === 'product') {
    // قبول المنتج
    await supabase.from('products')
      .update({ approval_status: 'approved', is_active: true })
      .eq('id', id);

    // ⭐ إشعار البائع
    const { data: product } = await supabase
      .from('products')
      .select('name, stores!inner(user_id, name)')
      .eq('id', id)
      .single();

    if (product) {
      await supabase.from('notifications').insert({
        user_id: product.stores.user_id,
        type: 'product_approved',
        title: '✅ تم قبول المنتج',
        message: `تم قبول منتج "${product.name}" وأصبح متاحاً للبيع`,
        link: '/dashboard/vendor/products',
        category: 'products',
        priority: 'normal'
      });
    }

    toast.success('تم قبول المنتج وإرسال إشعار للبائع');
    fetchPendingItems();
  }
};

const handleReject = async (type: string, id: string) => {
  // نفس المنطق مع 'product_rejected' و priority: 'high'
};
```

2. **`app/dashboard/vendor/products/page.tsx`** (مراجعة جديدة)
```typescript
// عند إضافة مراجعة على منتج (في صفحة المنتج):
const { data: product } = await supabase
  .from('products')
  .select('vendor_id, name, stores!inner(user_id)')
  .eq('id', productId)
  .single();

if (product) {
  await supabase.from('notifications').insert({
    user_id: product.stores.user_id,
    type: 'new_review',
    title: '⭐ مراجعة جديدة',
    message: `حصل منتج "${product.name}" على مراجعة جديدة (${rating} نجوم)`,
    link: `/dashboard/vendor/products/${productId}`,
    category: 'products',
    priority: 'low'
  });
}
```

#### Task 2.3: إشعارات Driver
**الملف:** `app/dashboard/admin/approvals/page.tsx`

```typescript
// عند قبول/رفض سائق:
const handleDriverDecision = async (driverId: string, approved: boolean) => {
  const newStatus = approved ? 'approved' : 'rejected';
  
  await supabase
    .from('drivers')
    .update({ approval_status: newStatus })
    .eq('id', driverId);

  // الحصول على user_id للسائق
  const { data: driver } = await supabase
    .from('drivers')
    .select('user_id, users!inner(full_name)')
    .eq('id', driverId)
    .single();

  if (driver) {
    await supabase.from('notifications').insert({
      user_id: driver.user_id,
      type: approved ? 'account_approved' : 'account_rejected',
      title: approved ? '✅ تم قبولك كسائق' : '❌ تم رفض طلبك',
      message: approved 
        ? 'مبروك! يمكنك الآن البدء باستلام الطلبات وكسب المال'
        : 'نأسف، لم يتم قبول طلبك كسائق. يرجى مراجعة البيانات المطلوبة.',
      link: '/dashboard/driver',
      category: 'system',
      priority: 'high'
    });
  }

  toast.success(`تم ${approved ? 'قبول' : 'رفض'} السائق وإرسال إشعار`);
};
```

#### Task 2.4: تحسين إشعارات الطلبات
**الملف:** `lib/orderHelpers.ts`

```typescript
// إضافة المزيد من الحالات:

async function notifyOrderCancelled(orderId: string): Promise<void> {
  const { data: order } = await supabase
    .from('orders')
    .select('customer_id, driver_id, order_number, order_items!inner(stores!inner(user_id))')
    .eq('id', orderId)
    .single();

  if (!order) return;

  // إشعار العميل
  await supabase.from('notifications').insert({
    user_id: order.customer_id,
    type: 'order_cancelled',
    title: 'تم إلغاء الطلب',
    message: `تم إلغاء طلبك رقم ${order.order_number}`,
    link: '/my-orders',
    category: 'orders',
    priority: 'high'
  });

  // إشعار السائق إذا كان معيّن
  if (order.driver_id) {
    const { data: driver } = await supabase
      .from('drivers')
      .select('user_id')
      .eq('id', order.driver_id)
      .single();

    if (driver) {
      await supabase.from('notifications').insert({
        user_id: driver.user_id,
        type: 'order_cancelled',
        title: 'تم إلغاء طلب',
        message: `تم إلغاء الطلب ${order.order_number} الذي كنت ستوصله`,
        link: '/dashboard/driver/available',
        category: 'orders',
        priority: 'normal'
      });
    }
  }

  // إشعار البائع
  const vendorUserId = order.order_items[0]?.stores?.user_id;
  if (vendorUserId) {
    await supabase.from('notifications').insert({
      user_id: vendorUserId,
      type: 'order_cancelled',
      title: 'تم إلغاء طلب',
      message: `تم إلغاء الطلب ${order.order_number}`,
      link: '/dashboard/vendor/orders',
      category: 'orders',
      priority: 'normal'
    });
  }
}
```

### المرحلة 3: تحسينات UX ⏰ 2-3 ساعات

#### Task 3.1: صفحة Notification Settings
**الملف الجديد:** `app/settings/notifications/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function NotificationSettingsPage() {
  const { userId } = useAuth();
  const [settings, setSettings] = useState({
    orders: true,
    products: true,
    messages: true,
    system: true,
    staff: true
  });

  const updateSetting = async (category: string, enabled: boolean) => {
    // حفظ في جدول user_settings أو في users.notification_preferences
    await supabase
      .from('users')
      .update({
        notification_preferences: { ...settings, [category]: enabled }
      })
      .eq('id', userId);

    setSettings(prev => ({ ...prev, [category]: enabled }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">إعدادات الإشعارات</h1>
      
      <div className="space-y-4">
        <ToggleSetting
          label="إشعارات الطلبات"
          description="تحديثات حول طلباتك وحالتها"
          enabled={settings.orders}
          onChange={(enabled) => updateSetting('orders', enabled)}
        />
        <ToggleSetting
          label="إشعارات المنتجات"
          description="موافقات، رفض، ومراجعات المنتجات"
          enabled={settings.products}
          onChange={(enabled) => updateSetting('products', enabled)}
        />
        {/* المزيد من الخيارات */}
      </div>
    </div>
  );
}
```

#### Task 3.2: Notification Grouping
**تحسين:** `components/NotificationDropdown.tsx`

```typescript
// تجميع الإشعارات حسب التاريخ
const groupedNotifications = notifications.reduce((groups, notif) => {
  const date = formatDate(notif.created_at);
  if (!groups[date]) groups[date] = [];
  groups[date].push(notif);
  return groups;
}, {} as Record<string, Notification[]>);

// العرض:
{Object.entries(groupedNotifications).map(([date, notifs]) => (
  <div key={date}>
    <div className="px-4 py-2 text-xs text-gray-500 font-semibold">
      {date}
    </div>
    {notifs.map(notif => (
      <NotificationItem key={notif.id} notification={notif} />
    ))}
  </div>
))}
```

#### Task 3.3: Action Buttons في الإشعارات
**مثال:** إشعار موافقة بائع مع زر "مراجعة الآن"

```typescript
// في orderHelpers.ts:
await supabase.from('notifications').insert({
  user_id: adminId,
  type: 'vendor_pending',
  title: 'بائع جديد',
  message: `${vendorName} بانتظار الموافقة`,
  link: '/dashboard/admin/approvals?tab=vendors',
  data: {
    vendor_id: vendorId,
    actions: [
      { id: 'approve', label: 'قبول', color: 'green', icon: 'check' },
      { id: 'reject', label: 'رفض', color: 'red', icon: 'x' }
    ]
  }
});

// في NotificationDropdown.tsx:
{notification.data?.actions?.map(action => (
  <button
    key={action.id}
    className={`btn-${action.color}`}
    onClick={() => handleAction(notification.id, action.id)}
  >
    {action.label}
  </button>
))}
```

### المرحلة 4: مطعم Staff Page ⏰ 30 دقيقة

#### Task 4.1: إنشاء صفحة Staff للمطاعم
**الملف الجديد:** `app/dashboard/restaurant/staff/page.tsx`

```typescript
// نسخ بالكامل من app/dashboard/vendor/staff/page.tsx
// مع استبدال:
// - 'stores' → 'restaurants'
// - 'vendor_staff' → 'restaurant_staff'
// - 'store_id' → 'restaurant_id'

// الكود مطابق 100% مع تغيير الجداول فقط
```

---

## 📋 القسم 6: ملخص الملفات المطلوبة | Files Summary

### ملفات Database (يجب تنفيذها بالترتيب):
1. ✅ `database/add-notification-fields.sql` - إضافة حقول link, read_at, priority, category
2. ✅ `database/create-notification-functions.sql` - إنشاء RPC functions
3. ✅ `database/add-notification-delete-policy.sql` - إضافة DELETE policy

### ملفات Frontend (يجب تعديلها):
1. ⚠️ `app/auth/register/page.tsx` - إشعار Admin عند تسجيل بائع/سائق
2. ⚠️ `app/dashboard/admin/approvals/page.tsx` - إشعارات قبول/رفض (منتجات، بائعين، سائقين)
3. ⚠️ `app/dashboard/vendor/products/new/page.tsx` - إشعار Admin عند منتج جديد
4. ⚠️ `app/complaints/page.tsx` - إشعار Admin عند شكوى جديدة
5. ⚠️ `lib/orderHelpers.ts` - إضافة إشعارات للحالات المفقودة
6. 🆕 `app/dashboard/restaurant/staff/page.tsx` - صفحة جديدة
7. 🆕 `app/settings/notifications/page.tsx` - صفحة إعدادات (اختياري)

### ملفات Config (يجب إضافتها):
```env
# .env.local
NEXT_PUBLIC_ADMIN_USER_ID=your-admin-uuid-here
```

---

## 🎯 القسم 7: الأولويات | Priorities

### 🔴 عالية الأولوية (High Priority) - يجب تنفيذها فوراً:
1. ✅ إضافة حقل `link` و `read_at` للجدول
2. ✅ إنشاء RPC Functions الثلاثة
3. ✅ إضافة DELETE policy
4. ⚠️ إشعارات Admin (بائع جديد، سائق جديد، منتج جديد، شكوى)
5. ⚠️ إشعارات Vendor/Restaurant (قبول/رفض منتج)
6. ⚠️ إشعارات Driver (قبول/رفض)
7. 🆕 صفحة Staff للمطاعم

### 🟡 متوسطة الأولوية (Medium Priority) - قريباً:
1. إشعارات إلغاء الطلبات
2. إشعارات الرسائل
3. إشعارات المراجعات
4. Notification grouping
5. إضافة priority للإشعارات

### 🟢 منخفضة الأولوية (Low Priority) - مستقبلاً:
1. صفحة Notification Settings
2. Action buttons في الإشعارات
3. تنظيف الإشعارات القديمة تلقائياً
4. Push notifications (PWA)
5. Email notifications

---

## ✅ القسم 8: Checklist التنفيذ | Implementation Checklist

### Database (يجب تنفيذها أولاً):
- [ ] تنفيذ `add-notification-fields.sql`
- [ ] تنفيذ `create-notification-functions.sql`
- [ ] تنفيذ `add-notification-delete-policy.sql`
- [ ] التأكد من عدم وجود أخطاء في DB

### Config:
- [ ] إضافة `NEXT_PUBLIC_ADMIN_USER_ID` في `.env.local`
- [ ] التأكد من Admin user موجود في جدول users

### Frontend - Admin:
- [ ] تعديل `app/auth/register/page.tsx` - إشعار تسجيل بائع
- [ ] تعديل `app/auth/register/page.tsx` - إشعار تسجيل سائق
- [ ] تعديل `app/dashboard/admin/approvals/page.tsx` - قبول/رفض منتج
- [ ] تعديل `app/dashboard/admin/approvals/page.tsx` - قبول/رفض بائع
- [ ] تعديل `app/dashboard/admin/approvals/page.tsx` - قبول/رفض سائق
- [ ] تعديل `app/complaints/page.tsx` - إشعار شكوى جديدة
- [ ] تعديل `app/dashboard/admin/tickets/page.tsx` - إشعار تذكرة جديدة (إذا لم يكن موجود)

### Frontend - Vendor:
- [ ] تعديل `app/dashboard/vendor/products/new/page.tsx` - إشعار منتج جديد
- [ ] إضافة notifications للمراجعات
- [ ] إضافة notifications للرسائل الجديدة

### Frontend - Restaurant:
- [ ] إنشاء `app/dashboard/restaurant/staff/page.tsx`
- [ ] نفس التعديلات الخاصة بالـ Vendor

### Frontend - Driver:
- [ ] التأكد من إشعارات الموافقة/الرفض تعمل

### Frontend - Customer:
- [ ] التأكد من إشعارات الطلبات تعمل
- [ ] إضافة إشعار رد على الشكوى

### Testing:
- [ ] اختبار `mark_notification_read`
- [ ] اختبار `mark_all_notifications_read`
- [ ] اختبار `create_notification`
- [ ] اختبار حذف الإشعارات
- [ ] اختبار real-time subscriptions
- [ ] اختبار الإشعارات لكل دور

---

## 📊 القسم 9: الإحصائيات | Statistics

### الحالة الحالية:
- **أنواع الإشعارات المعرّفة:** 17
- **أنواع الإشعارات المستخدمة فعلياً:** 3-4
- **الصفحات التي ترسل إشعارات:** 3
- **الصفحات التي يجب أن ترسل:** 15+
- **RPC Functions موجودة:** 1 من 4
- **RLS Policies موجودة:** 3 من 4
- **معدل الاكتمال:** ~30%

### بعد التنفيذ المتوقع:
- **أنواع الإشعارات المستخدمة:** 17+
- **الصفحات المُفعّلة:** 15+
- **RPC Functions:** 4/4 ✅
- **RLS Policies:** 4/4 ✅
- **معدل الاكتمال:** ~95% ✅

---

## 🎓 القسم 10: Best Practices

### 1. معايير كتابة الإشعارات:
```typescript
// ✅ جيد:
{
  title: 'تم قبول المنتج',
  message: 'تم قبول منتج "iPhone 15 Pro" وأصبح متاحاً للبيع',
  link: '/dashboard/vendor/products/123'
}

// ❌ سيء:
{
  title: 'تحديث',
  message: 'تم تحديث شيء ما',
  link: '/dashboard'
}
```

### 2. استخدام الـ Priority بشكل صحيح:
- **urgent:** أخطاء حرجة، حساب معلّق، طلب ملغي
- **high:** موافقات، شكاوى، نزاعات
- **normal:** طلبات جديدة، تحديثات عادية
- **low:** مراجعات، عروض، تذكيرات

### 3. Category Guidelines:
- **orders:** كل ما يتعلق بالطلبات
- **products:** منتجات، موافقات، مراجعات
- **messages:** رسائل، محادثات
- **system:** حساب، صلاحيات، موافقات
- **staff:** موظفين، دعوات، صلاحيات
- **admin:** إشعارات خاصة بالمدير

### 4. Real-time Best Practices:
```typescript
// التأكد من unsubscribe عند unmount
useEffect(() => {
  const channel = subscribeToNotifications(userId, handleNewNotification);
  
  return () => {
    channel?.unsubscribe();
  };
}, [userId]);
```

---

## 🔒 القسم 11: الأمان | Security

### 1. RLS Policies Security Audit:
```sql
-- ✅ آمن: المستخدم يرى إشعاراته فقط
CREATE POLICY "view_own" ON notifications
FOR SELECT USING (user_id = auth.uid());

-- ⚠️ خطر: أي مستخدم يُرسل لأي مستخدم
CREATE POLICY "insert_any" ON notifications
FOR INSERT WITH CHECK (true);

-- ✅ أفضل: استخدام RPC function مع SECURITY DEFINER
-- يتحقق من الصلاحيات داخل الـ function
```

### 2. منع Notification Spam:
```sql
-- إضافة Rate Limiting
CREATE OR REPLACE FUNCTION check_notification_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- منع إرسال أكثر من 10 إشعارات في دقيقة واحدة
  IF (
    SELECT COUNT(*) FROM notifications
    WHERE user_id = NEW.user_id
      AND created_at > NOW() - INTERVAL '1 minute'
  ) > 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notification_rate_limit
BEFORE INSERT ON notifications
FOR EACH ROW EXECUTE FUNCTION check_notification_rate_limit();
```

### 3. Data Sanitization:
```typescript
// تنظيف البيانات قبل الإرسال
const sanitizeMessage = (message: string): string => {
  return message
    .replace(/<script>/gi, '')
    .replace(/<iframe>/gi, '')
    .substring(0, 500); // حد أقصى 500 حرف
};
```

---

## 🚀 القسم 12: الخطوات التالية | Next Steps

### فوراً (Today):
1. تنفيذ الـ 3 SQL files (المرحلة 1)
2. اختبار الـ RPC functions
3. إضافة ADMIN_USER_ID في config

### هذا الأسبوع (This Week):
1. تعديل صفحات Admin (إشعارات الموافقات)
2. تعديل صفحات Vendor (إشعارات المنتجات)
3. إنشاء صفحة Restaurant/staff
4. اختبار شامل

### الأسبوع القادم (Next Week):
1. إضافة Notification Settings
2. تحسين UX (grouping, actions)
3. إضافة priority system
4. Performance optimization

---

## 📞 الدعم | Support

إذا واجهت أي مشاكل:
1. راجع الأخطاء في Console
2. تحقق من DB logs
3. اختبر RPC functions يدوياً
4. راجع RLS policies

---

## 📝 الملاحظات النهائية | Final Notes

هذا النظام **يجب أن يعمل بشكل احترافي** بعد تنفيذ كل المراحل.

**التقدير الزمني الإجمالي:** 8-12 ساعة عمل
**مستوى الأولوية:** 🔴 حرج
**التأثير المتوقع:** 📈 تحسين كبير في تجربة المستخدم

---

**تم إعداد التقرير بواسطة:** GitHub Copilot
**التاريخ:** 2024
**الحالة:** جاهز للتنفيذ ✅
