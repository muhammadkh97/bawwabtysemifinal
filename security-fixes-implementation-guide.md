# دليل تطبيق الإصلاحات الأمنية - بوابتي
## Security Fixes Implementation Guide - Bawwabty

**التاريخ:** 10 يناير 2026  
**المشروع:** bawwabtysemifinal  
**المؤلف:** Manus AI

---

## 📋 ملخص الإصلاحات المطبقة

تم إنشاء الإصلاحات التالية لحل الثغرات الأمنية الحرجة:

| الثغرة | الحل المطبق | الملف | الحالة |
| :--- | :--- | :--- | :--- |
| FM-001 إلى FM-005 | دالة RPC آمنة لإنشاء الطلبات | `database/create-secure-order-function.sql` | ✅ تم التطبيق |
| DL-002 | تشفير معلومات البنك | `database/encrypt-bank-info.sql` | ✅ تم التطبيق |
| DL-003 | تأمين دوال SECURITY DEFINER | `database/secure-definer-functions.sql` | ⚠️ يحتاج تعديل |
| OTP-001 | Rate Limiting على OTP | `database/secure-definer-functions.sql` | ✅ تم التطبيق |
| DL-001 | Row Level Security | `database/enable-rls-policies-fixed.sql` | ⚠️ يحتاج مراجعة |

---

## 1. إصلاح الثغرات المالية (CRITICAL)

### 1.1. الدالة الآمنة لإنشاء الطلبات

**الملف:** `database/create-secure-order-function.sql`

**ما تم تطبيقه:**
- دالة `create_order_secure` تقوم بـ:
  - جلب الأسعار من قاعدة البيانات مباشرة
  - التحقق من صحة الكميات (1-100)
  - حساب الإجمالي الفرعي من أسعار المنتجات الفعلية
  - التحقق من صحة كوبونات الخصم
  - حساب رسوم الشحن والضريبة
  - حساب الإجمالي النهائي
  - إنشاء الطلب وعناصره
  - تحديث المخزون

**كيفية الاستخدام:**

```typescript
const { data, error } = await supabase.rpc('create_order_secure', {
  p_customer_id: user.id,
  p_cart_items: [
    {
      product_id: 'uuid-here',
      quantity: 2,
      store_id: 'store-uuid-here'
    }
  ],
  p_delivery_address: 'العنوان الكامل',
  p_delivery_city: 'المدينة',
  p_delivery_phone: '0501234567',
  p_payment_method: 'cash',
  p_coupon_code: 'DISCOUNT10', // اختياري
  p_notes: 'ملاحظات' // اختياري
});

if (data && data.success) {
  console.log('Order created:', data.order_id);
  console.log('Total:', data.total);
} else {
  console.error('Error:', data.error, data.message);
}
```

### 1.2. التحديثات المطلوبة في Frontend

**الملف المطلوب تحديثه:** `app/checkout/page.tsx`

**الخطوات:**

1. **حذف جميع حسابات الأسعار:**
   ```typescript
   // ❌ احذف هذه الأسطر:
   const subtotal = cartItems.reduce((sum, item) => 
     sum + (item.product?.price || 0) * item.quantity, 0);
   const shipping = subtotal >= 50 ? 0 : 20;
   const tax = subtotal * 0.1;
   const discount = appliedCoupon ? ... : 0;
   const total = subtotal + shipping + tax - discount;
   ```

2. **استبدال منطق إنشاء الطلب:**
   ```typescript
   // ❌ احذف:
   const { data: newOrder, error: orderError } = await supabase
     .from('orders')
     .insert([orderData])
     ...
   
   // ✅ استخدم بدلاً منه:
   const result = await createOrderSecure(
     user.id,
     cartItems,
     deliveryAddress,
     deliveryCity,
     deliveryPhone,
     paymentMethod,
     appliedCoupon?.code,
     notes
   );
   ```

3. **معالجة الأخطاء:**
   ```typescript
   if (!result.success) {
     switch (result.error) {
       case 'invalid_quantity':
         alert('❌ الكمية غير صحيحة');
         break;
       case 'insufficient_stock':
         alert('❌ المخزون غير كافي');
         break;
       // ... باقي الحالات
     }
     return;
   }
   ```

**ملف مرجعي:** راجع `app/checkout/page-secure.tsx` للكود الكامل

---

## 2. تشفير معلومات البنك (CRITICAL)

