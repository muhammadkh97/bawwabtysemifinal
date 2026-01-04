-- ============================================
-- إضافة عمود coupon_id لجدول orders
-- ============================================

-- إضافة العمود
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS coupon_id uuid NULL;

-- إضافة foreign key للربط مع جدول coupons
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_coupon 
FOREIGN KEY (coupon_id) REFERENCES coupons(id) 
ON DELETE SET NULL;

-- إنشاء index لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);

-- التحقق من النتيجة
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name = 'coupon_id';

-- عرض معلومات الـ foreign key
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='orders'
  AND kcu.column_name='coupon_id';
