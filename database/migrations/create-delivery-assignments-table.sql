-- ========================================
-- CREATE DELIVERY_ASSIGNMENTS TABLE
-- Critical table for driver assignment system
-- Referenced in lib/orderHelpers.ts
-- ========================================

-- Drop table if exists (for clean recreation)
DROP TABLE IF EXISTS delivery_assignments CASCADE;

-- Create the delivery_assignments table
CREATE TABLE delivery_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Timestamps for tracking the assignment lifecycle
  assigned_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  
  -- Additional metadata
  rejection_reason TEXT,
  notes TEXT,
  
  -- Status tracking
  status TEXT CHECK (status IN ('assigned', 'accepted', 'picked_up', 'delivered', 'rejected')) DEFAULT 'assigned',
  
  -- Standard tracking fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure one active assignment per order
  UNIQUE(order_id, driver_id)
);

-- Create indexes for performance
CREATE INDEX idx_delivery_assignments_order_id ON delivery_assignments(order_id);
CREATE INDEX idx_delivery_assignments_driver_id ON delivery_assignments(driver_id);
CREATE INDEX idx_delivery_assignments_status ON delivery_assignments(status);
CREATE INDEX idx_delivery_assignments_assigned_at ON delivery_assignments(assigned_at);

-- Add comments for documentation
COMMENT ON TABLE delivery_assignments IS 'Tracks driver assignments for orders';
COMMENT ON COLUMN delivery_assignments.order_id IS 'Reference to the order being delivered';
COMMENT ON COLUMN delivery_assignments.driver_id IS 'Reference to the assigned driver';
COMMENT ON COLUMN delivery_assignments.status IS 'Current status of the delivery assignment';
COMMENT ON COLUMN delivery_assignments.assigned_at IS 'When the order was assigned to the driver';
COMMENT ON COLUMN delivery_assignments.accepted_at IS 'When the driver accepted the assignment';
COMMENT ON COLUMN delivery_assignments.picked_up_at IS 'When the driver picked up the order';
COMMENT ON COLUMN delivery_assignments.delivered_at IS 'When the order was delivered';
COMMENT ON COLUMN delivery_assignments.rejected_at IS 'When the driver rejected the assignment';

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all assignments"
ON delivery_assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Drivers can view their own assignments
CREATE POLICY "Drivers can view their own assignments"
ON delivery_assignments
FOR SELECT
TO authenticated
USING (
  driver_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'driver'
  )
);

-- Policy: Drivers can update their own assignments
CREATE POLICY "Drivers can update their own assignments"
ON delivery_assignments
FOR UPDATE
TO authenticated
USING (driver_id = auth.uid())
WITH CHECK (driver_id = auth.uid());

-- Policy: Vendors can view assignments for their orders
CREATE POLICY "Vendors can view assignments for their orders"
ON delivery_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    INNER JOIN order_items oi ON o.id = oi.order_id
    INNER JOIN products p ON oi.product_id = p.id
    WHERE o.id = delivery_assignments.order_id
    AND p.vendor_id = auth.uid()
  )
);

-- Policy: System can create assignments (for automated systems)
CREATE POLICY "System can create assignments"
ON delivery_assignments
FOR INSERT
TO authenticated
WITH CHECK (true); -- Will be controlled by application logic

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_delivery_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_delivery_assignments_timestamp
BEFORE UPDATE ON delivery_assignments
FOR EACH ROW
EXECUTE FUNCTION update_delivery_assignments_updated_at();

-- Trigger to update order status when assignment changes
CREATE OR REPLACE FUNCTION sync_order_status_with_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- When driver accepts, update order status
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    UPDATE orders
    SET status = 'confirmed',
        updated_at = now()
    WHERE id = NEW.order_id;
  END IF;
  
  -- When driver picks up, update order status
  IF NEW.status = 'picked_up' AND (OLD.status IS NULL OR OLD.status != 'picked_up') THEN
    UPDATE orders
    SET status = 'out_for_delivery',
        updated_at = now()
    WHERE id = NEW.order_id;
  END IF;
  
  -- When delivered, update order status
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    UPDATE orders
    SET status = 'delivered',
        delivered_at = now(),
        updated_at = now()
    WHERE id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_order_status
AFTER UPDATE ON delivery_assignments
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION sync_order_status_with_assignment();

-- ========================================
-- VERIFICATION
-- ========================================

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'delivery_assignments'
  ) THEN
    RAISE NOTICE '✅ Table delivery_assignments created successfully';
  ELSE
    RAISE EXCEPTION '❌ Table delivery_assignments was not created';
  END IF;
END $$;

-- Show table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'delivery_assignments'
ORDER BY ordinal_position;
