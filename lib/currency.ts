import { supabase } from '@/lib/supabase';

/**
 * واجهة العملة
 */
export interface Currency {
  code: string;
  name_en: string;
  name_ar: string;
  symbol: string;
  flag: string;
  decimal_places: number;
  is_active: boolean;
  display_order: number;
}

/**
 * واجهة سعر الصرف
 */
export interface ExchangeRate {
  base_currency: string;
  target_currency: string;
  rate: number;
  last_updated: string;
}

/**
 * جلب جميع العملات النشطة من قاعدة البيانات
 */
export async function getCurrencies(): Promise<Currency[]> {
  try {
    const { data, error } = await supabase
      .from('currencies')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Error fetching currencies:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCurrencies:', error);
    return [];
  }
}

/**
 * تحويل السعر من عملة لأخرى باستخدام دالة قاعدة البيانات
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('convert_currency', {
      amount,
      from_curr: fromCurrency,
      to_curr: toCurrency,
    });

    if (error) {
      console.error('Error converting currency:', error);
      return amount; // إرجاع المبلغ الأصلي في حالة الخطأ
    }

    return data || amount;
  } catch (error) {
    console.error('Error in convertCurrency:', error);
    return amount;
  }
}

/**
 * جلب سعر الصرف المباشر بين عملتين
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('base_currency', fromCurrency)
      .eq('target_currency', toCurrency)
      .single();

    if (error) {
      console.error('Error fetching exchange rate:', error);
      return null;
    }

    return data?.rate || null;
  } catch (error) {
    console.error('Error in getExchangeRate:', error);
    return null;
  }
}

/**
 * تنسيق السعر بالعملة المحددة
 */
export function formatPrice(
  amount: number,
  currencyCode: string,
  currencyInfo?: Currency
): string {
  const decimalPlaces = currencyInfo?.decimal_places || 2;
  const symbol = currencyInfo?.symbol || currencyCode;

  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  return `${formattedAmount} ${symbol}`;
}

/**
 * جلب العملة المفضلة للمستخدم من قاعدة البيانات
 */
export async function getUserPreferredCurrency(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('preferred_currency')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user preferred currency:', error);
      return null;
    }

    return data?.preferred_currency || null;
  } catch (error) {
    console.error('Error in getUserPreferredCurrency:', error);
    return null;
  }
}

/**
 * تحديث العملة المفضلة للمستخدم في قاعدة البيانات
 */
export async function updateUserPreferredCurrency(
  userId: string,
  currencyCode: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ preferred_currency: currencyCode })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user preferred currency:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserPreferredCurrency:', error);
    return false;
  }
}

/**
 * جلب المنتجات مع الأسعار المحولة من View
 */
export async function getProductsWithConvertedPrices() {
  try {
    const { data, error } = await supabase
      .from('products_with_converted_prices')
      .select('*');

    if (error) {
      console.error('Error fetching products with converted prices:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getProductsWithConvertedPrices:', error);
    return [];
  }
}

// تنسيق السعر مع رمز العملة
export function formatPrice(priceInILS: number, toCurrency?: CurrencyCode): string {
  const currency = toCurrency || getSavedCurrency();
  const converted = convertPrice(priceInILS, currency);
  const symbol = CURRENCIES[currency].symbol;
  
  return `${converted.toFixed(2)} ${symbol}`;
}

// الحصول على معلومات العملة الحالية
export function getCurrentCurrency() {
  const code = getSavedCurrency();
  return CURRENCIES[code];
}
