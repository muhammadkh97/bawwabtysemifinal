-- ============================================
-- إضافة أسعار صرف للريال السعودي (SAR)
-- ============================================

-- فحص أسعار الصرف الحالية لـ SAR
SELECT 
  base_currency,
  target_currency,
  rate,
  source
FROM exchange_rates
WHERE base_currency = 'SAR' OR target_currency = 'SAR'
ORDER BY base_currency, target_currency;

-- إضافة أسعار صرف SAR
-- SAR إلى JOD (1 ريال سعودي = 0.19 دينار أردني تقريباً)
INSERT INTO exchange_rates (base_currency, target_currency, rate, source)
VALUES ('SAR', 'JOD', 0.19, 'manual')
ON CONFLICT (base_currency, target_currency) DO UPDATE 
SET rate = 0.19;

-- SAR إلى ILS (1 ريال سعودي = 0.97 شيكل إسرائيلي تقريباً)
INSERT INTO exchange_rates (base_currency, target_currency, rate, source)
VALUES ('SAR', 'ILS', 0.97, 'manual')
ON CONFLICT (base_currency, target_currency) DO UPDATE 
SET rate = 0.97;

-- JOD إلى SAR (عكسي)
INSERT INTO exchange_rates (base_currency, target_currency, rate, source)
VALUES ('JOD', 'SAR', 5.26, 'manual')
ON CONFLICT (base_currency, target_currency) DO UPDATE 
SET rate = 5.26;

-- ILS إلى SAR (عكسي)
INSERT INTO exchange_rates (base_currency, target_currency, rate, source)
VALUES ('ILS', 'SAR', 1.03, 'manual')
ON CONFLICT (base_currency, target_currency) DO UPDATE 
SET rate = 1.03;

-- التحقق من النتيجة
SELECT 
  base_currency,
  target_currency,
  rate,
  source,
  last_updated
FROM exchange_rates
WHERE base_currency = 'SAR' OR target_currency = 'SAR'
ORDER BY base_currency, target_currency;
