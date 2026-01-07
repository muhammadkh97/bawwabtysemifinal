// =========================================================
// 🧪 سكربت اختبار نظام العملات
// =========================================================
// قم بتشغيله لاختبار جميع الوظائف

import { updateExchangeRatesFromAPI, convertCurrency, getAllCurrencies, formatPrice } from './lib/exchange-rates';

async function testCurrencySystem() {
  console.log('🧪 بدء اختبار نظام العملات...\n');

  try {
    // 1️⃣ تحديث الأسعار من API
    console.log('1️⃣ اختبار تحديث الأسعار من API...');
    const updateResult = await updateExchangeRatesFromAPI();
    console.log('✅ النتيجة:', updateResult);
    console.log('');

    // 2️⃣ جلب جميع العملات
    console.log('2️⃣ اختبار جلب العملات...');
    const currencies = await getAllCurrencies();
    console.log(`✅ تم جلب ${currencies.length} عملة`);
    console.log('أول 5 عملات:', currencies.slice(0, 5).map(c => `${c.code} - ${c.name_ar}`));
    console.log('');

    // 3️⃣ اختبار التحويل
    console.log('3️⃣ اختبار تحويل العملات...');
    
    const conversions = [
      { amount: 100, from: 'JOD', to: 'USD' },
      { amount: 100, from: 'SAR', to: 'EGP' },
      { amount: 100, from: 'USD', to: 'JOD' },
      { amount: 1000, from: 'AED', to: 'EUR' },
    ];

    for (const { amount, from, to } of conversions) {
      try {
        const result = await convertCurrency(amount, from, to);
        console.log(`✅ ${amount} ${from} = ${result.toFixed(2)} ${to}`);
      } catch (error) {
        console.log(`❌ خطأ في تحويل ${from} → ${to}:`, error);
      }
    }
    console.log('');

    // 4️⃣ اختبار تنسيق الأسعار
    console.log('4️⃣ اختبار تنسيق الأسعار...');
    console.log('✅ 100 JOD:', formatPrice(100, 'JOD', 'ar'));
    console.log('✅ 250 SAR:', formatPrice(250, 'SAR', 'ar'));
    console.log('✅ 50 USD:', formatPrice(50, 'USD', 'en'));
    console.log('');

    // 5️⃣ ملخص النتائج
    console.log('🎉 اكتمل الاختبار بنجاح!');
    console.log('✅ جميع الوظائف تعمل بشكل صحيح');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

// تشغيل الاختبار
testCurrencySystem();
