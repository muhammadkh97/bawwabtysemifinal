-- ===================================================================
-- بناء نظام العملات العالمي الشامل
-- ===================================================================

-- ========================================
-- 1. إضافة عمود العملة المفضلة لجدول users
-- ========================================

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'JOD';

COMMENT ON COLUMN public.users.preferred_currency IS 'العملة المفضلة للمستخدم (JOD, SAR, ILS, USD, EUR, إلخ)';

-- ========================================
-- 2. إنشاء جدول العملات المدعومة
-- ========================================

CREATE TABLE IF NOT EXISTS public.currencies (
    code TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    symbol TEXT NOT NULL,
    flag TEXT,
    decimal_places INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 999,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.currencies IS 'العملات المدعومة في النظام';

-- ========================================
-- 3. إدراج العملات الأساسية
-- ========================================

INSERT INTO public.currencies (code, name_en, name_ar, symbol, flag, decimal_places, is_active, display_order) VALUES
-- العملات العربية الرئيسية
('JOD', 'Jordanian Dinar', 'دينار أردني', 'د.أ', '🇯🇴', 3, true, 1),
('SAR', 'Saudi Riyal', 'ريال سعودي', 'ر.س', '🇸🇦', 2, true, 2),
('ILS', 'Israeli Shekel', 'شيكل إسرائيلي', '₪', '🇮🇱', 2, true, 3),
('AED', 'UAE Dirham', 'درهم إماراتي', 'د.إ', '🇦🇪', 2, true, 4),
('KWD', 'Kuwaiti Dinar', 'دينار كويتي', 'د.ك', '🇰🇼', 3, true, 5),
('QAR', 'Qatari Riyal', 'ريال قطري', 'ر.ق', '🇶🇦', 2, true, 6),
('BHD', 'Bahraini Dinar', 'دينار بحريني', 'د.ب', '🇧🇭', 3, true, 7),
('OMR', 'Omani Rial', 'ريال عماني', 'ر.ع', '🇴🇲', 3, true, 8),
('EGP', 'Egyptian Pound', 'جنيه مصري', 'ج.م', '🇪🇬', 2, true, 9),
('LBP', 'Lebanese Pound', 'ليرة لبنانية', 'ل.ل', '🇱🇧', 0, true, 10),
('SYP', 'Syrian Pound', 'ليرة سورية', 'ل.س', '🇸🇾', 0, true, 11),
('IQD', 'Iraqi Dinar', 'دينار عراقي', 'د.ع', '🇮🇶', 0, true, 12),
('YER', 'Yemeni Rial', 'ريال يمني', 'ر.ي', '🇾🇪', 0, true, 13),
('LYD', 'Libyan Dinar', 'دينار ليبي', 'د.ل', '🇱🇾', 3, true, 14),
('TND', 'Tunisian Dinar', 'دينار تونسي', 'د.ت', '🇹🇳', 3, true, 15),
('DZD', 'Algerian Dinar', 'دينار جزائري', 'د.ج', '🇩🇿', 2, true, 16),
('MAD', 'Moroccan Dirham', 'درهم مغربي', 'د.م', '🇲🇦', 2, true, 17),
('SDG', 'Sudanese Pound', 'جنيه سوداني', 'ج.س', '🇸🇩', 2, true, 18),

-- العملات العالمية الرئيسية
('USD', 'US Dollar', 'دولار أمريكي', '$', '🇺🇸', 2, true, 20),
('EUR', 'Euro', 'يورو', '€', '🇪🇺', 2, true, 21),
('GBP', 'British Pound', 'جنيه إسترليني', '£', '🇬🇧', 2, true, 22),
('JPY', 'Japanese Yen', 'ين ياباني', '¥', '🇯🇵', 0, true, 23),
('CNY', 'Chinese Yuan', 'يوان صيني', '¥', '🇨🇳', 2, true, 24),
('INR', 'Indian Rupee', 'روبية هندية', '₹', '🇮🇳', 2, true, 25),
('TRY', 'Turkish Lira', 'ليرة تركية', '₺', '🇹🇷', 2, true, 26),
('RUB', 'Russian Ruble', 'روبل روسي', '₽', '🇷🇺', 2, true, 27)

ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_ar = EXCLUDED.name_ar,
    symbol = EXCLUDED.symbol,
    flag = EXCLUDED.flag,
    decimal_places = EXCLUDED.decimal_places,
    is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order;

-- ========================================
-- 4. تحسين جدول exchange_rates
-- ========================================

-- إعادة بناء الجدول بشكل أفضل
DROP TABLE IF EXISTS public.exchange_rates_old;
ALTER TABLE public.exchange_rates RENAME TO exchange_rates_old;

CREATE TABLE public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency TEXT NOT NULL DEFAULT 'USD',
    target_currency TEXT NOT NULL,
    rate NUMERIC(20, 6) NOT NULL,
    source TEXT DEFAULT 'manual',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(base_currency, target_currency)
);

