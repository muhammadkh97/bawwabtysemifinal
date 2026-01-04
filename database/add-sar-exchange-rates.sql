-- ============================================
-- إضافة أسعار صرف للريال السعودي (SAR)
-- ============================================

-- فحص أسعار الصرف الحالية لـ SAR
SELECT 
  from_currency,
  to_currency,
  rate,
  is_active
FROM exchange_rates
WHERE from_currency = 'SAR' OR to_currency = 'SAR'
ORDER BY from_currency, to_currency;

-- إضافة أسعار صرف SAR (إذا لم تكن موجودة)
-- SAR إلى JOD (1 ريال سعودي = 0.19 دينار أردني تقريباً)
INSERT INTO exchange_rates (from_currency, to_currency, rate, is_active)
VALUES ('SAR', 'JOD', 0.19, true)
ON CONFLICT (from_currency, to_currency) DO UPDATE 
SET rate = 0.19, is_active = true;

-- SAR إلى ILS (1 ريال سعودي = 0.97 شيكل إسرائيلي تقريباً)
INSERT INTO exchange_rates (from_currency, to_currency, rate, is_active)
VALUES ('SAR', 'ILS', 0.97, true)
ON CONFLICT (from_currency, to_currency) DO UPDATE 
SET rate = 0.97, is_active = true;

-- JOD إلى SAR (عكسي)
INSERT INTO exchange_rates (from_currency, to_currency, rate, is_active)
VALUES ('JOD', 'SAR', 5.26, true)
ON CONFLICT (from_currency, to_currency) DO UPDATE 
SET rate = 5.26, is_active = true;

-- ILS إلى SAR (عكسي)
INSERT INTO exchange_rates (from_currency, to_currency, rate, is_active)
VALUES ('ILS', 'SAR', 1.03, true)
ON CONFLICT (from_currency, to_currency) DO UPDATE 
SET rate = 1.03, is_active = true;

-- التحقق من النتيجة
SELECT 
  from_currency,
  to_currency,
  rate,
  is_active
FROM exchange_rates
WHERE from_currency = 'SAR' OR to_currency = 'SAR'
ORDER BY from_currency, to_currency;
