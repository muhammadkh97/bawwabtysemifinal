-- ============================================================================
-- FIX EXCHANGE_RATES RLS POLICY
-- ============================================================================
-- Problem: "permission denied for table exchange_rates"
-- Solution: Enable RLS and allow public read access
-- ============================================================================

-- Enable RLS on exchange_rates table
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if present
DROP POLICY IF EXISTS "Allow public read access to exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Allow admin to manage exchange rates" ON exchange_rates;

-- Create policy for public read access
CREATE POLICY "Allow public read access to exchange rates"
ON exchange_rates
FOR SELECT
TO public
USING (true);

-- Create policy for admin to insert/update/delete
CREATE POLICY "Allow admin to manage exchange rates"
ON exchange_rates
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ============================================================================
-- INSERT DEFAULT EXCHANGE RATES (if not exists)
-- ============================================================================
-- These match the hardcoded rates in convert_price function
-- Note: base_currency must be USD (constraint check_base_usd)

INSERT INTO exchange_rates (base_currency, target_currency, rate, last_updated)
VALUES
  -- From USD to all other currencies (only USD as base is allowed)
  ('USD', 'USD', 1.00, NOW()),
  ('USD', 'SAR', 3.75, NOW()),
  ('USD', 'ILS', 3.65, NOW()),
  ('USD', 'JOD', 0.71, NOW()),
  ('USD', 'EGP', 49.5, NOW()),
  ('USD', 'AED', 3.67, NOW()),
  ('USD', 'KWD', 0.31, NOW())
ON CONFLICT (base_currency, target_currency) 
DO UPDATE SET 
  rate = EXCLUDED.rate,
  last_updated = EXCLUDED.last_updated;

-- ============================================================================
-- VERIFY
-- ============================================================================
SELECT 
  base_currency,
  target_currency,
  rate,
  last_updated
FROM exchange_rates
ORDER BY base_currency, target_currency;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Exchange rates RLS policies enabled!';
  RAISE NOTICE '✅ Default exchange rates inserted!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Deploy to Supabase to fix 403 errors';
  RAISE NOTICE '';
END $$;
