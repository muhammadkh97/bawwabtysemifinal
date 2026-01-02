-- =========================================================
-- 08-functions-triggers.sql
-- الدوال والمشغلات
-- =========================================================

-- =====================================================
-- 1. دالة البحث عن المنتجات
-- =====================================================

CREATE OR REPLACE FUNCTION search_products(
  p_query TEXT,
  p_category_id UUID DEFAULT NULL,
  p_min_price DECIMAL DEFAULT 0,
  p_max_price DECIMAL DEFAULT 999999,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  description TEXT,
  price DECIMAL,
  rating DECIMAL,
  image_url VARCHAR,
  vendor_id UUID,
  category_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.rating,
    p.image_url,
    p.vendor_id,
    p.category_id
  FROM public.products p
  WHERE 
    (p.is_active = true) AND
    (p_query IS NULL OR p.name ILIKE '%' || p_query || '%' OR p.description ILIKE '%' || p_query || '%') AND
    (p_category_id IS NULL OR p.category_id = p_category_id) AND
    (p.price BETWEEN p_min_price AND p_max_price)
  ORDER BY p.rating DESC, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. دالة حساب نقاط الولاء
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_loyalty_points(p_order_amount DECIMAL)
RETURNS INT AS $$
DECLARE
  v_points INT;
BEGIN
  v_points := FLOOR(p_order_amount / 10); -- 1 نقطة لكل 10 وحدات عملة
  RETURN GREATEST(v_points, 1);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. دالة تطبيق كود القسيمة
-- =====================================================

CREATE OR REPLACE FUNCTION apply_coupon(
  p_coupon_code VARCHAR,
  p_order_amount DECIMAL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_amount DECIMAL,
  error_message TEXT
) AS $$
DECLARE
  v_coupon public.coupons%ROWTYPE;
  v_discount DECIMAL;
BEGIN
  SELECT * INTO v_coupon FROM public.coupons
  WHERE code = p_coupon_code AND is_active = true;
  
  IF v_coupon IS NULL THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, 'القسيمة غير صحيحة أو منتهية'::TEXT;
    RETURN;
  END IF;
  
  IF NOW() < v_coupon.valid_from OR NOW() > v_coupon.valid_until THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, 'القسيمة منتهية الصلاحية'::TEXT;
    RETURN;
  END IF;
  
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, 'انتهت مشاركات القسيمة'::TEXT;
    RETURN;
  END IF;
  
  IF v_coupon.min_order_amount IS NOT NULL AND p_order_amount < v_coupon.min_order_amount THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, 'لم تصل الطلبية للحد الأدنى'::TEXT;
    RETURN;
  END IF;
  
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := (p_order_amount * v_coupon.discount_value / 100);
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;
  
  IF v_coupon.max_discount IS NOT NULL THEN
    v_discount := LEAST(v_discount, v_coupon.max_discount);
  END IF;
  
  RETURN QUERY SELECT TRUE, v_discount, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. دالة حساب الدخل الإجمالي للتاجر
-- =====================================================

CREATE OR REPLACE FUNCTION get_vendor_total_revenue(p_vendor_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_revenue DECIMAL;
BEGIN
  SELECT COALESCE(SUM(o.total_amount), 0)
  INTO v_revenue
  FROM public.orders o
  WHERE o.vendor_id = p_vendor_id AND o.status IN ('completed', 'delivered');
  
  RETURN v_revenue;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. دالة الحصول على عدد الطلبات
-- =====================================================

CREATE OR REPLACE FUNCTION get_vendor_order_count(p_vendor_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM public.orders
  WHERE vendor_id = p_vendor_id;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. دالة الحصول على متوسط التقييم
-- =====================================================

CREATE OR REPLACE FUNCTION get_average_rating(p_vendor_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_avg DECIMAL;
BEGIN
  SELECT ROUND(COALESCE(AVG(r.rating), 0)::NUMERIC, 2)
  INTO v_avg
  FROM public.reviews r
  JOIN public.orders o ON r.order_id = o.id
  WHERE o.vendor_id = p_vendor_id;
  
  RETURN v_avg;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. دالة مراقبة مخزون المنتج
-- =====================================================

CREATE OR REPLACE FUNCTION check_product_stock(p_product_id UUID, p_quantity INT)
RETURNS BOOLEAN AS $$
DECLARE
  v_stock INT;
BEGIN
  SELECT stock_quantity INTO v_stock FROM public.products WHERE id = p_product_id;
  RETURN v_stock >= p_quantity;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. دالة إنشاء الإشعارات
-- =====================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_action_url VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, notification_type, title, message, action_url)
  VALUES (p_user_id, p_type, p_title, p_message, p_action_url)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- المشغلات
-- =====================================================

-- مشغل: تحديث متوسط التقييم عند إضافة تقييم جديد
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET rating = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM public.reviews WHERE product_id = NEW.product_id)
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_rating
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- مشغل: تحديث عدد التقييمات
CREATE OR REPLACE FUNCTION update_review_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET review_count = (SELECT COUNT(*) FROM public.reviews WHERE product_id = NEW.product_id)
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_count
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_review_count();

-- مشغل: تحديث حالة المخزون
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_stock
AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- مشغل: إضافة نقاط الولاء تلقائياً
CREATE OR REPLACE FUNCTION add_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
  v_points INT;
BEGIN
  IF NEW.status = 'delivered' THEN
    v_points := calculate_loyalty_points(NEW.total_amount);
    
    INSERT INTO public.loyalty_points (customer_id, points_earned, points_balance, reason)
    VALUES (NEW.customer_id, v_points, v_points, 'نقاط من طلبية #' || NEW.order_number)
    ON CONFLICT (customer_id) DO UPDATE
    SET points_balance = loyalty_points.points_balance + v_points,
        points_earned = loyalty_points.points_earned + v_points;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_add_loyalty_points
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION add_loyalty_points();

-- مشغل: تسجيل المعاملات المالية
CREATE OR REPLACE FUNCTION log_transaction()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.transactions (user_id, vendor_id, order_id, type, amount, payment_status)
  VALUES (NEW.customer_id, NEW.vendor_id, NEW.id, 'order_payment', NEW.total_amount, NEW.payment_status);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_transaction
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION log_transaction();

SELECT 'تم إنشاء الدوال والمشغلات بنجاح ✓' AS status;
