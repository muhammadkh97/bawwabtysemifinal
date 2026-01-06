-- ============================================
-- إضافة الأعمدة المفقودة - لوحة تحكم السائق
-- Add Missing Columns for Driver Dashboard
-- ============================================

-- ========================================
-- 1. إضافة أعمدة drivers المفقودة
-- ========================================

-- تحقق من وجود الجدول أولاً
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'drivers') THEN
    RAISE NOTICE 'جدول drivers غير موجود - يجب إنشاؤه أولاً';
  ELSE
    RAISE NOTICE 'جدول drivers موجود ✓';
  END IF;
END $$;

-- إضافة الأعمدة المفقودة
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_location TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'offline',
ADD COLUMN IF NOT EXISTS total_distance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS today_distance NUMERIC DEFAULT 0;

COMMENT ON COLUMN drivers.is_available IS 'هل السائق متاح لاستقبال الطلبات';
COMMENT ON COLUMN drivers.current_location IS 'الموقع الحالي (نص وصفي)';
COMMENT ON COLUMN drivers.latitude IS 'خط العرض';
COMMENT ON COLUMN drivers.longitude IS 'خط الطول';
COMMENT ON COLUMN drivers.status IS 'حالة السائق (online/offline/busy)';
COMMENT ON COLUMN drivers.total_distance IS 'المسافة الإجمالية المقطوعة (كم)';
COMMENT ON COLUMN drivers.today_distance IS 'المسافة المقطوعة اليوم (كم)';

-- ========================================
-- 2. إضافة أعمدة orders المفقودة
-- ========================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_latitude NUMERIC,
ADD COLUMN IF NOT EXISTS delivery_longitude NUMERIC;

COMMENT ON COLUMN orders.delivery_latitude IS 'خط عرض موقع التوصيل';
COMMENT ON COLUMN orders.delivery_longitude IS 'خط طول موقع التوصيل';

-- ========================================
-- 3. إضافة أعمدة stores المفقودة (لاستخدام الخريطة)
-- ========================================

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

COMMENT ON COLUMN stores.latitude IS 'خط عرض المتجر/المطعم';
COMMENT ON COLUMN stores.longitude IS 'خط طول المتجر/المطعم';

-- ========================================
-- 4. التحقق من Foreign Key لـ driver_id في orders
-- ========================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_driver_id_fkey' 
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_driver_id_fkey 
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'تم إضافة Foreign Key لـ driver_id ✓';
  ELSE
    RAISE NOTICE 'Foreign Key لـ driver_id موجود بالفعل ✓';
  END IF;
END $$;

-- ========================================
-- 5. إنشاء Index على driver_id لتحسين الأداء
-- ========================================

CREATE INDEX IF NOT EXISTS idx_orders_driver_id 
ON orders(driver_id) 
WHERE driver_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_driver_status 
ON orders(driver_id, status) 
WHERE driver_id IS NOT NULL;

COMMENT ON INDEX idx_orders_driver_id IS 'تحسين استعلامات طلبات السائق';
COMMENT ON INDEX idx_orders_driver_status IS 'تحسين استعلامات حالة طلبات السائق';

-- ========================================
-- 6. إنشاء RLS Policies للسائق
-- ========================================

