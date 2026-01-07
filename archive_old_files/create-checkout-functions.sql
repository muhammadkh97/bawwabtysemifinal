-- ===================================================================
-- دوال مساعدة لصفحة Checkout
-- ===================================================================

-- دالة لحساب رسوم التوصيل بناءً على المنطقة ونوع التوصيل
CREATE OR REPLACE FUNCTION calculate_delivery_fee(
    p_zone_id UUID,
    p_delivery_type delivery_type,
    p_subtotal NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
    v_delivery_fee NUMERIC;
    v_free_threshold NUMERIC;
BEGIN
    -- التوصيل الفوري للمطاعم: رسوم ثابتة
    IF p_delivery_type = 'instant' THEN
        -- رسوم التوصيل الفوري (يمكن تخصيصها حسب المطعم)
        RETURN 5.00;
    END IF;
    
    -- التوصيل المجدول: حسب المنطقة
    SELECT delivery_fee, COALESCE(
        (SELECT free_shipping_threshold FROM shipping_settings WHERE is_active = true LIMIT 1),
        100
    ) INTO v_delivery_fee, v_free_threshold
    FROM delivery_zones
    WHERE id = p_zone_id;
    
    -- إذا كان المبلغ يستحق توصيل مجاني
    IF p_subtotal >= v_free_threshold THEN
        RETURN 0;
    END IF;
    
    RETURN COALESCE(v_delivery_fee, 5.00);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_delivery_fee IS 'حساب رسوم التوصيل بناءً على المنطقة ونوع التوصيل';

-- دالة للحصول على الوقت المتوقع للتوصيل
CREATE OR REPLACE FUNCTION get_estimated_delivery(
    p_delivery_type delivery_type,
    p_zone_id UUID DEFAULT NULL
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    v_estimated_days INTEGER;
BEGIN
    -- التوصيل الفوري: 30-60 دقيقة
    IF p_delivery_type = 'instant' THEN
        RETURN NOW() + INTERVAL '45 minutes';
    END IF;
    
    -- التوصيل المجدول: حسب المنطقة
    IF p_zone_id IS NOT NULL THEN
        SELECT estimated_days INTO v_estimated_days
        FROM delivery_zones
        WHERE id = p_zone_id;
        
        IF v_estimated_days IS NOT NULL THEN
            RETURN NOW() + (v_estimated_days || ' days')::INTERVAL;
        END IF;
    END IF;
    
    -- افتراضي: يومين
    RETURN NOW() + INTERVAL '2 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_estimated_delivery IS 'حساب الوقت المتوقع للتوصيل';

-- دالة لإنشاء طلب مع دعم نظام التوصيل المزدوج
CREATE OR REPLACE FUNCTION create_order_with_delivery(
    p_order_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_vendor_id UUID;
    v_delivery_type delivery_type;
    v_zone_id UUID;
    v_delivery_fee NUMERIC;
    v_estimated_delivery TIMESTAMP WITH TIME ZONE;
    v_result JSONB;
BEGIN
    -- استخراج بيانات الطلب
    v_vendor_id := (p_order_data->>'vendor_id')::UUID;
    
    -- تحديد نوع التوصيل
    v_delivery_type := determine_delivery_type(v_vendor_id);
    
    -- تحديد المنطقة
    v_zone_id := find_delivery_zone(
        (p_order_data->'delivery_address'->>'latitude')::DOUBLE PRECISION,
        (p_order_data->'delivery_address'->>'longitude')::DOUBLE PRECISION,
        p_order_data->'delivery_address'->>'city'
    );
    
    -- حساب رسوم التوصيل
    v_delivery_fee := calculate_delivery_fee(
        v_zone_id,
        v_delivery_type,
        (p_order_data->>'subtotal')::NUMERIC
    );
    
    -- حساب الوقت المتوقع
    v_estimated_delivery := get_estimated_delivery(v_delivery_type, v_zone_id);
    
    -- إنشاء الطلب
    INSERT INTO orders (
        order_number,
        customer_id,
        vendor_id,
        delivery_type,
        zone_id,
        subtotal,
        delivery_fee,
        tax,
        discount,
        total,
        payment_method,
        payment_status,
        delivery_address,
        delivery_lat,
        delivery_lng,
        delivery_notes,
        estimated_delivery,
        status
    ) VALUES (
        p_order_data->>'order_number',
        (p_order_data->>'customer_id')::UUID,
        v_vendor_id,
        v_delivery_type,
        v_zone_id,
        (p_order_data->>'subtotal')::NUMERIC,
        v_delivery_fee,
        (p_order_data->>'tax')::NUMERIC,
        (p_order_data->>'discount')::NUMERIC,
        (p_order_data->>'total')::NUMERIC + v_delivery_fee, -- إعادة حساب الإجمالي
        p_order_data->>'payment_method',
        p_order_data->>'payment_status',
        p_order_data->'delivery_address'->>'address',
        (p_order_data->'delivery_address'->>'latitude')::DOUBLE PRECISION,
        (p_order_data->'delivery_address'->>'longitude')::DOUBLE PRECISION,
        p_order_data->'delivery_address'->>'notes',
        v_estimated_delivery,
        'pending'
    )
    RETURNING id INTO v_order_id;
    
    -- إنشاء سجل تتبع أولي
    INSERT INTO delivery_tracking (
        order_id,
        driver_id,
        status,
        notes
    ) VALUES (
        v_order_id,
        NULL,
        'order_placed',
        'تم استلام الطلب'
    );
    
    -- إرجاع النتيجة
    v_result := jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'delivery_type', v_delivery_type,
        'delivery_fee', v_delivery_fee,
        'zone_id', v_zone_id,
        'estimated_delivery', v_estimated_delivery
    );
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_order_with_delivery IS 'إنشاء طلب مع دعم نظام التوصيل المزدوج';

-- ===================================================================
-- ✅ اكتمل إنشاء دوال Checkout
-- ===================================================================

SELECT '✅ تم إنشاء دوال Checkout بنجاح!' as status;
