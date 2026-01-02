-- =========================================================
-- المرحلة 1: إنشاء الأنواع المخصصة (ENUMS)
-- =========================================================
-- الإصدار: 2.0
-- التاريخ: 2026-01-02
-- الوصف: تعريف جميع أنواع البيانات المخصصة المستخدمة في النظام
-- =========================================================

-- إزالة الأنواع القديمة إن وجدت
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS vendor_type CASCADE;
DROP TYPE IF EXISTS vendor_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS delivery_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS complaint_status CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;

-- نوع دور المستخدم
CREATE TYPE user_role AS ENUM (
  'admin',           -- مدير النظام
  'vendor',          -- بائع/تاجر
  'restaurant',      -- صاحب مطعم
  'driver',          -- سائق توصيل
  'customer'         -- عميل/زبون
);

-- نوع المتجر/البائع
CREATE TYPE vendor_type AS ENUM (
  'restaurant',      -- مطعم
  'shop',            -- متجر
  'supermarket',     -- سوبر ماركت
  'pharmacy',        -- صيدلية
  'grocery',         -- بقالة
  'electronics',     -- إلكترونيات
  'fashion',         -- أزياء
  'beauty',          -- مستحضرات تجميل
  'home',            -- أدوات منزلية
  'sports',          -- رياضة
  'books',           -- كتب
  'toys',            -- ألعاب
  'other'            -- أخرى
);

-- حالة المتجر
CREATE TYPE vendor_status AS ENUM (
  'pending',         -- في انتظار الموافقة
  'approved',        -- موافق عليه
  'rejected',        -- مرفوض
  'suspended',       -- معلق
  'closed'           -- مغلق
);

-- حالة الطلب
CREATE TYPE order_status AS ENUM (
  'pending',         -- في الانتظار
  'confirmed',       -- مؤكد
  'preparing',       -- قيد التحضير
  'ready',           -- جاهز للتوصيل
  'out_for_delivery', -- في طريق التوصيل
  'delivered',       -- تم التوصيل
  'cancelled',       -- ملغي
  'refunded'         -- مسترجع
);

-- حالة التوصيل
CREATE TYPE delivery_status AS ENUM (
  'pending',         -- في الانتظار
  'assigned',        -- تم التعيين لسائق
  'accepted',        -- قبله السائق
  'picked_up',       -- تم الاستلام من المتجر
  'in_transit',      -- في الطريق
  'arrived',         -- وصل للعميل
  'delivered',       -- تم التسليم
  'failed',          -- فشل التوصيل
  'returned'         -- تم الإرجاع
);

-- حالة الدفع
CREATE TYPE payment_status AS ENUM (
  'pending',         -- في الانتظار
  'processing',      -- قيد المعالجة
  'completed',       -- مكتمل
  'failed',          -- فشل
  'refunded',        -- مسترجع
  'cancelled'        -- ملغي
);

-- طريقة الدفع
CREATE TYPE payment_method AS ENUM (
  'cash',            -- نقدي
  'card',            -- بطاقة
  'wallet',          -- محفظة إلكترونية
  'bank_transfer',   -- تحويل بنكي
  'credit'           -- ائتمان
);

-- نوع الإشعار
CREATE TYPE notification_type AS ENUM (
  'order',           -- إشعار طلب
  'delivery',        -- إشعار توصيل
  'payment',         -- إشعار دفع
  'promotion',       -- إشعار عرض
  'system',          -- إشعار نظام
  'chat',            -- إشعار محادثة
  'review'           -- إشعار تقييم
);

-- حالة الشكوى
CREATE TYPE complaint_status AS ENUM (
  'open',            -- مفتوحة
  'in_progress',     -- قيد المعالجة
  'resolved',        -- تم الحل
  'closed',          -- مغلقة
  'escalated'        -- تم تصعيدها
);

-- نوع المعاملة المالية
CREATE TYPE transaction_type AS ENUM (
  'credit',          -- إضافة رصيد
  'debit',           -- خصم رصيد
  'refund',          -- استرجاع
  'commission',      -- عمولة
  'withdrawal',      -- سحب
  'bonus',           -- مكافأة
  'penalty'          -- غرامة
);

-- إنشاء تعليقات للتوثيق
COMMENT ON TYPE user_role IS 'أدوار المستخدمين في النظام';
COMMENT ON TYPE vendor_type IS 'أنواع المتاجر والبائعين';
COMMENT ON TYPE vendor_status IS 'حالات الموافقة والتشغيل للمتاجر';
COMMENT ON TYPE order_status IS 'حالات الطلبات';
COMMENT ON TYPE delivery_status IS 'حالات عمليات التوصيل';
COMMENT ON TYPE payment_status IS 'حالات عمليات الدفع';
COMMENT ON TYPE payment_method IS 'طرق الدفع المتاحة';
COMMENT ON TYPE notification_type IS 'أنواع الإشعارات';
COMMENT ON TYPE complaint_status IS 'حالات الشكاوى';
COMMENT ON TYPE transaction_type IS 'أنواع المعاملات المالية';

-- =========================================================
-- نهاية ملف إنشاء الأنواع المخصصة
-- =========================================================