-- السماح للسائق برؤية بياناته
DROP POLICY IF EXISTS "Drivers can view own data" ON drivers;
CREATE POLICY "Drivers can view own data" 
ON drivers FOR SELECT
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- السماح للسائق بتحديث بياناته
DROP POLICY IF EXISTS "Drivers can update own data" ON drivers;
CREATE POLICY "Drivers can update own data" 
ON drivers FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- السماح للسائق برؤية الطلبات المتاحة
DROP POLICY IF EXISTS "Drivers can view available orders" ON orders;
CREATE POLICY "Drivers can view available orders" 
ON orders FOR SELECT
USING (
  -- الطلبات المخصصة له
  driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  OR
  -- الطلبات المتاحة (بدون سائق)
  (driver_id IS NULL AND status = 'ready_for_pickup')
  OR
  -- المسؤولين
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- السماح للسائق بتحديث حالة الطلبات المخصصة له
DROP POLICY IF EXISTS "Drivers can update assigned orders" ON orders;
CREATE POLICY "Drivers can update assigned orders" 
ON orders FOR UPDATE
USING (
  driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
)
WITH CHECK (
  driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
);

-- ========================================
-- 7. إنشاء دالة لقبول الطلب (assign order to driver)
-- ========================================

CREATE OR REPLACE FUNCTION assign_order_to_driver(
  p_order_id UUID,
  p_driver_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_driver_id UUID;
  v_order RECORD;
BEGIN
  -- الحصول على معرف السائق
  SELECT id INTO v_driver_id
  FROM drivers
  WHERE user_id = p_driver_user_id
  AND is_available = true;

  IF v_driver_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'السائق غير متاح حالياً'
    );
  END IF;

  -- التحقق من الطلب
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  AND status = 'ready_for_pickup'
  AND driver_id IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'الطلب غير متاح'
    );
  END IF;

  -- تعيين السائق للطلب
  UPDATE orders
  SET 
    driver_id = v_driver_id,
    status = 'picked_up',
    updated_at = NOW()
  WHERE id = p_order_id;

  -- إرسال إشعار للعميل
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    priority,
    category
  )
  VALUES (
    v_order.customer_id,
    'order_update',
    'تم تعيين مندوب توصيل',
    'تم تعيين مندوب توصيل لطلبك رقم ' || v_order.order_number,
    '/orders/' || v_order.id,
    'high',
    'orders'
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'driver_id', v_driver_id,
    'message', 'تم قبول الطلب بنجاح'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION assign_order_to_driver TO authenticated;

COMMENT ON FUNCTION assign_order_to_driver IS 'تعيين طلب لسائق معين';

-- ========================================
-- 8. إنشاء دالة لتحديث حالة الطلب من السائق
-- ========================================

CREATE OR REPLACE FUNCTION update_order_status_by_driver(
  p_order_id UUID,
  p_new_status TEXT,
  p_driver_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_driver_id UUID;
  v_order RECORD;
  v_status_messages JSONB;
BEGIN
  -- رسائل الحالات
  v_status_messages := jsonb_build_object(
    'picked_up', 'تم استلام الطلب من المتجر',
    'in_transit', 'الطلب في الطريق إليك',
    'out_for_delivery', 'الطلب في طريقه للتوصيل',
    'delivered', 'تم توصيل الطلب بنجاح'
  );

  -- الحصول على معرف السائق
  SELECT id INTO v_driver_id
  FROM drivers
  WHERE user_id = p_driver_user_id;

  IF v_driver_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'السائق غير موجود'
    );
  END IF;

  -- التحقق من الطلب
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  AND driver_id = v_driver_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'الطلب غير موجود أو غير مخصص لك'
    );
  END IF;

  -- تحديث حالة الطلب
  UPDATE orders
  SET 
    status = p_new_status,
    delivered_at = CASE WHEN p_new_status = 'delivered' THEN NOW() ELSE delivered_at END,
    updated_at = NOW()
  WHERE id = p_order_id;

  -- إرسال إشعار للعميل
  IF v_status_messages ? p_new_status THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link,
      priority,
      category
    )
    VALUES (
      v_order.customer_id,
      'order_update',
      'تحديث حالة الطلب',
      v_status_messages->>p_new_status || ' - رقم الطلب: ' || v_order.order_number,
      '/orders/' || v_order.id,
      CASE WHEN p_new_status = 'delivered' THEN 'high' ELSE 'normal' END,
      'orders'
    );
  END IF;

  -- إرسال إشعار للبائع/المطعم
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    priority,
    category
  )
  SELECT
    s.user_id,
    'order_update',
    'تحديث حالة الطلب',
    v_status_messages->>p_new_status || ' - رقم الطلب: ' || v_order.order_number,
    '/dashboard/restaurant/orders',
    'normal',
    'orders'
  FROM stores s
  WHERE s.id = v_order.vendor_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'new_status', p_new_status,
    'message', 'تم تحديث حالة الطلب بنجاح'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION update_order_status_by_driver TO authenticated;