COMMENT ON TABLE public.exchange_rates IS 'أسعار صرف العملات';
COMMENT ON COLUMN public.exchange_rates.rate IS 'سعر الصرف: 1 base_currency = rate target_currency';

-- ========================================
-- 5. إضافة أسعار الصرف الأساسية (مقابل USD)
-- ========================================

INSERT INTO public.exchange_rates (base_currency, target_currency, rate, source) VALUES
-- من USD إلى العملات العربية
('USD', 'JOD', 0.709, 'manual'),    -- 1 USD = 0.709 JOD
('USD', 'SAR', 3.75, 'manual'),      -- 1 USD = 3.75 SAR
('USD', 'ILS', 3.65, 'manual'),      -- 1 USD = 3.65 ILS
('USD', 'AED', 3.67, 'manual'),      -- 1 USD = 3.67 AED
('USD', 'KWD', 0.307, 'manual'),     -- 1 USD = 0.307 KWD
('USD', 'QAR', 3.64, 'manual'),      -- 1 USD = 3.64 QAR
('USD', 'BHD', 0.376, 'manual'),     -- 1 USD = 0.376 BHD
('USD', 'OMR', 0.385, 'manual'),     -- 1 USD = 0.385 OMR
('USD', 'EGP', 30.9, 'manual'),      -- 1 USD = 30.9 EGP
('USD', 'LBP', 89500, 'manual'),     -- 1 USD = 89500 LBP
('USD', 'SYP', 13001, 'manual'),     -- 1 USD = 13001 SYP
('USD', 'IQD', 1310, 'manual'),      -- 1 USD = 1310 IQD
('USD', 'YER', 250, 'manual'),       -- 1 USD = 250 YER
('USD', 'LYD', 4.82, 'manual'),      -- 1 USD = 4.82 LYD
('USD', 'TND', 3.11, 'manual'),      -- 1 USD = 3.11 TND
('USD', 'DZD', 134, 'manual'),       -- 1 USD = 134 DZD
('USD', 'MAD', 9.95, 'manual'),      -- 1 USD = 9.95 MAD
('USD', 'SDG', 601, 'manual'),       -- 1 USD = 601 SDG

-- العملات العالمية
('USD', 'EUR', 0.92, 'manual'),      -- 1 USD = 0.92 EUR
('USD', 'GBP', 0.79, 'manual'),      -- 1 USD = 0.79 GBP
('USD', 'JPY', 148, 'manual'),       -- 1 USD = 148 JPY
('USD', 'CNY', 7.19, 'manual'),      -- 1 USD = 7.19 CNY
('USD', 'INR', 83, 'manual'),        -- 1 USD = 83 INR
('USD', 'TRY', 32, 'manual'),        -- 1 USD = 32 TRY
('USD', 'RUB', 92, 'manual'),        -- 1 USD = 92 RUB

-- العكس: من العملات إلى USD
('JOD', 'USD', 1.41, 'manual'),
('SAR', 'USD', 0.267, 'manual'),
('ILS', 'USD', 0.274, 'manual'),
('AED', 'USD', 0.272, 'manual'),
('KWD', 'USD', 3.26, 'manual'),
('EUR', 'USD', 1.09, 'manual'),
('GBP', 'USD', 1.27, 'manual'),

-- ========================================
-- أسعار الصرف المباشرة بين العملات العربية الرئيسية
-- ========================================

-- من الدينار الأردني (JOD)
('JOD', 'SAR', 5.29, 'manual'),      -- 1 JOD = 5.29 SAR
('JOD', 'ILS', 5.15, 'manual'),      -- 1 JOD = 5.15 ILS
('JOD', 'AED', 5.18, 'manual'),      -- 1 JOD = 5.18 AED
('JOD', 'KWD', 0.433, 'manual'),     -- 1 JOD = 0.433 KWD
('JOD', 'QAR', 5.13, 'manual'),      -- 1 JOD = 5.13 QAR
('JOD', 'BHD', 0.530, 'manual'),     -- 1 JOD = 0.530 BHD
('JOD', 'OMR', 0.543, 'manual'),     -- 1 JOD = 0.543 OMR
('JOD', 'EGP', 43.58, 'manual'),     -- 1 JOD = 43.58 EGP

