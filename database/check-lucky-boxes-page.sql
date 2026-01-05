-- ====================================
-- فحص صفحة Lucky Boxes (الصناديق المحظوظة)
-- ====================================

-- ========== 1. فحص جدول lucky_boxes ==========

SELECT 
  'lucky_boxes table' as check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lucky_boxes') as table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'lucky_boxes') as column_count;

-- عرض أعمدة lucky_boxes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lucky_boxes'
ORDER BY ordinal_position;

-- ========== 2. فحص جدول loyalty_tiers ==========

SELECT 
  'loyalty_tiers table' as check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_tiers') as table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'loyalty_tiers') as column_count;

-- عرض أعمدة loyalty_tiers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'loyalty_tiers'
ORDER BY ordinal_position;

-- ========== 3. فحص البيانات ==========

-- 3.1 عرض الصناديق المحظوظة
SELECT 
  id,
  title_ar,
  total_points,
  max_winners,
  current_winners,
  is_active,
  start_date,
  end_date
FROM lucky_boxes
ORDER BY created_at DESC
LIMIT 10;

-- 3.2 إحصائيات lucky_boxes
SELECT 
  COUNT(*) as total_boxes,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_boxes,
  SUM(total_points) as total_points_pool,
  SUM(current_winners) as total_winners
FROM lucky_boxes;

-- 3.3 عرض المستويات (tiers)
SELECT 
  id,
  tier_name_ar,
  min_points,
  max_points,
  discount_percentage,
  free_shipping_threshold,
  tier_order,
  is_active
FROM loyalty_tiers
ORDER BY tier_order;

-- 3.4 إحصائيات loyalty_tiers
SELECT 
  COUNT(*) as total_tiers,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_tiers,
  AVG(discount_percentage) as avg_discount
FROM loyalty_tiers;

-- ========== 4. فحص Foreign Keys ==========

SELECT 
  tc.constraint_name,
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
  AND tc.table_name IN ('lucky_boxes', 'loyalty_tiers')
ORDER BY tc.table_name;

-- ========== 5. التحقق من تطابق المستويات مع المستخدمين ==========

-- عد المستخدمين لكل مستوى
SELECT 
  CASE 
    WHEN loyalty_points >= 10000 THEN 'Platinum'
    WHEN loyalty_points >= 5000 THEN 'Gold'
    WHEN loyalty_points >= 1000 THEN 'Silver'
    ELSE 'Bronze'
  END as tier,
  COUNT(*) as users_count
FROM users
WHERE role = 'customer'
GROUP BY 
  CASE 
    WHEN loyalty_points >= 10000 THEN 'Platinum'
    WHEN loyalty_points >= 5000 THEN 'Gold'
    WHEN loyalty_points >= 1000 THEN 'Silver'
    ELSE 'Bronze'
  END
ORDER BY 
  CASE 
    WHEN loyalty_points >= 10000 THEN 4
    WHEN loyalty_points >= 5000 THEN 3
    WHEN loyalty_points >= 1000 THEN 2
    ELSE 1
  END DESC;

-- ========== 6. ملخص النتائج ==========

SELECT 
  'Lucky Boxes Summary' as section,
  json_build_object(
    'lucky_boxes_table_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lucky_boxes'),
    'loyalty_tiers_table_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_tiers'),
    'total_boxes', (SELECT COUNT(*) FROM lucky_boxes),
    'active_boxes', (SELECT COUNT(*) FROM lucky_boxes WHERE is_active = true),
    'total_tiers', (SELECT COUNT(*) FROM loyalty_tiers),
    'active_tiers', (SELECT COUNT(*) FROM loyalty_tiers WHERE is_active = true)
  ) as summary;
