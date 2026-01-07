-- ============================================================================
-- FIX: get_products_by_currency function only
-- ============================================================================

-- Drop existing function first
DROP FUNCTION IF EXISTS get_products_by_currency(character varying);

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
  original_price NUMERIC,
  converted_price NUMERIC,
  old_price NUMERIC,
  converted_old_price NUMERIC,
  sale_price NUMERIC,
  converted_sale_price NUMERIC,
  original_currency TEXT,
  target_currency VARCHAR,
  price_usd NUMERIC,
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

-- Test it
SELECT * FROM get_products_by_currency('JOD') LIMIT 5;