-- من الريال السعودي (SAR)
('SAR', 'JOD', 0.189, 'manual'),     -- 1 SAR = 0.189 JOD
('SAR', 'ILS', 0.973, 'manual'),     -- 1 SAR = 0.973 ILS
('SAR', 'AED', 0.979, 'manual'),     -- 1 SAR = 0.979 AED
('SAR', 'KWD', 0.082, 'manual'),     -- 1 SAR = 0.082 KWD
('SAR', 'QAR', 0.971, 'manual'),     -- 1 SAR = 0.971 QAR
('SAR', 'BHD', 0.100, 'manual'),     -- 1 SAR = 0.100 BHD
('SAR', 'OMR', 0.103, 'manual'),     -- 1 SAR = 0.103 OMR
('SAR', 'EGP', 8.24, 'manual'),      -- 1 SAR = 8.24 EGP

-- من الشيكل الإسرائيلي (ILS)
('ILS', 'JOD', 0.194, 'manual'),     -- 1 ILS = 0.194 JOD
('ILS', 'SAR', 1.027, 'manual'),     -- 1 ILS = 1.027 SAR
('ILS', 'AED', 1.005, 'manual'),     -- 1 ILS = 1.005 AED
('ILS', 'KWD', 0.084, 'manual'),     -- 1 ILS = 0.084 KWD
('ILS', 'QAR', 0.997, 'manual'),     -- 1 ILS = 0.997 QAR
('ILS', 'BHD', 0.103, 'manual'),     -- 1 ILS = 0.103 BHD
('ILS', 'OMR', 0.105, 'manual'),     -- 1 ILS = 0.105 OMR
('ILS', 'EGP', 8.47, 'manual'),      -- 1 ILS = 8.47 EGP

-- من الدرهم الإماراتي (AED)
('AED', 'JOD', 0.193, 'manual'),     -- 1 AED = 0.193 JOD
('AED', 'SAR', 1.022, 'manual'),     -- 1 AED = 1.022 SAR
('AED', 'ILS', 0.995, 'manual'),     -- 1 AED = 0.995 ILS

-- من الدينار الكويتي (KWD)
('KWD', 'JOD', 2.310, 'manual'),     -- 1 KWD = 2.310 JOD
('KWD', 'SAR', 12.21, 'manual'),     -- 1 KWD = 12.21 SAR
('KWD', 'ILS', 11.89, 'manual'),     -- 1 KWD = 11.89 ILS

-- من الجنيه المصري (EGP)
('EGP', 'JOD', 0.023, 'manual'),     -- 1 EGP = 0.023 JOD
('EGP', 'SAR', 0.121, 'manual'),     -- 1 EGP = 0.121 SAR
('EGP', 'ILS', 0.118, 'manual')      -- 1 EGP = 0.118 ILS

ON CONFLICT (base_currency, target_currency) 
DO UPDATE SET 
    rate = EXCLUDED.rate,
    last_updated = NOW();

-- ========================================
-- 6. إنشاء دالة لتحويل العملات
-- ========================================

CREATE OR REPLACE FUNCTION convert_currency(
    amount NUMERIC,
    from_curr TEXT,
    to_curr TEXT
) RETURNS NUMERIC AS $$
DECLARE
    exchange_rate NUMERIC;
    usd_rate NUMERIC;
    result NUMERIC;
BEGIN
    -- إذا كانت العملات متطابقة، أرجع المبلغ كما هو
    IF from_curr = to_curr THEN
        RETURN amount;
    END IF;
    
    -- محاولة الحصول على سعر الصرف المباشر
    SELECT rate INTO exchange_rate
    FROM exchange_rates
    WHERE base_currency = from_curr 
        AND target_currency = to_curr
    LIMIT 1;
    
    IF exchange_rate IS NOT NULL THEN
        RETURN ROUND(amount * exchange_rate, 2);
    END IF;
    
    -- إذا لم يوجد سعر مباشر، استخدم USD كوسيط
    -- تحويل من from_curr إلى USD
    SELECT rate INTO exchange_rate
    FROM exchange_rates
    WHERE base_currency = from_curr 
        AND target_currency = 'USD'
    LIMIT 1;
    
    IF exchange_rate IS NULL THEN
        -- محاولة العكس
        SELECT 1.0 / rate INTO exchange_rate
        FROM exchange_rates
        WHERE base_currency = 'USD' 
            AND target_currency = from_curr
        LIMIT 1;
    END IF;
    
    IF exchange_rate IS NULL THEN
        RETURN amount; -- إرجاع المبلغ الأصلي إذا فشل التحويل
    END IF;
    
    -- الآن لدينا المبلغ بالدولار
    result := amount * exchange_rate;
    
    -- تحويل من USD إلى to_curr
    SELECT rate INTO usd_rate
    FROM exchange_rates
    WHERE base_currency = 'USD' 
        AND target_currency = to_curr
    LIMIT 1;
    
    IF usd_rate IS NULL THEN
        -- محاولة العكس
        SELECT 1.0 / rate INTO usd_rate
        FROM exchange_rates
        WHERE base_currency = to_curr 
            AND target_currency = 'USD'
        LIMIT 1;
    END IF;
    
    IF usd_rate IS NULL THEN
        RETURN amount;
    END IF;
    
    result := result * usd_rate;
    
    RETURN ROUND(result, 2);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION convert_currency IS 'تحويل المبلغ من عملة إلى أخرى';

