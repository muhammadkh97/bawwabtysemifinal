-- 📋 سكريبت تشخيصي شامل لجدول categories
-- انسخ هذا الكود وشغله في Supabase SQL Editor وأرسل النتائج

-- 1️⃣ معلومات الجدول الأساسية
SELECT 
  table_name,
  table_schema,
  (SELECT count(*) FROM information_schema.columns WHERE table_name='categories') as column_count
FROM information_schema.tables 
WHERE table_name = 'categories';

-- 2️⃣ جميع الأعمدة والأنواع
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- 3️⃣ جميع السياسات (RLS Policies)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE tablename = 'categories'
ORDER BY policyname;

-- 4️⃣ حالة RLS على الجدول
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class 
WHERE relname = 'categories';

-- 5️⃣ جميع الـ Triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'categories';

-- 6️⃣ جميع الـ Indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'categories'
ORDER BY indexname;

-- 7️⃣ الـ Constraints
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'categories'
ORDER BY constraint_type;

-- 8️⃣ عدد الصفوف
SELECT COUNT(*) as total_rows FROM categories;

-- 9️⃣ بيانات المستخدمين المدراء
SELECT 
  id,
  email,
  full_name,
  role
FROM users 
WHERE role = 'admin'
LIMIT 5;

-- 🔟 عينة من البيانات في categories
SELECT 
  id,
  name,
  name_ar,
  approval_status,
  requires_approval,
  created_by,
  is_active
FROM categories 
LIMIT 3;
