-- =========================================================
-- 💰 فحص شامل للنظام المالي - Financial System Diagnostic
-- =========================================================
-- التاريخ: 2026-01-07
-- الهدف: فحص كامل للنظام المالي وتحليل الترابط بين المعاملات
-- =========================================================

SELECT '=========================================' as info;
SELECT '💰 بدء فحص النظام المالي الشامل' as info;
SELECT '=========================================' as info;

-- =========================================================
-- 1️⃣: فحص الجداول المالية الموجودة
-- =========================================================

SELECT '1️⃣ فحص الجداول المالية' as checkpoint;

SELECT 
    table_name as "اسم الجدول",
    CASE 
        WHEN table_name IN ('orders', 'order_items', 'vendor_wallets', 'wallet_transactions', 
                           'payout_requests', 'payouts', 'commissions', 'financial_settings') 
        THEN '✅'
        ELSE '⚠️'
    END as "الحالة"
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN (
        'orders', 'order_items', 'vendor_wallets', 'wallet_transactions',
        'payout_requests', 'payouts', 'commissions', 'financial_settings',
        'transactions', 'payments'
    )
ORDER BY table_name;

-- =========================================================
-- 2️⃣: فحص جدول الطلبات (orders)
-- =========================================================

SELECT '2️⃣ فحص جدول الطلبات (orders)' as checkpoint;

-- أعمدة مالية في جدول orders
SELECT 
    column_name as "العمود",
    data_type as "النوع",
    is_nullable as "يقبل NULL",
    column_default as "القيمة الافتراضية"
FROM information_schema.columns
WHERE table_name = 'orders'
    AND column_name IN (
        'total', 'subtotal', 'delivery_fee', 'tax', 'discount',
        'payment_method', 'payment_status', 'currency', 'exchange_rate_used'
    )
ORDER BY ordinal_position;

-- إحصائيات مالية للطلبات
SELECT 
    status as "حالة الطلب",
    COUNT(*) as "عدد الطلبات",
    COALESCE(SUM(total), 0) as "إجمالي المبلغ",
    COALESCE(AVG(total), 0) as "متوسط قيمة الطلب",
    COALESCE(MIN(total), 0) as "أصغر طلب",
    COALESCE(MAX(total), 0) as "أكبر طلب"
FROM orders
GROUP BY status
ORDER BY COUNT(*) DESC;

-- توزيع طرق الدفع
SELECT 
    payment_method as "طريقة الدفع",
    COUNT(*) as "عدد الطلبات",
    COALESCE(SUM(total), 0) as "إجمالي المبلغ"
FROM orders
GROUP BY payment_method
ORDER BY COUNT(*) DESC;

-- توزيع حالة الدفع
SELECT 
    payment_status as "حالة الدفع",
    COUNT(*) as "عدد الطلبات",
    COALESCE(SUM(total), 0) as "إجمالي المبلغ"
FROM orders
GROUP BY payment_status
ORDER BY COUNT(*) DESC;

-- =========================================================
-- 3️⃣: فحص جدول عناصر الطلبات (order_items)
-- =========================================================

SELECT '3️⃣ فحص جدول عناصر الطلبات (order_items)' as checkpoint;

-- الأعمدة المالية في order_items
SELECT 
    column_name as "العمود",
    data_type as "النوع",
    is_nullable as "يقبل NULL"
FROM information_schema.columns
WHERE table_name = 'order_items'
    AND column_name IN (
        'price', 'quantity', 'subtotal', 'tax', 'discount',
        'commission_amount', 'commission_percentage',
        'price_at_time', 'currency'
    )
ORDER BY ordinal_position;

-- إحصائيات عناصر الطلبات
SELECT 
    COUNT(*) as "عدد عناصر الطلبات",
    COALESCE(SUM(quantity), 0) as "إجمالي الكميات",
    COALESCE(SUM(price * quantity), 0) as "إجمالي المبيعات",
    COALESCE(AVG(price), 0) as "متوسط السعر",
    COALESCE(SUM(commission_amount), 0) as "إجمالي العمولات"
FROM order_items;

