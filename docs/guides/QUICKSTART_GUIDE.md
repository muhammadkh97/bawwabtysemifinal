# 🚀 دليل البدء السريع - بوابتي

## 📌 المتطلبات

قبل البدء، تأكد من تثبيت:
- Node.js 18+ ([تحميل](https://nodejs.org/))
- npm أو yarn
- حساب Supabase ([إنشاء حساب](https://supabase.com/))

---

## ⚡ البدء السريع (5 دقائق)

### 1️⃣ التثبيت

```bash
# استنساخ المشروع
git clone <repository-url>
cd bawwabtyM

# تثبيت المكتبات
npm install
```

### 2️⃣ إعداد البيئة

```bash
# إنشاء ملف البيئة
cp .env.example .env.local
```

أضف مفاتيح Supabase في `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-key (اختياري للإشعارات)
```

### 3️⃣ إعداد قاعدة البيانات

في **Supabase SQL Editor**:

1. نفذ `supabase-schema.sql` (الجداول + Triggers)
2. نفذ `supabase-storage-setup.sql` (Storage + Policies)

### 4️⃣ التشغيل

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) 🎉

---

## 👥 الحسابات التجريبية

بعد إنشاء الحسابات، يمكنك تجربة:

### Admin
- **Email**: admin@bawabty.com
- **الصفحة**: `/dashboard/admin`
- **الصلاحيات**: إدارة كاملة

### Vendor (بائع)
- **Email**: vendor@bawabty.com
- **الصفحة**: `/dashboard/vendor`
- **الصلاحيات**: إدارة المنتجات والطلبات

### Driver (مندوب)
- **Email**: driver@bawabty.com
- **الصفحة**: `/dashboard/driver`
- **الصلاحيات**: استلام وتوصيل الطلبات

### Customer (عميل)
- **Email**: customer@bawabty.com
- **الصفحة**: `/`
- **الصلاحيات**: تصفح وشراء

---

## 🗺️ خريطة الموقع

### للعملاء
- `/` - الصفحة الرئيسية
- `/products` - المنتجات
- `/products/[id]` - تفاصيل المنتج
- `/wishlist` - قائمة الأمنيات
- `/orders/[id]` - تتبع الطلب (مع خريطة حية)
- `/chats` - الدردشة
- `/settings/notifications` - إعدادات الإشعارات

### للبائعين
- `/dashboard/vendor` - لوحة التحكم
- `/dashboard/vendor/products` - إدارة المنتجات
- `/dashboard/vendor/wallet` - المحفظة
- `/dashboard/vendor/coupons` - الكوبونات
- `/dashboard/vendor/analytics` - التحليلات

### للمناديب
- `/dashboard/driver` - لوحة التحكم (مع auto-assignment)

### للإدارة
- `/dashboard/admin` - لوحة التحكم
- `/dashboard/admin/approvals` - الموافقات
- `/dashboard/admin/disputes` - النزاعات
- `/dashboard/admin/financials` - التقارير المالية

### صفحات قانونية
- `/terms` - الشروط والأحكام
- `/privacy-policy` - سياسة الخصوصية

---

## 🎯 الميزات الرئيسية

### 1. إدارة المنتجات
```typescript
// رفع صور متعددة
<MultiImageUpload 
  onImagesChange={(files) => console.log(files)}
  maxImages={5}
/>
```

### 2. نظام التوصيل
```typescript
import { calculateShippingRate } from '@/lib/shipping';

const rate = calculateShippingRate(origin, destination, {
  weight: 2.5,
  isExpress: false
});
```

### 3. الإشعارات
```typescript
import { sendLocalNotification } from '@/lib/notifications';

sendLocalNotification({
  title: 'طلب جديد',
  body: 'لديك طلب رقم #1234'
});
```

### 4. Storage
```typescript
import { uploadFile } from '@/lib/storage';

const result = await uploadFile(file, {
  bucket: 'products',
  folder: 'vendor-123'
});
```

---

## 📱 Mobile Navigation

### Bottom Nav
يظهر تلقائياً على الشاشات الصغيرة (`md:hidden`):
- الرئيسية
- المنتجات
- السلة
- الحساب

### Hamburger Menu
قائمة جانبية منزلقة مع:
- جميع الصفحات
- Badges للعناصر الجديدة
- تصميم smooth

---

## 🎨 تخصيص التصميم

### الألوان

في `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    500: '#a855f7', // Purple
    600: '#9333ea'
  },
  secondary: {
    500: '#ec4899', // Pink
    600: '#db2777'
  }
}
```

### Animations

```css
/* في globals.css */
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
```

---

## 🗄️ استخدام قاعدة البيانات

### إضافة منتج

```typescript
const { data, error } = await supabase
  .from('products')
  .insert({
    vendor_id: userId,
    name: 'منتج جديد',
    price: 50,
    stock: 100
  });
```

### تحديث المخزون (يحدث تلقائياً عبر Trigger)

```sql
-- عند إنشاء order_item، ينقص المخزون تلقائياً
```

---

## 🔔 إعداد الإشعارات

### 1. توليد VAPID Keys

```bash
npx web-push generate-vapid-keys
```

### 2. إضافة المفاتيح

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
```

### 3. طلب الإذن

```typescript
import { requestNotificationPermission } from '@/lib/notifications';

const permission = await requestNotificationPermission();
```

---

## 🚚 اختبار التوصيل

### تفعيل المندوب

```typescript
// في /dashboard/driver
const [availabilityStatus, setAvailabilityStatus] = 
  useState<'available' | 'busy' | 'offline'>('offline');

// تغيير الحالة إلى 'available'
setAvailabilityStatus('available');
```

### تتبع الموقع

```typescript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    // حفظ في driver_locations
  }
);
```

---

## 💰 إعداد المحفظة

### للبائع

```sql
-- المحفظة تُنشأ تلقائياً عند التسجيل
-- يمكن طلب سحب:
INSERT INTO payouts (vendor_id, amount, status)
VALUES ('vendor-id', 500, 'pending');
```

### للمندوب

```sql
-- نفس النظام مع driver_id
```

---

## 🎟️ إنشاء كوبون

```typescript
// في /dashboard/vendor/coupons
const coupon = {
  code: generateRandomCode(), // XH7K2M9P
  discount_type: 'percentage',
  discount_value: 20,
  min_purchase: 50,
  valid_from: new Date(),
  valid_until: new Date(Date.now() + 30*24*60*60*1000)
};
```

---

## 📊 Analytics

### عرض الإحصائيات

```typescript
// في /dashboard/vendor/analytics
const stats = {
  totalSales: 15240.50,
  totalOrders: 342,
  avgOrderValue: 44.56,
  conversionRate: 3.2
};
```

---

## 🐛 حل المشاكل الشائعة

### خطأ في Supabase

```bash
# تحقق من الاتصال
curl https://your-project.supabase.co/rest/v1/

# تحقق من المفاتيح في .env.local
```

### الصور لا تُرفع

```typescript
// تأكد من Storage Policies
// نفذ supabase-storage-setup.sql
```

### الإشعارات لا تعمل

```typescript
// تأكد من تسجيل Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

---

## 📚 موارد إضافية

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

---

## 🤝 الدعم

للمساعدة:
- 📧 Email: support@bawabty.com
- 💬 Discord: [قريباً]
- 📖 Documentation: `/DOCUMENTATION.md`

---

## ✅ Checklist

قبل النشر، تأكد من:
- [ ] تم إعداد Supabase
- [ ] تم تنفيذ SQL files
- [ ] تم إضافة .env.local
- [ ] تم اختبار جميع الأدوار
- [ ] تم اختبار الإشعارات
- [ ] تم اختبار رفع الصور
- [ ] تم اختبار التوصيل
- [ ] تم مراجعة الصفحات القانونية

---

<div align="center">
  <h2>🎉 استمتع باستخدام بوابتي! 🎉</h2>
  <p>صُنع بـ ❤️ في الأردن 🇯🇴</p>
</div>
