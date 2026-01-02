'use client'

import { useState, useEffect } from 'react'
import { Phone, ChevronDown, Search } from 'lucide-react'

interface CountryCode {
  code: string
  name: string
  dialCode: string
  flag: string
}

// قائمة شاملة بأكواد الدول العربية والعالمية
const COUNTRY_CODES: CountryCode[] = [
  // فلسطين أولاً
  { code: 'IL', name: 'الأراضي الفلسطينية المحتلة', dialCode: '+972', flag: '🇵🇸' },
  { code: 'PS', name: 'فلسطين', dialCode: '+970', flag: '🇵🇸' },
  // باقي الدول العربية
  { code: 'JO', name: 'الأردن', dialCode: '+962', flag: '🇯🇴' },
  { code: 'SA', name: 'السعودية', dialCode: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'الإمارات', dialCode: '+971', flag: '🇦🇪' },
  { code: 'KW', name: 'الكويت', dialCode: '+965', flag: '🇰🇼' },
  { code: 'BH', name: 'البحرين', dialCode: '+973', flag: '🇧🇭' },
  { code: 'QA', name: 'قطر', dialCode: '+974', flag: '🇶🇦' },
  { code: 'OM', name: 'عمان', dialCode: '+968', flag: '🇴🇲' },
  { code: 'EG', name: 'مصر', dialCode: '+20', flag: '🇪🇬' },
  { code: 'LB', name: 'لبنان', dialCode: '+961', flag: '🇱🇧' },
  { code: 'SY', name: 'سوريا', dialCode: '+963', flag: '🇸🇾' },
  { code: 'IQ', name: 'العراق', dialCode: '+964', flag: '🇮🇶' },
  { code: 'YE', name: 'اليمن', dialCode: '+967', flag: '🇾🇪' },
  { code: 'TN', name: 'تونس', dialCode: '+216', flag: '🇹🇳' },
  { code: 'DZ', name: 'الجزائر', dialCode: '+213', flag: '🇩🇿' },
  { code: 'MA', name: 'المغرب', dialCode: '+212', flag: '🇲🇦' },
  { code: 'LY', name: 'ليبيا', dialCode: '+218', flag: '🇱🇾' },
  { code: 'SD', name: 'السودان', dialCode: '+249', flag: '🇸🇩' },
  { code: 'MR', name: 'موريتانيا', dialCode: '+222', flag: '🇲🇷' },
  { code: 'SO', name: 'الصومال', dialCode: '+252', flag: '🇸🇴' },
  { code: 'DJ', name: 'جيبوتي', dialCode: '+253', flag: '🇩🇯' },
  { code: 'KM', name: 'جزر القمر', dialCode: '+269', flag: '🇰🇲' },
  // دول أخرى مهمة
  { code: 'TR', name: 'تركيا', dialCode: '+90', flag: '🇹🇷' },
  { code: 'US', name: 'أمريكا', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'بريطانيا', dialCode: '+44', flag: '🇬🇧' },
  { code: 'FR', name: 'فرنسا', dialCode: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'ألمانيا', dialCode: '+49', flag: '🇩🇪' },
  { code: 'IT', name: 'إيطاليا', dialCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'إسبانيا', dialCode: '+34', flag: '🇪🇸' },
  { code: 'CA', name: 'كندا', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'أستراليا', dialCode: '+61', flag: '🇦🇺' },
]

interface CountryPhoneInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  required?: boolean
  className?: string
  label?: string
}

export default function CountryPhoneInput({
  value,
  onChange,
  placeholder = 'رقم الهاتف',
  error,
  required = false,
  className = '',
  label
}: CountryPhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0])
  const [showDropdown, setShowDropdown] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // استخراج الدولة ورقم الهاتف من القيمة المدخلة عند التحميل
  useEffect(() => {
    if (value) {
      // البحث عن الدولة المطابقة
      const matchingCountry = COUNTRY_CODES.find(country => 
        value.startsWith(country.dialCode)
      )
      if (matchingCountry) {
        setSelectedCountry(matchingCountry)
        setPhoneNumber(value.replace(matchingCountry.dialCode, ''))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country)
    setShowDropdown(false)
    setSearchQuery('')
    // تحديث القيمة الكاملة
    onChange(`${country.dialCode}${phoneNumber}`)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value.replace(/[^0-9]/g, '')
    setPhoneNumber(number)
    onChange(`${selectedCountry.dialCode}${number}`)
  }

  // تصفية الدول حسب البحث
  const filteredCountries = COUNTRY_CODES.filter(country =>
    country.name.includes(searchQuery) ||
    country.dialCode.includes(searchQuery) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.country-selector')) {
        setShowDropdown(false)
        setSearchQuery('')
      }
    }

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showDropdown])

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          <Phone className="inline w-4 h-4 ml-1" />
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Mobile Overlay */}
      {showDropdown && (
        <div 
          className="fixed inset-0 bg-black/30 z-[9998] sm:hidden"
          onClick={() => {
            setShowDropdown(false)
            setSearchQuery('')
          }}
        />
      )}
      
      <div className="flex gap-1.5 sm:gap-2">
        {/* Country Selector */}
        <div className="relative country-selector">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition min-w-[100px] sm:min-w-[130px] shadow-sm"
          >
            <span className="text-xl sm:text-2xl">{selectedCountry.flag}</span>
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
              {selectedCountry.dialCode}
            </span>
            <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="fixed sm:absolute top-1/2 sm:top-full left-1/2 sm:left-0 -translate-x-1/2 sm:translate-x-0 -translate-y-1/2 sm:translate-y-0 sm:mt-2 w-[90vw] max-w-[320px] sm:w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl z-[9999] overflow-hidden">
              {/* Search Box */}
              <div className="p-2.5 sm:p-3 border-b border-gray-200 dark:border-gray-600">
                <div className="relative">
                  <Search className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن دولة..."
                    className="w-full pr-9 sm:pr-10 pl-2.5 sm:pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Countries List */}
              <div className="max-h-[50vh] sm:max-h-64 overflow-y-auto">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition text-right group"
                    >
                      <span className="text-xl sm:text-2xl flex-shrink-0">{country.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-800 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 truncate">
                          {country.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {country.dialCode}
                        </div>
                      </div>
                      {selectedCountry.code === country.code && (
                        <span className="text-green-500 font-bold text-base sm:text-lg flex-shrink-0">✓</span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    لم يتم العثور على دولة
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 transition shadow-sm ${
            error
              ? 'border-red-300 focus:ring-red-500 dark:border-red-600'
              : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
          } bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
          required={required}
        />
      </div>

      {error && (
        <p className="text-red-500 text-xs sm:text-sm mt-2 flex items-center gap-1">
          <span className="text-base sm:text-lg">⚠</span>
          {error}
        </p>
      )}

      {!error && (
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2">
          مثال: {selectedCountry.dialCode}591234567
        </p>
      )}
    </div>
  )
}