-- =========================================================
-- 4️⃣: فحص جدول محافظ البائعين (vendor_wallets)
-- =========================================================

SELECT '4️⃣ فحص جدول محافظ البائعين (vendor_wallets)' as checkpoint;

-- هل الجدول موجود؟
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_wallets') 
        THEN '✅ موجود'
        ELSE '❌ غير موجود'
    END as "حالة الجدول";

-- إذا كان موجوداً، فحص الأعمدة
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_wallets') THEN
        PERFORM * FROM (
            SELECT 
                column_name as "العمود",
                data_type as "النوع",
                is_nullable as "يقبل NULL"
            FROM information_schema.columns
            WHERE table_name = 'vendor_wallets'
            ORDER BY ordinal_position
        ) AS columns_info;
    END IF;
END $$;

-- إحصائيات المحافظ (إذا كان الجدول موجوداً)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_wallets') THEN
        RAISE NOTICE '📊 إحصائيات المحافظ:';
        PERFORM * FROM (
            SELECT 
                COUNT(*) as "عدد المحافظ",
                COALESCE(SUM(current_balance), 0) as "إجمالي الأرصدة الحالية",
                COALESCE(SUM(pending_balance), 0) as "إجمالي الأرصدة المعلقة",
                COALESCE(SUM(total_earned), 0) as "إجمالي الأرباح",
                COALESCE(SUM(total_withdrawn), 0) as "إجمالي المسحوبات",
                COALESCE(AVG(current_balance), 0) as "متوسط الرصيد"
            FROM vendor_wallets
        ) AS wallet_stats;
    END IF;
END $$;

-- =========================================================
-- 5️⃣: فحص جدول معاملات المحفظة (wallet_transactions)
-- =========================================================

SELECT '5️⃣ فحص جدول معاملات المحفظة (wallet_transactions)' as checkpoint;

-- هل الجدول موجود؟
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions') 
        THEN '✅ موجود'
        ELSE '❌ غير موجود'
    END as "حالة الجدول";

-- إحصائيات المعاملات (إذا كان الجدول موجوداً)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions') THEN
        RAISE NOTICE '💳 إحصائيات المعاملات:';
        PERFORM * FROM (
            SELECT 
                type as "نوع المعاملة",
                status as "الحالة",
                COUNT(*) as "العدد",
                COALESCE(SUM(amount), 0) as "الإجمالي"
            FROM wallet_transactions
            GROUP BY type, status
            ORDER BY type, status
        ) AS transactions_stats;
    END IF;
END $$;

-- =========================================================
-- 6️⃣: فحص جدول طلبات السحب (payout_requests / payouts)
-- =========================================================

SELECT '6️⃣ فحص جدول طلبات السحب' as checkpoint;

-- فحص payout_requests
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payout_requests') 
        THEN '✅ payout_requests موجود'
        ELSE '❌ payout_requests غير موجود'
    END as "حالة الجدول 1";

-- فحص payouts
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payouts') 
        THEN '✅ payouts موجود'
        ELSE '❌ payouts غير موجود'
    END as "حالة الجدول 2";

-- إحصائيات طلبات السحب
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payout_requests') THEN
        RAISE NOTICE '💸 إحصائيات طلبات السحب (payout_requests):';
        PERFORM * FROM (
            SELECT 
                status as "الحالة",
                COUNT(*) as "العدد",
                COALESCE(SUM(amount), 0) as "الإجمالي"
            FROM payout_requests
            GROUP BY status
        ) AS payout_requests_stats;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payouts') THEN
        RAISE NOTICE '💸 إحصائيات المدفوعات (payouts):';
        PERFORM * FROM (
            SELECT 
                status as "الحالة",
                COUNT(*) as "العدد",
                COALESCE(SUM(amount), 0) as "الإجمالي"
            FROM payouts
            GROUP BY status
        ) AS payouts_stats;
    END IF;
END $$;

-- =========================================================
-- 7️⃣: فحص جدول العمولات (commissions)
-- =========================================================

SELECT '7️⃣ فحص جدول العمولات (commissions)' as checkpoint;

-- هل الجدول موجود؟
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commissions') 
        THEN '✅ موجود'
        ELSE '❌ غير موجود'
    END as "حالة الجدول";

