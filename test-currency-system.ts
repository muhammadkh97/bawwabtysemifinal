// =========================================================
// 🧪 سكربت اختبار نظام العملات
// =========================================================
// قم بتشغيله لاختبار جميع الوظائف

import { updateExchangeRatesFromAPI, convertCurrency, getAllCurrencies, formatPrice } from './lib/exchange-rates';

async function testCurrencySystem() {

  try {
    // 1️⃣ تحديث الأسعار من API
    const updateResult = await updateExchangeRatesFromAPI();

    // 2️⃣ جلب جميع العملات
    const currencies = await getAllCurrencies();

    // 3️⃣ اختبار التحويل
    
    const conversions = [
      { amount: 100, from: 'JOD', to: 'USD' },
      { amount: 100, from: 'SAR', to: 'EGP' },
      { amount: 100, from: 'USD', to: 'JOD' },
      { amount: 1000, from: 'AED', to: 'EUR' },
    ];

    for (const { amount, from, to } of conversions) {
      try {
        const result = await convertCurrency(amount, from, to);
      } catch (error) {
      }
    }

    // 4️⃣ اختبار تنسيق الأسعار

    // 5️⃣ ملخص النتائج
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

// تشغيل الاختبار
testCurrencySystem();
