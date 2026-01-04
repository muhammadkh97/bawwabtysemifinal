'use client';

import { useCurrency, CurrencyCode, SUPPORTED_CURRENCIES } from '@/contexts/CurrencyContext';
import { Globe, Search, RefreshCw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function CurrencySelector() {
  const { selectedCurrency, changeCurrency, isLoading, refreshCurrencies, currencies: allCurrencies } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currencies: { code: CurrencyCode; label: string; symbol: string; flag: string; group: string }[] = [
    // العملات العربية
    { code: 'JOD', label: 'دينار أردني', symbol: 'د.أ', flag: '🇯🇴', group: 'arab' },
    { code: 'SAR', label: 'ريال سعودي', symbol: 'ر.س', flag: '🇸🇦', group: 'arab' },
    { code: 'AED', label: 'درهم إماراتي', symbol: 'د.إ', flag: '🇦🇪', group: 'arab' },
    { code: 'KWD', label: 'دينار كويتي', symbol: 'د.ك', flag: '🇰🇼', group: 'arab' },
    { code: 'BHD', label: 'دينار بحريني', symbol: 'د.ب', flag: '🇧🇭', group: 'arab' },
    { code: 'QAR', label: 'ريال قطري', symbol: 'ر.ق', flag: '🇶🇦', group: 'arab' },
    { code: 'OMR', label: 'ريال عماني', symbol: 'ر.ع', flag: '🇴🇲', group: 'arab' },
    { code: 'EGP', label: 'جنيه مصري', symbol: 'ج.م', flag: '🇪🇬', group: 'arab' },
    { code: 'LBP', label: 'ليرة لبنانية', symbol: 'ل.ل', flag: '🇱🇧', group: 'arab' },
    { code: 'SYP', label: 'ليرة سورية', symbol: 'ل.س', flag: '🇸🇾', group: 'arab' },
    { code: 'IQD', label: 'دينار عراقي', symbol: 'د.ع', flag: '🇮🇶', group: 'arab' },
    { code: 'YER', label: 'ريال يمني', symbol: 'ر.ي', flag: '🇾🇪', group: 'arab' },
    // عملات أخرى
    { code: 'ILS', label: 'شيكل', symbol: '₪', flag: '�🇸', group: 'other' },
    { code: 'USD', label: 'دولار أمريكي', symbol: '$', flag: '🇺🇸', group: 'other' },
    { code: 'EUR', label: 'يورو', symbol: '€', flag: '🇪🇺', group: 'other' },
  ];

  const currentCurrency = currencies.find(c => c.code === selectedCurrency) || currencies[0];

  // تصفية العملات حسب البحث
  const filteredCurrencies = currencies.filter(curr =>
    curr.label.includes(searchQuery) ||
    curr.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    curr.symbol.includes(searchQuery)
  );

  const arabCurrencies = filteredCurrencies.filter(c => c.group === 'arab');
  const otherCurrencies = filteredCurrencies.filter(c => c.group === 'other');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    changeCurrency(newCurrency);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await refreshCurrencies();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="اختيار العملة"
      >
        <Globe className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        <span className="text-sm font-medium hidden md:inline text-gray-800 dark:text-gray-200">
          {currentCurrency.flag} {currentCurrency.symbol}
        </span>
        <span className="text-sm font-medium md:hidden text-gray-800 dark:text-gray-200">
          {currentCurrency.symbol}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery('');
            }}
          />
          
          {/* Dropdown Menu */}
          <div className="fixed md:absolute left-1/2 md:left-0 top-1/2 md:top-auto md:mt-2 -translate-x-1/2 md:translate-x-0 -translate-y-1/2 md:translate-y-0 w-[90vw] max-w-sm md:w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50 overflow-hidden">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <span>اختر العملة</span>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 disabled:opacity-50"
                title="تحديث الأسعار"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              )}
            </div>

            {/* Search Box */}
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن عملة..."
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Currencies List */}
            <div className="max-h-80 overflow-y-auto">
            {filteredCurrencies.length > 0 ? (
              <>
                {/* العملات العربية */}
                {arabCurrencies.length > 0 && (
                  <>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-600 dark:text-gray-300 sticky top-0">
                      العملات العربية
                    </div>
                    {arabCurrencies.map((curr) => (
                      <button
                        key={curr.code}
                        onClick={() => handleCurrencyChange(curr.code)}
                        className={`w-full text-right px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-between ${
                          curr.code === selectedCurrency ? 'bg-purple-100 dark:bg-purple-900/50' : ''
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-xl">{curr.flag}</span>
                          <span className="font-medium text-gray-800 dark:text-gray-100">{curr.label}</span>
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">{curr.symbol}</span>
                      </button>
                    ))}
                  </>
                )}

                {/* عملات أخرى */}
                {otherCurrencies.length > 0 && (
                  <>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-600 dark:text-gray-300 sticky top-0">
                      عملات أخرى
                    </div>
                    {otherCurrencies.map((curr) => (
                      <button
                        key={curr.code}
                        onClick={() => handleCurrencyChange(curr.code)}
                        className={`w-full text-right px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-between ${
                          curr.code === selectedCurrency ? 'bg-purple-100 dark:bg-purple-900/50' : ''
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-xl">{curr.flag}</span>
                          <span className="font-medium text-gray-800 dark:text-gray-100">{curr.label}</span>
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">{curr.symbol}</span>
                      </button>
                    ))}
                  </>
                )}
              </>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                لم يتم العثور على عملة
              </div>
            )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
