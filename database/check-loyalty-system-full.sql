-- ====================================
-- فحص شامل لنظام نقاط الولاء في كامل الموقع
-- ====================================

-- ========== 1. فحص الجداول ==========

-- 1.1 فحص جدول loyalty_points
SELECT 
  'loyalty_points table' as check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_points') as table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'loyalty_points') as column_count;

-- 1.2 عرض أعمدة loyalty_points
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'loyalty_points'
ORDER BY ordinal_position;

-- 1.3 فحص جدول loyalty_transactions
SELECT 
  'loyalty_transactions table' as check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_transactions') as table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'loyalty_transactions') as column_count;

-- 1.4 عرض أعمدة loyalty_transactions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'loyalty_transactions'
ORDER BY ordinal_position;

-- 1.5 فحص loyalty_points في جدول users
SELECT 
  'users.loyalty_points' as field,
  COUNT(*) as total_users,
  COUNT(loyalty_points) as users_with_points,
  SUM(loyalty_points) as total_points,
  AVG(loyalty_points) as avg_points,
  MAX(loyalty_points) as max_points
FROM users;

-- ========== 2. فحص البيانات ==========

-- 2.1 عرض نقاط المستخدمين
SELECT 
  u.id,
  u.name,
  u.email,
  u.loyalty_points as points_in_users_table,
  lp.points as points_in_loyalty_table,
  lp.lifetime_points,
  lp.tier,
  lp.created_at
FROM users u
LEFT JOIN loyalty_points lp ON u.id = lp.user_id
WHERE u.role = 'customer'
ORDER BY u.loyalty_points DESC NULLS LAST
LIMIT 10;

-- 2.2 عرض معاملات الولاء
SELECT 
  lt.id,
  u.name,
  lt.points,
  lt.type,
  lt.description,
  lt.order_id,
  lt.created_at
FROM loyalty_transactions lt
LEFT JOIN users u ON lt.user_id = u.id
ORDER BY lt.created_at DESC
LIMIT 10;

-- 2.3 إحصائيات المستويات (tiers)
SELECT 
  tier,
  COUNT(*) as users_count,
  AVG(points) as avg_points,
  SUM(lifetime_points) as total_lifetime_points
FROM loyalty_points
GROUP BY tier
ORDER BY 
  CASE tier
    WHEN 'platinum' THEN 4
    WHEN 'gold' THEN 3
    WHEN 'silver' THEN 2
    WHEN 'bronze' THEN 1
    ELSE 0
  END DESC;

-- ========== 3. فحص Foreign Keys ==========

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
  AND tc.table_name IN ('loyalty_points', 'loyalty_transactions')
ORDER BY tc.table_name;

-- ========== 4. فحص Triggers والـ Functions ==========

-- 4.1 البحث عن triggers متعلقة بالولاء
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%loyalty%'
   OR event_object_table IN ('loyalty_points', 'loyalty_transactions', 'orders');

-- 4.2 البحث عن functions متعلقة بالولاء
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%loyalty%' OR routine_name LIKE '%points%')
ORDER BY routine_name;

-- ========== 5. فحص RLS Policies ==========

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('loyalty_points', 'loyalty_transactions')
ORDER BY tablename, policyname;

-- ========== 6. تحليل نظام النقاط ==========

-- 6.1 النقاط حسب نوع المعاملة
SELECT 
  type,
  COUNT(*) as transaction_count,
  SUM(points) as total_points,
  AVG(points) as avg_points_per_transaction
FROM loyalty_transactions
GROUP BY type
ORDER BY total_points DESC;

-- 6.2 النقاط المرتبطة بالطلبات
SELECT 
  COUNT(DISTINCT order_id) as orders_with_loyalty,
  SUM(points) as total_points_from_orders,
  AVG(points) as avg_points_per_order
FROM loyalty_transactions
WHERE order_id IS NOT NULL;

-- 6.3 التحقق من تزامن البيانات
SELECT 
  'Data Sync Check' as check_name,
  COUNT(*) as users_with_mismatch
FROM users u
LEFT JOIN loyalty_points lp ON u.id = lp.user_id
WHERE u.loyalty_points != COALESCE(lp.points, 0);

-- ========== 7. ملخص شامل ==========

SELECT 
  'Loyalty System Summary' as section,
  json_build_object(
    'total_users_with_points', (SELECT COUNT(*) FROM users WHERE loyalty_points > 0),
    'total_points_in_system', (SELECT SUM(loyalty_points) FROM users),
    'total_transactions', (SELECT COUNT(*) FROM loyalty_transactions),
    'loyalty_points_table_users', (SELECT COUNT(*) FROM loyalty_points),
    'tiers_distribution', (
      SELECT json_object_agg(tier, cnt)
      FROM (
        SELECT tier, COUNT(*) as cnt
        FROM loyalty_points
        GROUP BY tier
      ) t
    )
  ) as summary;
