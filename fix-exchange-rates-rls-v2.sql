-- ============================================================================
-- FIX EXCHANGE_RATES RLS - V2 (SIMPLIFIED)
-- ============================================================================
-- Problem: 403 Forbidden still appearing despite policy
-- Solution: Use anon role + simpler policy
-- ============================================================================

-- Step 1: Disable RLS temporarily to clean up
ALTER TABLE exchange_rates DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Allow public read access to exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Allow admin to manage exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "exchange_rates_select_policy" ON exchange_rates;
DROP POLICY IF EXISTS "exchange_rates_public_read" ON exchange_rates;

-- Step 3: Re-enable RLS
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple SELECT policy for everyone (including anon)
CREATE POLICY "exchange_rates_public_read"
ON exchange_rates
FOR SELECT
USING (true);

-- Step 5: Create admin INSERT/UPDATE/DELETE policy
CREATE POLICY "exchange_rates_admin_write"
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
-- VERIFY POLICIES
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'exchange_rates';

-- ============================================================================
-- SUCCESS
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Exchange rates RLS fixed!';
  RAISE NOTICE '✅ Public read policy created (works for anon users)';
  RAISE NOTICE '';
  RAISE NOTICE 'After deployment, the 403 errors should disappear.';
  RAISE NOTICE '';
END $$;
