-- ============================================
-- إضافة أسعار الصرف المفقودة
-- ============================================

-- 1️⃣ إضافة USD → SAR (الريال السعودي)
INSERT INTO exchange_rates (base_currency, target_currency, rate, source)
VALUES ('USD', 'SAR', 3.75, 'manual')
ON CONFLICT DO NOTHING;

-- 2️⃣ إضافة USD → ILS (الشيكل الإسرائيلي)
INSERT INTO exchange_rates (base_currency, target_currency, rate, source)
VALUES ('USD', 'ILS', 3.65, 'manual')
ON CONFLICT DO NOTHING;

-- 3️⃣ إضافة USD → JOD (الدينار الأردني)
INSERT INTO exchange_rates (base_currency, target_currency, rate, source)
VALUES ('USD', 'JOD', 0.71, 'manual')
ON CONFLICT DO NOTHING;

-- 4️⃣ إضافة USD → EGP (الجنيه المصري)
INSERT INTO exchange_rates (base_currency, target_currency, rate, source)
VALUES ('USD', 'EGP', 49.5, 'manual')
ON CONFLICT DO NOTHING;

-- 5️⃣ إضافة USD → AED (الدرهم الإماراتي)
INSERT INTO exchange_rates (base_currency, target_currency, rate, source)
VALUES ('USD', 'AED', 3.67, 'manual')
ON CONFLICT DO NOTHING;

-- 6️⃣ إضافة USD → KWD (الدينار الكويتي)
INSERT INTO exchange_rates (base_currency, target_currency, rate, source)
VALUES ('USD', 'KWD', 0.31, 'manual')
ON CONFLICT DO NOTHING;

-- 7️⃣ إضافة SAR → USD (عكسي)
INSERT INTO exchange_rates (base_currency, target_currency, rate, source)
VALUES ('SAR', 'USD', 0.2667, 'manual')
ON CONFLICT DO NOTHING;

-- 8️⃣ إضافة ILS → USD (عكسي)
INSERT INTO exchange_rates (base_currency, target_currency, rate, source)
VALUES ('ILS', 'USD', 0.274, 'manual')
ON CONFLICT DO NOTHING;

-- ✅ التحقق من النتائج
SELECT 
    base_currency,
    target_currency,
    rate,
    last_updated
FROM exchange_rates
WHERE base_currency IN ('USD', 'SAR', 'ILS')
   OR target_currency IN ('USD', 'SAR', 'ILS')
ORDER BY base_currency, target_currency;
