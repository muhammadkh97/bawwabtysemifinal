# 🔐 دليل نظام صلاحيات المساعدين

## 📋 نظرة عامة

تم إصلاح نظام المساعدين ليعمل بشكل صحيح:
- ✅ المساعد يرى **لوحة التحكم** في الهيدر
- ✅ المساعد يصل إلى لوحة تحكم البائع **بصلاحيات محدودة**
- ✅ المساعد **لا يمكنه** إدارة المساعدين الآخرين (إلا إذا أعطيت له صلاحية `manage_staff`)

---

## 🔄 التغييرات المطبقة

### 1. **AuthContext** (`contexts/AuthContext.tsx`)

#### متغيرات جديدة:
```typescript
interface AuthContextType {
  user: User | null;
  userId: string | null;
  userRole: string | null;          // يبقى 'customer' للمساعدين
  userFullName: string | null;
  loading: boolean;
  isVendorStaff: boolean;           // ✨ جديد
  isRestaurantStaff: boolean;       // ✨ جديد
  staffVendorId: string | null;     // ✨ جديد
  staffRestaurantId: string | null; // ✨ جديد
  staffPermissions: string[];       // ✨ جديد
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}
```

#### المنطق:
- المساعد يبقى `userRole = 'customer'` في قاعدة البيانات
- ولكن يتم تعيين `isVendorStaff = true`
- مع حفظ `staffVendorId` و `staffPermissions`
- هذا يسمح بالتمييز بين:
  - ✅ **بائع أصلي**: `userRole = 'vendor'` && `isVendorStaff = false`
  - ✅ **مساعد بائع**: `userRole = 'customer'` && `isVendorStaff = true`

---

### 2. **Header** (`components/Header.tsx`)

#### شرط عرض لوحة التحكم:
```typescript
{(userRole && userRole !== 'customer') || isVendorStaff || isRestaurantStaff ? (
  <Link href={getDashboardUrl()}>
    لوحة التحكم
  </Link>
) : null}
```

#### تحديد URL لوحة التحكم:
```typescript
const getDashboardUrl = () => {
  if (isVendorStaff) return '/dashboard/vendor';
  if (isRestaurantStaff) return '/dashboard/restaurant';
  
  switch (userRole) {
    case 'admin': return '/dashboard/admin';
    case 'vendor': return '/dashboard/vendor';
    case 'driver': return '/dashboard/driver';
    case 'restaurant': return '/dashboard/restaurant';
    default: return '/auth/login';
  }
};
```

---

### 3. **دالة التحقق من الصلاحيات** (`lib/permissions.ts`)

#### وظائف مساعدة:
```typescript
// فحص صلاحية واحدة
hasPermission(userPermissions, 'manage_staff')

// فحص أي صلاحية من قائمة
hasAnyPermission(userPermissions, ['view_orders', 'manage_orders'])

// فحص جميع الصلاحيات
hasAllPermissions(userPermissions, ['manage_products', 'view_analytics'])

// التحقق من أنه بائع أصلي
isOriginalVendor(userRole, isVendorStaff)
```

---

### 4. **صفحة المساعدين** (`app/dashboard/vendor/staff/page.tsx`)

#### استخدام AuthContext:
```typescript
const { user, isVendorStaff, staffPermissions, staffVendorId } = useAuth();
```

#### التحقق من الصلاحية:
```typescript
const canManageStaff = !isVendorStaff || hasPermission(staffPermissions, 'manage_staff');
```

#### رسالة تحذير:
```typescript
{isVendorStaff && !canManageStaff && (
  <div className="alert warning">
    ⚠️ لا تمتلك صلاحية إدارة المساعدين
  </div>
)}
```

#### إخفاء الأزرار:
```typescript
{canManageStaff && (
  <button onClick={handleAddStaff}>إضافة مساعد</button>
)}

{canManageStaff && (
  <button onClick={handleRemoveStaff}>حذف</button>
)}
```

---

## 🎯 الصلاحيات المتاحة

