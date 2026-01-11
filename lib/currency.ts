import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

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
      logger.error('Error fetching currencies', { error: error.message, component: 'getCurrencies' });
      return [];
    }

    return data || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error in getCurrencies', { error: errorMessage, component: 'getCurrencies' });
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
      logger.error('Error converting currency', { error: error.message, component: 'convertCurrency', fromCurrency, toCurrency });
      return amount; // إرجاع المبلغ الأصلي في حالة الخطأ
    }

    return data || amount;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error in convertCurrency', { error: errorMessage, component: 'convertCurrency', fromCurrency, toCurrency });
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
      logger.error('Error fetching exchange rate', { error: error.message, component: 'getExchangeRate', fromCurrency, toCurrency });
      return null;
    }

    return data?.rate || null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error in getExchangeRate', { error: errorMessage, component: 'getExchangeRate', fromCurrency, toCurrency });
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
      logger.error('Error fetching user preferred currency', { error: error.message, component: 'getUserPreferredCurrency', userId });
      return null;
    }

    return data?.preferred_currency || null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error in getUserPreferredCurrency', { error: errorMessage, component: 'getUserPreferredCurrency', userId });
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
      logger.error('Error updating user preferred currency', { error: error.message, component: 'updateUserPreferredCurrency', userId, currencyCode });
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error in updateUserPreferredCurrency', { error: errorMessage, component: 'updateUserPreferredCurrency', userId, currencyCode });
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
      logger.error('Error fetching products with converted prices', { error: error.message, component: 'getProductsWithConvertedPrices' });
      return [];
    }

    return data || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error in getProductsWithConvertedPrices', { error: errorMessage, component: 'getProductsWithConvertedPrices' });
    return [];
  }
}
