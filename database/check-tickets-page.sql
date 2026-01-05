-- ====================================
-- فحص صفحة Tickets (التذاكر/الدعم الفني)
-- ====================================

-- ========== 1. فحص جدول support_tickets ==========

SELECT 
  'support_tickets table' as check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets') as table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'support_tickets') as column_count;

-- عرض أعمدة support_tickets
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'support_tickets'
ORDER BY ordinal_position;

-- ========== 2. فحص جدول tickets ==========

SELECT 
  'tickets table' as check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets') as table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'tickets') as column_count;

-- عرض أعمدة tickets
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tickets'
ORDER BY ordinal_position;

-- ========== 3. فحص جدول ticket_messages ==========

SELECT 
  'ticket_messages table' as check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_messages') as table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ticket_messages') as column_count;

-- عرض أعمدة ticket_messages
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ticket_messages'
ORDER BY ordinal_position;

-- ========== 4. فحص البيانات ==========

-- 4.1 إحصائيات support_tickets
SELECT 
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed
FROM support_tickets;

-- 4.2 عرض التذاكر الحديثة
SELECT 
  id,
  user_name,
  user_email,
  subject,
  category,
  priority,
  status,
  created_at
FROM support_tickets
ORDER BY created_at DESC
LIMIT 10;

-- 4.3 إحصائيات tickets (إن وجد)
SELECT 
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed
FROM tickets;

-- 4.4 عرض tickets الحديثة
SELECT 
  ticket_number,
  subject,
  category,
  priority,
  status,
  created_at
FROM tickets
ORDER BY created_at DESC
LIMIT 10;

-- 4.5 عرض الرسائل
SELECT 
  COUNT(*) as total_messages,
  COUNT(CASE WHEN is_internal = true THEN 1 END) as internal_messages,
  COUNT(CASE WHEN is_internal = false THEN 1 END) as user_messages
FROM ticket_messages;

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
  AND tc.table_name IN ('support_tickets', 'tickets', 'ticket_messages')
ORDER BY tc.table_name;

-- ========== 6. التحقق من الحقول المطلوبة ==========

-- التحقق من حقول support_tickets المطلوبة للكود
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'user_name') THEN 'user_name ✅'
    ELSE 'user_name ❌'
  END as user_name_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'user_email') THEN 'user_email ✅'
    ELSE 'user_email ❌'
  END as user_email_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'priority') THEN 'priority ✅'
    ELSE 'priority ❌'
  END as priority_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'category') THEN 'category ✅'
    ELSE 'category ❌'
  END as category_check;

-- ========== 7. ملخص النتائج ==========

SELECT 
  'Tickets Summary' as section,
  json_build_object(
    'support_tickets_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets'),
    'tickets_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets'),
    'ticket_messages_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_messages'),
    'total_support_tickets', (SELECT COUNT(*) FROM support_tickets),
    'total_tickets', (SELECT COUNT(*) FROM tickets),
    'open_support_tickets', (SELECT COUNT(*) FROM support_tickets WHERE status = 'open')
  ) as summary;