### للبائعين (Vendors):
| الصلاحية | الاسم | الوصف |
|---------|-------|------|
| `manage_products` | إدارة المنتجات | إضافة وتعديل وحذف المنتجات |
| `view_orders` | عرض الطلبات | مشاهدة تفاصيل الطلبات الواردة |
| `manage_orders` | إدارة الطلبات | تحديث حالة الطلبات ومعالجتها |
| `view_analytics` | عرض التحليلات | مشاهدة إحصائيات وتقارير المتجر |
| `manage_marketing` | إدارة التسويق | إنشاء الكوبونات والعروض |
| `manage_settings` | إدارة الإعدادات | تعديل معلومات المتجر |
| `manage_staff` | إدارة المساعدين | إضافة وحذف المساعدين |

---

## 📝 أمثلة الاستخدام

### مثال 1: حماية صفحة كاملة
```typescript
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProductsPage() {
  const { isVendorStaff, staffPermissions } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isVendorStaff && !hasPermission(staffPermissions, 'manage_products')) {
      router.push('/dashboard/vendor');
    }
  }, [isVendorStaff, staffPermissions]);

  return <div>صفحة المنتجات</div>;
}
```

### مثال 2: حماية زر أو عنصر
```typescript
const { isVendorStaff, staffPermissions } = useAuth();
const canDelete = !isVendorStaff || hasPermission(staffPermissions, 'manage_products');

return (
  <div>
    {canDelete && (
      <button onClick={handleDelete}>حذف المنتج</button>
    )}
  </div>
);
```

### مثال 3: رسالة تحذير
```typescript
{isVendorStaff && !hasPermission(staffPermissions, 'view_analytics') && (
  <div className="alert">
    ⚠️ ليس لديك صلاحية عرض التحليلات
  </div>
)}
```

---

## 🔍 اختبار النظام

### سيناريو 1: مساعد بدون صلاحية `manage_staff`
1. سجّل دخول كمساعد (muhmdakh@gmail.com)
2. الصلاحيات: `["view_orders", "manage_products"]`
3. **النتيجة المتوقعة:**
   - ✅ يظهر زر "لوحة التحكم" في الهيدر
   - ✅ يدخل إلى لوحة تحكم البائع
   - ⚠️ في صفحة المساعدين: يظهر تحذير "لا تمتلك صلاحية إدارة المساعدين"
   - ❌ لا يظهر زر "إضافة مساعد جديد"
   - ❌ لا تظهر أزرار الحذف للمساعدين

### سيناريو 2: بائع أصلي
1. سجّل دخول كبائع (mdadkh1@gmail.com)
2. `userRole = 'vendor'` && `isVendorStaff = false`
3. **النتيجة المتوقعة:**
   - ✅ يظهر زر "لوحة التحكم" في الهيدر
   - ✅ وصول كامل لجميع الصفحات
   - ✅ يمكنه إضافة وحذف المساعدين

---

## 🚀 الخطوات القادمة

لتطبيق نظام الصلاحيات على صفحات أخرى:

1. **صفحة المنتجات** (`app/dashboard/vendor/products/page.tsx`)
   ```typescript
   const canManageProducts = !isVendorStaff || hasPermission(staffPermissions, 'manage_products');
   ```

2. **صفحة الطلبات** (`app/dashboard/vendor/orders/page.tsx`)
   ```typescript
   const canViewOrders = !isVendorStaff || hasPermission(staffPermissions, 'view_orders');
   const canManageOrders = !isVendorStaff || hasPermission(staffPermissions, 'manage_orders');
   ```

3. **صفحة الإعدادات** (`app/dashboard/vendor/settings/page.tsx`)
   ```typescript
   const canManageSettings = !isVendorStaff || hasPermission(staffPermissions, 'manage_settings');
   ```

---

## ✅ الملخص

| الميزة | الحالة |
|--------|--------|
| عرض زر "لوحة التحكم" للمساعدين | ✅ تم |
| التحقق من صلاحية المساعد | ✅ تم |
| حماية صفحة المساعدين | ✅ تم |
| إخفاء أزرار الإضافة/الحذف | ✅ تم |
| رسائل تحذير عند عدم وجود صلاحية | ✅ تم |
| دالة `hasPermission` للتحقق | ✅ تم |
| توثيق كامل | ✅ تم |

---

**تاريخ التحديث:** 2026-01-06
**المطور:** GitHub Copilot