-- ========================================
-- 7. إنشاء view للمنتجات مع التحويل التلقائي
-- ========================================

CREATE OR REPLACE VIEW products_with_converted_prices AS
SELECT 
    p.*,
    convert_currency(p.price, p.original_currency, 'JOD') as price_jod,
    convert_currency(p.price, p.original_currency, 'SAR') as price_sar,
    convert_currency(p.price, p.original_currency, 'ILS') as price_ils,
    convert_currency(p.price, p.original_currency, 'USD') as price_usd,
    convert_currency(p.price, p.original_currency, 'EUR') as price_eur
FROM products p;

COMMENT ON VIEW products_with_converted_prices IS 'المنتجات مع الأسعار المحولة للعملات الرئيسية';

-- ========================================
-- 8. إنشاء سياسات RLS
-- ========================================

-- السماح للجميع بقراءة العملات
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view currencies" ON public.currencies;
CREATE POLICY "Anyone can view currencies"
ON public.currencies
FOR SELECT
TO public
USING (is_active = true);

-- السماح للجميع بقراءة أسعار الصرف
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view exchange rates" ON public.exchange_rates;
CREATE POLICY "Anyone can view exchange rates"
ON public.exchange_rates
FOR SELECT
TO public
USING (true);

-- ========================================
-- 9. التحقق من النتائج
-- ========================================

SELECT '✅ تم إنشاء نظام العملات بنجاح!' as status;

-- عرض العملات المضافة
SELECT 
    '💰 العملات المدعومة:' as info;

SELECT 
    code as "الكود",
    name_ar as "الاسم",
    symbol as "الرمز",
    flag as "العلم",
    decimal_places as "المنازل العشرية"
FROM currencies
WHERE is_active = true
ORDER BY display_order;

-- اختبار دالة التحويل
SELECT 
    '🧪 اختبار التحويل بين العملات العربية:' as info;

-- من الشيكل إلى الدينار الأردني
SELECT 
    '20 ILS to JOD' as "التحويل",
    convert_currency(20, 'ILS', 'JOD') as "النتيجة",
    '(20 × 0.194 = 3.88 تقريباً)' as "التوضيح";

-- من الريال السعودي إلى الدينار الأردني
SELECT 
    '100 SAR to JOD' as "التحويل",
    convert_currency(100, 'SAR', 'JOD') as "النتيجة",
    '(100 × 0.189 = 18.9 تقريباً)' as "التوضيح";

-- من الشيكل إلى الريال السعودي
SELECT 
    '20 ILS to SAR' as "التحويل",
    convert_currency(20, 'ILS', 'SAR') as "النتيجة",
    '(20 × 1.027 = 20.54 تقريباً)' as "التوضيح";

-- من الدينار الأردني إلى الشيكل
SELECT 
    '10 JOD to ILS' as "التحويل",
    convert_currency(10, 'JOD', 'ILS') as "النتيجة",
    '(10 × 5.15 = 51.5 تقريباً)' as "التوضيح";

-- من الدينار الأردني إلى الريال السعودي
SELECT 
    '10 JOD to SAR' as "التحويل",
    convert_currency(10, 'JOD', 'SAR') as "النتيجة",
    '(10 × 5.29 = 52.9 تقريباً)' as "التوضيح";

-- من الدرهم الإماراتي إلى الدينار الأردني
SELECT 
    '100 AED to JOD' as "التحويل",
    convert_currency(100, 'AED', 'JOD') as "النتيجة",
    '(100 × 0.193 = 19.3 تقريباً)' as "التوضيح";

-- من الجنيه المصري إلى الدينار الأردني
SELECT 
    '1000 EGP to JOD' as "التحويل",
    convert_currency(1000, 'EGP', 'JOD') as "النتيجة",
    '(1000 × 0.023 = 23 تقريباً)' as "التوضيح";

-- ===================================================================
-- ✅ تم بناء نظام العملات العالمي بنجاح مع أسعار صرف مباشرة للعملات العربية
-- ===================================================================
