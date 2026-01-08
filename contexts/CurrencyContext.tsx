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
      const savedCurrency = (typeof window !== 'undefined' ? localStorage.getItem('preferred_currency') : null);
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
      // جلب جميع أسعار الصرف (من وإلى USD)
      const { data, error } = await import('@/lib/supabase').then(m => m.supabase
        .from('exchange_rates')
        .select('base_currency, target_currency, rate')
      );
      
      if (error) {
        console.warn('⚠️ Error loading exchange rates from database, using hardcoded rates:', error.message);
        // Use hardcoded rates as fallback
        const hardcodedRates = getHardcodedRates(selectedCurrency);
        setExchangeRates(hardcodedRates);
        setExchangeRatesLoaded(true);
        return;
      }

      // بناء خريطة أسعار الصرف
      const ratesMap: Record<string, Record<string, number>> = {};
      data?.forEach(rate => {
        if (!ratesMap[rate.base_currency]) {
          ratesMap[rate.base_currency] = {};
        }
        ratesMap[rate.base_currency][rate.target_currency] = rate.rate;
      });

      // حساب أسعار التحويل إلى العملة المستهدفة (عبر USD)
      const rates: Record<string, number> = {};
      
      // الحصول على جميع العملات المتاحة
      const allCurrencies = new Set<string>();
      Object.keys(ratesMap).forEach(base => {
        allCurrencies.add(base);
        Object.keys(ratesMap[base]).forEach(target => allCurrencies.add(target));
      });
      
      // للتحويل من أي عملة إلى العملة المستهدفة
      allCurrencies.forEach(fromCurrency => {
        if (fromCurrency === selectedCurrency) {
          rates[fromCurrency] = 1;
        } else if (ratesMap[fromCurrency]?.[selectedCurrency]) {
          // تحويل مباشر موجود
          rates[fromCurrency] = ratesMap[fromCurrency][selectedCurrency];
        } else if (ratesMap[fromCurrency]?.['USD'] && ratesMap['USD']?.[selectedCurrency]) {
          // التحويل عبر USD: fromCurrency → USD → selectedCurrency
          rates[fromCurrency] = ratesMap[fromCurrency]['USD'] * ratesMap['USD'][selectedCurrency];
        } else if (ratesMap[selectedCurrency]?.[fromCurrency]) {
          // التحويل العكسي: إذا كان لدينا selectedCurrency → fromCurrency، نعكسه
          rates[fromCurrency] = 1 / ratesMap[selectedCurrency][fromCurrency];
        } else if (ratesMap['USD']?.[fromCurrency] && ratesMap[selectedCurrency]?.['USD']) {
          // التحويل عبر USD بالعكس: USD → fromCurrency و selectedCurrency → USD
          rates[fromCurrency] = ratesMap['USD'][fromCurrency] * ratesMap[selectedCurrency]['USD'];
        }
      });
      
      // إضافة سعر 1 للعملة نفسها
      rates[selectedCurrency] = 1;
      
      // If no data returned, use hardcoded rates
      if (Object.keys(rates).length <= 1) {
        const hardcodedRates = getHardcodedRates(selectedCurrency);
        setExchangeRates(hardcodedRates);
        setExchangeRatesLoaded(true);
        return;
      }
      
      setExchangeRates(rates);
      setExchangeRatesLoaded(true);
    } catch (error) {
      console.error('❌ خطأ في تحميل أسعار الصرف:', error);
      // Use hardcoded rates as final fallback
      const hardcodedRates = getHardcodedRates(selectedCurrency);
      setExchangeRates(hardcodedRates);
      setExchangeRatesLoaded(true);
    }
  };

  // جلب العملة المفضلة للمستخدم من قاعدة البيانات
  const loadUserPreferredCurrency = async () => {
    if (!user?.id) return;
    
    try {
      const preferredCurrency = await getUserPreferredCurrency(user.id);
      if (preferredCurrency && SUPPORTED_CURRENCIES[preferredCurrency]) {
        setSelectedCurrency(preferredCurrency);
        (typeof window !== 'undefined' ? localStorage.setItem('preferred_currency', preferredCurrency) : null);
      }
    } catch (error) {
      console.error('Error loading user preferred currency:', error);
    }
  };

  // دالة لتحديث العملات يدوياً
  const refreshCurrencies = async () => {
    await loadCurrencies();
  };

  // تغيير العملة المفضلة
  const changeCurrency = async (currency: string) => {
    if (!SUPPORTED_CURRENCIES[currency]) return;
    
    setSelectedCurrency(currency);
    (typeof window !== 'undefined' ? localStorage.setItem('preferred_currency', currency) : null);
    
    // إذا كان المستخدم مسجلاً الدخول، حفظ في قاعدة البيانات
    if (user?.id) {
      try {
        await updateUserPreferredCurrency(user.id, currency);
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
