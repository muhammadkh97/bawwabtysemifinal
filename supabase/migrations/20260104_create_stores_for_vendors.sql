-- ✅ إصلاح مشكلة إنشاء منتج بدون store
-- التاريخ: 4 يناير 2026
-- المشكلة: البائع لا يملك سجل في جدول stores

-- 1️⃣ إنشاء دالة لإنشاء store تلقائياً عند تسجيل بائع جديد
CREATE OR REPLACE FUNCTION create_store_for_vendor()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا كان المستخدم بائع ولم يكن لديه store
  IF NEW.role = 'vendor' OR NEW.role = 'restaurant' THEN
    -- تحقق من وجود store
    IF NOT EXISTS (SELECT 1 FROM stores WHERE user_id = NEW.id) THEN
      INSERT INTO stores (
        user_id,
        name,
        name_ar,
        business_type,
        category,
        is_active,
        approval_status,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        COALESCE(NEW.full_name, 'متجري'),
        COALESCE(NEW.full_name, 'متجري'),
        CASE 
          WHEN NEW.role = 'restaurant' THEN 'restaurant'::business_type
          ELSE 'retail'::business_type
        END,
        'General',
        true,
        'approved',
        NOW(),
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2️⃣ إنشاء Trigger لتطبيق الدالة
DROP TRIGGER IF EXISTS trigger_create_store_on_user_insert ON users;
CREATE TRIGGER trigger_create_store_on_user_insert
AFTER INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION create_store_for_vendor();

-- 3️⃣ إنشاء stores للبائعين الموجودين بدون stores
INSERT INTO stores (
  user_id,
  name,
  name_ar,
  business_type,
  category,
  is_active,
  approval_status,
  created_at,
  updated_at
)
SELECT 
  u.id,
  COALESCE(u.full_name, 'متجري'),
  COALESCE(u.full_name, 'متجري'),
  'retail'::business_type,
  'General',
  true,
  'approved',
  NOW(),
  NOW()
FROM users u
WHERE (u.role = 'vendor' OR u.role = 'restaurant')
  AND NOT EXISTS (SELECT 1 FROM stores WHERE user_id = u.id)
ON CONFLICT DO NOTHING;

-- 4️⃣ تحديث RLS على stores للسماح للبائعين برؤية متجرهم
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "stores_select_public" ON stores;
DROP POLICY IF EXISTS "stores_select_vendor" ON stores;
DROP POLICY IF EXISTS "stores_insert_admin" ON stores;
DROP POLICY IF EXISTS "stores_update_vendor" ON stores;

-- السياسة 1: الجميع يمكنهم رؤية المتاجر النشطة المعتمدة
CREATE POLICY "stores_select_public"
ON stores FOR SELECT
TO public
USING (
  is_active = true 
  AND approval_status = 'approved'
);

-- السياسة 2: الادمن يرى كل المتاجر
CREATE POLICY "stores_select_admin"
ON stores FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- السياسة 3: البائع يرى متجره فقط
CREATE POLICY "stores_select_vendor"
ON stores FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- السياسة 4: البائع يحدث متجره فقط
CREATE POLICY "stores_update_vendor"
ON stores FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- السياسة 5: الادمن يمكنه إدراج stores
CREATE POLICY "stores_insert_admin"
ON stores FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 5️⃣ تحديث RLS على vendors للسماح بالوصول الصحيح
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "vendors_select_public" ON vendors;
DROP POLICY IF EXISTS "vendors_select_vendor" ON vendors;

-- السياسة 1: الجميع يرون البائعين النشطين
CREATE POLICY "vendors_select_public"
ON vendors FOR SELECT
TO public
USING (
  is_active = true 
  AND approval_status = 'approved'
);

-- السياسة 2: الادمن يرى الكل
CREATE POLICY "vendors_select_admin"
ON vendors FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- السياسة 3: البائع يرى بيانته فقط
CREATE POLICY "vendors_select_vendor"
ON vendors FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 6️⃣ تحديث RLS على products للسماح للبائع بإدراج منتجات
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "products_select_public" ON products;
DROP POLICY IF EXISTS "products_select_admin" ON products;
DROP POLICY IF EXISTS "products_insert_vendor" ON products;
DROP POLICY IF EXISTS "products_update_vendor" ON products;
DROP POLICY IF EXISTS "products_delete_vendor" ON products;

-- السياسة 1: قراءة عامة للمنتجات المعتمدة والنشطة
CREATE POLICY "products_select_public"
ON products FOR SELECT
TO public
USING (
  status = 'approved' 
  AND is_active = true
);

-- السياسة 2: الادمن يرى كل المنتجات
CREATE POLICY "products_select_admin"
ON products FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- السياسة 3: البائع يدرج منتجات لمتجره فقط
CREATE POLICY "products_insert_vendor"
ON products FOR INSERT
TO authenticated
WITH CHECK (
  vendor_id IN (
    SELECT id FROM stores 
    WHERE user_id = auth.uid()
  )
);

-- السياسة 4: البائع يحدث منتجاته فقط
CREATE POLICY "products_update_vendor"
ON products FOR UPDATE
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM stores 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  vendor_id IN (
    SELECT id FROM stores 
    WHERE user_id = auth.uid()
  )
);

-- السياسة 5: البائع يحذف منتجاته فقط
CREATE POLICY "products_delete_vendor"
ON products FOR DELETE
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM stores 
    WHERE user_id = auth.uid()
  )
);

-- 7️⃣ التحقق من النتيجة
SELECT 
  'Users with role vendor/restaurant without stores:',
  COUNT(*)
FROM users u
WHERE (u.role = 'vendor' OR u.role = 'restaurant')
  AND NOT EXISTS (SELECT 1 FROM stores WHERE user_id = u.id);

SELECT 
  'Total stores created:',
  COUNT(*)
FROM stores;

SELECT 
  'Total vendors/restaurants without store conflicts:',
  COUNT(*)
FROM users u
WHERE (u.role = 'vendor' OR u.role = 'restaurant')
  AND NOT EXISTS (SELECT 1 FROM stores WHERE user_id = u.id);