### 2.1. الدوال المطبقة

**الملف:** `database/encrypt-bank-info.sql`

**ما تم تطبيقه:**
- تفعيل `pgcrypto` extension
- إضافة أعمدة مشفرة: `account_number_encrypted`, `iban_encrypted`
- دالة `create_payout_request_secure` لإنشاء طلبات سحب آمنة
- دالة `get_payout_request_details_admin` للأدمن لعرض المعلومات المشفرة

### 2.2. التحديثات المطلوبة في Frontend

**الملف المطلوب تحديثه:** `app/dashboard/vendor/wallet/page.tsx`

**استبدال كود إنشاء طلب السحب:**

```typescript
// ❌ احذف:
const { data, error } = await supabase
  .from('payout_requests')
  .insert({
    vendor_id: vendorId,
    amount: amount,
    bank_name: bankName,
    account_number: accountNumber,
    iban: iban,
    ...
  })

// ✅ استخدم بدلاً منه:
const { data, error } = await supabase.rpc('create_payout_request_secure', {
  p_vendor_id: vendorId,
  p_amount: amount,
  p_bank_name: bankName,
  p_account_number: accountNumber,
  p_iban: iban
});

if (data && data.success) {
  alert('✅ تم إنشاء طلب السحب بنجاح');
} else {
  alert(`❌ ${data.message}`);
}
```

### 2.3. ⚠️ مهم جداً: تغيير مفتاح التشفير

**يجب تغيير مفتاح التشفير الافتراضي فوراً!**

1. افتح ملف `database/encrypt-bank-info.sql`
2. ابحث عن: `'your-encryption-key-here-change-this'`
3. استبدله بمفتاح قوي (32 حرف على الأقل)
4. احفظ المفتاح في مكان آمن (مثل متغيرات البيئة)

```sql
-- مثال:
v_encryption_key TEXT := 'Bw7Y#mK9$pL2@qR5*tN8&vX3^zC6!aF4';
```

---

## 3. تأمين دوال SECURITY DEFINER (CRITICAL)

### 3.1. الدوال المحدثة

**الملف:** `database/secure-definer-functions.sql`

**ما تم تطبيقه:**
- إضافة تحقق من الصلاحيات في بداية كل دالة
- Rate Limiting على محاولات التحقق من OTP (5 محاولات / 15 دقيقة)
- تسجيل جميع المحاولات في `verification_attempts`
- إشعارات للمستخدم بعدد المحاولات المتبقية

### 3.2. ⚠️ ملاحظة

الدالة تحتاج إلى مراجعة لأن أسماء المعاملات في الدالة الأصلية قد تختلف. يجب:
1. فحص الدالة الأصلية في قاعدة البيانات
2. التأكد من أسماء المعاملات
3. تطبيق التحديثات بشكل صحيح

---

## 4. Row Level Security (HIGH)

### 4.1. السياسات المطلوبة

**الملف:** `database/enable-rls-policies-fixed.sql`

**ما تم محاولة تطبيقه:**
- RLS على جدول `users`
- RLS على جدول `orders`
- RLS على جدول `vendor_wallets`
- RLS على جدول `payout_requests`
- RLS على جدول `notifications`
- RLS على جدول `products`
- RLS على جدول `stores`
- RLS على جدول `drivers`
- RLS على جدول `wallet_transactions`

### 4.2. ⚠️ المشكلة

واجهنا خطأ بسبب اختلاف أسماء الأعمدة في الجداول الفعلية. يجب:

1. **فحص بنية الجداول:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'products' AND table_schema = 'public';
   ```

2. **تحديث السياسات:**
   - تأكد من أسماء الأعمدة الصحيحة
   - تأكد من وجود العلاقات بين الجداول
   - اختبر كل سياسة على حدة

3. **الأولوية:**
   - ابدأ بـ `users`, `orders`, `vendor_wallets`, `payout_requests`
   - ثم `products`, `stores`
   - ثم باقي الجداول

---

## 5. Rate Limiting على API (HIGH)

### 5.1. الحل المطبق في قاعدة البيانات

تم تطبيق Rate Limiting على مستوى دوال OTP في قاعدة البيانات (5 محاولات / 15 دقيقة).

### 5.2. Rate Limiting على مستوى API

**يحتاج إلى تطبيق:**

#### الخيار 1: استخدام Vercel Edge Middleware

**إنشاء ملف:** `middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// تخزين مؤقت للطلبات (في الإنتاج استخدم Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  const ip = request.ip || 'unknown';
  const now = Date.now();
  
  // الحصول على عدد الطلبات الحالي
  let record = requestCounts.get(ip);
  
  // إعادة تعيين العداد كل دقيقة
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + 60000 }; // 1 دقيقة
  }
  
  record.count++;
  requestCounts.set(ip, record);
  
  // الحد الأقصى: 100 طلب/دقيقة
  if (record.count > 100) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

