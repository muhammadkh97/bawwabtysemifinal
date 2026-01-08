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
    const rates = await source.fetch();
    
    if (rates && Object.keys(rates).length > 0) {
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
    const rates: { [key: string]: { rate: number; lastUpdated: string } } = {};
    
    if (data) {
      interface ExchangeRateRow {
        to_currency: string;
        rate: string;
        last_updated: string;
      }
      
      (data as ExchangeRateRow[]).forEach((item) => {
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
    updateExchangeRatesFromAPI();
  }, intervalMs);

  // إرجاع دالة لإلغاء الجدولة
  return () => {
    clearInterval(intervalId);
  };
}

// =========================================================
// إضافات جديدة لدعم نظام العملات المحسّن
// =========================================================

/**
 * Types
 */
export interface Currency {
  code: string;
  name_en: string;
  name_ar: string;
  symbol: string;
  flag: string;
  decimal_places: number;
  country_code: string;
  subunit_name: string;
  is_active: boolean;
}

export interface ExchangeRate {
  currency: string;
  rate: number;
  last_updated: string;
  is_stale: boolean;
}

/**
 * الحصول على جميع العملات النشطة
 */
export async function getAllCurrencies(): Promise<Currency[]> {
  try {
    const { data, error } = await supabase
      .from('currencies')
      .select('code, name_en, name_ar, symbol, flag, decimal_places, country_code, subunit_name, is_active')
      .eq('is_active', true)
      .order('display_order');
    
    if (error) {
      console.error('❌ خطأ في جلب العملات:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getAllCurrencies:', error);
    throw error;
  }
}

/**
 * تحويل مبلغ من عملة إلى أخرى
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (amount === 0) return 0;
  if (fromCurrency === toCurrency) return amount;
  
  try {
    const { data, error } = await supabase.rpc('convert_currency_cached', {
      p_amount: amount,
      p_from_currency: fromCurrency,
      p_to_currency: toCurrency
    });
    
    if (error) {
      console.error(`❌ خطأ في تحويل ${amount} ${fromCurrency} إلى ${toCurrency}:`, error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in convertCurrency:', error);
    throw error;
  }
}

/**
 * الحصول على معلومات عملة محددة
 */
export async function getCurrencyInfo(code: string): Promise<Currency | null> {
  try {
    const { data, error } = await supabase.rpc('get_currency_info', {
      p_code: code
    });
    
    if (error) {
      console.error(`❌ خطأ في جلب معلومات العملة ${code}:`, error);
      return null;
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error in getCurrencyInfo:', error);
    return null;
  }
}

/**
 * تمييز الأسعار القديمة (أكثر من 24 ساعة)
 */
export async function markStaleRates(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('mark_stale_exchange_rates');
    
    if (error) {
      console.error('❌ خطأ في تمييز الأسعار القديمة:', error);
      throw error;
    }
    
    return data || 0;
  } catch (error) {
    console.error('Error in markStaleRates:', error);
    throw error;
  }
}

/**
 * تنسيق السعر حسب العملة
 */
export function formatPrice(
  amount: number,
  currency: string,
  locale: 'ar' | 'en' = 'ar'
): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-JO' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * الحصول على رمز العملة مع العلم
 */
export function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    JOD: 'د.أ 🇯🇴',
    SAR: 'ر.س 🇸🇦',
    ILS: '₪ 🇮🇱',
    USD: '$ 🇺🇸',
    EUR: '€ 🇪🇺',
    GBP: '£ 🇬🇧',
    AED: 'د.إ 🇦🇪',
    KWD: 'د.ك 🇰🇼',
    QAR: 'ر.ق 🇶🇦',
    BHD: 'د.ب 🇧🇭',
    OMR: 'ر.ع 🇴🇲',
    EGP: 'ج.م 🇪🇬',
  };
  
  return symbols[code] || code;
}
