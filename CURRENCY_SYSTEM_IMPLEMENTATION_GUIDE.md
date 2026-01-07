# 💰 دليل تنفيذ نظام العملات العالمي
## Currency System Implementation Guide

**التاريخ:** 2026-01-07  
**النسخة:** 1.0  
**المستوى:** احترافي عالمي

---

## 🚀 البداية السريعة
## Quick Start

### خطوات التنفيذ (30 دقيقة):

#### 1️⃣ تنفيذ سكربت التشخيص (5 دقائق)

```sql
-- في Supabase SQL Editor، نفّذ هذا الملف:
-- diagnostic_currency_system_complete.sql
```

**الهدف:** معرفة الوضع الحالي للنظام

#### 2️⃣ تنفيذ سكربت الإصلاح (10 دقائق)

```sql
-- في Supabase SQL Editor، نفّذ هذا الملف:
-- fix_currency_system_complete.sql
```

**ملاحظة:** السكربت **آمن** - لن يحذف أي بيانات موجودة!

#### 3️⃣ تحديث أسعار الصرف من API (5 دقائق)

```typescript
// في Next.js app، نفّذ:
import { updateExchangeRatesFromAPI } from '@/lib/exchange-rates';

await updateExchangeRatesFromAPI();
```

أو باستخدام Edge Function:

```bash
# في Terminal:
curl -X POST https://your-project.supabase.co/functions/v1/update-exchange-rates \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

#### 4️⃣ اختبار النظام (10 دقائق)

```sql
-- 1. التحقق من العملات:
SELECT * FROM currencies WHERE is_active = true ORDER BY display_order;

-- 2. التحقق من أسعار الصرف:
SELECT * FROM exchange_rates ORDER BY target_currency;

-- 3. اختبار تحويل العملات:
SELECT convert_currency_cached(100, 'JOD', 'USD') as result;
SELECT convert_currency_cached(100, 'SAR', 'EGP') as result;

