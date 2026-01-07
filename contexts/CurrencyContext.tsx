'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrencies, convertCurrency as dbConvertCurrency, getUserPreferredCurrency, updateUserPreferredCurrency, Currency } from '@/lib/currency';
import { useAuth } from '@/contexts/AuthContext';

// العملات المدعومة - سيتم تحميلها من قاعدة البيانات
export let SUPPORTED_CURRENCIES: Record<string, Currency> = {};

export type CurrencyCode = string;

interface CurrencyContextType {
  selectedCurrency: string;
  changeCurrency: (currency: string) => Promise<void>;
  convertPrice: (price: number, fromCurrency?: string) => number;
  formatPrice: (price: number, fromCurrency?: string) => string;
  getCurrencySymbol: (currency: string) => string;
  getCurrencyInfo: (currency: string) => Currency | undefined;
  currencies: Currency[];
  isLoading: boolean;
  refreshCurrencies: () => Promise<void>;
  exchangeRatesLoaded: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('JOD');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [exchangeRatesLoaded, setExchangeRatesLoaded] = useState(false);
  const { user } = useAuth();

  // تحميل العملات وأسعار الصرف من قاعدة البيانات
  useEffect(() => {
    loadCurrencies();
    loadExchangeRates();
  }, []);

  // تحميل أسعار الصرف عند تغيير العملة المختارة
  useEffect(() => {
    if (selectedCurrency) {
      loadExchangeRates();
    }
  }, [selectedCurrency]);

  // تحميل العملة المفضلة للمستخدم
  useEffect(() => {
    if (user?.id) {
      loadUserPreferredCurrency();
    } else {
      // إذا لم يكن المستخدم مسجلاً الدخول، استخدم localStorage
      const savedCurrency = localStorage.getItem('preferred_currency');
      if (savedCurrency) {
        setSelectedCurrency(savedCurrency);
      }
    }
  }, [user]);

