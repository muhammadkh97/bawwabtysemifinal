-- ===================================================================
-- نظام السلتين المنفصلتين: سلة المنتجات + سلة المطاعم
-- ===================================================================

-- ========================================
-- 1. إنشاء جدول سلة المطاعم (restaurant_cart_items)
-- ========================================

CREATE TABLE IF NOT EXISTS public.restaurant_cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    selected_variant JSONB,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id, selected_variant)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_cart_user ON restaurant_cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_cart_product ON restaurant_cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_cart_vendor ON restaurant_cart_items(vendor_id);

COMMENT ON TABLE public.restaurant_cart_items IS 'سلة الوجبات من المطاعم - منفصلة عن سلة المنتجات العادية';
COMMENT ON COLUMN public.restaurant_cart_items.special_instructions IS 'ملاحظات خاصة للطلب (مثل: بدون بصل، إضافة جبن)';

-- ========================================
-- 2. Trigger لتحديث updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_restaurant_cart_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_restaurant_cart_timestamp ON restaurant_cart_items;
CREATE TRIGGER trigger_update_restaurant_cart_timestamp
    BEFORE UPDATE ON restaurant_cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_restaurant_cart_timestamp();

-- ========================================
-- 3. سياسات الأمان (RLS)
-- ========================================

ALTER TABLE public.restaurant_cart_items ENABLE ROW LEVEL SECURITY;

-- المستخدمون يمكنهم رؤية سلتهم فقط
DROP POLICY IF EXISTS "Users can view own restaurant cart" ON public.restaurant_cart_items;
CREATE POLICY "Users can view own restaurant cart"
ON public.restaurant_cart_items FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- المستخدمون يمكنهم إضافة إلى سلتهم
DROP POLICY IF EXISTS "Users can add to restaurant cart" ON public.restaurant_cart_items;
CREATE POLICY "Users can add to restaurant cart"
ON public.restaurant_cart_items FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- المستخدمون يمكنهم تحديث سلتهم
DROP POLICY IF EXISTS "Users can update restaurant cart" ON public.restaurant_cart_items;
CREATE POLICY "Users can update restaurant cart"
ON public.restaurant_cart_items FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- المستخدمون يمكنهم حذف من سلتهم
DROP POLICY IF EXISTS "Users can delete from restaurant cart" ON public.restaurant_cart_items;
CREATE POLICY "Users can delete from restaurant cart"
ON public.restaurant_cart_items FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ========================================
-- 4. Views مفيدة
-- ========================================

-- عرض سلة المطاعم مع تفاصيل المنتجات
CREATE OR REPLACE VIEW restaurant_cart_with_details AS
SELECT 
    rc.*,
    p.name as product_name,
    p.name_ar as product_name_ar,
    p.price as product_price,
    p.images as product_images,
    p.featured_image,
    s.name as restaurant_name,
    s.name_ar as restaurant_name_ar,
    s.logo_url as restaurant_logo,
    (rc.quantity * p.price) as item_total
FROM restaurant_cart_items rc
JOIN products p ON rc.product_id = p.id
JOIN stores s ON rc.vendor_id = s.id
WHERE s.business_type = 'restaurant';

COMMENT ON VIEW restaurant_cart_with_details IS 'سلة المطاعم مع جميع تفاصيل المنتجات والمطاعم';

-- عرض ملخص السلة لكل مستخدم
CREATE OR REPLACE VIEW user_carts_summary AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.email,
    -- سلة المنتجات العادية
    COUNT(DISTINCT ci.id) as products_cart_items,
    COALESCE(SUM(ci.quantity * p1.price), 0) as products_cart_total,
    -- سلة المطاعم
    COUNT(DISTINCT rc.id) as restaurant_cart_items,
    COALESCE(SUM(rc.quantity * p2.price), 0) as restaurant_cart_total,
    -- الإجمالي
    COUNT(DISTINCT ci.id) + COUNT(DISTINCT rc.id) as total_items,
    COALESCE(SUM(ci.quantity * p1.price), 0) + COALESCE(SUM(rc.quantity * p2.price), 0) as grand_total
FROM users u
LEFT JOIN cart_items ci ON u.id = ci.user_id
LEFT JOIN products p1 ON ci.product_id = p1.id
LEFT JOIN restaurant_cart_items rc ON u.id = rc.user_id
LEFT JOIN products p2 ON rc.product_id = p2.id
GROUP BY u.id, u.full_name, u.email;

COMMENT ON VIEW user_carts_summary IS 'ملخص شامل لسلتي كل مستخدم (المنتجات + المطاعم)';

-- ========================================
-- 5. دالة لنقل المنتجات من السلة العادية إلى سلة المطاعم
-- ========================================