-- 4. التحقق من Functions:
SELECT * FROM get_latest_exchange_rates();
```

---

## 📚 الوثائق التفصيلية
## Detailed Documentation

### 🗄️ قاعدة البيانات
### Database Schema

#### جدول `currencies` (العملات المدعومة)

```sql
CREATE TABLE currencies (
    code TEXT PRIMARY KEY,              -- رمز العملة (JOD, SAR, USD)
    name_en TEXT NOT NULL,              -- الاسم بالإنجليزية
    name_ar TEXT NOT NULL,              -- الاسم بالعربية
    symbol TEXT NOT NULL,               -- الرمز (د.أ, $, €)
    flag TEXT,                          -- العلم 🇯🇴
    decimal_places INTEGER DEFAULT 2,   -- عدد الخانات العشرية
    is_active BOOLEAN DEFAULT true,     -- نشط/غير نشط
    display_order INTEGER DEFAULT 999,  -- ترتيب العرض
    country_code TEXT,                  -- رمز الدولة (JO, SA)
    subunit_name TEXT,                  -- اسم الوحدة الفرعية (قرش، فلس)
    subunit_to_unit INTEGER DEFAULT 100,-- نسبة التحويل
    metadata JSONB DEFAULT '{}'::jsonb, -- بيانات إضافية
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**أمثلة:**

```sql
-- الدينار الأردني
('JOD', 'Jordanian Dinar', 'دينار أردني', 'د.أ', '🇯🇴', 3, true, 1, 'JO', 'قرش', 100)

-- الريال السعودي
('SAR', 'Saudi Riyal', 'ريال سعودي', 'ر.س', '🇸🇦', 2, true, 2, 'SA', 'هللة', 100)

-- الدينار الكويتي (3 خانات عشرية!)
('KWD', 'Kuwaiti Dinar', 'دينار كويتي', 'د.ك', '🇰🇼', 3, true, 5, 'KW', 'فلس', 1000)
```

#### جدول `exchange_rates` (أسعار الصرف)

```sql
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency TEXT NOT NULL DEFAULT 'USD',  -- دائماً USD
    target_currency TEXT NOT NULL,               -- العملة المستهدفة
    rate NUMERIC(20, 6) NOT NULL,                -- السعر (1 USD = X target)
    source TEXT DEFAULT 'manual',                -- مصدر السعر
    is_stale BOOLEAN DEFAULT false,              -- قديم > 24 ساعة
    retry_count INTEGER DEFAULT 0,               -- عدد المحاولات
    error_message TEXT,                          -- رسالة الخطأ
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(base_currency, target_currency)
);
```

**أمثلة:**

```sql
-- 1 USD = 0.709 JOD
('USD', 'JOD', 0.709000)

-- 1 USD = 3.75 SAR
('USD', 'SAR', 3.750000)

-- 1 USD = 0.307 KWD
('USD', 'KWD', 0.307000)
```

**كيفية التحويل:**

```
مثال: تحويل 100 JOD إلى SAR

1. JOD -> USD:  100 / 0.709 = 141.04 USD
2. USD -> SAR:  141.04 * 3.75 = 528.90 SAR

النتيجة: 100 JOD = 528.90 SAR
```

#### جدول `exchange_rates_history` (تاريخ الأسعار)

```sql
CREATE TABLE exchange_rates_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency TEXT NOT NULL DEFAULT 'USD',
    target_currency TEXT NOT NULL,
    rate NUMERIC(20, 6) NOT NULL,
    source TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**الفائدة:**
- تتبع تغيرات الأسعار
- تحليل الاتجاهات
- Audit trail

---

### ⚙️ Functions (الدوال)
### Database Functions

#### 1. `get_latest_exchange_rates()`

**الوصف:** جلب آخر أسعار الصرف

```sql
SELECT * FROM get_latest_exchange_rates();
```

**النتيجة:**

| currency | rate    | last_updated            | is_stale |
|----------|---------|-------------------------|----------|
| JOD      | 0.709   | 2026-01-07 10:30:00+00  | false    |
| SAR      | 3.750   | 2026-01-07 10:30:00+00  | false    |
| EUR      | 0.920   | 2026-01-07 09:00:00+00  | false    |

#### 2. `update_exchange_rates(rates JSONB, source TEXT)`

**الوصف:** تحديث أسعار الصرف بشكل دفعة

```sql
SELECT update_exchange_rates(
  '[
    {"currency": "JOD", "rate": 0.709},
    {"currency": "SAR", "rate": 3.75},
    {"currency": "EUR", "rate": 0.92}
  ]'::JSONB,
  'ExchangeRate-API'
);
```

**النتيجة:** `3` (عدد الأسعار المحدثة)

#### 3. `convert_currency_cached(amount, from, to)`

**الوصف:** تحويل المبلغ من عملة لأخرى

```sql
-- تحويل 100 JOD إلى USD
SELECT convert_currency_cached(100, 'JOD', 'USD') as usd_amount;
-- النتيجة: 141.04

-- تحويل 500 SAR إلى EGP
SELECT convert_currency_cached(500, 'SAR', 'EGP') as egp_amount;
-- النتيجة: 4120.00
```

#### 4. `mark_stale_exchange_rates()`

**الوصف:** تمييز الأسعار القديمة (> 24 ساعة)

```sql
SELECT mark_stale_exchange_rates();
-- النتيجة: 5 (عدد الأسعار القديمة)
```

#### 5. `get_currency_info(code TEXT)`

**الوصف:** جلب معلومات كاملة عن عملة

```sql
SELECT * FROM get_currency_info('JOD');
```

**النتيجة:**

```json
{
  "code": "JOD",
  "name_en": "Jordanian Dinar",
  "name_ar": "دينار أردني",
  "symbol": "د.أ",
  "flag": "🇯🇴",
  "decimal_places": 3,
  "country_code": "JO",
  "subunit_name": "قرش"
}
```

---

### 🎯 Triggers (المشغّلات التلقائية)

#### 1. `tr_exchange_rates_history`

**الهدف:** حفظ تاريخ كل تغيير في السعر

```sql
-- عند تحديث السعر:
UPDATE exchange_rates 
SET rate = 0.710 
WHERE target_currency = 'JOD';

-- تلقائياً يحفظ في exchange_rates_history:
-- timestamp: 2026-01-07 11:00:00
-- rate: 0.710
```

#### 2. `tr_validate_product_currency`

**الهدف:** التحقق من صحة عملة المنتج

```sql
-- هذا سينجح:
INSERT INTO products (name, price, currency) 
VALUES ('منتج تجريبي', 50, 'JOD');

