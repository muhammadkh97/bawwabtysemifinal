# 🌍 نظام العملات العالمي الشامل - دليل التكامل

## ✅ ما تم إنجازه

### 1. قاعدة البيانات (Database)
تم إنشاء بنية تحتية كاملة لنظام العملات:

#### الجداول (Tables):
- ✅ `users.preferred_currency` - عمود جديد لحفظ العملة المفضلة لكل مستخدم
- ✅ `currencies` - جدول 26 عملة (18 عربية + 8 عالمية)
- ✅ `exchange_rates` - جدول أسعار الصرف الشاملة

#### الدوال (Functions):
```sql
convert_currency(amount, from_curr, to_curr) → NUMERIC
```
- تحويل ذكي: مباشر إذا وُجد سعر مباشر
- عبر USD كوسيط إذا لم يوجد سعر مباشر
- دقة عالية: 6 منازل عشرية للأسعار

#### الـ Views:
```sql
products_with_converted_prices
```
- عرض جميع المنتجات مع أسعار محولة مسبقاً
- تحويل تلقائي إلى: JOD, SAR, ILS, USD, EUR

#### أسعار الصرف (Exchange Rates):
**التحويلات المباشرة بين العملات العربية:**
- JOD ↔ SAR, ILS, AED, KWD, QAR, BHD, OMR, EGP
- SAR ↔ JOD, ILS, AED, KWD, QAR, BHD, OMR, EGP
- ILS ↔ JOD, SAR, AED, KWD, QAR, BHD, OMR, EGP
- AED ↔ JOD, SAR, ILS
- KWD ↔ JOD, SAR, ILS
- EGP ↔ JOD, SAR, ILS

**أمثلة على الأسعار:**
- 1 SAR = 0.189 JOD
- 1 ILS = 0.194 JOD
- 1 ILS = 1.027 SAR
- 100 SAR = 18.90 JOD
- 20 ILS = 3.88 JOD

### 2. الباك إند (Backend)

#### ملف: `/lib/currency.ts`
دوال مساعدة للتعامل مع العملات:

```typescript
// جلب جميع العملات النشطة
getCurrencies(): Promise<Currency[]>

// تحويل السعر باستخدام دالة قاعدة البيانات
convertCurrency(amount, fromCurrency, toCurrency): Promise<number>

// جلب سعر صرف مباشر
getExchangeRate(fromCurrency, toCurrency): Promise<number | null>

// تنسيق السعر
formatPrice(amount, currencyCode, currencyInfo?): string

// جلب/تحديث العملة المفضلة للمستخدم
getUserPreferredCurrency(userId): Promise<string | null>
updateUserPreferredCurrency(userId, currencyCode): Promise<boolean>

// جلب المنتجات مع أسعار محولة
getProductsWithConvertedPrices(): Promise<any[]>
```

### 3. الفرونت إند (Frontend)

#### ملف: `/contexts/CurrencyContext.tsx`
Context محدّث بالكامل ليستخدم قاعدة البيانات:

**التغييرات الرئيسية:**
- ❌ لم يعد يستخدم أسعار صرف ثابتة (hardcoded)
- ✅ يجلب العملات من جدول `currencies`
- ✅ يحفظ العملة المفضلة في قاعدة البيانات للمستخدمين المسجلين
- ✅ يحفظ في localStorage للزوار غير المسجلين
- ✅ استخدام دالة `convert_currency()` من قاعدة البيانات

**الواجهة الجديدة:**
```typescript
interface CurrencyContextType {
  selectedCurrency: string;
  changeCurrency: (currency: string) => Promise<void>;  // async الآن
  convertPrice: (price: number, fromCurrency?: string) => Promise<number>;  // async
  formatPrice: (price: number, fromCurrency?: string) => Promise<string>;  // async
  getCurrencySymbol: (currency: string) => string;
  getCurrencyInfo: (currency: string) => Currency | undefined;
  currencies: Currency[];  // جديد: قائمة جميع العملات
  isLoading: boolean;
  refreshCurrencies: () => Promise<void>;  // جديد: تحديث العملات
}
```

## 🚀 كيفية الاستخدام

### 1. في المكونات (Components)
```typescript
'use client';
import { useCurrency } from '@/contexts/CurrencyContext';

export function ProductCard({ product }) {
  const { convertPrice, formatPrice, selectedCurrency } = useCurrency();
  
  // مثال 1: تحويل السعر فقط
  const [convertedPrice, setConvertedPrice] = useState(0);
  useEffect(() => {
    convertPrice(product.price, product.original_currency).then(setConvertedPrice);
  }, [product.price, selectedCurrency]);
  
  // مثال 2: تنسيق السعر مباشرة
  const [formattedPrice, setFormattedPrice] = useState('');
  useEffect(() => {
    formatPrice(product.price, product.original_currency).then(setFormattedPrice);
  }, [product.price, selectedCurrency]);
  
  return (
    <div>
      <p>{formattedPrice}</p>
    </div>
  );
}
```