-- إحصائيات العمولات
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commissions') THEN
        RAISE NOTICE '💼 إحصائيات العمولات:';
        PERFORM * FROM (
            SELECT 
                COUNT(*) as "عدد العمولات",
                COALESCE(SUM(commission_amount), 0) as "إجمالي العمولات",
                COALESCE(AVG(commission_rate), 0) as "متوسط نسبة العمولة",
                COALESCE(SUM(order_amount), 0) as "إجمالي الطلبات"
            FROM commissions
        ) AS commissions_stats;
    END IF;
END $$;

-- =========================================================
-- 8️⃣: فحص الإعدادات المالية (financial_settings)
-- =========================================================

SELECT '8️⃣ فحص الإعدادات المالية (financial_settings)' as checkpoint;

-- هل الجدول موجود؟
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_settings') 
        THEN '✅ موجود'
        ELSE '❌ غير موجود'
    END as "حالة الجدول";

-- الإعدادات الحالية
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_settings') THEN
        RAISE NOTICE '⚙️ الإعدادات المالية الحالية:';
        PERFORM * FROM (
            SELECT 
                default_commission_rate as "نسبة العمولة الافتراضية",
                tax_rate as "نسبة الضريبة",
                min_payout_amount as "الحد الأدنى للسحب",
                base_delivery_fee as "رسوم التوصيل الأساسية",
                per_km_delivery_fee as "رسوم التوصيل لكل كم"
            FROM financial_settings
            WHERE is_active = true
            LIMIT 1
        ) AS settings;
    END IF;
END $$;

-- =========================================================
-- 9️⃣: فحص Foreign Keys والعلاقات
-- =========================================================

SELECT '9️⃣ فحص العلاقات بين الجداول (Foreign Keys)' as checkpoint;

SELECT 
    tc.table_name as "الجدول",
    kcu.column_name as "العمود",
    ccu.table_name AS "يشير إلى جدول",
    ccu.column_name AS "يشير إلى عمود",
    CASE 
        WHEN tc.table_name IN ('orders', 'order_items', 'vendor_wallets', 'wallet_transactions', 'payout_requests', 'payouts')
        THEN '✅'
        ELSE '⚠️'
    END as "الحالة"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN (
        'orders', 'order_items', 'vendor_wallets', 'wallet_transactions',
        'payout_requests', 'payouts', 'commissions'
    )
ORDER BY tc.table_name, kcu.column_name;

-- =========================================================
-- 🔟: فحص Triggers المالية
-- =========================================================

SELECT '🔟 فحص Triggers المالية' as checkpoint;

SELECT 
    trigger_name as "اسم الـ Trigger",
    event_object_table as "الجدول",
    action_statement as "الوظيفة",
    CASE 
        WHEN trigger_name LIKE '%wallet%' OR trigger_name LIKE '%commission%' OR trigger_name LIKE '%payment%'
        THEN '✅ مالي'
        ELSE '⚠️'
    END as "النوع"
FROM information_schema.triggers
WHERE event_object_schema = 'public'
    AND (
        event_object_table IN ('orders', 'order_items', 'vendor_wallets')
        OR trigger_name LIKE '%wallet%'
        OR trigger_name LIKE '%commission%'
        OR trigger_name LIKE '%payment%'
    )
ORDER BY event_object_table, trigger_name;

-- =========================================================
-- 1️⃣1️⃣: فحص Functions المالية
-- =========================================================

SELECT '1️⃣1️⃣ فحص Functions المالية' as checkpoint;

SELECT 
    routine_name as "اسم الـ Function",
    routine_type as "النوع",
    CASE 
        WHEN routine_name LIKE '%wallet%' OR routine_name LIKE '%commission%' 
            OR routine_name LIKE '%payment%' OR routine_name LIKE '%payout%'
        THEN '✅ مالية'
        ELSE '⚠️'
    END as "التصنيف"
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND (
        routine_name LIKE '%wallet%'
        OR routine_name LIKE '%commission%'
        OR routine_name LIKE '%payment%'
        OR routine_name LIKE '%payout%'
        OR routine_name LIKE '%financial%'
    )