COMMENT ON FUNCTION update_order_status_by_driver IS 'تحديث حالة الطلب من قبل السائق';

-- ========================================
-- 9. إنشاء دالة لتحديث موقع السائق
-- ========================================

CREATE OR REPLACE FUNCTION update_driver_location(
  p_driver_user_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_location_text TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_driver_id UUID;
  v_last_lat NUMERIC;
  v_last_lng NUMERIC;
  v_distance NUMERIC := 0;
BEGIN
  -- الحصول على بيانات السائق الحالية
  SELECT id, latitude, longitude 
  INTO v_driver_id, v_last_lat, v_last_lng
  FROM drivers
  WHERE user_id = p_driver_user_id;

  IF v_driver_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'السائق غير موجود'
    );
  END IF;

  -- حساب المسافة المقطوعة (تقريبية)
  IF v_last_lat IS NOT NULL AND v_last_lng IS NOT NULL THEN
    v_distance := (
      6371 * acos(
        cos(radians(v_last_lat)) * 
        cos(radians(p_latitude)) * 
        cos(radians(p_longitude) - radians(v_last_lng)) + 
        sin(radians(v_last_lat)) * 
        sin(radians(p_latitude))
      )
    );
  END IF;

  -- تحديث موقع السائق
  UPDATE drivers
  SET 
    latitude = p_latitude,
    longitude = p_longitude,
    current_location = COALESCE(p_location_text, current_location),
    total_distance = total_distance + v_distance,
    today_distance = today_distance + v_distance,
    updated_at = NOW()
  WHERE id = v_driver_id;

  RETURN jsonb_build_object(
    'success', true,
    'driver_id', v_driver_id,
    'distance_moved', v_distance,
    'message', 'تم تحديث الموقع بنجاح'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION update_driver_location TO authenticated;

COMMENT ON FUNCTION update_driver_location IS 'تحديث موقع السائق الحالي';

-- ========================================
-- 10. التحقق من الإضافات
-- ========================================

-- التحقق من drivers
SELECT 
  '✅ أعمدة drivers' as check_name,
  COUNT(*) FILTER (WHERE column_name IN ('is_available', 'current_location', 'latitude', 'longitude', 'status', 'total_distance', 'today_distance')) as added_columns
FROM information_schema.columns
WHERE table_name = 'drivers'
AND column_name IN ('is_available', 'current_location', 'latitude', 'longitude', 'status', 'total_distance', 'today_distance');

-- التحقق من orders
SELECT 
  '✅ أعمدة orders' as check_name,
  COUNT(*) FILTER (WHERE column_name IN ('delivery_latitude', 'delivery_longitude')) as added_columns
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN ('delivery_latitude', 'delivery_longitude');

-- التحقق من stores
SELECT 
  '✅ أعمدة stores' as check_name,
  COUNT(*) FILTER (WHERE column_name IN ('latitude', 'longitude')) as added_columns
FROM information_schema.columns
WHERE table_name = 'stores'
AND column_name IN ('latitude', 'longitude');

-- التحقق من الدوال
SELECT 
  '✅ الدوال المضافة' as check_name,
  COUNT(*) as functions_count
FROM pg_proc
WHERE proname IN ('assign_order_to_driver', 'update_order_status_by_driver', 'update_driver_location');

-- التحقق من RLS Policies
SELECT 
  '✅ RLS Policies' as check_name,
  COUNT(*) as policies_count
FROM pg_policies
WHERE tablename IN ('drivers', 'orders')
AND policyname IN (
  'Drivers can view own data',
  'Drivers can update own data',
  'Drivers can view available orders',
  'Drivers can update assigned orders'
);

-- ✅ تم إضافة جميع الأعمدة والدوال المفقودة للوحة تحكم السائق
