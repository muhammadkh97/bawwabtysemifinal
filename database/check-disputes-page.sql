-- ====================================
-- فحص صفحة Disputes (النزاعات والدعم الفني)
-- ====================================

-- ========== 1. فحص جدول disputes ==========

SELECT 
  'disputes table' as check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disputes') as table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'disputes') as column_count;

-- عرض أعمدة disputes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'disputes'
ORDER BY ordinal_position;

-- ========== 2. فحص جدول support_tickets ==========

SELECT 
  'support_tickets table' as check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets') as table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'support_tickets') as column_count;

-- عرض أعمدة support_tickets (للتأكد من توافقها مع صفحة disputes)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'support_tickets'
ORDER BY ordinal_position;

-- ========== 3. فحص البيانات - Disputes ==========

-- 3.1 إحصائيات النزاعات
SELECT 
  COUNT(*) as total_disputes,
  COUNT(CASE WHEN status = 'open' THEN 1 END) as open_disputes,
  COUNT(CASE WHEN status = 'investigating' THEN 1 END) as investigating,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
  SUM(CASE WHEN amount IS NOT NULL THEN amount ELSE 0 END) as total_amount
FROM disputes;

-- 3.2 عرض النزاعات الحديثة مع تفاصيل الطلب
SELECT 
  d.id,
  d.order_id,
  o.order_number,
  d.type,
  d.description,
  d.status,
  d.amount,
  d.created_at
FROM disputes d
LEFT JOIN orders o ON d.order_id = o.id
ORDER BY d.created_at DESC
LIMIT 10;

-- 3.3 النزاعات حسب النوع
SELECT 
  type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM disputes
GROUP BY type
ORDER BY count DESC;

-- 3.4 النزاعات حسب الحالة
SELECT 
  status,
  COUNT(*) as count,
  AVG(amount) as avg_amount
FROM disputes
GROUP BY status
ORDER BY count DESC;

-- ========== 4. فحص البيانات - Support Tickets ==========

-- 4.1 إحصائيات التذاكر
SELECT 
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
  COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed
FROM support_tickets;

-- 4.2 التذاكر حسب الأولوية
SELECT 
  priority,
  COUNT(*) as count,
  COUNT(CASE WHEN status IN ('open', 'assigned', 'in_progress') THEN 1 END) as active_count
FROM support_tickets
GROUP BY priority
ORDER BY 
  CASE priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'normal' THEN 3
    WHEN 'low' THEN 4
  END;

-- 4.3 التذاكر حسب الفئة
SELECT 
  category,
  COUNT(*) as count
FROM support_tickets
GROUP BY category
ORDER BY count DESC;

-- ========== 5. فحص Foreign Keys ==========

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
  AND tc.table_name IN ('disputes', 'support_tickets')
ORDER BY tc.table_name;

-- ========== 6. التحقق من الحقول المطلوبة ==========

-- 6.1 التحقق من حقول disputes المطلوبة للكود
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'order_id') THEN 'order_id ✅'
    ELSE 'order_id ❌'
  END as order_id_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'type') THEN 'type ✅'
    ELSE 'type ❌'
  END as type_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'description') THEN 'description ✅'
    ELSE 'description ❌'
  END as description_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'status') THEN 'status ✅'
    ELSE 'status ❌'
  END as status_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'amount') THEN 'amount ✅'
    ELSE 'amount ❌'
  END as amount_check;

-- 6.2 التحقق من حقول support_tickets
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'subject') THEN 'subject ✅'
    ELSE 'subject ❌'
  END as subject_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'category') THEN 'category ✅'
    ELSE 'category ❌'
  END as category_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'priority') THEN 'priority ✅'
    ELSE 'priority ❌'
  END as priority_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'status') THEN 'status ✅'
    ELSE 'status ❌'
  END as status_check;

-- ========== 7. فحص العلاقات ==========

-- 7.1 النزاعات مع بيانات الطلبات (JOIN test)
SELECT 
  d.id as dispute_id,
  d.order_id,
  o.order_number,
  o.total_amount as order_amount,
  d.amount as dispute_amount,
  o.vendor_id,
  d.type,
  d.status
FROM disputes d
LEFT JOIN orders o ON d.order_id = o.id
LIMIT 5;

-- 7.2 تذاكر الدعم مع بيانات المستخدمين (JOIN test)
SELECT 
  st.id as ticket_id,
  st.user_id,
  u.name,
  u.full_name,
  u.role,
  st.subject,
  st.category,
  st.priority,
  st.status
FROM support_tickets st
LEFT JOIN users u ON st.user_id = u.id
LIMIT 5;

-- ========== 8. ملخص النتائج ==========

SELECT 
  'Disputes Summary' as section,
  json_build_object(
    'disputes_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disputes'),
    'support_tickets_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets'),
    'total_disputes', (SELECT COUNT(*) FROM disputes),
    'open_disputes', (SELECT COUNT(*) FROM disputes WHERE status = 'open'),
    'investigating_disputes', (SELECT COUNT(*) FROM disputes WHERE status = 'investigating'),
    'total_support_tickets', (SELECT COUNT(*) FROM support_tickets),
    'open_support_tickets', (SELECT COUNT(*) FROM support_tickets WHERE status = 'open'),
    'urgent_tickets', (SELECT COUNT(*) FROM support_tickets WHERE priority = 'urgent')
  ) as summary;