ORDER BY routine_name;

-- =========================================================
-- 1️⃣2️⃣: فحص Indexes على الجداول المالية
-- =========================================================

SELECT '1️⃣2️⃣ فحص Indexes المالية' as checkpoint;

SELECT 
    tablename as "الجدول",
    indexname as "اسم الـ Index",
    indexdef as "التعريف"
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN (
        'orders', 'order_items', 'vendor_wallets', 
        'wallet_transactions', 'payout_requests', 'payouts', 'commissions'
    )
ORDER BY tablename, indexname;

-- =========================================================
-- 1️⃣3️⃣: فحص RLS (Row Level Security) على الجداول المالية
-- =========================================================

SELECT '1️⃣3️⃣ فحص Row Level Security (RLS)' as checkpoint;

SELECT 
    tablename as "الجدول",
    policyname as "اسم السياسة",
    permissive as "نوع السياسة",
    roles as "الأدوار",
    cmd as "العملية",
    qual as "الشرط"
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'orders', 'order_items', 'vendor_wallets',
        'wallet_transactions', 'payout_requests', 'payouts', 'commissions'
    )
ORDER BY tablename, policyname;

-- =========================================================
-- 1️⃣4️⃣: تحليل الترابط بين الطلبات والمعاملات المالية
-- =========================================================

SELECT '1️⃣4️⃣ تحليل الترابط بين الطلبات والمعاملات' as checkpoint;

-- طلبات بدون معاملات محفظة (إذا كان الجدول موجوداً)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions') THEN
        RAISE NOTICE '⚠️ طلبات مكتملة بدون معاملات محفظة:';
        PERFORM * FROM (
            SELECT 
                o.id,
                o.order_number as "رقم الطلب",
                o.total as "المبلغ",
                o.status as "الحالة",
                o.created_at as "التاريخ"
            FROM orders o
            WHERE o.status IN ('completed', 'delivered')
                AND NOT EXISTS (
                    SELECT 1 FROM wallet_transactions wt
                    WHERE wt.order_id = o.id
                )
            ORDER BY o.created_at DESC
            LIMIT 5
        ) AS orphan_orders;
    END IF;
END $$;

-- طلبات بدون عناصر
SELECT 
    o.id,
    o.order_number as "رقم الطلب",
    o.total as "المبلغ",
    o.status as "الحالة"
FROM orders o
WHERE NOT EXISTS (
    SELECT 1 FROM order_items oi
    WHERE oi.order_id = o.id
)
LIMIT 5;

-- =========================================================
-- 1️⃣5️⃣: التقرير النهائي والملخص
-- =========================================================

SELECT '=========================================' as info;
SELECT '📊 التقرير النهائي للنظام المالي' as info;
SELECT '=========================================' as info;

DO $$ 
DECLARE
    v_has_orders BOOLEAN;
    v_has_order_items BOOLEAN;
    v_has_vendor_wallets BOOLEAN;
    v_has_wallet_transactions BOOLEAN;
    v_has_payout_requests BOOLEAN;
    v_has_payouts BOOLEAN;
    v_has_commissions BOOLEAN;
    v_has_financial_settings BOOLEAN;
    
    v_orders_count INTEGER;
    v_total_revenue NUMERIC;
    v_wallets_count INTEGER;
    v_transactions_count INTEGER;
    v_payouts_count INTEGER;
    
    v_financial_score INTEGER := 0;
    v_max_score INTEGER := 8;
