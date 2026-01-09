-- ============================================
-- إضافة حقول جديدة لصفحة المتاجر المحسنة (محدّث)
-- بناءً على البنية الفعلية لقاعدة البيانات
-- ============================================

-- ملاحظة: جدول store_followers موجود بالفعل ويستخدم vendor_id ✅

-- 1. إضافة حقل is_verified للمتاجر
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 2. إضافة حقل website للمتاجر
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS website TEXT;

-- 3. إضافة حقل last_products_update
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS last_products_update TIMESTAMPTZ;

-- 4. إضافة حقل city إذا لم يكن موجوداً (للفلترة حسب الموقع)
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS city TEXT;

-- 5. إنشاء/تحديث view لحساب عدد المتابعين (باستخدام vendor_id)
CREATE OR REPLACE VIEW stores_with_followers AS
SELECT 
  s.*,
  COUNT(DISTINCT sf.user_id) as followers_count
FROM stores s
LEFT JOIN store_followers sf ON s.id = sf.vendor_id
GROUP BY s.id;

-- 6. إنشاء function لتحديث last_products_update تلقائياً
CREATE OR REPLACE FUNCTION update_store_last_products_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stores 
  SET last_products_update = NOW()
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. إنشاء trigger لتحديث last_products_update عند إضافة/تعديل منتج
DROP TRIGGER IF EXISTS trigger_update_store_products ON products;
CREATE TRIGGER trigger_update_store_products
AFTER INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_store_last_products_update();

-- 8. تحديث last_products_update للمتاجر الحالية
UPDATE stores s
SET last_products_update = (
  SELECT MAX(updated_at)
  FROM products p
  WHERE p.vendor_id = s.id
)
WHERE business_type = 'retail';

-- 9. استخراج المدينة من حقل address إلى city (إذا كان فارغاً)
UPDATE stores 
SET city = COALESCE(
  city,
  CASE 
    WHEN address LIKE '%رام الله%' OR address LIKE '%Ramallah%' THEN 'ramallah'
    WHEN address LIKE '%نابلس%' OR address LIKE '%Nablus%' THEN 'nablus'
    WHEN address LIKE '%الخليل%' OR address LIKE '%Hebron%' THEN 'hebron'
    WHEN address LIKE '%بيت لحم%' OR address LIKE '%Bethlehem%' THEN 'bethlehem'
    WHEN address LIKE '%جنين%' OR address LIKE '%Jenin%' THEN 'jenin'
    WHEN address LIKE '%طولكرم%' OR address LIKE '%Tulkarm%' THEN 'tulkarm'
    WHEN address LIKE '%قلقيلية%' OR address LIKE '%Qalqilya%' THEN 'qalqilya'
    WHEN address LIKE '%أريحا%' OR address LIKE '%Jericho%' THEN 'jericho'
    ELSE NULL
  END
)
WHERE business_type = 'retail' AND city IS NULL;

-- 10. تعيين بعض المتاجر كموثوقة افتراضياً (بناءً على التقييم)
UPDATE stores 
SET is_verified = true
WHERE rating >= 4.7 
  AND business_type = 'retail'
  AND is_verified = false;

-- 11. إنشاء indexes إضافية للأداء
CREATE INDEX IF NOT EXISTS idx_stores_is_verified ON stores(is_verified);
CREATE INDEX IF NOT EXISTS idx_stores_city ON stores(city);
CREATE INDEX IF NOT EXISTS idx_stores_website ON stores(website) WHERE website IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stores_last_products_update ON stores(last_products_update);

-- 12. إنشاء index على store_followers للأداء (إذا لم يكن موجوداً)
CREATE INDEX IF NOT EXISTS idx_store_followers_vendor_id ON store_followers(vendor_id);
CREATE INDEX IF NOT EXISTS idx_store_followers_user_id ON store_followers(user_id);

-- 13. إضافة constraint فريد لمنع التكرار في store_followers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'store_followers_vendor_user_unique'
  ) THEN
    ALTER TABLE store_followers 
    ADD CONSTRAINT store_followers_vendor_user_unique 
    UNIQUE(vendor_id, user_id);
  END IF;
END $$;

-- 14. رسالة نجاح مع ملخص
SELECT 
  '✅ تم إضافة الحقول والتحسينات بنجاح' AS الحالة,
  'is_verified, website, last_products_update, city, indexes' AS المميزات_المضافة,
  (SELECT COUNT(*) FROM stores WHERE business_type = 'retail') AS عدد_المتاجر,
  (SELECT COUNT(*) FROM stores WHERE is_verified = true AND business_type = 'retail') AS المتاجر_الموثوقة,
  (SELECT COUNT(DISTINCT vendor_id) FROM store_followers) AS المتاجر_التي_لها_متابعين;
