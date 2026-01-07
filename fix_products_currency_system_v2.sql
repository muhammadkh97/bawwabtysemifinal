-- ============================================================================
-- CURRENCY CONVERSION SYSTEM FOR PRODUCTS - V2 (Corrected Schema)
-- ============================================================================
-- Problem: Products show same numeric price in all currencies (50 ILS = 50 JOD)
-- Solution: Use existing price_usd column and create proper conversion functions
-- Schema: Uses actual columns from products table (verified via information_schema)
-- Author: GitHub Copilot
-- Date: 2026-01-07
-- ============================================================================

-- EXCHANGE RATES (relative to USD = 1.0)
-- SAR = 3.75 (1 USD = 3.75 SAR)
-- ILS = 3.65 (1 USD = 3.65 ILS)  
-- JOD = 0.71 (1 USD = 0.71 JOD)
-- EGP = 49.5 (1 USD = 49.5 EGP)
-- AED = 3.67 (1 USD = 3.67 AED)
-- KWD = 0.31 (1 USD = 0.31 KWD)

-- ============================================================================
-- Step 1: Calculate and store price_usd for all products
-- ============================================================================
-- Converts from original_currency to USD and stores in price_usd column
UPDATE products 
SET price_usd = CASE 
  WHEN original_currency = 'USD' THEN price
  WHEN original_currency = 'SAR' THEN price / 3.75
  WHEN original_currency = 'ILS' THEN price / 3.65
  WHEN original_currency = 'JOD' THEN price / 0.71
  WHEN original_currency = 'EGP' THEN price / 49.5
  WHEN original_currency = 'AED' THEN price / 3.67
  WHEN original_currency = 'KWD' THEN price / 0.31
  ELSE price / 3.75 -- Default to SAR if unknown
END
WHERE price_usd IS NULL OR price_usd = 0;

-- ============================================================================
-- Step 2: Create function to convert price from USD to any currency
-- ============================================================================
CREATE OR REPLACE FUNCTION convert_price_from_usd(
  p_price_usd DECIMAL(10, 2),
  p_to_currency VARCHAR(3)
)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE p_to_currency
    WHEN 'USD' THEN p_price_usd
    WHEN 'SAR' THEN p_price_usd * 3.75
    WHEN 'ILS' THEN p_price_usd * 3.65
    WHEN 'JOD' THEN p_price_usd * 0.71
    WHEN 'EGP' THEN p_price_usd * 49.5
    WHEN 'AED' THEN p_price_usd * 3.67
    WHEN 'KWD' THEN p_price_usd * 0.31
    ELSE p_price_usd * 3.75 -- Default to SAR
  END;
END;
$$;

-- ============================================================================
-- Step 3: Create function to convert price between any two currencies
-- ============================================================================
CREATE OR REPLACE FUNCTION convert_price(
  p_price DECIMAL(10, 2),
  p_from_currency VARCHAR(3),
  p_to_currency VARCHAR(3)
)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_price_usd DECIMAL(10, 2);
BEGIN
  -- First convert to USD
  v_price_usd := CASE p_from_currency
    WHEN 'USD' THEN p_price
    WHEN 'SAR' THEN p_price / 3.75
    WHEN 'ILS' THEN p_price / 3.65
    WHEN 'JOD' THEN p_price / 0.71
    WHEN 'EGP' THEN p_price / 49.5
    WHEN 'AED' THEN p_price / 3.67
    WHEN 'KWD' THEN p_price / 0.31
    ELSE p_price / 3.75
  END;
  
  -- Then convert from USD to target currency
  RETURN convert_price_from_usd(v_price_usd, p_to_currency);
END;
$$;

-- ============================================================================
-- Step 4: Create view with converted prices
-- ============================================================================
CREATE OR REPLACE VIEW v_products_with_converted_prices AS
SELECT 
  p.id,
  p.vendor_id,
  p.category_id,
  p.name,
  p.name_ar,
  p.description,
  p.description_ar,
  p.slug,
  p.price,
  p.old_price,
  p.sale_price,
  p.original_currency,
  p.currency,
  p.price_usd,
  p.stock,
  p.low_stock_threshold,
  p.images,
  p.featured_image,
  p.status,
  p.is_active,
  p.has_variants,
  p.variants,
  p.attributes,
  p.metadata,
  p.rating,
  p.total_reviews,
  p.total_sales,
  p.created_at,
  p.updated_at,
  p.approval_status,
  p.rejection_reason
FROM products p;

