import { supabase } from '@/lib/supabase';

/**
 * واجهات APIs لأسعار الصرف
 * Multiple exchange rate API providers with fallback
 */
export interface ExchangeRateSource {
  name: string;
  fetch: () => Promise<Record<string, number> | null>;
}

/**
 * 1. ExchangeRate-API (مجاني 100%)
 */
const exchangeRateAPI: ExchangeRateSource = {
  name: 'ExchangeRate-API',
  fetch: async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/SAR');
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.rates || null;
    } catch (error) {
      console.error('ExchangeRate-API error:', error);
      return null;
    }
  },
};

/**
 * 2. Frankfurter (البنك المركزي الأوروبي - مجاني)
 */
const frankfurterAPI: ExchangeRateSource = {
  name: 'Frankfurter',
  fetch: async () => {
    try {
      const response = await fetch('https://api.frankfurter.app/latest?from=SAR');
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.rates || null;
    } catch (error) {
      console.error('Frankfurter API error:', error);
      return null;
    }
  },
};

/**
 * 3. Currency API (مجاني - بديل)
 */
const currencyAPI: ExchangeRateSource = {
  name: 'Currency API',
  fetch: async () => {
    try {
      const response = await fetch('https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/sar.json');
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.sar || null;
    } catch (error) {
      console.error('Currency API error:', error);
      return null;
    }
  },
};

/**
 * جلب أسعار الصرف من APIs عالمية مع fallback
 */
export async function fetchGlobalExchangeRates(): Promise<Record<string, number> | null> {
  const sources = [exchangeRateAPI, frankfurterAPI, currencyAPI];

  for (const source of sources) {
    console.log(`📡 Trying ${source.name}...`);
    const rates = await source.fetch();
    
    if (rates && Object.keys(rates).length > 0) {
      console.log(`✅ Success with ${source.name}`);
      return rates;
    }
  }

  console.error('❌ All exchange rate APIs failed');
  return null;
}

/**
 * جلب أحدث أسعار الصرف من قاعدة البيانات
 * Fetch latest exchange rates from database
 */
export async function getLatestExchangeRates() {
  try {
    const { data, error } = await supabase.rpc('get_latest_exchange_rates');

    if (error) {
      console.error('Error fetching exchange rates:', error);
      return null;
    }

    // تحويل النتائج لصيغة object
    const rates: Record<string, { rate: number; lastUpdated: string }> = {};
    
    if (data) {
      data.forEach((item: any) => {
        rates[item.to_currency] = {
          rate: parseFloat(item.rate),
          lastUpdated: item.last_updated,
        };
      });
    }

    return rates;
  } catch (error) {
    console.error('Error in getLatestExchangeRates:', error);
    return null;
  }
}

/**
 * تحديث أسعار الصرف من APIs عالمية
 * Update exchange rates from external API
 */
export async function updateExchangeRatesFromAPI() {
  try {
    // جلب من APIs عالمية مع fallback
    const globalRates = await fetchGlobalExchangeRates();
    
    if (!globalRates) {
      console.error('❌ Failed to fetch rates from global APIs');
      return { success: false, error: 'No API available' };
    }

    // تحضير البيانات للإرسال لقاعدة البيانات
    const supportedCurrencies = ['USD', 'ILS', 'EUR', 'GBP', 'AED', 'EGP', 'JOD', 'KWD', 'QAR', 'OMR', 'BHD'];
    const rates = supportedCurrencies
      .filter(currency => globalRates[currency] || globalRates[currency.toLowerCase()])
      .map(currency => ({
        currency,
        rate: globalRates[currency] || globalRates[currency.toLowerCase()],
      }));

    if (rates.length === 0) {
      console.error('❌ No supported currencies found in API response');
      return { success: false, error: 'No supported currencies found' };
    }

    // تحديث قاعدة البيانات
    const { data: updateResult, error: updateError } = await supabase.rpc('update_exchange_rates', {
      p_rates: rates,
      p_source: 'Global API Auto-Update',
    });

    if (updateError) {
      console.error('Error updating exchange rates in database:', updateError);
      return { success: false, error: updateError };
    }

    console.log(`✅ تم تحديث ${updateResult} سعر صرف بنجاح من APIs عالمية`);
    return { success: true, count: updateResult, rates };
  } catch (error) {
    console.error('Error updating exchange rates:', error);
    return { success: false, error };
  }
}

/**
 * استدعاء Supabase Edge Function لتحديث الأسعار
 * Trigger Edge Function to update rates
 */
export async function triggerExchangeRatesUpdate() {
  try {
    const { data, error } = await supabase.functions.invoke('update-exchange-rates', {
      body: {},
    });

    if (error) {
      console.error('Edge Function error:', error);
      return { success: false, error };
    }

    console.log('✅ Exchange rates updated via Edge Function:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error invoking Edge Function:', error);
    return { success: false, error };
  }
}

/**
 * تحديث سعر صرف عملة واحدة
 * Update single currency rate
 */
export async function updateSingleRate(currency: string, rate: number, source: string = 'Manual') {
  try {
    const { data, error } = await supabase.rpc('update_exchange_rates', {
      p_rates: [{ currency, rate }],
      p_source: source,
    });

    if (error) {
      console.error('Error updating rate:', error);
      return { success: false, error };
    }

    return { success: true, count: data };
  } catch (error) {
    console.error('Error in updateSingleRate:', error);
    return { success: false, error };
  }
}

/**
 * الحصول على عمر آخر تحديث للأسعار (بالساعات)
 * Get age of last update in hours
 */
export async function getExchangeRatesAge() {
  try {
    const rates = await getLatestExchangeRates();
    
    if (!rates || Object.keys(rates).length === 0) {
      return null;
    }

    // أخذ أول عملة للتحقق من آخر تحديث
    const firstCurrency = Object.keys(rates)[0];
    const lastUpdated = new Date(rates[firstCurrency].lastUpdated);
    const now = new Date();
    const ageInHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

    return {
      lastUpdated,
      ageInHours,
      needsUpdate: ageInHours > 24, // تحديث إذا مر أكثر من 24 ساعة
    };
  } catch (error) {
    console.error('Error getting exchange rates age:', error);
    return null;
  }
}

/**
 * جدولة تحديث تلقائي (للاستخدام في useEffect)
 * Schedule automatic updates
 */
export function scheduleExchangeRatesUpdate(intervalHours: number = 24) {
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  // تحديث فوري عند التشغيل
  updateExchangeRatesFromAPI();
  
  // جدولة تحديث دوري
  const intervalId = setInterval(() => {
    console.log('🕐 Scheduled exchange rates update triggered...');
    updateExchangeRatesFromAPI();
  }, intervalMs);

  // إرجاع دالة لإلغاء الجدولة
  return () => {
    console.log('🛑 Stopping scheduled exchange rates updates');
    clearInterval(intervalId);
  };
}
