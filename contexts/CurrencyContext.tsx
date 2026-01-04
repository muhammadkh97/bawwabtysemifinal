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
  convertPrice: (price: number, fromCurrency?: string) => Promise<number>;
  formatPrice: (price: number, fromCurrency?: string) => Promise<string>;
  getCurrencySymbol: (currency: string) => string;
  getCurrencyInfo: (currency: string) => Currency | undefined;
  currencies: Currency[];
  isLoading: boolean;
  refreshCurrencies: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('JOD');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // تحميل العملات من قاعدة البيانات
  useEffect(() => {
    loadCurrencies();
  }, []);

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

  // تحويل السعر باستخدام دالة قاعدة البيانات
  const convertPrice = async (price: number, fromCurrency: string = 'SAR'): Promise<number> => {
    if (!fromCurrency || fromCurrency === selectedCurrency) {
      return price;
    }

    try {
      const converted = await dbConvertCurrency(price, fromCurrency, selectedCurrency);
      return converted;
    } catch (error) {
      console.error('Error converting price:', error);
      return price; // إرجاع السعر الأصلي في حالة الخطأ
    }
  };

  // تنسيق السعر
  const formatPrice = async (price: number, fromCurrency: string = 'SAR'): Promise<string> => {
    const convertedPrice = await convertPrice(price, fromCurrency);
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