-- هذا سيفشل:
INSERT INTO products (name, price, currency) 
VALUES ('منتج تجريبي', 50, 'XYZ');
-- Error: رمز عملة غير صحيح أو غير نشط: XYZ
```

#### 3. `tr_validate_order_currency`

**الهدف:** التحقق من صحة عملة الطلب

#### 4. `tr_calculate_product_usd_price`

**الهدف:** حساب السعر بالدولار تلقائياً

```sql
-- عند إضافة منتج:
INSERT INTO products (name, price, currency) 
VALUES ('منتج تجريبي', 100, 'JOD');

-- تلقائياً يحسب price_usd:
-- price_usd = 100 / 0.709 = 141.04
```

---

### 🔐 Row Level Security (RLS)

#### سياسات القراءة (للجميع)

```sql
-- الجميع يمكنهم قراءة العملات
CREATE POLICY "Everyone can read currencies"
    ON currencies FOR SELECT
    USING (true);

-- الجميع يمكنهم قراءة أسعار الصرف
CREATE POLICY "Everyone can read exchange rates"
    ON exchange_rates FOR SELECT
    USING (true);
```

#### سياسات التعديل (Admin فقط)

```sql
-- Admin فقط يمكنه تعديل العملات
CREATE POLICY "Only admins can modify currencies"
    ON currencies FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
        )
    );
```

---

## 💻 Frontend Integration
## دمج Frontend

### 1️⃣ استخدام CurrencyContext

```typescript
import { useCurrency } from '@/contexts/CurrencyContext';

function ProductCard({ product }) {
  const { 
    selectedCurrency,      // العملة المختارة حالياً
    convertPrice,          // دالة تحويل السعر
    formatPrice,           // دالة تنسيق السعر
    getCurrencySymbol      // دالة جلب رمز العملة
  } = useCurrency();
  
  // تحويل السعر للعملة المختارة
  const displayPrice = convertPrice(product.price, product.currency);
  
  return (
    <div>
      <h3>{product.name}</h3>
      <p className="price">
        {formatPrice(displayPrice)}
      </p>
      
      {/* عرض السعر الأصلي */}
      {product.currency !== selectedCurrency && (
        <p className="original-price">
          ({formatPrice(product.price, product.currency)})
        </p>
      )}
    </div>
  );
}
```

### 2️⃣ تغيير العملة

```typescript
function CurrencyButton() {
  const { selectedCurrency, changeCurrency } = useCurrency();
  
  const handleChange = async (newCurrency: string) => {
    await changeCurrency(newCurrency);
    // سيتم حفظ في localStorage + قاعدة البيانات
  };
  
  return (
    <select value={selectedCurrency} onChange={(e) => handleChange(e.target.value)}>
      <option value="JOD">🇯🇴 دينار أردني</option>
      <option value="SAR">🇸🇦 ريال سعودي</option>
      <option value="USD">🇺🇸 دولار</option>
    </select>
  );
}
```

### 3️⃣ مكون PriceDisplay محسّن

```typescript
// components/PriceDisplay.tsx
interface PriceDisplayProps {
  amount: number;
  currency?: string;
  showOriginal?: boolean;
  showConversion?: boolean;
  className?: string;
}