CREATE OR REPLACE FUNCTION migrate_restaurant_items_to_new_cart()
RETURNS TABLE(migrated_count INTEGER, errors_count INTEGER) AS $$
DECLARE
    v_migrated INTEGER := 0;
    v_errors INTEGER := 0;
    v_item RECORD;
BEGIN
    -- البحث عن منتجات المطاعم في السلة العادية
    FOR v_item IN 
        SELECT DISTINCT
            ci.user_id,
            ci.product_id,
            ci.quantity,
            ci.selected_variant,
            p.vendor_id
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        JOIN stores s ON p.vendor_id = s.id
        WHERE s.business_type = 'restaurant'
    LOOP
        BEGIN
            -- نقل إلى سلة المطاعم
            INSERT INTO restaurant_cart_items (
                user_id,
                product_id,
                vendor_id,
                quantity,
                selected_variant
            ) VALUES (
                v_item.user_id,
                v_item.product_id,
                v_item.vendor_id,
                v_item.quantity,
                v_item.selected_variant
            )
            ON CONFLICT (user_id, product_id, selected_variant) 
            DO UPDATE SET quantity = restaurant_cart_items.quantity + EXCLUDED.quantity;
            
            -- حذف من السلة العادية
            DELETE FROM cart_items
            WHERE user_id = v_item.user_id 
                AND product_id = v_item.product_id
                AND COALESCE(selected_variant::TEXT, '') = COALESCE(v_item.selected_variant::TEXT, '');
            
            v_migrated := v_migrated + 1;
        EXCEPTION
            WHEN OTHERS THEN
                v_errors := v_errors + 1;
                RAISE NOTICE 'Error migrating item for user % product %: %', 
                    v_item.user_id, v_item.product_id, SQLERRM;
        END;
    END LOOP;
    
    RETURN QUERY SELECT v_migrated, v_errors;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION migrate_restaurant_items_to_new_cart IS 'نقل منتجات المطاعم من السلة العادية إلى سلة المطاعم الجديدة';

-- ========================================
-- 6. دالة للتحقق من نوع المنتج عند الإضافة للسلة
-- ========================================

CREATE OR REPLACE FUNCTION get_product_cart_type(p_product_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_business_type TEXT;
BEGIN
    SELECT s.business_type::TEXT INTO v_business_type
    FROM products p
    JOIN stores s ON p.vendor_id = s.id
    WHERE p.id = p_product_id;
    
    IF v_business_type = 'restaurant' THEN
        RETURN 'restaurant';
    ELSE
        RETURN 'products';
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_product_cart_type IS 'تحديد نوع السلة المناسبة للمنتج';

-- ========================================
-- 7. دالة لحذف السلة بالكامل
-- ========================================

CREATE OR REPLACE FUNCTION clear_user_carts(p_user_id UUID, p_cart_type TEXT DEFAULT 'all')
RETURNS VOID AS $$
BEGIN
    IF p_cart_type = 'all' OR p_cart_type = 'products' THEN
        DELETE FROM cart_items WHERE user_id = p_user_id;
    END IF;
    
    IF p_cart_type = 'all' OR p_cart_type = 'restaurant' THEN
        DELETE FROM restaurant_cart_items WHERE user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION clear_user_carts IS 'حذف سلة المستخدم (products, restaurant, أو all)';

-- ========================================
-- 8. تنفيذ النقل التلقائي للمنتجات الموجودة
-- ========================================

SELECT 
    '🔄 جاري نقل منتجات المطاعم من السلة العادية...' as status;

SELECT * FROM migrate_restaurant_items_to_new_cart();

-- ========================================
-- 9. إحصائيات بعد النقل
-- ========================================

SELECT 
    '📊 إحصائيات بعد الفصل:' as info;

SELECT 
    COUNT(DISTINCT user_id) as "عدد المستخدمين مع منتجات عادية",
    COUNT(*) as "عدد المنتجات في السلة العادية",
    SUM(quantity) as "إجمالي الكمية"
FROM cart_items;

SELECT 
    COUNT(DISTINCT user_id) as "عدد المستخدمين مع وجبات مطاعم",
    COUNT(*) as "عدد الوجبات في سلة المطاعم",
    SUM(quantity) as "إجمالي الكمية"
FROM restaurant_cart_items;

-- ===================================================================
-- ✅ اكتمل إنشاء نظام السلتين المنفصلتين
-- ===================================================================

SELECT '✅ تم إنشاء نظام السلتين بنجاح!' as status;
SELECT '🛒 السلة العادية: cart_items' as info1;
SELECT '🍽️ سلة المطاعم: restaurant_cart_items' as info2;
