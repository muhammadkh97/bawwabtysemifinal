# 📖 دليل التطوير الكامل - بوابتي

## جدول المحتويات

1. [نظام الأدوار والصلاحيات](#نظام-الأدوار-والصلاحيات)
2. [بنية قاعدة البيانات](#بنية-قاعدة-البيانات)
3. [دوال API](#دوال-api)
4. [نظام المصادقة](#نظام-المصادقة)
5. [لوحات التحكم](#لوحات-التحكم)
6. [سير العمل](#سير-العمل)

---

## نظام الأدوار والصلاحيات

### 1. المدير (Admin)

#### الصفحات:
- `/admin` - لوحة التحكم الرئيسية
- `/admin/approvals` - الموافقات المعلقة
- `/admin/vendors` - إدارة البائعين
- `/admin/drivers` - إدارة المناديب
- `/admin/products` - إدارة المنتجات
- `/admin/orders` - إدارة الطلبات
- `/admin/finance` - الإدارة المالية
- `/admin/analytics` - التقارير والإحصائيات
- `/admin/disputes` - النزاعات والدعم
- `/admin/settings` - الإعدادات العامة

#### الصلاحيات:
```typescript
- approveVendor(vendorId, status, rejectionReason?)
- approveDriver(driverId, status, rejectionReason?)
- approveProduct(productId, status, rejectionReason?)
- resolveDispute(disputeId, resolution, refundAmount?)
- processPayout(payoutId, status, rejectionReason?)
- updatePlatformSettings(settings)
- getAllDisputes(status?)
- getPlatformAnalytics(period)
- getTopVendors(limit)
```

### 2. البائع (Vendor)

#### الصفحات:
- `/vendor` - نظرة عامة
- `/vendor/products` - إدارة المنتجات
- `/vendor/orders` - إدارة الطلبات
- `/vendor/analytics` - التحليلات والإحصائيات
- `/vendor/wallet` - المحفظة المالية
- `/vendor/reviews` - التقييمات والمراجعات
- `/vendor/marketing` - أدوات التسويق (كوبونات، عروض)
- `/vendor/store` - تخصيص المتجر
- `/vendor/settings` - الإعدادات

#### الصلاحيات:
```typescript
- createProduct(productData)
- updateProduct(productId, updates)
- deleteProduct(productId)
- getVendorProducts(vendorId, status?)
- getVendorOrders(vendorId, status?)
- updateOrderStatus(orderId, status)
- getVendorAnalytics(vendorId)
- requestPayout(amount)
```

### 3. مندوب التوصيل (Driver)

#### الصفحات:
- `/driver` - نظرة عامة
- `/driver/available` - الطلبات المتاحة للتوصيل
- `/driver/my-deliveries` - طلباتي الحالية
- `/driver/history` - سجل التوصيلات
- `/driver/wallet` - المحفظة
- `/driver/location` - إدارة الموقع
- `/driver/settings` - الإعدادات

#### الصلاحيات:
```typescript
- getAvailableDeliveries()
- acceptDelivery(orderId, driverId)
- updateDriverLocation(driverId, lat, lng)
- updateOrderStatus(orderId, status)
```

### 4. المشتري (Buyer)

#### الصفحات:
- `/` - الصفحة الرئيسية
- `/products` - جميع المنتجات
- `/products/[id]` - تفاصيل المنتج
- `/cart` - سلة التسوق
- `/checkout` - إتمام الشراء
- `/orders` - طلباتي
- `/orders/[id]` - تفاصيل الطلب
- `/profile` - الملف الشخصي

---

## بنية قاعدة البيانات

### الجداول الرئيسية

#### 1. users
```sql
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- name (VARCHAR)
- phone (VARCHAR)
- avatar (TEXT)
- role (VARCHAR) - admin|vendor|driver|buyer
- created_at, updated_at
```

#### 2. vendors
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- business_name, business_description
- logo, banner, address, city
- tax_id, bank_account
- identity_document (رابط الوثيقة)
- approval_status (pending|approved|rejected)
- rejection_reason
- approved_at
- rating (0-5)
- total_sales, commission, balance, total_earnings
```

#### 3. drivers
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- vehicle_type, vehicle_number
- driving_license, vehicle_document
- approval_status
- rating, total_deliveries
- balance
- current_location (JSONB: {lat, lng})
- is_available (BOOLEAN)
```

#### 4. products
```sql
- id (UUID, PK)
- vendor_id (FK → vendors)
- category_id (FK → categories)
- name, description
- price, old_price
- sku, stock
- weight, dimensions (JSONB)
- image, images (TEXT[])
- status (draft|pending_review|published|rejected)
- rejection_reason
- featured, rating, review_count, sold_count
- created_at, updated_at, published_at
```

#### 5. orders
```sql
- id (UUID, PK)
- order_number (UNIQUE)
- buyer_id (FK → users)
- subtotal, shipping_fee, tax, discount, total
- status (pending|confirmed|preparing|ready_for_pickup|
         picked_up|in_transit|delivered|cancelled)
- payment_status (pending|paid|refunded|failed)
- payment_method
- shipping_address (JSONB)
- driver_id (FK → drivers)
- tracking_number
- notes, refund_amount
- created_at, updated_at, confirmed_at, delivered_at
```

#### 6. order_items
```sql
- id (UUID, PK)
- order_id (FK → orders)
- product_id (FK → products)
- variant_id (FK → product_variants)
- vendor_id (FK → vendors)
- quantity, price, subtotal
```

---

## دوال API

### المدير

```typescript
// lib/api.ts

// الموافقات
getPendingVendors()
approveVendor(vendorId, status, rejectionReason?)
getPendingDrivers()
approveDriver(driverId, status, rejectionReason?)
getPendingProducts()
approveProduct(productId, status, rejectionReason?)

// الإحصائيات
getPlatformAnalytics(period: 'today'|'week'|'month'|'year')
getTopVendors(limit: number)

// المالية
getPendingPayouts()
processPayout(payoutId, status, rejectionReason?)

// الإعدادات
updatePlatformSettings(settings)
getPlatformSettings()

// النزاعات
getAllDisputes(status?)
resolveDispute(disputeId, resolution, refundAmount?, resolvedBy?)
```

### البائع

```typescript
// المنتجات
createProduct(productData)
updateProduct(productId, updates)
deleteProduct(productId)
getVendorProducts(vendorId, status?)

// الطلبات
getVendorOrders(vendorId, status?)
updateOrderStatus(orderId, status)

// الإحصائيات
getVendorAnalytics(vendorId)
```

### السائق

```typescript
getAvailableDeliveries()
acceptDelivery(orderId, driverId)
updateDriverLocation(driverId, lat, lng)
```

---

## نظام المصادقة

### التسجيل

```typescript
// lib/auth.ts
import { signUp } from '@/lib/auth'

const { data, error } = await signUp(
  email,
  password,
  {
    name: 'محمد أحمد',
    phone: '+966500000000',
    role: 'vendor' // admin|vendor|driver|buyer
  }
)
```

### تسجيل الدخول

```typescript
import { signIn } from '@/lib/auth'

const { data, error } = await signIn(email, password)
```

### الحصول على المستخدم الحالي

```typescript
import { getCurrentUser } from '@/lib/auth'

const { user, error } = await getCurrentUser()
```

### التحقق من الصلاحيات

```typescript
import { checkUserRole } from '@/lib/auth'

const isAdmin = await checkUserRole('admin')
const isVendorOrAdmin = await checkUserRole(['admin', 'vendor'])
```

---

## لوحات التحكم

### المدير

```typescript
// app/admin/layout.tsx
import AdminSidebar from '@/components/AdminSidebar'

// القوائم الجانبية تشمل:
// - لوحة التحكم
// - الموافقات المعلقة (مع badge للعدد)
// - إدارة البائعين
// - إدارة المناديب
// - إدارة المنتجات
// - إدارة الطلبات
// - الإدارة المالية
// - التقارير والإحصائيات
// - النزاعات والدعم
// - الإعدادات العامة
```

### البائع

```typescript
// app/vendor/layout.tsx
import VendorSidebar from '@/components/VendorSidebar'

// القوائم الجانبية تشمل:
// - نظرة عامة
// - إدارة المنتجات
// - الطلبات (مع badge)
// - التحليلات والإحصائيات
// - المحفظة المالية
// - التقييمات والمراجعات
// - أدوات التسويق
// - الرسائل
// - متجري
// - الإعدادات
```

---

## سير العمل

### 1. تسجيل بائع جديد

```mermaid
1. البائع يملأ نموذج التسجيل مع الوثائق
   ↓
2. يتم إنشاء حساب بحالة "pending"
   ↓
3. المدير يستلم إشعار في صفحة الموافقات
   ↓
4. المدير يراجع الوثائق
   ↓
5. الموافقة أو الرفض مع السبب
   ↓
6. إرسال إشعار للبائع
   ↓
7. إذا تمت الموافقة، يمكن للبائع إضافة منتجات
```

### 2. إضافة منتج جديد

```mermaid
1. البائع يضيف منتج جديد
   ↓
2. المنتج يذهب لحالة "pending_review"
   ↓
3. المدير يستلم إشعار
   ↓
4. المدير يراجع المنتج
   ↓
5. الموافقة → status: "published"
   أو الرفض → status: "rejected" مع السبب
   ↓
6. إشعار للبائع بالقرار
```

### 3. معالجة طلب

```mermaid
1. المشتري يضع طلب → status: "pending"
   ↓
2. الدفع → payment_status: "paid", status: "confirmed"
   ↓
3. البائع يجهز الطلب → status: "preparing"
   ↓
4. البائع ينهي التجهيز → status: "ready_for_pickup"
   ↓
5. المندوب يرى الطلب في "الطلبات المتاحة"
   ↓
6. المندوب يقبل → status: "picked_up"
   ↓
7. في الطريق → status: "in_transit"
   ↓
8. التسليم → status: "delivered"
   ↓
9. تحديث رصيد البائع والمندوب
```

### 4. طلب سحب أرباح

```mermaid
1. البائع/المندوب يطلب سحب
   ↓
2. يتم إنشاء payout_request بحالة "pending"
   ↓
3. المدير يستلم إشعار
   ↓
4. المدير يراجع ويوافق أو يرفض
   ↓
5. إذا تمت الموافقة:
   - خصم المبلغ من الرصيد
   - إنشاء transaction
   - إشعار المستخدم
```

---

## النشر على Vercel

### 1. ربط المشروع

```bash
npm install -g vercel
vercel login
vercel
```

### 2. إعداد المتغيرات البيئية

في لوحة Vercel:
- Settings → Environment Variables
- أضف جميع المتغيرات من `.env.local`

### 3. النشر

```bash
vercel --prod
```

---

## الأمان

### Row Level Security (RLS)

- تم تفعيل RLS على جميع الجداول
- المستخدمون يمكنهم رؤية بياناتهم فقط
- البائعون يمكنهم إدارة منتجاتهم فقط
- المنتجات المنشورة مرئية للجميع

### المصادقة

- استخدام Supabase Auth
- تشفير كلمات المرور
- JWT tokens
- Refresh tokens

---

## الأداء

### التحسينات

1. **Indexes** - تم إضافة indexes على جميع الأعمدة المستخدمة في البحث
2. **Image Optimization** - استخدام Next.js Image component
3. **Caching** - استخدام React Server Components
4. **Lazy Loading** - تحميل المكونات عند الحاجة

---

## الخطوات التالية

1. إكمال صفحات لوحات التحكم
2. إضافة نظام الدفع (Stripe/PayPal)
3. نظام الإشعارات الفورية (Real-time)
4. تطبيق الموبايل (React Native)
5. نظام البحث المتقدم (Elasticsearch)
6. نظام التوصيات (AI-powered)

---

تم التحديث: ديسمبر 2024