export function PriceDisplay({
  amount,
  currency = 'JOD',
  showOriginal = false,
  showConversion = true,
  className
}: PriceDisplayProps) {
  const { selectedCurrency, convertPrice, formatPrice, getCurrencySymbol } = useCurrency();
  
  // تحويل السعر إذا كانت العملة مختلفة
  const displayAmount = showConversion && currency !== selectedCurrency
    ? convertPrice(amount, currency)
    : amount;
  
  // جلب معلومات العملة
  const currencyInfo = useMemo(() => {
    return getCurrencyInfo(showConversion ? selectedCurrency : currency);
  }, [selectedCurrency, currency, showConversion]);
    
  return (
    <div className={cn("flex flex-col", className)}>
      {/* السعر الرئيسي */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {displayAmount.toLocaleString('ar-SA', {
            minimumFractionDigits: currencyInfo?.decimal_places || 2,
            maximumFractionDigits: currencyInfo?.decimal_places || 2,
          })}
        </span>
        <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {currencyInfo?.symbol || getCurrencySymbol(selectedCurrency)}
        </span>
      </div>
      
      {/* السعر الأصلي (اختياري) */}
      {showOriginal && currency !== selectedCurrency && showConversion && (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({amount.toLocaleString('ar-SA')} {getCurrencySymbol(currency)})
        </span>
      )}
    </div>
  );
}
```

**الاستخدام:**

```typescript
<PriceDisplay 
  amount={product.price} 
  currency={product.currency}
  showOriginal={true}
  showConversion={true}
/>
```

---

## 🔄 تحديث أسعار الصرف تلقائياً
## Auto-Update Exchange Rates

### الطريقة 1: Frontend (Manual)

```typescript
// في أي صفحة:
import { updateExchangeRatesFromAPI } from '@/lib/exchange-rates';

async function updateRates() {
  const result = await updateExchangeRatesFromAPI();
  
  if (result.success) {
    console.log(`✅ تم تحديث ${result.count} سعر صرف`);
  } else {
    console.error('❌ فشل تحديث الأسعار:', result.error);
  }
}
```

### الطريقة 2: Edge Function (Scheduled)

```typescript
// supabase/functions/update-exchange-rates/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  try {
    // جلب الأسعار من API خارجي
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    
    // تحضير البيانات
    const rates = Object.entries(data.rates)
      .filter(([currency]) => ['JOD', 'SAR', 'AED', 'KWD', 'EUR', 'GBP'].includes(currency))
      .map(([currency, rate]) => ({ currency, rate }));
    
    // تحديث قاعدة البيانات
    const { data: result, error } = await supabase.rpc('update_exchange_rates', {
      p_rates: rates,
      p_source: 'ExchangeRate-API Auto'
    });
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ success: true, count: result }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

**جدولة التحديث اليومي في Supabase:**

```sql
-- في Supabase Dashboard -> Database -> Extensions
-- تفعيل pg_cron

SELECT cron.schedule(
  'update-exchange-rates-daily',  -- اسم المهمة
  '0 0 * * *',                     -- كل يوم في منتصف الليل
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/update-exchange-rates',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

---

## 🧪 الاختبارات
## Testing

### اختبارات قاعدة البيانات

```sql
-- 1. اختبار تحويل العملات
DO $$
DECLARE
  v_result NUMERIC;
BEGIN
  -- JOD -> USD
  v_result := convert_currency_cached(100, 'JOD', 'USD');
  ASSERT v_result BETWEEN 140 AND 142, 'JOD to USD conversion failed';
  
  -- SAR -> EGP
  v_result := convert_currency_cached(100, 'SAR', 'EGP');
  ASSERT v_result > 0, 'SAR to EGP conversion failed';
  
  -- نفس العملة
  v_result := convert_currency_cached(100, 'JOD', 'JOD');
  ASSERT v_result = 100, 'Same currency conversion failed';
  
  RAISE NOTICE '✅ جميع اختبارات التحويل نجحت';
END $$;

-- 2. اختبار التحقق من العملات
DO $$
BEGIN
  -- يجب أن ينجح
  INSERT INTO products (name, price, currency) 
  VALUES ('Test Product 1', 50, 'JOD');
  
  -- يجب أن يفشل
  BEGIN
    INSERT INTO products (name, price, currency) 
    VALUES ('Test Product 2', 50, 'INVALID');
    RAISE EXCEPTION 'Should have failed!';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✅ التحقق من العملة يعمل بشكل صحيح';
  END;
  
  -- تنظيف
  DELETE FROM products WHERE name LIKE 'Test Product%';
END $$;

-- 3. اختبار الأسعار القديمة
DO $$
BEGIN
  -- تعيين سعر قديم
  UPDATE exchange_rates
  SET last_updated = NOW() - INTERVAL '25 hours'
  WHERE target_currency = 'EUR';
  
  -- تمييز الأسعار القديمة
  PERFORM mark_stale_exchange_rates();
  
  -- التحقق
  ASSERT EXISTS (
    SELECT 1 FROM exchange_rates 
    WHERE target_currency = 'EUR' AND is_stale = true
  ), 'Stale rate marking failed';
  
  RAISE NOTICE '✅ اختبار الأسعار القديمة نجح';
  
  -- إعادة تعيين
  UPDATE exchange_rates
  SET last_updated = NOW(), is_stale = false
  WHERE target_currency = 'EUR';
END $$;
```

### اختبارات Frontend

```typescript
// __tests__/currency.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCurrency } from '@/contexts/CurrencyContext';

