-- ============================================
-- إصلاح المشاكل الحرجة في قاعدة البيانات
-- تاريخ: 11 يناير 2026
-- ============================================

-- 1. إضافة عمود currency إلى جدول orders
-- ============================================
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'ILS';

COMMENT ON COLUMN orders.currency IS 'العملة المستخدمة في الطلب (ILS, JOD, USD, إلخ)';

-- تحديث الطلبات الموجودة بعملة افتراضية
UPDATE orders 
SET currency = 'ILS' 
WHERE currency IS NULL;

-- 2. التأكد من عدم تكرار البريد الإلكتروني
-- ============================================
-- حذف المستخدمين المكررين (الاحتفاظ بالأقدم فقط)
WITH duplicates AS (
  SELECT id, email, 
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as rn
  FROM users
  WHERE email IS NOT NULL
)
DELETE FROM users
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- إضافة قيد UNIQUE على البريد الإلكتروني إذا لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_email_unique'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT users_email_unique UNIQUE (email);
  END IF;
END $$;

-- 3. إصلاح مشكلة "بائع غير معروف"
-- ============================================
-- التأكد من أن جميع المنتجات لديها vendor_id صحيح
UPDATE products 
SET vendor_id = (SELECT id FROM stores LIMIT 1)
WHERE vendor_id IS NULL 
AND (SELECT COUNT(*) FROM stores) > 0;

-- إضافة قيد Foreign Key إذا لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_vendor_id_fkey'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_vendor_id_fkey 
    FOREIGN KEY (vendor_id) 
    REFERENCES stores(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- 4. تحديث أسماء المنتجات التجريبية
-- ============================================
-- تحديث المنتجات التي تحمل اسم "تست" أو "jsj"
UPDATE products 
SET 
  name = CASE 
    WHEN LOWER(name) = 'تست' AND description LIKE '%ساعة%' THEN 'ساعة ذكية'
    WHEN LOWER(name) = 'تست' AND description LIKE '%عطر%' THEN 'عطر فاخر'
    WHEN LOWER(name) = 'تست' AND description LIKE '%سيارة%' THEN 'سيارة لعبة'
    WHEN LOWER(name) = 'تست' AND description LIKE '%سماعات%' THEN 'سماعات رأس'
    WHEN LOWER(name) = 'تست' THEN 'منتج متنوع'
    WHEN LOWER(name) = 'jsj' THEN 'هاتف ذكي'
    ELSE name
  END,
  description = CASE 
    WHEN LOWER(name) = 'تست' AND description LIKE '%ساعة%' THEN 'ساعة ذكية عصرية بتصميم أنيق ومميزات متقدمة'
    WHEN LOWER(name) = 'تست' AND description LIKE '%عطر%' THEN 'عطر فاخر بعبير مميز يدوم طويلاً'
    WHEN LOWER(name) = 'تست' AND description LIKE '%سيارة%' THEN 'سيارة لعبة بتصميم واقعي وجودة عالية'
    WHEN LOWER(name) = 'تست' AND description LIKE '%سماعات%' THEN 'سماعات رأس بجودة صوت عالية وراحة فائقة'
    WHEN LOWER(name) = 'تست' THEN 'منتج متنوع بجودة ممتازة وسعر مناسب'
    WHEN LOWER(name) = 'jsj' THEN 'هاتف ذكي بمواصفات عالية وأداء ممتاز'
    ELSE description
  END
WHERE LOWER(name) IN ('تست', 'jsj');

-- 5. إضافة تقييمات واقعية للمنتجات
-- ============================================
-- إضافة تقييمات عشوائية للمنتجات (إذا كان جدول reviews فارغاً)
DO $$ 
DECLARE
  product_record RECORD;
  user_record RECORD;
  rating_value INTEGER;
BEGIN
  -- التحقق من وجود تقييمات
  IF (SELECT COUNT(*) FROM reviews) = 0 THEN
    -- إضافة تقييمات لكل منتج
    FOR product_record IN SELECT id FROM products LIMIT 10 LOOP
      -- إضافة 2-3 تقييمات لكل منتج
      FOR i IN 1..3 LOOP
        -- اختيار مستخدم عشوائي
        SELECT id INTO user_record FROM users WHERE role = 'customer' ORDER BY RANDOM() LIMIT 1;
        
        -- تقييم عشوائي بين 3 و 5
        rating_value := 3 + FLOOR(RANDOM() * 3);
        
        -- إدراج التقييم
        INSERT INTO reviews (
          product_id, 
          user_id, 
          rating, 
          comment,
          created_at
        ) VALUES (
          product_record.id,
          COALESCE(user_record.id, (SELECT id FROM users LIMIT 1)),
          rating_value,
          CASE rating_value
            WHEN 5 THEN 'منتج ممتاز وجودة عالية، أنصح بشرائه!'
            WHEN 4 THEN 'منتج جيد جداً، يستحق السعر'
            ELSE 'منتج جيد بشكل عام'
          END,
          NOW() - (RANDOM() * INTERVAL '30 days')
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;
END $$;

-- 6. تحديث معلومات الاتصال
-- ============================================
-- يمكن تحديث معلومات الاتصال في جدول settings أو في الكود مباشرة

-- 7. إضافة indexes لتحسين الأداء
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- انتهى ملف الإصلاحات
-- ============================================

-- ملاحظات:
-- 1. يجب تنفيذ هذا الملف في Supabase SQL Editor
-- 2. تأكد من أخذ نسخة احتياطية قبل التنفيذ
-- 3. بعض الاستعلامات قد تستغرق وقتاً حسب حجم البيانات