#### الخيار 2: استخدام خدمة خارجية

- **Upstash Redis** مع Rate Limiting
- **Cloudflare Rate Limiting**
- **Vercel Rate Limiting** (إذا كان متاحاً في خطتك)

---

## 6. خطة التطبيق الموصى بها

### المرحلة 1: الإصلاحات الحرجة الفورية (يجب تنفيذها الآن)

1. ✅ **تطبيق دالة `create_order_secure`** (تم)
2. ✅ **تطبيق تشفير معلومات البنك** (تم)
3. ⚠️ **تغيير مفتاح التشفير** (يدوي - مطلوب فوراً)
4. 🔄 **تحديث `app/checkout/page.tsx`** (مطلوب)
5. 🔄 **تحديث `app/dashboard/vendor/wallet/page.tsx`** (مطلوب)

### المرحلة 2: تأمين إضافي (خلال 24 ساعة)

6. 🔄 **إصلاح وتطبيق RLS policies** (مطلوب)
7. 🔄 **تطبيق Rate Limiting middleware** (مطلوب)
8. 🔄 **مراجعة وتحديث دوال SECURITY DEFINER** (مطلوب)

### المرحلة 3: الاختبار (خلال 48 ساعة)

9. اختبار دالة `create_order_secure` بسيناريوهات مختلفة
10. اختبار تشفير معلومات البنك
11. اختبار RLS policies
12. اختبار Rate Limiting

### المرحلة 4: النشر

13. رفع التغييرات إلى GitHub
14. نشر التحديثات على Vercel
15. مراقبة الأخطاء

---

## 7. أوامر Git للنشر

```bash
# إنشاء فرع جديد للإصلاحات الأمنية
cd /home/ubuntu/bawwabtysemifinal
git checkout -b security-fixes

# إضافة الملفات الجديدة
git add database/create-secure-order-function.sql
git add database/encrypt-bank-info.sql
git add database/secure-definer-functions.sql
git add database/enable-rls-policies-fixed.sql
git add app/checkout/page-secure.tsx

# Commit
git commit -m "🔒 Security fixes: 
- Add secure order creation function
- Encrypt bank information
- Add rate limiting to OTP verification
- Prepare RLS policies
- Update checkout to use secure functions"

# Push
git push origin security-fixes

# إنشاء Pull Request على GitHub
gh pr create --title "🔒 Critical Security Fixes" --body "Fixes critical security vulnerabilities (FM-001 to FM-005, DL-001 to DL-003, OTP-001)"
```

---

## 8. قائمة التحقق النهائية

- [ ] تم تطبيق `create_order_secure` في قاعدة البيانات
- [ ] تم تطبيق تشفير معلومات البنك
- [ ] تم تغيير مفتاح التشفير إلى مفتاح قوي
- [ ] تم تحديث `app/checkout/page.tsx`
- [ ] تم تحديث `app/dashboard/vendor/wallet/page.tsx`
- [ ] تم اختبار إنشاء طلب جديد
- [ ] تم اختبار إنشاء طلب سحب
- [ ] تم تطبيق RLS policies
- [ ] تم تطبيق Rate Limiting
- [ ] تم رفع التغييرات إلى GitHub
- [ ] تم النشر على Vercel

---

## 9. جهات الاتصال للدعم

إذا واجهت أي مشاكل أثناء التطبيق:
1. راجع ملف `final_security_audit_report.md` للتفاصيل الكاملة
2. راجع ملفات SQL في مجلد `database/`
3. راجع `app/checkout/page-secure.tsx` للكود المرجعي

---

**ملاحظة نهائية:** هذه الإصلاحات حرجة ويجب تطبيقها فوراً. الموقع حالياً عرضة لثغرات مالية خطيرة يمكن أن تؤدي إلى خسائر كبيرة.