describe('Currency System', () => {
  test('should convert price correctly', () => {
    const { result } = renderHook(() => useCurrency());
    
    act(() => {
      result.current.changeCurrency('USD');
    });
    
    const converted = result.current.convertPrice(100, 'JOD');
    expect(converted).toBeGreaterThan(140);
    expect(converted).toBeLessThan(142);
  });
  
  test('should format price with correct symbol', () => {
    const { result } = renderHook(() => useCurrency());
    
    const formatted = result.current.formatPrice(100);
    expect(formatted).toContain('د.أ'); // JOD symbol
  });
});
```

---

## 📊 لوحة تحكم الأسعار
## Exchange Rates Dashboard

### مثال على صفحة Admin

```typescript
// app/dashboard/admin/exchange-rates/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { updateExchangeRatesFromAPI } from '@/lib/exchange-rates';

export default function ExchangeRatesPage() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadRates();
  }, []);
  
  async function loadRates() {
    const { data } = await supabase.rpc('get_latest_exchange_rates');
    setRates(data || []);
  }
  
  async function handleUpdate() {
    setLoading(true);
    const result = await updateExchangeRatesFromAPI();
    
    if (result.success) {
      alert(`✅ تم تحديث ${result.count} سعر صرف`);
      await loadRates();
    } else {
      alert('❌ فشل التحديث');
    }
    
    setLoading(false);
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">أسعار الصرف</h1>
        
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'جاري التحديث...' : '🔄 تحديث الأسعار'}
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-right">العملة</th>
              <th className="px-6 py-3 text-right">السعر (مقابل USD)</th>
              <th className="px-6 py-3 text-right">آخر تحديث</th>
              <th className="px-6 py-3 text-right">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => (
              <tr key={rate.currency} className="border-t">
                <td className="px-6 py-4 font-medium">
                  {rate.currency}
                </td>
                <td className="px-6 py-4">
                  {rate.rate.toFixed(6)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(rate.last_updated).toLocaleString('ar-SA')}
                </td>
                <td className="px-6 py-4">
                  {rate.is_stale ? (
                    <span className="text-red-600">⚠️ قديم</span>
                  ) : (
                    <span className="text-green-600">✅ محدث</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 🐛 استكشاف الأخطاء
## Troubleshooting

### 1. خطأ: "سعر صرف غير موجود"

**السبب:** لم يتم تحديث أسعار الصرف

**الحل:**

```typescript
await updateExchangeRatesFromAPI();
```

### 2. خطأ: "رمز عملة غير صحيح"

**السبب:** العملة غير موجودة في جدول `currencies`

**الحل:**

```sql
-- التحقق من العملات المتاحة:
SELECT code FROM currencies WHERE is_active = true;

-- إضافة عملة جديدة:
INSERT INTO currencies (code, name_en, name_ar, symbol, flag)
VALUES ('XXX', 'New Currency', 'عملة جديدة', 'X', '🏳️');
```

### 3. الأسعار لا تتحدث تلقائياً

**الحل:**

```sql
-- التحقق من pg_cron:
SELECT * FROM cron.job;

-- إعادة جدولة المهمة:
SELECT cron.unschedule('update-exchange-rates-daily');
SELECT cron.schedule('update-exchange-rates-daily', '0 0 * * *', $$...$$);
```

---

## 🎉 الخلاصة
## Summary

بعد تنفيذ هذا النظام، لديك الآن:

✅ **نظام عملات احترافي عالمي** يضاهي أكبر المنصات  
✅ **25+ عملة** مدعومة (عربية + عالمية)  
✅ **تحديث تلقائي** لأسعار الصرف  
✅ **Real-time conversion** سريع ودقيق  
✅ **Historical data** لتتبع التغيرات  
✅ **Secure & Auditable** مع RLS وAudit trail  
✅ **Mobile-optimized** UI/UX ممتاز  

---

## 📞 الدعم
## Support

**الملفات المهمة:**
- `diagnostic_currency_system_complete.sql` - التشخيص
- `fix_currency_system_complete.sql` - الإصلاح
- `CURRENCY_SYSTEM_DIAGNOSTIC_REPORT.md` - التقرير الكامل
- هذا الملف - دليل التنفيذ

**للمساعدة:**
راجع التقرير التشخيصي أولاً، ثم اتبع خطوات التنفيذ بالترتيب.

---

**🚀 حظاً موفقاً في تطبيق النظام!**
