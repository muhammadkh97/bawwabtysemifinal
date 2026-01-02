// نظام العملات للدول العربية
export const CURRENCIES = {
  ILS: { symbol: '₪', name: 'شيكل فلسطيني', code: 'ILS', flag: '🇵🇸', rate: 1 },
  JOD: { symbol: 'د.أ', name: 'دينار أردني', code: 'JOD', flag: '🇯🇴', rate: 0.19 },
  SAR: { symbol: 'ر.س', name: 'ريال سعودي', code: 'SAR', flag: '🇸🇦', rate: 1.36 },
  AED: { symbol: 'د.إ', name: 'درهم إماراتي', code: 'AED', flag: '🇦🇪', rate: 1.0 },
  EGP: { symbol: 'ج.م', name: 'جنيه مصري', code: 'EGP', flag: '🇪🇬', rate: 8.5 },
  KWD: { symbol: 'د.ك', name: 'دينار كويتي', code: 'KWD', flag: '🇰🇼', rate: 0.083 },
  QAR: { symbol: 'ر.ق', name: 'ريال قطري', code: 'QAR', flag: '🇶🇦', rate: 0.99 },
  OMR: { symbol: 'ر.ع', name: 'ريال عماني', code: 'OMR', flag: '🇴🇲', rate: 0.10 },
  BHD: { symbol: 'د.ب', name: 'دينار بحريني', code: 'BHD', flag: '🇧🇭', rate: 0.10 },
  LBP: { symbol: 'ل.ل', name: 'ليرة لبنانية', code: 'LBP', flag: '🇱🇧', rate: 4100 },
  SYP: { symbol: 'ل.س', name: 'ليرة سورية', code: 'SYP', flag: '🇸🇾', rate: 6850 },
  IQD: { symbol: 'د.ع', name: 'دينار عراقي', code: 'IQD', flag: '🇮🇶', rate: 356 },
  YER: { symbol: 'ر.ي', name: 'ريال يمني', code: 'YER', flag: '🇾🇪', rate: 68 },
  TND: { symbol: 'د.ت', name: 'دينار تونسي', code: 'TND', flag: '🇹🇳', rate: 0.84 },
  DZD: { symbol: 'د.ج', name: 'دينار جزائري', code: 'DZD', flag: '🇩🇿', rate: 36 },
  MAD: { symbol: 'د.م', name: 'درهم مغربي', code: 'MAD', flag: '🇲🇦', rate: 2.7 },
  LYD: { symbol: 'د.ل', name: 'دينار ليبي', code: 'LYD', flag: '🇱🇾', rate: 1.3 },
  SDG: { symbol: 'ج.س', name: 'جنيه سوداني', code: 'SDG', flag: '🇸🇩', rate: 164 },
  MRU: { symbol: 'أ.م', name: 'أوقية موريتانية', code: 'MRU', flag: '🇲🇷', rate: 10.2 },
  USD: { symbol: '$', name: 'دولار أمريكي', code: 'USD', flag: '🇺🇸', rate: 0.27 },
  EUR: { symbol: '€', name: 'يورو', code: 'EUR', flag: '🇪🇺', rate: 0.25 },
};

export type CurrencyCode = keyof typeof CURRENCIES;

// الحصول على العملة المحفوظة
export function getSavedCurrency(): CurrencyCode {
  if (typeof window === 'undefined') return 'ILS';
  
  const saved = localStorage.getItem('selectedCurrency');
  return (saved as CurrencyCode) || 'ILS';
}

// حفظ العملة المختارة
export function saveCurrency(code: CurrencyCode) {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('selectedCurrency', code);
  // إعادة تحميل الصفحة لتطبيق العملة الجديدة
  window.location.reload();
}

// تحويل السعر من الشيكل إلى العملة المختارة
export function convertPrice(priceInILS: number, toCurrency?: CurrencyCode): number {
  const currency = toCurrency || getSavedCurrency();
  const rate = CURRENCIES[currency].rate;
  return Math.round(priceInILS * rate * 100) / 100;
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
