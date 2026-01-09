-- ============================================
-- اختبار تكامل OAuth مع قاعدة البيانات
-- ============================================

-- 1. اختبار قراءة role بشكل صحيح
SELECT 
    id,
    email,
    full_name,
    role::text as role,  -- تحويل ENUM إلى TEXT
    avatar_url,
    created_at
FROM users 
LIMIT 3;

-- 2. اختبار إنشاء مستخدم OAuth جديد
-- (هذا استعلام تجريبي - لا تشغله على الإنتاج)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'oauth_test_' || floor(random() * 10000) || '@example.com';
BEGIN
    -- محاولة إدراج مستخدم تجريبي
    INSERT INTO users (
        id,
        email,
        full_name,
        role,
        avatar_url,
        created_at
    ) VALUES (
        test_user_id,
        test_email,
        'OAuth Test User',
        'customer',
        'https://example.com/avatar.jpg',
        NOW()
    );
    
    RAISE NOTICE 'تم إنشاء مستخدم تجريبي بنجاح: %', test_user_id;
    
    -- حذف المستخدم التجريبي
    DELETE FROM users WHERE id = test_user_id;
    RAISE NOTICE 'تم حذف المستخدم التجريبي';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'خطأ: %', SQLERRM;
        ROLLBACK;
END $$;

-- 3. فحص قيم role المسموحة (ENUM)
SELECT 
    enumlabel as allowed_roles,
    enumsortorder as sort_order
FROM pg_enum 
WHERE enumtypid = 'user_role'::regtype
ORDER BY enumsortorder;

-- 4. اختبار triggers الموجودة
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
    AND event_object_schema = 'public'
ORDER BY trigger_name;

-- 5. اختبار RLS policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
    AND schemaname = 'public'
ORDER BY policyname;

-- 6. اختبار أن full_name إلزامي
-- (هذا سيفشل وهو المتوقع - لإثبات أن full_name إلزامي)
DO $$
BEGIN
    INSERT INTO users (id, email, role)
    VALUES (gen_random_uuid(), 'test_no_name@example.com', 'customer');
EXCEPTION
    WHEN not_null_violation THEN
        RAISE NOTICE 'جيد! full_name إلزامي كما هو متوقع';
    WHEN OTHERS THEN
        RAISE NOTICE 'خطأ آخر: %', SQLERRM;
END $$;

-- 7. اختبار أن email فريد
DO $$
DECLARE
    existing_email TEXT;
BEGIN
    -- جلب أول email موجود
    SELECT email INTO existing_email FROM users LIMIT 1;
    
    IF existing_email IS NOT NULL THEN
        BEGIN
            INSERT INTO users (id, email, full_name, role)
            VALUES (gen_random_uuid(), existing_email, 'Duplicate Test', 'customer');
        EXCEPTION
            WHEN unique_violation THEN
                RAISE NOTICE 'جيد! email فريد كما هو متوقع';
            WHEN OTHERS THEN
                RAISE NOTICE 'خطأ آخر: %', SQLERRM;
        END;
    END IF;
END $$;

-- 8. فحص sync_users_aliases_trigger
-- (هذا الـ trigger يزامن name مع full_name تلقائياً)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
    INSERT INTO users (id, email, full_name, role)
    VALUES (test_user_id, 'sync_test@example.com', 'Sync Test User', 'customer');
    
    -- التحقق من أن name تم ملؤه تلقائياً
    IF EXISTS (
        SELECT 1 FROM users 
        WHERE id = test_user_id 
        AND name = full_name
    ) THEN
        RAISE NOTICE 'جيد! sync_users_aliases_trigger يعمل';
    ELSE
        RAISE NOTICE 'تحذير: sync_users_aliases_trigger لا يعمل كما متوقع';
    END IF;
    
    -- حذف المستخدم التجريبي
    DELETE FROM users WHERE id = test_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'خطأ: %', SQLERRM;
        ROLLBACK;
END $$;

-- 9. ملخص البنية النهائية
SELECT 
    'users table structure' as info,
    COUNT(*) as total_columns,
    COUNT(*) FILTER (WHERE is_nullable = 'NO') as required_columns,
    COUNT(*) FILTER (WHERE is_nullable = 'YES') as optional_columns
FROM information_schema.columns
WHERE table_name = 'users' 
    AND table_schema = 'public';

-- 10. التحقق من أن الكود الآن متوافق
SELECT 
    'OAuth Integration Status' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name' AND is_nullable = 'NO')
        THEN '✅ full_name إلزامي'
        ELSE '❌ full_name غير صحيح'
    END as full_name_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role' AND data_type = 'USER-DEFINED')
        THEN '✅ role ENUM موجود'
        ELSE '❌ role غير صحيح'
    END as role_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url')
        THEN '✅ avatar_url موجود'
        ELSE '❌ avatar_url مفقود'
    END as avatar_check;
