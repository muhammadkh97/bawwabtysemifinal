-- ====================================
-- فحص عميق لصفحة الماليات
-- ====================================

-- 1. فحص جدول payouts (طلبات السحب)
SELECT 
  'payouts table' as check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payouts') as exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'payouts') as column_count;

-- 2. عرض أعمدة جدول payouts
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payouts'
ORDER BY ordinal_position;

-- 3. فحص جدول commissions 
SELECT 
  'commissions table' as check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commissions') as exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'commissions') as column_count;

-- 4. عرض أعمدة جدول commissions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'commissions'
ORDER BY ordinal_position;

-- 5. فحص أعمدة orders التي تستخدمها الصفحة
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('status', 'total_amount', 'order_number', 'vendor_id', 'created_at')
ORDER BY ordinal_position;

-- 6. فحص أعمدة stores (commission_rate)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'stores'
  AND column_name IN ('commission_rate', 'name', 'name_ar')
ORDER BY ordinal_position;

-- 7. فحص foreign key orders.vendor_id -> stores
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'orders'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'vendor_id';

-- 8. فحص foreign key في payouts (user_id)
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'payouts'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 9. اختبار query العمولات (sample orders)
SELECT 
  o.id,
  o.order_number,
  o.total_amount,
  o.status,
  s.name_ar,
  s.commission_rate
FROM orders o
LEFT JOIN stores s ON o.vendor_id = s.id
WHERE o.status = 'delivered'
ORDER BY o.created_at DESC
LIMIT 5;

-- 10. اختبار query طلبات السحب (sample payouts)
SELECT 
  p.id,
  p.amount,
  p.status,
  p.bank_name,
  p.bank_account_number,
  p.created_at
FROM payouts p
ORDER BY p.created_at DESC
LIMIT 5;

-- 11. ملخص النتائج
SELECT 
  'Summary' as section,
  'Tables' as item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payouts')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commissions')
    THEN '✅ Both tables exist'
    ELSE '❌ Missing tables'
  END as status;
