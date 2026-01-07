-- ============================================================================
-- تشخيص أسعار الصرف الناقصة
-- ============================================================================

-- 1. عرض جميع أسعار الصرف الحالية
SELECT 
  base_currency,
  target_currency,
  rate,
  last_updated
FROM exchange_rates
ORDER BY base_currency, target_currency;

-- 2. فحص العملات المستخدمة في المنتجات
SELECT DISTINCT
  original_currency,
  COUNT(*) as products_count
FROM products
WHERE original_currency IS NOT NULL
GROUP BY original_currency
ORDER BY products_count DESC;

-- 3. فحص إذا كان يوجد SAR
SELECT COUNT(*) as sar_products
FROM products
WHERE original_currency = 'SAR';

-- 4. التحقق من وجود USD كعملة أساس
SELECT 
  base_currency,
  target_currency,
  rate
FROM exchange_rates
WHERE base_currency = 'USD' OR target_currency = 'USD'
ORDER BY target_currency;
