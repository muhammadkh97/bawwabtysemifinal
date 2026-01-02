'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getLatestExchangeRates, updateExchangeRatesFromAPI, getExchangeRatesAge } from '@/lib/exchange-rates';

// العملات المدعومة مع أسعار الصرف الافتراضية (بالنسبة للريال السعودي SAR)
// هذه الأسعار تُستخدم فقط كاحتياطي إذا فشل جلب الأسعار من قاعدة البيانات
const DEFAULT_RATES = {
  SAR: { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي', arabicName: 'ريال', flag: '🇸🇦', rate: 1.0 },
  USD: { code: 'USD', symbol: '$', name: 'دولار أمريكي', arabicName: 'دولار', flag: '🇺🇸', rate: 0.27 },
  ILS: { code: 'ILS', symbol: '₪', name: 'شيكل إسرائيلي', arabicName: 'شيكل', flag: '🇮🇱', rate: 0.95 },
  EUR: { code: 'EUR', symbol: '€', name: 'يورو', arabicName: 'يورو', flag: '🇪🇺', rate: 0.24 },
  GBP: { code: 'GBP', symbol: '£', name: 'جنيه إسترليني', arabicName: 'جنيه', flag: '🇬🇧', rate: 0.21 },
  AED: { code: 'AED', symbol: 'د.إ', name: 'درهم إماراتي', arabicName: 'درهم', flag: '🇦🇪', rate: 0.98 },
  EGP: { code: 'EGP', symbol: 'ج.م', name: 'جنيه مصري', arabicName: 'جنيه', flag: '🇪🇬', rate: 13.2 },
  JOD: { code: 'JOD', symbol: 'د.أ', name: 'دينار أردني', arabicName: 'دينار', flag: '🇯🇴', rate: 0.19 },
  KWD: { code: 'KWD', symbol: 'د.ك', name: 'دينار كويتي', arabicName: 'دينار', flag: '🇰🇼', rate: 0.08 },
  QAR: { code: 'QAR', symbol: 'ر.ق', name: 'ريال قطري', arabicName: 'ريال', flag: '🇶🇦', rate: 0.97 },
  OMR: { code: 'OMR', symbol: 'ر.ع', name: 'ريال عماني', arabicName: 'ريال', flag: '🇴🇲', rate: 0.10 },
  BHD: { code: 'BHD', symbol: 'د.ب', name: 'دينار بحريني', arabicName: 'دينار', flag: '🇧🇭', rate: 0.10 },
  LBP: { code: 'LBP', symbol: 'ل.ل', name: 'ليرة لبنانية', arabicName: 'ليرة', flag: '🇱🇧', rate: 400.0 },
  SYP: { code: 'SYP', symbol: 'ل.س', name: 'ليرة سورية', arabicName: 'ليرة', flag: '🇸🇾', rate: 6700.0 },
  IQD: { code: 'IQD', symbol: 'د.ع', name: 'دينار عراقي', arabicName: 'دينار', flag: '🇮🇶', rate: 350.0 },
  YER: { code: 'YER', symbol: 'ر.ي', name: 'ريال يمني', arabicName: 'ريال', flag: '🇾🇪', rate: 66.5 },
} as const;

export let SUPPORTED_CURRENCIES: Record<string, { code: string; symbol: string; name: string; arabicName: string; flag: string; rate: number }> = { ...DEFAULT_RATES };

export type CurrencyCode = keyof typeof DEFAULT_RATES;

interface CurrencyContextType {
  selectedCurrency: string;
  changeCurrency: (currency: string) => void;
  convertPrice: (price: number, fromCurrency?: string) => number;
  formatPrice: (price: number, fromCurrency?: string) => string;
  getCurrencySymbol: (currency: string) => string;
  getCurrencyInfo: (currency: string) => { code: string; symbol: string; name: string; arabicName: string; flag: string; rate: number } | undefined;
  lastUpdated: Date | null;
  isLoading: boolean;
  refreshRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ILS');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // تحميل العملة المحفوظة عند بدء التطبيق
  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferred_currency');
    if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency as CurrencyCode]) {
      setSelectedCurrency(savedCurrency);
    } else {
      setSelectedCurrency('ILS');
    }
    
    // جلب أحدث أسعار الصرف
    loadExchangeRates();
  }, []);

  // جلب أسعار الصرف من قاعدة البيانات
  const loadExchangeRates = async () => {
    try {
      setIsLoading(true);
      
      // التحقق من عمر آخر تحديث
      const age = await getExchangeRatesAge();
      
      // إذا مر أكثر من 24 ساعة، حدّث من API
      if (!age || age.needsUpdate) {
        console.log('⏰ أسعار الصرف قديمة، جاري التحديث من API...');
        await updateExchangeRatesFromAPI();
      }
      
      // جلب الأسعار من قاعدة البيانات
      const rates = await getLatestExchangeRates();
      
      if (rates) {
        // تحديث SUPPORTED_CURRENCIES بالأسعار الجديدة
        Object.keys(rates).forEach((currency) => {
          if (SUPPORTED_CURRENCIES[currency as CurrencyCode]) {
            SUPPORTED_CURRENCIES[currency as CurrencyCode] = {
              ...SUPPORTED_CURRENCIES[currency as CurrencyCode],
              rate: rates[currency].rate,
            };
          }
        });
        
        setLastUpdated(new Date(rates[Object.keys(rates)[0]]?.lastUpdated || Date.now()));
        console.log('✅ تم تحديث أسعار الصرف بنجاح');
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل أسعار الصرف:', error);
      console.log('⚠️ سيتم استخدام الأسعار الافتراضية');
    } finally {
      setIsLoading(false);
    }
  };

  // دالة لتحديث الأسعار يدوياً
  const refreshRates = async () => {
    console.log('🔄 تحديث أسعار الصرف يدوياً...');
    await loadExchangeRates();
  };

  const changeCurrency = (currency: string) => {
    if (SUPPORTED_CURRENCIES[currency as CurrencyCode]) {
      setSelectedCurrency(currency);
      localStorage.setItem('preferred_currency', currency);
    }
  };

  const convertPrice = (price: number, fromCurrency: string = 'SAR'): number => {
    if (!fromCurrency || fromCurrency === selectedCurrency) {
      return price;
    }

    const fromRate = SUPPORTED_CURRENCIES[fromCurrency as CurrencyCode]?.rate || 1;
    const toRate = SUPPORTED_CURRENCIES[selectedCurrency as CurrencyCode]?.rate || 1;
    
    // تحويل عبر SAR كعملة وسيطة
    const priceInSAR = price / fromRate;
    const convertedPrice = priceInSAR * toRate;
    
    return Math.round(convertedPrice * 100) / 100;
  };

  const formatPrice = (price: number, fromCurrency: string = 'SAR'): string => {
    const convertedPrice = convertPrice(price, fromCurrency);
    const currencyInfo = SUPPORTED_CURRENCIES[selectedCurrency as CurrencyCode];
    
    if (!currencyInfo) {
      return `${convertedPrice.toFixed(2)}`;
    }

    // تنسيق السعر مع فواصل الآلاف
    const formattedNumber = convertedPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `${formattedNumber} ${currencyInfo.symbol}`;
  };

  const getCurrencySymbol = (currency: string): string => {
    return SUPPORTED_CURRENCIES[currency as CurrencyCode]?.symbol || '';
  };

  const getCurrencyInfo = (currency: string): { code: string; symbol: string; name: string; arabicName: string; flag: string; rate: number } | undefined => {
    return SUPPORTED_CURRENCIES[currency as CurrencyCode];
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
        lastUpdated,
        isLoading,
        refreshRates,
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
