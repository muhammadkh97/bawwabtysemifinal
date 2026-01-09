-- ============================================
-- فحص بنية جدول Users لتسجيل الدخول
-- ============================================

-- 1. فحص جدول users وأعمدته
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. فحص القيود (Constraints)
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name = 'users'
ORDER BY tc.constraint_type, kcu.ordinal_position;

-- 3. فحص الفهارس (Indexes)
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename = 'users';

-- 4. فحص وجود حقول OAuth المطلوبة
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') 
        THEN '✓ email موجود'
        ELSE '✗ email مفقود'
    END as email_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('name', 'full_name')) 
        THEN '✓ name/full_name موجود'
        ELSE '✗ name/full_name مفقود'
    END as name_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('role', 'user_role')) 
        THEN '✓ role موجود'
        ELSE '✗ role مفقود'
    END as role_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') 
        THEN '✓ created_at موجود'
        ELSE '✗ created_at مفقود'
    END as created_at_check;

-- 5. فحص auth.users (جدول Supabase Auth)
SELECT 
    'auth.users' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'auth' 
    AND table_name = 'users'
    AND column_name IN ('id', 'email', 'raw_user_meta_data', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- 6. فحص السياسات (RLS Policies)
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'users';

-- 7. اختبار إنشاء مستخدم OAuth (محاكاة)
-- هذا استعلام تجريبي للتحقق من إمكانية الإدراج
EXPLAIN (VERBOSE, COSTS OFF)
INSERT INTO users (id, email, name, role, created_at)
VALUES (
    gen_random_uuid(),
    'test_oauth@example.com',
    'OAuth User',
    'customer',
    NOW()
);
