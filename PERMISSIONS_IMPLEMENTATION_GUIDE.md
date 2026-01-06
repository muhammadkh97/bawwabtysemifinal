# 🎯 دليل تطبيق نظام الصلاحيات على الصفحات

## ✅ ما تم إنجازه

### 1. **FuturisticSidebar** - فلترة القائمة الجانبية
- ✅ إضافة `requiredPermission` لكل عنصر في القائمة
- ✅ فلترة العناصر تلقائياً حسب صلاحيات المساعد
- ✅ البائع الأصلي يرى جميع العناصر

### 2. **PermissionGuard** - مكون حماية جديد
- ✅ حماية المحتوى/الصفحات بناءً على الصلاحيات
- ✅ رسالة تلقائية عند عدم وجود صلاحية
- ✅ إمكانية إعادة التوجيه التلقائي

### 3. **صفحة المنتجات** - مثال تطبيقي
- ✅ حماية كاملة للصفحة بصلاحية `manage_products`
- ✅ إعادة توجيه للوحة التحكم الرئيسية عند عدم وجود الصلاحية

---

## 📋 مخطط الصلاحيات والصفحات

| الصفحة | الصلاحية المطلوبة | الحالة |
|--------|-------------------|---------|
| لوحة التحكم | - | ✅ متاح للجميع |
| المنتجات | `manage_products` | ✅ محمي |
| الطلبات | `view_orders` | ⏳ قريباً |
| الإحصائيات | `view_analytics` | ⏳ قريباً |
| الكوبونات | `manage_marketing` | ⏳ قريباً |
| الإعدادات | `manage_settings` | ⏳ قريباً |
| المساعدين | `manage_staff` | ✅ محمي |

---

## 🔧 كيفية حماية صفحة جديدة

### الطريقة 1: حماية الصفحة كاملة

```typescript
import PermissionGuard from '@/components/PermissionGuard';

export default function MyPage() {
  return (
    <PermissionGuard 
      requiredPermission="manage_products"
      redirectTo="/dashboard/vendor"
    >
      {/* محتوى الصفحة */}
    </PermissionGuard>
  );
}
```

### الطريقة 2: حماية جزء من الصفحة

```typescript
import PermissionGuard from '@/components/PermissionGuard';

export default function MyPage() {
  return (
    <div>
      <h1>صفحة عامة</h1>
      
      <PermissionGuard requiredPermission="manage_products">
        <button>حذف المنتج</button>
      </PermissionGuard>
    </div>
  );
}
```

### الطريقة 3: التحقق داخل الكود

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';

export default function MyPage() {
  const { isVendorStaff, staffPermissions } = useAuth();
  const canDelete = !isVendorStaff || hasPermission(staffPermissions, 'manage_products');

  return (
    <div>
      {canDelete && <button>حذف</button>}
    </div>
  );
}
```

---

## 📝 الخطوات التالية لحماية باقي الصفحات

### 1. صفحة الطلبات (`app/dashboard/vendor/orders/page.tsx`)

```typescript
<PermissionGuard requiredPermission="view_orders" redirectTo="/dashboard/vendor">
  {/* محتوى الصفحة */}
</PermissionGuard>
```

### 2. صفحة الإحصائيات (`app/dashboard/vendor/analytics/page.tsx`)

```typescript
<PermissionGuard requiredPermission="view_analytics" redirectTo="/dashboard/vendor">
  {/* محتوى الصفحة */}
</PermissionGuard>
```

### 3. صفحة الكوبونات (`app/dashboard/vendor/promotions/page.tsx`)

```typescript
<PermissionGuard requiredPermission="manage_marketing" redirectTo="/dashboard/vendor">
  {/* محتوى الصفحة */}
</PermissionGuard>
```

### 4. صفحة الإعدادات (`app/dashboard/vendor/settings/page.tsx`)

```typescript
<PermissionGuard requiredPermission="manage_settings" redirectTo="/dashboard/vendor">
  {/* محتوى الصفحة */}
</PermissionGuard>
```

---

## 🎨 مثال: حماية أزرار داخل الصفحة

### قبل:
```typescript
<button onClick={handleDelete}>حذف المنتج</button>
<button onClick={handleEdit}>تعديل</button>
```

### بعد:
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';

const { isVendorStaff, staffPermissions } = useAuth();
const canManage = !isVendorStaff || hasPermission(staffPermissions, 'manage_products');

{canManage && (
  <>
    <button onClick={handleDelete}>حذف المنتج</button>
    <button onClick={handleEdit}>تعديل</button>
  </>
)}
```

---

## 🧪 اختبار النظام

### سيناريو 1: مساعد بصلاحيات محدودة
**الصلاحيات:** `["view_orders", "manage_products"]`

**النتيجة المتوقعة:**
- ✅ يظهر في Sidebar: لوحة التحكم، المنتجات، الطلبات، المحفظة، التقييمات، الرسائل، متجري
- ❌ يختفي من Sidebar: الإحصائيات، الكوبونات، المساعدين، الإعدادات
- ✅ يمكنه دخول صفحة المنتجات
- ✅ يمكنه دخول صفحة الطلبات
- ❌ عند محاولة دخول `/dashboard/vendor/analytics` → رسالة "صلاحية مطلوبة"

### سيناريو 2: بائع أصلي
**الحالة:** `isVendorStaff = false`

**النتيجة المتوقعة:**
- ✅ يظهر جميع عناصر Sidebar
- ✅ يمكنه دخول جميع الصفحات
- ✅ لا توجد قيود على أي شيء

---

## ⚡ ميزات إضافية

### رسالة مخصصة عند عدم وجود صلاحية

```typescript
<PermissionGuard 
  requiredPermission="manage_products"
  fallback={
    <div className="alert warning">
      <p>عذراً، أنت بحاجة لصلاحية "إدارة المنتجات" للوصول إلى هذه الميزة.</p>
    </div>
  }
>
  {/* محتوى */}
</PermissionGuard>
```

### التحقق من أكثر من صلاحية

```typescript
// يحتاج ANY من الصلاحيات
<PermissionGuard requiredPermissions={['view_orders', 'manage_orders']}>
  {/* محتوى */}
</PermissionGuard>

// يحتاج ALL الصلاحيات
<PermissionGuard 
  requiredPermissions={['manage_products', 'view_analytics']} 
  requireAll={true}
>
  {/* محتوى */}
</PermissionGuard>
```

---

**تاريخ التحديث:** 2026-01-06  
**الحالة:** نظام الصلاحيات مُفعَّل ويعمل ✅
