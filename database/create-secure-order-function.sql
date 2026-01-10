-- =====================================================
-- دالة آمنة لإنشاء الطلبات مع التحقق من الأسعار
-- Secure Order Creation Function with Price Validation
-- =====================================================
-- التاريخ: 10 يناير 2026
-- الهدف: حل الثغرات المالية (FM-001 إلى FM-005)
-- =====================================================

-- إنشاء نوع مخصص لعناصر السلة
CREATE TYPE cart_item_type AS (
  product_id UUID,
  quantity INTEGER,
  store_id UUID
);

-- الدالة الرئيسية لإنشاء الطلب بشكل آمن
CREATE OR REPLACE FUNCTION create_order_secure(
  p_customer_id UUID,
  p_cart_items JSONB,
  p_delivery_address TEXT,
  p_delivery_city TEXT,
  p_delivery_phone TEXT,
  p_payment_method TEXT,
  p_coupon_code TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_product RECORD;
  v_store RECORD;
  v_subtotal DECIMAL(10, 2) := 0;
  v_tax DECIMAL(10, 2);
  v_shipping DECIMAL(10, 2) := 0;
  v_discount DECIMAL(10, 2) := 0;
  v_total DECIMAL(10, 2);
  v_order_id UUID;
  v_order_number TEXT;
  v_vendor_earnings DECIMAL(10, 2);
  v_platform_fee DECIMAL(10, 2);
  v_coupon RECORD;
  v_item_total DECIMAL(10, 2);
  v_item_price DECIMAL(10, 2);
  v_order_items JSONB := '[]'::JSONB;
  v_result JSONB;
  v_free_shipping_threshold DECIMAL(10, 2) := 50.0;
  v_shipping_fee DECIMAL(10, 2) := 20.0;
  v_tax_rate DECIMAL(5, 4) := 0.10; -- 10%
  v_platform_commission DECIMAL(5, 4) := 0.10; -- 10%
BEGIN
  -- =====================================================
  -- 1. التحقق من صحة المدخلات
  -- =====================================================
  
  -- التحقق من أن المستخدم مصادق عليه
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'يجب تسجيل الدخول أولاً'
    );
  END IF;
  
  -- التحقق من أن المستخدم هو نفسه الذي يقوم بإنشاء الطلب
  IF auth.uid() != p_customer_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'forbidden',
      'message', 'غير مصرح لك بإنشاء طلب لمستخدم آخر'
    );
  END IF;
  
  -- التحقق من أن السلة ليست فارغة
  IF jsonb_array_length(p_cart_items) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'empty_cart',
      'message', 'السلة فارغة'
    );
  END IF;
  
  -- =====================================================
  -- 2. التحقق من الأسعار وحساب الإجمالي الفرعي
  -- =====================================================
  
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    -- استخراج البيانات من العنصر
    DECLARE
      v_product_id UUID := (v_item->>'product_id')::UUID;
      v_quantity INTEGER := (v_item->>'quantity')::INTEGER;
      v_store_id UUID := (v_item->>'store_id')::UUID;
    BEGIN
      -- التحقق من صحة الكمية
      IF v_quantity IS NULL OR v_quantity <= 0 THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'invalid_quantity',
          'message', 'الكمية يجب أن تكون أكبر من صفر',
          'product_id', v_product_id
        );
      END IF;
      
      -- التحقق من الحد الأقصى للكمية
      IF v_quantity > 100 THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'quantity_exceeded',
          'message', 'الحد الأقصى للكمية هو 100 لكل منتج',
          'product_id', v_product_id
        );
      END IF;
      
      -- جلب بيانات المنتج من قاعدة البيانات
      SELECT 
        p.id,
        p.name,
        p.price,
        p.discount_price,
        p.stock,
        p.image,
        p.store_id
      INTO v_product
      FROM products p
      WHERE p.id = v_product_id
        AND p.status = 'approved'
        AND p.store_id = v_store_id;
      
      -- التحقق من وجود المنتج
      IF NOT FOUND THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'product_not_found',
          'message', 'المنتج غير موجود أو غير متاح',
          'product_id', v_product_id
        );
      END IF;
      
      -- التحقق من المخزون
      IF v_product.stock < v_quantity THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'insufficient_stock',
          'message', 'المخزون غير كافي',
          'product_id', v_product_id,
          'available_stock', v_product.stock
        );
      END IF;
      
      -- تحديد السعر (استخدام سعر الخصم إن وجد)
      v_item_price := COALESCE(v_product.discount_price, v_product.price);
      
      -- حساب إجمالي العنصر
      v_item_total := v_item_price * v_quantity;
      
      -- إضافة إلى الإجمالي الفرعي
      v_subtotal := v_subtotal + v_item_total;
      
      -- إضافة العنصر إلى قائمة عناصر الطلب
      v_order_items := v_order_items || jsonb_build_object(
        'product_id', v_product.id,
        'product_name', v_product.name,
        'quantity', v_quantity,
        'price', v_item_price,
        'total', v_item_total,
        'image', v_product.image,
        'store_id', v_product.store_id
      );
    END;
  END LOOP;
  
  -- =====================================================
  -- 3. التحقق من كوبون الخصم وحساب قيمته
  -- =====================================================
  
  IF p_coupon_code IS NOT NULL AND p_coupon_code != '' THEN
    SELECT 
      id,
      code,
      discount_type,
      discount_value,
      min_purchase,
      max_discount,
      valid_from,
      valid_until,
      usage_limit,
      used_count,
      is_active
    INTO v_coupon
    FROM coupons
    WHERE code = p_coupon_code
      AND is_active = true
      AND (valid_from IS NULL OR valid_from <= NOW())
      AND (valid_until IS NULL OR valid_until >= NOW());
    
    IF FOUND THEN
      -- التحقق من حد الاستخدام
      IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'coupon_expired',
          'message', 'تم استخدام الكوبون بالكامل'
        );
      END IF;
      
      -- التحقق من الحد الأدنى للشراء
      IF v_coupon.min_purchase IS NOT NULL AND v_subtotal < v_coupon.min_purchase THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'min_purchase_not_met',
          'message', 'الحد الأدنى للشراء لاستخدام هذا الكوبون هو ' || v_coupon.min_purchase || ' دينار'
        );
      END IF;
      
      -- حساب قيمة الخصم
      IF v_coupon.discount_type = 'percentage' THEN
        v_discount := v_subtotal * (v_coupon.discount_value / 100.0);
      ELSIF v_coupon.discount_type = 'fixed' THEN
        v_discount := v_coupon.discount_value;
      END IF;
      
      -- تطبيق الحد الأقصى للخصم
      IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
        v_discount := v_coupon.max_discount;
      END IF;
      
      -- التأكد من أن الخصم لا يتجاوز الإجمالي الفرعي
      IF v_discount > v_subtotal THEN
        v_discount := v_subtotal;
      END IF;
      
      -- تحديث عدد استخدامات الكوبون
      UPDATE coupons
      SET used_count = used_count + 1
      WHERE id = v_coupon.id;
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'invalid_coupon',
        'message', 'كوبون الخصم غير صالح أو منتهي الصلاحية'
      );
    END IF;
  END IF;
  
  -- =====================================================
  -- 4. حساب رسوم الشحن
  -- =====================================================
  
  -- شحن مجاني إذا كان الإجمالي أكبر من الحد المحدد
  IF v_subtotal >= v_free_shipping_threshold THEN
    v_shipping := 0;
  ELSE
    v_shipping := v_shipping_fee;
  END IF;
  
  -- =====================================================
  -- 5. حساب الضريبة والإجمالي النهائي
  -- =====================================================
  
  v_tax := (v_subtotal - v_discount) * v_tax_rate;
  v_total := v_subtotal - v_discount + v_shipping + v_tax;
  
  -- التأكد من أن الإجمالي موجب
  IF v_total <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_total',
      'message', 'الإجمالي النهائي يجب أن يكون أكبر من صفر'
    );
  END IF;
  
  -- =====================================================
  -- 6. إنشاء رقم الطلب الفريد
  -- =====================================================
  
  v_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  -- =====================================================
  -- 7. إنشاء الطلب في قاعدة البيانات
  -- =====================================================
  
  -- جلب بيانات المتجر من أول عنصر
  SELECT store_id INTO v_store
  FROM jsonb_to_recordset(v_order_items) AS x(store_id UUID)
  LIMIT 1;
  
  INSERT INTO orders (
    order_number,
    customer_id,
    vendor_id,
    subtotal,
    delivery_fee,
    tax,
    discount,
    total,
    payment_method,
    payment_status,
    status,
    delivery_address,
    delivery_city,
    delivery_phone,
    notes,
    created_at
  )
  VALUES (
    v_order_number,
    p_customer_id,
    v_store,
    v_subtotal,
    v_shipping,
    v_tax,
    v_discount,
    v_total,
    p_payment_method,
    'pending',
    'pending',
    p_delivery_address,
    p_delivery_city,
    p_delivery_phone,
    p_notes,
    NOW()
  )
  RETURNING id INTO v_order_id;
  
  -- =====================================================
  -- 8. إضافة عناصر الطلب
  -- =====================================================
  
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_order_items)
  LOOP
    DECLARE
      v_product_id UUID := (v_item->>'product_id')::UUID;
      v_quantity INTEGER := (v_item->>'quantity')::INTEGER;
      v_price DECIMAL(10, 2) := (v_item->>'price')::DECIMAL(10, 2);
      v_total_item DECIMAL(10, 2) := (v_item->>'total')::DECIMAL(10, 2);
      v_store_id UUID := (v_item->>'store_id')::UUID;
    BEGIN
      -- حساب أرباح البائع والعمولة
      v_vendor_earnings := v_total_item * (1 - v_platform_commission);
      v_platform_fee := v_total_item * v_platform_commission;
      
      INSERT INTO order_items (
        order_id,
        product_id,
        quantity,
        price,
        total,
        vendor_earnings,
        platform_fee,
        created_at
      )
      VALUES (
        v_order_id,
        v_product_id,
        v_quantity,
        v_price,
        v_total_item,
        v_vendor_earnings,
        v_platform_fee,
        NOW()
      );
      
      -- تحديث المخزون
      UPDATE products
      SET stock = GREATEST(0, stock - v_quantity)
      WHERE id = v_product_id;
    END;
  END LOOP;
  
  -- =====================================================
  -- 9. إرجاع النتيجة
  -- =====================================================
  
  v_result := jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'shipping', v_shipping,
    'tax', v_tax,
    'discount', v_discount,
    'total', v_total,
    'items', v_order_items
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'internal_error',
      'message', 'حدث خطأ أثناء إنشاء الطلب',
      'details', SQLERRM
    );
END;
$$;

-- =====================================================
-- منح الصلاحيات
-- =====================================================

-- السماح للمستخدمين المصادق عليهم باستدعاء الدالة
GRANT EXECUTE ON FUNCTION create_order_secure TO authenticated;

-- =====================================================
-- تعليقات للتوثيق
-- =====================================================

COMMENT ON FUNCTION create_order_secure IS 'دالة آمنة لإنشاء الطلبات مع التحقق الكامل من الأسعار والكميات والخصومات';