### 2. تغيير العملة
```typescript
const { changeCurrency } = useCurrency();

// تغيير العملة
await changeCurrency('SAR');
// سيتم الحفظ تلقائياً في:
// - قاعدة البيانات (إذا كان المستخدم مسجل الدخول)
// - localStorage (للزوار)
```

### 3. عرض قائمة العملات
```typescript
const { currencies, selectedCurrency, changeCurrency } = useCurrency();

return (
  <select value={selectedCurrency} onChange={(e) => changeCurrency(e.target.value)}>
    {currencies.map(currency => (
      <option key={currency.code} value={currency.code}>
        {currency.flag} {currency.name_ar} ({currency.symbol})
      </option>
    ))}
  </select>
);
```

## 📋 المهام المتبقية

### أولوية عالية:
- [ ] تحديث صفحات المنتجات لاستخدام النظام الجديد
- [ ] تحديث صفحة السلة (Cart)
- [ ] تحديث صفحة الدفع (Checkout)
- [ ] تحديث لوحة البائع (Vendor Dashboard)

### أولوية متوسطة:
- [ ] إضافة مؤشر تحميل عند تحويل الأسعار
- [ ] إضافة cache للأسعار المحولة (تقليل استعلامات DB)
- [ ] إضافة خيار تحديث أسعار الصرف من APIs خارجية
- [ ] إضافة صفحة إدارة للـ Admin لتحديث أسعار الصرف

### أولوية منخفضة:
- [ ] إضافة رسوم بيانية لتاريخ أسعار الصرف
- [ ] إضافة إشعارات عند تغير أسعار الصرف بنسبة كبيرة
- [ ] إضافة API endpoints لتحديث الأسعار تلقائياً

## 🧪 اختبار النظام

### اختبار قاعدة البيانات:
```sql
-- اختبار دالة التحويل
SELECT convert_currency(100, 'SAR', 'JOD');  -- يجب أن يعيد 18.90 تقريباً
SELECT convert_currency(20, 'ILS', 'JOD');   -- يجب أن يعيد 3.88 تقريباً
SELECT convert_currency(20, 'ILS', 'SAR');   -- يجب أن يعيد 20.54 تقريباً

-- عرض جميع العملات
SELECT * FROM currencies ORDER BY display_order;

-- عرض أسعار الصرف
SELECT * FROM exchange_rates WHERE base_currency = 'JOD';
```

### اختبار الفرونت إند:
1. افتح المتصفح Console
2. جرّب:
```javascript
// تغيير العملة
const { changeCurrency } = useCurrency();
await changeCurrency('SAR');

// تحويل سعر
const { convertPrice } = useCurrency();
const converted = await convertPrice(100, 'ILS');
console.log(converted);
```

## ⚠️ ملاحظات مهمة

### الأداء (Performance):
- **Cache المحلي**: `convertPrice` يتصل بقاعدة البيانات في كل مرة
- **حل مقترح**: استخدام `products_with_converted_prices` view للصفحات الرئيسية
- **أو**: إضافة cache في Frontend باستخدام `useMemo` أو `React Query`

### الأمان (Security):
- ✅ RLS Policies موجودة على `currencies` و `exchange_rates`
- ✅ الجميع يستطيع القراءة (SELECT)
- ❌ فقط Admin يستطيع الكتابة (INSERT/UPDATE)

### التوافقية (Compatibility):
- ⚠️ بعض المكونات القديمة قد تستخدم `convertPrice` بشكل synchronous
- 🔧 يجب تحديثها لتستخدم async/await أو Promises

## 🎯 الخطوات التالية

### الآن:
1. اختبار النظام على بيئة التطوير
2. التحقق من أن الأسعار تُعرض بشكل صحيح
3. اختبار تغيير العملة

### بعد ذلك:
1. تحديث صفحات المنتجات
2. تحديث السلة والدفع
3. تحديث لوحة البائع

### أخيراً:
1. اختبار شامل على جميع الصفحات
2. إضافة مؤشرات التحميل
3. تحسين الأداء بإضافة Cache
4. Deploy إلى Production

---

## 📞 للدعم
إذا واجهت أي مشاكل:
1. تحقق من Console للأخطاء
2. تحقق من Supabase Logs
3. تأكد من تشغيل السكريبت `create-currency-system.sql`
4. تأكد من وجود بيانات في جداول `currencies` و `exchange_rates`

---

**✨ نظام عملات عالمي احترافي جاهز للاستخدام!**
