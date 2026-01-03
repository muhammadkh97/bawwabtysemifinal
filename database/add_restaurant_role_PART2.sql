-- ==========================================
-- PART 2: تحديث RLS Policies والدوال
-- ==========================================
-- شغّل هذا الجزء بعد اكتمال PART 1
-- تأكد من أن restaurant موجود في ENUM قبل تشغيل هذا

-- ==========================================
-- الخطوة 1: تحديث RLS Policies لدور restaurant
-- ==========================================

-- سياسات جدول stores (المتاجر/المطاعم)
DROP POLICY IF EXISTS "Restaurant owners can manage stores" ON stores;
CREATE POLICY "Restaurant owners can manage stores" ON stores 
FOR ALL USING (auth.uid() = user_id);

-- سياسات جدول vendors (للتوافق مع الإصدارات القديمة)
DROP POLICY IF EXISTS "Restaurant owners can manage vendors" ON vendors;
CREATE POLICY "Restaurant owners can manage vendors" ON vendors 
FOR ALL USING (auth.uid() = user_id);

-- سياسات جدول products
DROP POLICY IF EXISTS "Restaurants can manage own products" ON products;
CREATE POLICY "Restaurants can manage own products" ON products 
FOR ALL USING (
    vendor_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid() AND auth.uid() IN (
            SELECT id FROM users WHERE role IN ('vendor', 'restaurant')
        )
    )
);

-- سياسات جدول orders
DROP POLICY IF EXISTS "Restaurants can view store orders" ON orders;
CREATE POLICY "Restaurants can view store orders" ON orders 
FOR SELECT USING (
    vendor_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Restaurants can update store orders" ON orders;
CREATE POLICY "Restaurants can update store orders" ON orders 
FOR UPDATE USING (
    vendor_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    )
);

-- سياسات جدول chats
DROP POLICY IF EXISTS "Restaurants can view store chats" ON chats;
CREATE POLICY "Restaurants can view store chats" ON chats 
FOR SELECT USING (
    vendor_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Restaurants can update chats" ON chats;
CREATE POLICY "Restaurants can update chats" ON chats 
FOR UPDATE USING (
    vendor_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    )
);

-- سياسات جدول deals
DROP POLICY IF EXISTS "Restaurants can manage own deals" ON deals;
CREATE POLICY "Restaurants can manage own deals" ON deals 
FOR ALL USING (
    vendor_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    )
);

-- سياسات جدول lucky_boxes
DROP POLICY IF EXISTS "Restaurants can manage own lucky boxes" ON lucky_boxes;
CREATE POLICY "Restaurants can manage own lucky boxes" ON lucky_boxes 
FOR ALL USING (
    vendor_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    )
);

-- سياسات جدول order_items
DROP POLICY IF EXISTS "Restaurants can view store order items" ON order_items;
CREATE POLICY "Restaurants can view store order items" ON order_items 
FOR SELECT USING (
    vendor_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    )
);

-- سياسات جدول disputes
DROP POLICY IF EXISTS "Restaurants can view store disputes" ON disputes;
CREATE POLICY "Restaurants can view store disputes" ON disputes 
FOR SELECT USING (
    vendor_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    )
);

-- ==========================================
-- الخطوة 2: إنشاء دالة للتحقق من صلاحيات المطعم
-- ==========================================

CREATE OR REPLACE FUNCTION is_restaurant_owner(store_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM stores s
        INNER JOIN users u ON u.id = s.user_id
        WHERE s.id = store_id 
        AND u.id = auth.uid()
        AND u.role IN ('vendor', 'restaurant')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- الخطوة 3: تحديث trigger لمزامنة الأدوار
-- ==========================================

CREATE OR REPLACE FUNCTION sync_users_aliases()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name = NEW.full_name;
  NEW.user_role = NEW.role::TEXT;
  
  -- لوج للتتبع
  RAISE NOTICE 'Syncing user aliases: role=%, user_role=%', NEW.role, NEW.user_role;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- ✅ اكتمل جزء الـ Policies والدوال
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '✅ تم تحديث RLS Policies والدوال بنجاح';
  RAISE NOTICE '📊 الخطوة التالية: قم بتشغيل PART 3 للتحقق والأمثلة';
END $$;