BEGIN
    -- فحص وجود الجداول
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') INTO v_has_orders;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') INTO v_has_order_items;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_wallets') INTO v_has_vendor_wallets;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions') INTO v_has_wallet_transactions;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payout_requests') INTO v_has_payout_requests;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payouts') INTO v_has_payouts;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commissions') INTO v_has_commissions;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_settings') INTO v_has_financial_settings;
    
    -- حساب النقاط
    IF v_has_orders THEN v_financial_score := v_financial_score + 1; END IF;
    IF v_has_order_items THEN v_financial_score := v_financial_score + 1; END IF;
    IF v_has_vendor_wallets THEN v_financial_score := v_financial_score + 1; END IF;
    IF v_has_wallet_transactions THEN v_financial_score := v_financial_score + 1; END IF;
    IF v_has_payout_requests OR v_has_payouts THEN v_financial_score := v_financial_score + 1; END IF;
    IF v_has_commissions THEN v_financial_score := v_financial_score + 1; END IF;
    IF v_has_financial_settings THEN v_financial_score := v_financial_score + 1; END IF;
    
    -- جمع الإحصائيات
    SELECT COUNT(*), COALESCE(SUM(total), 0) INTO v_orders_count, v_total_revenue FROM orders;
    
    IF v_has_vendor_wallets THEN
        SELECT COUNT(*) INTO v_wallets_count FROM vendor_wallets;
    ELSE
        v_wallets_count := 0;
    END IF;
    
    IF v_has_wallet_transactions THEN
        SELECT COUNT(*) INTO v_transactions_count FROM wallet_transactions;
    ELSE
        v_transactions_count := 0;
    END IF;
    
    IF v_has_payouts THEN
        SELECT COUNT(*) INTO v_payouts_count FROM payouts;
    ELSIF v_has_payout_requests THEN
        SELECT COUNT(*) INTO v_payouts_count FROM payout_requests;
    ELSE
        v_payouts_count := 0;
    END IF;
    
    -- عرض التقرير النهائي
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 ملخص النظام المالي';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 نقاط اكتمال النظام: %/%', v_financial_score, v_max_score;
    RAISE NOTICE '';
    RAISE NOTICE '📋 الجداول الأساسية:';
    RAISE NOTICE '   % orders (الطلبات)', CASE WHEN v_has_orders THEN '✅' ELSE '❌' END;
    RAISE NOTICE '   % order_items (عناصر الطلبات)', CASE WHEN v_has_order_items THEN '✅' ELSE '❌' END;
    RAISE NOTICE '   % vendor_wallets (محافظ البائعين)', CASE WHEN v_has_vendor_wallets THEN '✅' ELSE '❌' END;
    RAISE NOTICE '   % wallet_transactions (معاملات المحفظة)', CASE WHEN v_has_wallet_transactions THEN '✅' ELSE '❌' END;
    RAISE NOTICE '   % payout_requests/payouts (طلبات السحب)', CASE WHEN v_has_payout_requests OR v_has_payouts THEN '✅' ELSE '❌' END;
    RAISE NOTICE '   % commissions (العمولات)', CASE WHEN v_has_commissions THEN '✅' ELSE '❌' END;
    RAISE NOTICE '   % financial_settings (الإعدادات المالية)', CASE WHEN v_has_financial_settings THEN '✅' ELSE '❌' END;
    RAISE NOTICE '';
    RAISE NOTICE '📊 الإحصائيات:';
    RAISE NOTICE '   🛒 عدد الطلبات: %', v_orders_count;
    RAISE NOTICE '   💰 إجمالي الإيرادات: % وحدة نقدية', v_total_revenue;
    RAISE NOTICE '   👛 عدد المحافظ: %', v_wallets_count;
    RAISE NOTICE '   💳 عدد المعاملات: %', v_transactions_count;
    RAISE NOTICE '   💸 عدد طلبات السحب: %', v_payouts_count;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ المشاكل المحتملة:';
    IF NOT v_has_vendor_wallets THEN
        RAISE NOTICE '   ❌ جدول vendor_wallets غير موجود';
    END IF;
    IF NOT v_has_wallet_transactions THEN
        RAISE NOTICE '   ❌ جدول wallet_transactions غير موجود';
    END IF;
    IF NOT v_has_commissions THEN
        RAISE NOTICE '   ⚠️  جدول commissions غير موجود';
    END IF;
    IF NOT v_has_financial_settings THEN
        RAISE NOTICE '   ⚠️  جدول financial_settings غير موجود';
    END IF;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

-- =========================================================
-- 🎉 انتهى الفحص الشامل
-- =========================================================

SELECT '🎉 اكتمل فحص النظام المالي!' as status;
SELECT 'يرجى مراجعة النتائج أعلاه والتقرير النهائي' as note;