-- ============================================================================
-- Step 5: Create function to get products with currency conversion
-- ============================================================================
-- Returns all active/approved products with prices converted to target currency
CREATE OR REPLACE FUNCTION get_products_by_currency(p_currency VARCHAR(3))
RETURNS TABLE (
  id UUID,
  vendor_id UUID,
  category_id UUID,
  name TEXT,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  slug TEXT,
  original_price DECIMAL(10, 2),
  converted_price DECIMAL(10, 2),
  old_price DECIMAL(10, 2),
  converted_old_price DECIMAL(10, 2),
  sale_price DECIMAL(10, 2),
  converted_sale_price DECIMAL(10, 2),
  original_currency TEXT,
  target_currency TEXT,
  price_usd DECIMAL(10, 2),
  stock INTEGER,
  low_stock_threshold INTEGER,
  images TEXT[],
  featured_image TEXT,
  status product_status,
  is_active BOOLEAN,
  has_variants BOOLEAN,
  variants JSONB,
  attributes JSONB,
  metadata JSONB,
  rating NUMERIC,
  total_reviews INTEGER,
  total_sales INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  approval_status VARCHAR,
  rejection_reason TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.vendor_id,
    p.category_id,
    p.name,
    p.name_ar,
    p.description,
    p.description_ar,
    p.slug,
    p.price as original_price,
    convert_price_from_usd(COALESCE(p.price_usd, p.price / 3.75), p_currency) as converted_price,
    p.old_price,
    CASE 
      WHEN p.old_price IS NOT NULL AND p.price_usd IS NOT NULL AND p.price > 0
      THEN convert_price_from_usd((p.old_price / p.price) * p.price_usd, p_currency)
      ELSE NULL 
    END as converted_old_price,
    p.sale_price,
    CASE 
      WHEN p.sale_price IS NOT NULL AND p.price_usd IS NOT NULL AND p.price > 0
      THEN convert_price_from_usd((p.sale_price / p.price) * p.price_usd, p_currency)
      ELSE NULL 
    END as converted_sale_price,
    p.original_currency,
    p_currency as target_currency,
    p.price_usd,
    p.stock,
    p.low_stock_threshold,
    p.images,
    p.featured_image,
    p.status,
    p.is_active,
    p.has_variants,
    p.variants,
    p.attributes,
    p.metadata,
    p.rating,
    p.total_reviews,
    p.total_sales,
    p.created_at,
    p.updated_at,
    p.approval_status,
    p.rejection_reason
  FROM products p
  WHERE p.is_active = true 
    AND p.approval_status = 'approved';
END;
$$;

-- ============================================================================
-- Step 6: Create trigger to auto-calculate price_usd
-- ============================================================================
CREATE OR REPLACE FUNCTION set_price_usd_on_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Auto-calculate price_usd based on original_currency
  NEW.price_usd := CASE NEW.original_currency
    WHEN 'USD' THEN NEW.price
    WHEN 'SAR' THEN NEW.price / 3.75
    WHEN 'ILS' THEN NEW.price / 3.65
    WHEN 'JOD' THEN NEW.price / 0.71
    WHEN 'EGP' THEN NEW.price / 49.5
    WHEN 'AED' THEN NEW.price / 3.67
    WHEN 'KWD' THEN NEW.price / 0.31
    ELSE NEW.price / 3.75 -- Default to SAR
  END;
  
  RETURN NEW;
END;
$$;

-- Drop existing triggers if present
DROP TRIGGER IF EXISTS trigger_set_price_usd_on_insert ON products;
DROP TRIGGER IF EXISTS trigger_set_price_usd_on_update ON products;

-- Create triggers for INSERT and UPDATE
CREATE TRIGGER trigger_set_price_usd_on_insert
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_price_usd_on_change();

CREATE TRIGGER trigger_set_price_usd_on_update
  BEFORE UPDATE OF price, original_currency ON products
  FOR EACH ROW
  WHEN (OLD.price IS DISTINCT FROM NEW.price OR OLD.original_currency IS DISTINCT FROM NEW.original_currency)
  EXECUTE FUNCTION set_price_usd_on_change();

-- ============================================================================
-- Step 7: Add documentation comments
-- ============================================================================
COMMENT ON COLUMN products.price_usd IS 'Automatically calculated USD price for currency conversion (managed by trigger)';
COMMENT ON COLUMN products.original_currency IS 'The currency in which the product was originally priced';
COMMENT ON FUNCTION convert_price IS 'Converts a price from one currency to another via USD. Usage: convert_price(50, ''ILS'', ''JOD'')';
COMMENT ON FUNCTION convert_price_from_usd IS 'Converts a USD price to the target currency. Usage: convert_price_from_usd(13.70, ''JOD'')';
COMMENT ON FUNCTION get_products_by_currency IS 'Returns all active/approved products with prices converted to the specified currency. Usage: SELECT * FROM get_products_by_currency(''JOD'')';

-- ============================================================================
-- Step 8: Verification Tests
-- ============================================================================
DO $$
DECLARE
  v_result DECIMAL(10, 2);
  v_usd DECIMAL(10, 2);
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CURRENCY CONVERSION TESTS';
  RAISE NOTICE '========================================';
  
  -- Test 1: 50 ILS to JOD
  v_usd := convert_price(50, 'ILS', 'USD');
  v_result := convert_price(50, 'ILS', 'JOD');
  RAISE NOTICE 'Test 1: 50 ILS → % USD → % JOD', v_usd, v_result;
  RAISE NOTICE 'Expected: ~13.70 USD, ~9.73 JOD';
  
  -- Test 2: 100 SAR to JOD
  v_usd := convert_price(100, 'SAR', 'USD');
  v_result := convert_price(100, 'SAR', 'JOD');
  RAISE NOTICE 'Test 2: 100 SAR → % USD → % JOD', v_usd, v_result;
  RAISE NOTICE 'Expected: ~26.67 USD, ~18.93 JOD';
  
  -- Test 3: 10 JOD to ILS
  v_usd := convert_price(10, 'JOD', 'USD');
  v_result := convert_price(10, 'JOD', 'ILS');
  RAISE NOTICE 'Test 3: 10 JOD → % USD → % ILS', v_usd, v_result;
  RAISE NOTICE 'Expected: ~14.08 USD, ~51.41 ILS';
  
  -- Test 4: Using convert_price_from_usd directly
  v_result := convert_price_from_usd(13.70, 'JOD');
  RAISE NOTICE 'Test 4: 13.70 USD → % JOD (Direct)', v_result;
  RAISE NOTICE 'Expected: ~9.73 JOD';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTS COMPLETE';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Currency conversion system installed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify all products have price_usd calculated (check UPDATE results above)';
  RAISE NOTICE '2. Test conversion: SELECT * FROM get_products_by_currency(''JOD'')';
  RAISE NOTICE '3. Update frontend to use get_products_by_currency() RPC';
  RAISE NOTICE '4. Test with different currencies: SAR, ILS, JOD, USD, etc.';
  RAISE NOTICE '';
END $$;