  // جلب العملات من قاعدة البيانات
  const loadCurrencies = async () => {
    try {
      setIsLoading(true);
      const currenciesData = await getCurrencies();
      
      if (currenciesData.length > 0) {
        setCurrencies(currenciesData);
        
        // تحديث SUPPORTED_CURRENCIES
        SUPPORTED_CURRENCIES = {};
        currenciesData.forEach((currency) => {
          SUPPORTED_CURRENCIES[currency.code] = currency;
        });
        
        console.log(`✅ تم تحميل ${currenciesData.length} عملة من قاعدة البيانات`);
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل العملات:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Hardcoded exchange rates (fallback if database is unavailable)
  const getHardcodedRates = (targetCurrency: string): Record<string, number> => {
    // All rates are based on USD = 1.0
    const usdRates: Record<string, number> = {
      'USD': 1.0,
      'SAR': 3.75,
      'ILS': 3.65,
      'JOD': 0.71,
      'EGP': 49.5,
      'AED': 3.67,
      'KWD': 0.31
    };

    const targetRate = usdRates[targetCurrency] || 1;
    const rates: Record<string, number> = {};
    
    // Convert all currencies to target currency
    Object.entries(usdRates).forEach(([currency, rateToUSD]) => {
      rates[currency] = targetRate / rateToUSD;
    });
    
    return rates;
  };

  // جلب أسعار الصرف من قاعدة البيانات
  const loadExchangeRates = async () => {
    try {
      const { data, error } = await import('@/lib/supabase').then(m => m.supabase
        .from('exchange_rates')
        .select('base_currency, target_currency, rate')
        .eq('target_currency', selectedCurrency)
      );
      
      if (error) {
        console.warn('⚠️ Error loading exchange rates from database, using hardcoded rates:', error.message);
        // Use hardcoded rates as fallback
        const hardcodedRates = getHardcodedRates(selectedCurrency);
        setExchangeRates(hardcodedRates);
        setExchangeRatesLoaded(true);
        console.log(`✅ استخدام أسعار صرف ثابتة (${Object.keys(hardcodedRates).length} عملة)`);
        return;
      }

      const rates: Record<string, number> = {};
      data?.forEach(rate => {
        rates[rate.base_currency] = rate.rate;
      });
      
      // إضافة سعر 1 للعملة نفسها
      rates[selectedCurrency] = 1;
      
      // If no data returned, use hardcoded rates
      if (Object.keys(rates).length <= 1) {
        const hardcodedRates = getHardcodedRates(selectedCurrency);
        setExchangeRates(hardcodedRates);
        setExchangeRatesLoaded(true);
        console.log(`✅ استخدام أسعار صرف ثابتة (${Object.keys(hardcodedRates).length} عملة)`);
        return;
      }
      
      setExchangeRates(rates);
      setExchangeRatesLoaded(true);
      console.log(`✅ تم تحميل ${Object.keys(rates).length} سعر صرف للعملة ${selectedCurrency}`);
    } catch (error) {
      console.error('❌ خطأ في تحميل أسعار الصرف:', error);
      // Use hardcoded rates as final fallback
      const hardcodedRates = getHardcodedRates(selectedCurrency);
      setExchangeRates(hardcodedRates);
      setExchangeRatesLoaded(true);
      console.log(`✅ استخدام أسعار صرف ثابتة كـ fallback (${Object.keys(hardcodedRates).length} عملة)`);
    }
  };

  // جلب العملة المفضلة للمستخدم من قاعدة البيانات
  const loadUserPreferredCurrency = async () => {
    if (!user?.id) return;
    
    try {
      const preferredCurrency = await getUserPreferredCurrency(user.id);
      if (preferredCurrency && SUPPORTED_CURRENCIES[preferredCurrency]) {
        setSelectedCurrency(preferredCurrency);
        localStorage.setItem('preferred_currency', preferredCurrency);
      }
    } catch (error) {
      console.error('Error loading user preferred currency:', error);
    }
  };

  // دالة لتحديث العملات يدوياً
  const refreshCurrencies = async () => {
    console.log('🔄 تحديث العملات يدوياً...');
    await loadCurrencies();
  };

  // تغيير العملة المفضلة
  const changeCurrency = async (currency: string) => {
    if (!SUPPORTED_CURRENCIES[currency]) return;
    
    setSelectedCurrency(currency);
    localStorage.setItem('preferred_currency', currency);
    
    // إذا كان المستخدم مسجلاً الدخول، حفظ في قاعدة البيانات
    if (user?.id) {
      try {
        await updateUserPreferredCurrency(user.id, currency);
        console.log(`✅ تم حفظ العملة المفضلة: ${currency}`);
      } catch (error) {
        console.error('Error updating preferred currency in database:', error);
      }
    }
  };

  // تحويل السعر باستخدام أسعار الصرف المحملة مسبقاً
  const convertPrice = (price: number, fromCurrency: string = 'SAR'): number => {
    if (!fromCurrency || fromCurrency === selectedCurrency) {
      return price;
    }

    // إذا كان السعر مساوياً للعملة المستهدفة، إرجاعه مباشرة
    const rate = exchangeRates[fromCurrency];
    if (!rate || rate === 0) {
      console.warn(`⚠️ لا يوجد سعر صرف للعملة ${fromCurrency} إلى ${selectedCurrency}`);
      return price; // إرجاع السعر الأصلي
    }

    return price * rate;
  };

  // تنسيق السعر (متزامن الآن)
  const formatPrice = (price: number, fromCurrency: string = 'SAR'): string => {
    const convertedPrice = convertPrice(price, fromCurrency);
    const currencyInfo = SUPPORTED_CURRENCIES[selectedCurrency];
    
    if (!currencyInfo) {
      return `${convertedPrice.toFixed(2)}`;
    }

    const decimalPlaces = currencyInfo.decimal_places || 2;
    const formattedNumber = convertedPrice.toLocaleString('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });

    return `${formattedNumber} ${currencyInfo.symbol}`;
  };

  const getCurrencySymbol = (currency: string): string => {
    return SUPPORTED_CURRENCIES[currency]?.symbol || '';
  };

  const getCurrencyInfo = (currency: string): Currency | undefined => {
    return SUPPORTED_CURRENCIES[currency];
  };

  return (
    <CurrencyContext.Provider
      value={{
        selectedCurrency,
        changeCurrency,
        convertPrice,
        formatPrice,
        getCurrencySymbol,
        getCurrencyInfo,
        currencies,
        isLoading,
        refreshCurrencies,
        exchangeRatesLoaded,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
