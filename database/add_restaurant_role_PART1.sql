-- ==========================================
-- PART 1: إضافة دور 'restaurant' إلى ENUM user_role
-- ==========================================
-- شغّل هذا الجزء أولاً وحده
-- ثم شغّل PART 2 بعد التأكد من نجاح هذا الجزء

DO $$
BEGIN
    -- التحقق من وجود القيمة أولاً
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'restaurant' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        -- إضافة القيمة الجديدة
        ALTER TYPE user_role ADD VALUE 'restaurant';
        RAISE NOTICE '✅ تم إضافة دور restaurant إلى ENUM user_role';
    ELSE
        RAISE NOTICE 'ℹ️  دور restaurant موجود بالفعل في ENUM user_role';
    END IF;
END $$;

-- ==========================================
-- التحقق من النتيجة
-- ==========================================
SELECT 
    enumlabel as role_name,
    enumsortorder as sort_order
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- ==========================================
-- ✅ انتظر حتى تكتمل هذه الخطوة، ثم شغّل PART 2
-- ==========================================
