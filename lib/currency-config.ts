/**
 * ملف تكوين العملات
 * Currency configuration file
 * 
 * يدعم جميع العملات العربية + الدولار واليورو والشيكل
 */

export interface Currency {
  symbol: string;
  code: string;
  name: string;
  nameEn: string;
  flag: string;
  country: string;
  rate?: number; // سعر الصرف مقابل العملة الأساسية
}

// قائمة جميع العملات المدعومة
export const CURRENCIES: Record<string, Currency> = {
  JOD: {
    symbol: 'د.أ',
    code: 'JOD',
    name: 'دينار أردني',
    nameEn: 'Jordanian Dinar',
    flag: '🇯🇴',
    country: 'الأردن',
    rate: 1,
  },
  SAR: {
    symbol: 'ر.س',
    code: 'SAR',
    name: 'ريال سعودي',
    nameEn: 'Saudi Riyal',
    flag: '🇸🇦',
    country: 'السعودية',
    rate: 1,
  },
  AED: {
    symbol: 'د.إ',
    code: 'AED',
    name: 'درهم إماراتي',
    nameEn: 'UAE Dirham',
    flag: '🇦🇪',
    country: 'الإمارات',
    rate: 1,
  },
  KWD: {
    symbol: 'د.ك',
    code: 'KWD',
    name: 'دينار كويتي',
    nameEn: 'Kuwaiti Dinar',
    flag: '🇰🇼',
    country: 'الكويت',
    rate: 1,
  },
  BHD: {
    symbol: 'د.ب',
    code: 'BHD',
    name: 'دينار بحريني',
    nameEn: 'Bahraini Dinar',
    flag: '🇧🇭',
    country: 'البحرين',
    rate: 1,
  },
  QAR: {
    symbol: 'ر.ق',
    code: 'QAR',
    name: 'ريال قطري',
    nameEn: 'Qatari Riyal',
    flag: '🇶🇦',
    country: 'قطر',
    rate: 1,
  },
  OMR: {
    symbol: 'ر.ع',
    code: 'OMR',
    name: 'ريال عماني',
    nameEn: 'Omani Rial',
    flag: '🇴🇲',
    country: 'عمان',
    rate: 1,
  },
  EGP: {
    symbol: 'ج.م',
    code: 'EGP',
    name: 'جنيه مصري',
    nameEn: 'Egyptian Pound',
    flag: '🇪🇬',
    country: 'مصر',
    rate: 1,
  },
  LBP: {
    symbol: 'ل.ل',
    code: 'LBP',
    name: 'ليرة لبنانية',
    nameEn: 'Lebanese Pound',
    flag: '🇱🇧',
    country: 'لبنان',
    rate: 1,
  },
  SYP: {
    symbol: 'ل.س',
    code: 'SYP',
    name: 'ليرة سورية',
    nameEn: 'Syrian Pound',
    flag: '🇸🇾',
    country: 'سوريا',
    rate: 1,
  },
  IQD: {
    symbol: 'د.ع',
    code: 'IQD',
    name: 'دينار عراقي',
    nameEn: 'Iraqi Dinar',
    flag: '🇮🇶',
    country: 'العراق',
    rate: 1,
  },
  YER: {
    symbol: 'ر.ي',
    code: 'YER',
    name: 'ريال يمني',
    nameEn: 'Yemeni Rial',
    flag: '🇾🇪',
    country: 'اليمن',
    rate: 1,
  },
  ILS: {
    symbol: '₪',
    code: 'ILS',
    name: 'شيكل',
    nameEn: 'Shekel',
    flag: '🪙',
    country: 'فلسطين',
    rate: 1,
  },
  USD: {
    symbol: '$',
    code: 'USD',
    name: 'دولار أمريكي',
    nameEn: 'US Dollar',
    flag: '🇺🇸',
    country: 'الولايات المتحدة',
    rate: 1,
  },
  EUR: {
    symbol: '€',
    code: 'EUR',
    name: 'يورو',
    nameEn: 'Euro',
    flag: '🇪🇺',
    country: 'الاتحاد الأوروبي',
    rate: 1,
  },
};

// العملة الافتراضية
export const DEFAULT_CURRENCY_CODE = 'JOD';
export const CURRENCY = CURRENCIES[DEFAULT_CURRENCY_CODE];

export function formatPrice(price: number, currencyCode: string = DEFAULT_CURRENCY_CODE): string {
  const currency = CURRENCIES[currencyCode] || CURRENCY;
  return `${price.toLocaleString('ar-SA')} ${currency.symbol}`;
}

export function parsePrice(priceString: string): number {
  return parseFloat(priceString.replace(/[^\d.]/g, ''));
}

// الحصول على قائمة العملات للعرض في القوائم المنسدلة
export function getCurrencyOptions() {
  return Object.values(CURRENCIES).map(currency => ({
    value: currency.code,
    label: `${currency.flag} ${currency.name} (${currency.symbol})`,
    symbol: currency.symbol,
    name: currency.name,
  }));
}

