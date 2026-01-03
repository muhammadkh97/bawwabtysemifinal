-- ==========================================
-- ⚠️ تحديث: استخدم الأجزاء بدلاً من هذا الملف
-- ==========================================
-- بسبب خطأ PostgreSQL ENUM transaction، يجب فصل السكريبت
-- استخدم الملفات التالية بالترتيب:
--
-- 1. database/add_restaurant_role_PART1.sql  ← شغّل أولاً
-- 2. database/add_restaurant_role_PART2.sql  ← شغّل ثانياً
-- 3. database/add_restaurant_role_PART3.sql  ← اختياري (للتحقق)
--
-- أو استخدم force_rebuild.sql للإعادة الكاملة
-- ==========================================
-- 
-- للمزيد من المعلومات، راجع FIX_ENUM_ERROR.md
--
-- ==========================================

-- الملف الأصلي أدناه (للرجوع فقط):

-- ==========================================
-- الخطوة 1: إضافة 'restaurant' إلى ENUM user_role
-- ==========================================
-- ملاحظة: PostgreSQL لا يدعم تعديل ENUM مباشرة، لذا نستخدم ALTER TYPE

DO $$
BEGIN
    -- التحقق من وجود القيمة أولاً
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'restaurant' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        -- إضافة القيمة الجديدة
        ALTER TYPE user_role ADD VALUE 'restaurant';
        RAISE NOTICE '✅ تم إضافة دور restaurant إلى ENUM user_role';
    ELSE
        RAISE NOTICE 'ℹ️  دور restaurant موجود بالفعل في ENUM user_role';
    END IF;
END $$;

-- ==========================================
-- الخطوة 2: التحقق من النتيجة
-- ==========================================
SELECT 
    enumlabel as role_name,
    enumsortorder as sort_order
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- ==========================================
-- الخطوة 3: تحديث RLS Policies لدور restaurant
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
-- الخطوة 4: إنشاء دالة للتحقق من صلاحيات المطعم
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
-- الخطوة 5: تحديث trigger لمزامنة الأدوار
-- ==========================================

-- تحديث الدالة لدعم restaurant
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
-- الخطوة 6: أمثلة لتحديث المستخدمين الحاليين
-- ==========================================

-- مثال 1: تحويل بائع لديه متجر من نوع restaurant إلى دور restaurant
-- UNCOMMENT هذا السطر وعدّل البريد الإلكتروني
/*
UPDATE users u
SET role = 'restaurant'
FROM stores s
WHERE s.user_id = u.id
AND s.business_type = 'restaurant'
AND u.role = 'vendor'
AND u.email = 'restaurant@example.com';
*/

-- مثال 2: عرض جميع البائعين الذين لديهم مطاعم
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    s.name as store_name,
    s.business_type
FROM users u
INNER JOIN stores s ON s.user_id = u.id
WHERE s.business_type = 'restaurant'
ORDER BY u.created_at DESC;

-- مثال 3: تحويل جميع أصحاب المطاعم إلى دور restaurant تلقائياً
-- UNCOMMENT للتنفيذ (كن حذراً!)
/*
UPDATE users u
SET role = 'restaurant'
FROM stores s
WHERE s.user_id = u.id
AND s.business_type = 'restaurant'
AND u.role = 'vendor';
*/

-- ==========================================
-- الخطوة 7: التحقق من التحديثات
-- ==========================================

-- عرض ملخص الأدوار
SELECT 
    role,
    COUNT(*) as user_count,
    COUNT(DISTINCT s.id) as stores_count
FROM users u
LEFT JOIN stores s ON s.user_id = u.id
GROUP BY role
ORDER BY user_count DESC;

-- عرض تفاصيل المطاعم
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.user_role,
    s.id as store_id,
    s.name as store_name,
    s.business_type,
    s.is_active,
    s.approval_status
FROM users u
LEFT JOIN stores s ON s.user_id = u.id
WHERE u.role = 'restaurant' OR s.business_type = 'restaurant'
ORDER BY u.created_at DESC;

-- ==========================================
-- رسالة نهاية التنفيذ
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '✅ اكتمل إضافة دور restaurant';
  RAISE NOTICE '🔍 راجع النتائج أعلاه للتحقق من التحديثات';
  RAISE NOTICE '⚠️  تذكر: إعادة تحميل Schema Cache في Supabase Dashboard';
  RAISE NOTICE '📝 استخدم أمثلة UPDATE أعلاه لتحديث المستخدمين';
END $$;
