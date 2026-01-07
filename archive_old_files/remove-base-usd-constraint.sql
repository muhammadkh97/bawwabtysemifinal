-- ============================================================================
-- إزالة قيد base_currency = 'USD' وإضافة أسعار صرف عكسية
-- ============================================================================

-- 1. حذف القيد الذي يفرض USD فقط
ALTER TABLE exchange_rates 
DROP CONSTRAINT IF EXISTS check_base_usd;

-- 2. تحديث القيمة الافتراضية (إزالة القيمة الافتراضية)
ALTER TABLE exchange_rates 
ALTER COLUMN base_currency DROP DEFAULT;

-- 3. إضافة أسعار صرف عكسية
INSERT INTO exchange_rates (base_currency, target_currency, rate, source, last_updated)
VALUES
  -- من العملات إلى USD (معكوس الأسعار الموجودة)
  ('AED', 'USD', 1/3.670000, 'manual', NOW()),
  ('SAR', 'USD', 1/3.750000, 'manual', NOW()),
  ('EGP', 'USD', 1/49.500000, 'manual', NOW()),
  ('ILS', 'USD', 1/3.650000, 'manual', NOW()),
  ('JOD', 'USD', 1/0.710000, 'manual', NOW()),
  ('KWD', 'USD', 1/0.310000, 'manual', NOW()),
  ('QAR', 'USD', 1/3.640000, 'manual', NOW()),
  ('BHD', 'USD', 1/0.376000, 'manual', NOW()),
  ('OMR', 'USD', 1/0.385000, 'manual', NOW()),
  ('EUR', 'USD', 1/0.920000, 'manual', NOW()),
  ('GBP', 'USD', 1/0.790000, 'manual', NOW()),
  ('INR', 'USD', 1/83.000000, 'manual', NOW()),
  ('CNY', 'USD', 1/7.190000, 'manual', NOW()),
  ('JPY', 'USD', 1/148.000000, 'manual', NOW()),
  ('TRY', 'USD', 1/32.000000, 'manual', NOW()),
  ('RUB', 'USD', 1/92.000000, 'manual', NOW()),
  ('LBP', 'USD', 1/89500.000000, 'manual', NOW()),
  ('SYP', 'USD', 1/13001.000000, 'manual', NOW()),
  ('IQD', 'USD', 1/1310.000000, 'manual', NOW()),
  ('YER', 'USD', 1/250.000000, 'manual', NOW()),
  ('LYD', 'USD', 1/4.820000, 'manual', NOW()),
  ('TND', 'USD', 1/3.110000, 'manual', NOW()),
  ('DZD', 'USD', 1/134.000000, 'manual', NOW()),
  ('MAD', 'USD', 1/9.950000, 'manual', NOW()),
  ('SDG', 'USD', 1/601.000000, 'manual', NOW())
ON CONFLICT (base_currency, target_currency) 
DO UPDATE SET
  rate = EXCLUDED.rate,
  last_updated = EXCLUDED.last_updated,
  source = EXCLUDED.source;

-- 4. التحقق من النتائج
SELECT 
  'Total exchange rates' as description,
  COUNT(*) as count
FROM exchange_rates
UNION ALL
SELECT 
  'Rates from USD' as description,
  COUNT(*) as count
FROM exchange_rates
WHERE base_currency = 'USD'
UNION ALL
SELECT 
  'Rates to USD' as description,
  COUNT(*) as count
FROM exchange_rates
WHERE target_currency = 'USD';

-- 5. اختبار التحويل من SAR إلى ILS (عبر USD)
SELECT 
  'SAR to USD' as conversion,
  rate as rate_value
FROM exchange_rates 
WHERE base_currency = 'SAR' AND target_currency = 'USD'
UNION ALL
SELECT 
  'USD to ILS' as conversion,
  rate as rate_value
FROM exchange_rates 
WHERE base_currency = 'USD' AND target_currency = 'ILS'
UNION ALL
SELECT 
  'SAR to ILS (calculated)' as conversion,
  (SELECT rate FROM exchange_rates WHERE base_currency = 'SAR' AND target_currency = 'USD') *
  (SELECT rate FROM exchange_rates WHERE base_currency = 'USD' AND target_currency = 'ILS') as rate_value;
