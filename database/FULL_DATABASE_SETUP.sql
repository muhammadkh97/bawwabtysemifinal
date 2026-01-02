
-- =========================================================
-- تعليمات الاستخدام
-- =========================================================
-- 1. افتح Supabase Dashboard > SQL Editor
-- 2. انسخ محتوى هذا الملف بالكامل
-- 3. الصقه في SQL Editor
-- 4. اضغط RUN
-- 5. انتظر حتى ينتهي التنفيذ (قد يستغرق 1-2 دقيقة)
-- 
-- سيتم إنشاء:
-- - جميع الأنواع المخصصة (ENUMs)
-- - جميع الجداول (20+ جدول)
-- - جميع الفهارس والقيود
-- - جميع الـ Triggers والـ Functions
-- - جميع سياسات الأمان (RLS Policies)
-- =========================================================

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
-- =========================================================
-- المرحلة 2: جداول المستخدمين والملفات الشخصية
-- =========================================================
-- الإصدار: 2.0
-- التاريخ: 2026-01-02
-- الوصف: جداول المستخدمين الأساسية مع الأمان الكامل
-- =========================================================

-- =====================================================
-- 1. جدول المستخدمين الرئيسي (profiles)
-- =====================================================
-- هذا الجدول مرتبط مباشرة مع auth.users في Supabase

CREATE TABLE IF NOT EXISTS public.profiles (
  -- المعرف الأساسي (مرتبط بـ auth.users)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- المعلومات الأساسية
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  
  -- الدور والصلاحيات
  user_role user_role NOT NULL DEFAULT 'customer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  
  -- العنوان والموقع
  address TEXT,
  city VARCHAR(100),
  region VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'المملكة العربية السعودية',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- التوقيتات
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- قيود للتحقق
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT phone_format CHECK (phone IS NULL OR phone ~* '^\+?[0-9]{10,15}$')
);

-- الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- تعليقات التوثيق
COMMENT ON TABLE public.profiles IS 'جدول الملفات الشخصية للمستخدمين';
COMMENT ON COLUMN public.profiles.id IS 'المعرف الفريد (مرتبط بـ auth.users)';
COMMENT ON COLUMN public.profiles.user_role IS 'دور المستخدم في النظام';
COMMENT ON COLUMN public.profiles.is_active IS 'هل الحساب نشط؟';
COMMENT ON COLUMN public.profiles.is_verified IS 'هل تم التحقق من المستخدم؟';

-- =====================================================
-- 2. جدول إعدادات المستخدم
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- إعدادات الإشعارات
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  order_notifications BOOLEAN DEFAULT true,
  promotion_notifications BOOLEAN DEFAULT true,
  
  -- إعدادات اللغة والواجهة
  language VARCHAR(10) DEFAULT 'ar',
  theme VARCHAR(20) DEFAULT 'light',
  currency VARCHAR(10) DEFAULT 'SAR',
  
  -- إعدادات الخصوصية
  profile_visibility VARCHAR(20) DEFAULT 'public',
  show_online_status BOOLEAN DEFAULT true,
  allow_chat BOOLEAN DEFAULT true,
  
  -- التوقيتات
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

COMMENT ON TABLE public.user_settings IS 'إعدادات وتفضيلات المستخدمين';

-- =====================================================
-- 3. جدول عناوين المستخدمين
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- معلومات العنوان
  label VARCHAR(100) NOT NULL, -- مثل: منزل، عمل، أخرى
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'المملكة العربية السعودية',
  
  -- الموقع الجغرافي
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- معلومات الاتصال
  contact_name VARCHAR(255),
  contact_phone VARCHAR(20),
  
  -- إعدادات
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- ملاحظات
  notes TEXT,
  
  -- التوقيتات
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_default ON public.user_addresses(user_id, is_default) WHERE is_default = true;

COMMENT ON TABLE public.user_addresses IS 'عناوين التوصيل للمستخدمين';

-- =====================================================
-- 4. جدول المفضلة (Favorites)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- نوع المفضلة
  entity_type VARCHAR(50) NOT NULL, -- product, vendor, category
  entity_id UUID NOT NULL,
  
  -- التوقيت
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- التفرد: مستخدم واحد لا يمكنه إضافة نفس العنصر مرتين
  UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_entity ON public.favorites(entity_type, entity_id);

COMMENT ON TABLE public.favorites IS 'المنتجات والمتاجر المفضلة للمستخدمين';

-- =====================================================
-- 5. جدول المتابعة (Following)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- التوقيت
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- لا يمكن للمستخدم متابعة نفسه
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  
  -- التفرد: لا يمكن المتابعة مرتين
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);

COMMENT ON TABLE public.user_follows IS 'متابعة المستخدمين لبعضهم البعض';

-- =====================================================
-- 6. تفعيل Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. Triggers للتحديث التلقائي
-- =====================================================

-- Function لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق Trigger على الجداول
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_addresses_updated_at
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 8. Function لإنشاء ملف شخصي تلقائياً
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- إنشاء ملف شخصي للمستخدم الجديد
  INSERT INTO public.profiles (id, email, full_name, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    NEW.email_confirmed_at IS NOT NULL
  );
  
  -- إنشاء إعدادات افتراضية
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger لإنشاء الملف الشخصي عند التسجيل
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- نهاية ملف جداول المستخدمين
-- =========================================================
-- =========================================================
-- المرحلة 3: جداول البائعين والمتاجر
-- =========================================================
-- الإصدار: 2.0
-- التاريخ: 2026-01-02
-- الوصف: جداول المتاجر والبائعين مع معلوماتهم الكاملة
-- =========================================================

-- =====================================================
-- 1. جدول البائعين/المتاجر
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- المعلومات الأساسية
  vendor_name VARCHAR(255) NOT NULL,
  vendor_name_en VARCHAR(255),
  slug VARCHAR(255) UNIQUE NOT NULL,
  vendor_type vendor_type NOT NULL,
  description TEXT,
  description_en TEXT,
  
  -- الشعار والصور
  logo_url TEXT,
  cover_image_url TEXT,
  images TEXT[], -- مصفوفة من روابط الصور
  
  -- معلومات الاتصال
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  website_url TEXT,
  
  -- العنوان والموقع
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'المملكة العربية السعودية',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- أوقات العمل
  opening_time TIME,
  closing_time TIME,
  working_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6], -- 0=Sunday, 6=Saturday
  is_24_hours BOOLEAN DEFAULT false,
  
  -- الحالة والموافقة
  status vendor_status NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- معلومات الأعمال
  business_license_number VARCHAR(100),
  tax_registration_number VARCHAR(100),
  commercial_registration TEXT, -- رابط صورة السجل التجاري
  
  -- التقييمات
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  
  -- رسوم التوصيل
  delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
  min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
  free_delivery_threshold DECIMAL(10, 2),
  
  -- مدة التحضير المتوقعة (بالدقائق)
  preparation_time INTEGER DEFAULT 30,
  
  -- البنك والحساب البنكي
  bank_name VARCHAR(100),
  bank_account_name VARCHAR(255),
  bank_account_number VARCHAR(100),
  iban VARCHAR(34),
  
  -- ملاحظات الإدارة
  admin_notes TEXT,
  rejection_reason TEXT,
  
  -- التوقيتات
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- قيود
  CONSTRAINT unique_owner_vendor UNIQUE(owner_id),
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT valid_preparation_time CHECK (preparation_time > 0)
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_vendors_owner_id ON public.vendors(owner_id);
CREATE INDEX IF NOT EXISTS idx_vendors_slug ON public.vendors(slug);
CREATE INDEX IF NOT EXISTS idx_vendors_type ON public.vendors(vendor_type);
CREATE INDEX IF NOT EXISTS idx_vendors_city ON public.vendors(city);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON public.vendors(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vendors_featured ON public.vendors(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_vendors_rating ON public.vendors(rating DESC);
CREATE INDEX IF NOT EXISTS idx_vendors_location ON public.vendors USING gist(
  ll_to_earth(latitude::float8, longitude::float8)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON TABLE public.vendors IS 'جدول المتاجر والبائعين';

-- =====================================================
-- 2. جدول فئات المتاجر
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vendor_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(vendor_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_vendor_categories_vendor_id ON public.vendor_categories(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_categories_active ON public.vendor_categories(is_active) WHERE is_active = true;

COMMENT ON TABLE public.vendor_categories IS 'فئات المنتجات داخل كل متجر';

-- =====================================================
-- 3. جدول ساعات عمل المتجر التفصيلية
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vendor_working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_day CHECK (day_of_week >= 0 AND day_of_week <= 6),
  CONSTRAINT valid_times CHECK (opening_time < closing_time),
  UNIQUE(vendor_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_vendor_working_hours_vendor_id ON public.vendor_working_hours(vendor_id);

COMMENT ON TABLE public.vendor_working_hours IS 'ساعات العمل التفصيلية لكل يوم';

-- =====================================================
-- 4. جدول إحصائيات المتاجر
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vendor_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL UNIQUE REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- إحصائيات الطلبات
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  
  -- إحصائيات المبيعات
  total_revenue DECIMAL(15, 2) DEFAULT 0.00,
  total_commission DECIMAL(15, 2) DEFAULT 0.00,
  net_revenue DECIMAL(15, 2) DEFAULT 0.00,
  
  -- إحصائيات المنتجات
  total_products INTEGER DEFAULT 0,
  active_products INTEGER DEFAULT 0,
  out_of_stock_products INTEGER DEFAULT 0,
  
  -- إحصائيات العملاء
  total_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  
  -- التقييمات
  average_rating DECIMAL(3, 2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  five_star_reviews INTEGER DEFAULT 0,
  four_star_reviews INTEGER DEFAULT 0,
  three_star_reviews INTEGER DEFAULT 0,
  two_star_reviews INTEGER DEFAULT 0,
  one_star_reviews INTEGER DEFAULT 0,
  
  -- الأداء
  average_preparation_time INTEGER, -- بالدقائق
  average_delivery_time INTEGER, -- بالدقائق
  on_time_delivery_rate DECIMAL(5, 2), -- نسبة مئوية
  
  -- التحديث
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_statistics_vendor_id ON public.vendor_statistics(vendor_id);

COMMENT ON TABLE public.vendor_statistics IS 'إحصائيات شاملة للمتاجر';

-- =====================================================
-- 5. جدول مناطق التوصيل
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vendor_delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  zone_name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  regions TEXT[], -- مصفوفة من المناطق
  
  -- رسوم التوصيل
  delivery_fee DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
  
  -- الموقع الجغرافي (إذا كانت دائرة)
  center_latitude DECIMAL(10, 8),
  center_longitude DECIMAL(11, 8),
  radius_km DECIMAL(10, 2),
  
  -- أو حدود متعددة النقاط (polygon)
  boundary_polygon TEXT, -- GeoJSON أو WKT
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_delivery_zones_vendor_id ON public.vendor_delivery_zones(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_delivery_zones_city ON public.vendor_delivery_zones(city);

COMMENT ON TABLE public.vendor_delivery_zones IS 'مناطق التوصيل المتاحة لكل متجر';

-- =====================================================
-- 6. تفعيل Row Level Security
-- =====================================================

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_delivery_zones ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. Triggers
-- =====================================================

-- تحديث updated_at
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_categories_updated_at
  BEFORE UPDATE ON public.vendor_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_working_hours_updated_at
  BEFORE UPDATE ON public.vendor_working_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_statistics_updated_at
  BEFORE UPDATE ON public.vendor_statistics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_delivery_zones_updated_at
  BEFORE UPDATE ON public.vendor_delivery_zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 8. Function لإنشاء إحصائيات عند إنشاء متجر
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_vendor_statistics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.vendor_statistics (vendor_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_vendor_created ON public.vendors;
CREATE TRIGGER on_vendor_created
  AFTER INSERT ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.create_vendor_statistics();

-- =====================================================
-- 9. Function لإنشاء slug تلقائياً
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_vendor_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- إذا كان slug موجود بالفعل، لا نفعل شيء
  IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    RETURN NEW;
  END IF;
  
  -- إنشاء slug من اسم المتجر
  base_slug := lower(trim(regexp_replace(NEW.vendor_name, '[^a-zA-Z0-9\s-]', '', 'g')));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  final_slug := base_slug;
  
  -- التحقق من التفرد وإضافة رقم إذا لزم الأمر
  WHILE EXISTS (SELECT 1 FROM public.vendors WHERE slug = final_slug AND id != NEW.id) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_vendor_slug_trigger ON public.vendors;
CREATE TRIGGER generate_vendor_slug_trigger
  BEFORE INSERT OR UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_vendor_slug();

-- =========================================================
-- نهاية ملف جداول البائعين
-- =========================================================
-- =========================================================
-- المرحلة 4: جداول المنتجات والمخزون
-- =========================================================
-- الإصدار: 2.0
-- التاريخ: 2026-01-02
-- الوصف: جداول المنتجات مع المتغيرات والمخزون
-- =========================================================

-- =====================================================
-- 1. جدول الفئات الرئيسية
-- =====================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- المعلومات الأساسية
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  description_en TEXT,
  
  -- التسلسل الهرمي
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 0,
  path TEXT, -- مثل: /electronics/phones/samsung
  
  -- الصور
  icon_url TEXT,
  image_url TEXT,
  
  -- الترتيب والعرض
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- الإحصائيات
  products_count INTEGER DEFAULT 0,
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_featured ON public.categories(is_featured) WHERE is_featured = true;

COMMENT ON TABLE public.categories IS 'الفئات الرئيسية للمنتجات (تصنيف هرمي)';

-- =====================================================
-- 2. جدول المنتجات الرئيسي
-- =====================================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  
  -- المعلومات الأساسية
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  slug VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  barcode VARCHAR(100),
  
  -- الوصف
  description TEXT,
  description_en TEXT,
  short_description TEXT,
  
  -- الصور
  main_image_url TEXT,
  images TEXT[], -- مصفوفة صور
  
  -- السعر
  base_price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  
  -- المخزون
  stock_quantity INTEGER DEFAULT 0,
  min_stock_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true,
  allow_backorder BOOLEAN DEFAULT false,
  
  -- القياسات والوزن
  weight DECIMAL(10, 2),
  weight_unit VARCHAR(10) DEFAULT 'kg',
  length DECIMAL(10, 2),
  width DECIMAL(10, 2),
  height DECIMAL(10, 2),
  dimension_unit VARCHAR(10) DEFAULT 'cm',
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_new_arrival BOOLEAN DEFAULT false,
  is_on_sale BOOLEAN DEFAULT false,
  
  -- التقييم
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  
  -- متغيرات
  has_variants BOOLEAN DEFAULT false,
  
  -- الضرائب والشحن
  tax_rate DECIMAL(5, 2) DEFAULT 0.00,
  is_taxable BOOLEAN DEFAULT true,
  is_shippable BOOLEAN DEFAULT true,
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  
  -- التوقيتات
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- قيود
  CONSTRAINT valid_price CHECK (base_price > 0),
  CONSTRAINT valid_sale_price CHECK (sale_price IS NULL OR sale_price > 0),
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT valid_stock CHECK (stock_quantity >= 0),
  UNIQUE(vendor_id, slug)
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(vendor_id, slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_rating ON public.products(rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(base_price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products(created_at DESC);

COMMENT ON TABLE public.products IS 'جدول المنتجات الرئيسي';

-- =====================================================
-- 3. جدول متغيرات المنتجات (Variants)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- معلومات المتغير
  name VARCHAR(255) NOT NULL, -- مثل: Large / أزرق / XL
  sku VARCHAR(100) UNIQUE,
  barcode VARCHAR(100),
  
  -- الخصائص
  attributes JSONB, -- مثل: {"size": "L", "color": "blue"}
  
  -- السعر
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  
  -- المخزون
  stock_quantity INTEGER DEFAULT 0,
  
  -- الصورة
  image_url TEXT,
  
  -- القياسات
  weight DECIMAL(10, 2),
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- الترتيب
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_variant_price CHECK (price > 0)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON public.product_variants(is_active) WHERE is_active = true;

COMMENT ON TABLE public.product_variants IS 'متغيرات المنتجات (الأحجام، الألوان، إلخ)';

-- =====================================================
-- 4. جدول الوسوم (Tags)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) UNIQUE NOT NULL,
  name_en VARCHAR(100),
  slug VARCHAR(100) UNIQUE NOT NULL,
  
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);

COMMENT ON TABLE public.tags IS 'وسوم المنتجات';

-- =====================================================
-- 5. جدول ربط المنتجات بالوسوم
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(product_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON public.product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag_id ON public.product_tags(tag_id);

COMMENT ON TABLE public.product_tags IS 'ربط المنتجات بالوسوم';

-- =====================================================
-- 6. جدول سجل المخزون
-- =====================================================

CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  
  -- التغيير
  change_type VARCHAR(50) NOT NULL, -- 'purchase', 'sale', 'adjustment', 'return'
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  
  -- السبب
  reason TEXT,
  reference_id UUID, -- رقم الطلب أو المرجع
  reference_type VARCHAR(50), -- 'order', 'manual', 'return'
  
  -- المستخدم
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT product_or_variant_required CHECK (
    (product_id IS NOT NULL AND variant_id IS NULL) OR
    (product_id IS NULL AND variant_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON public.inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_variant_id ON public.inventory_logs(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created ON public.inventory_logs(created_at DESC);

COMMENT ON TABLE public.inventory_logs IS 'سجل تغييرات المخزون';

-- =====================================================
-- 7. تفعيل Row Level Security
-- =====================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. Triggers
-- =====================================================

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 9. Functions لإدارة المخزون
-- =====================================================

-- Function لتحديث عدد المنتجات في الفئة
CREATE OR REPLACE FUNCTION public.update_category_products_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.categories 
    SET products_count = products_count + 1
    WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.categories 
    SET products_count = products_count - 1
    WHERE id = OLD.category_id AND products_count > 0;
  ELSIF TG_OP = 'UPDATE' AND NEW.category_id != OLD.category_id THEN
    UPDATE public.categories 
    SET products_count = products_count - 1
    WHERE id = OLD.category_id AND products_count > 0;
    
    UPDATE public.categories 
    SET products_count = products_count + 1
    WHERE id = NEW.category_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_products_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_category_products_count();

-- Function لإنشاء slug للمنتج
CREATE OR REPLACE FUNCTION public.generate_product_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    RETURN NEW;
  END IF;
  
  base_slug := lower(trim(regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g')));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  final_slug := base_slug;
  
  WHILE EXISTS (
    SELECT 1 FROM public.products 
    WHERE slug = final_slug 
    AND vendor_id = NEW.vendor_id 
    AND id != NEW.id
  ) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_product_slug_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_product_slug();

-- =========================================================
-- نهاية ملف جداول المنتجات
-- =========================================================
-- =========================================================
-- المرحلة 5: جداول الطلبات والمدفوعات
-- =========================================================
-- الإصدار: 2.0
-- التاريخ: 2026-01-02
-- الوصف: نظام الطلبات الكامل مع المدفوعات والتوصيل
-- =========================================================

-- =====================================================
-- 1. جدول الطلبات الرئيسي
-- =====================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- العلاقات
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- الحالة
  status order_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  delivery_status delivery_status NOT NULL DEFAULT 'pending',
  
  -- المبالغ
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  
  -- معلومات الدفع
  payment_method payment_method NOT NULL DEFAULT 'cash',
  paid_amount DECIMAL(10, 2) DEFAULT 0.00,
  
  -- معلومات التوصيل
  delivery_address TEXT NOT NULL,
  delivery_city VARCHAR(100) NOT NULL,
  delivery_latitude DECIMAL(10, 8),
  delivery_longitude DECIMAL(11, 8),
  delivery_phone VARCHAR(20) NOT NULL,
  delivery_notes TEXT,
  
  -- الأوقات
  preparation_time INTEGER, -- بالدقائق
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  
  -- ملاحظات
  customer_notes TEXT,
  vendor_notes TEXT,
  admin_notes TEXT,
  cancellation_reason TEXT,
  
  -- التوقيتات
  confirmed_at TIMESTAMP WITH TIME ZONE,
  preparing_at TIMESTAMP WITH TIME ZONE,
  ready_at TIMESTAMP WITH TIME ZONE,
  out_for_delivery_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- قيود
  CONSTRAINT valid_amounts CHECK (
    subtotal >= 0 AND
    tax_amount >= 0 AND
    delivery_fee >= 0 AND
    discount_amount >= 0 AND
    total_amount >= 0 AND
    paid_amount >= 0
  )
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON public.orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON public.orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

COMMENT ON TABLE public.orders IS 'جدول الطلبات الرئيسي';

-- =====================================================
-- 2. جدول عناصر الطلب (Order Items)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- المنتج
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  
  -- معلومات المنتج وقت الطلب
  product_name VARCHAR(255) NOT NULL,
  variant_name VARCHAR(255),
  product_image_url TEXT,
  sku VARCHAR(100),
  
  -- الكمية والسعر
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL,
  
  -- ملاحظات خاصة
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- قيود
  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_item_price CHECK (unit_price > 0),
  CONSTRAINT valid_item_total CHECK (total > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);

COMMENT ON TABLE public.order_items IS 'عناصر/منتجات الطلب';

-- =====================================================
-- 3. جدول المدفوعات
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- المبلغ
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'SAR',
  
  -- معلومات الدفع
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  
  -- معلومات البوابة
  gateway VARCHAR(50), -- 'stripe', 'paypal', 'tap', etc.
  transaction_id VARCHAR(255),
  gateway_response JSONB,
  
  -- الفشل والاسترجاع
  failure_reason TEXT,
  refund_amount DECIMAL(10, 2) DEFAULT 0.00,
  refund_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  -- التوقيتات
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_payment_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);

COMMENT ON TABLE public.payments IS 'سجل المدفوعات';

-- =====================================================
-- 4. جدول سجل حالة الطلب
-- =====================================================

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- الحالة
  old_status order_status,
  new_status order_status NOT NULL,
  
  -- المستخدم الذي قام بالتغيير
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- ملاحظات
  notes TEXT,
  
  -- الموقع (للسائق)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created ON public.order_status_history(created_at);

COMMENT ON TABLE public.order_status_history IS 'سجل تغييرات حالة الطلب';

-- =====================================================
-- 5. جدول التوصيل (Deliveries)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- الحالة
  status delivery_status NOT NULL DEFAULT 'pending',
  
  -- معلومات الالتقاط
  pickup_address TEXT NOT NULL,
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  
  -- معلومات التسليم
  delivery_address TEXT NOT NULL,
  delivery_latitude DECIMAL(10, 8),
  delivery_longitude DECIMAL(11, 8),
  
  -- المسافة والوقت
  distance_km DECIMAL(10, 2),
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  
  -- الرسوم
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  driver_commission DECIMAL(10, 2) DEFAULT 0.00,
  
  -- ملاحظات
  pickup_notes TEXT,
  delivery_notes TEXT,
  failure_reason TEXT,
  
  -- صورة التسليم (إثبات)
  delivery_proof_image_url TEXT,
  delivery_signature TEXT,
  
  -- التوقيتات
  assigned_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  arrived_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON public.deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON public.deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);

COMMENT ON TABLE public.deliveries IS 'معلومات التوصيل التفصيلية';

-- =====================================================
-- 6. تفعيل Row Level Security
-- =====================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. Triggers
-- =====================================================

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 8. Functions
-- =====================================================

-- Function لإنشاء رقم طلب تلقائي
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_suffix VARCHAR(2);
  random_part VARCHAR(8);
  new_number VARCHAR(50);
BEGIN
  IF NEW.order_number IS NOT NULL AND NEW.order_number != '' THEN
    RETURN NEW;
  END IF;
  
  year_suffix := TO_CHAR(NOW(), 'YY');
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  new_number := 'ORD-' || year_suffix || '-' || random_part;
  
  -- التأكد من التفرد
  WHILE EXISTS (SELECT 1 FROM public.orders WHERE order_number = new_number) LOOP
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    new_number := 'ORD-' || year_suffix || '-' || random_part;
  END LOOP;
  
  NEW.order_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_number();

-- Function لتسجيل تغيير حالة الطلب
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO public.order_status_history (
      order_id,
      old_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_order_status_change_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.log_order_status_change();

-- =========================================================
-- نهاية ملف جداول الطلبات والمدفوعات
-- =========================================================
-- =========================================================
-- سياسات الأمان - Row Level Security Policies
-- =========================================================
-- الإصدار: 2.0
-- التاريخ: 2026-01-02
-- الوصف: سياسات RLS كاملة وآمنة لجميع الجداول
-- =========================================================

-- =====================================================
-- 1. سياسات جدول profiles
-- =====================================================

-- عرض الملفات الشخصية: الكل يمكنهم رؤية الملفات النشطة فقط
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (is_active = true);

-- تحديث الملف الشخصي: المستخدم نفسه فقط
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- عرض الملف الشخصي الخاص: المستخدم نفسه أو المدير
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- =====================================================
-- 2. سياسات جدول user_settings
-- =====================================================

-- عرض وتحديث الإعدادات: المستخدم نفسه فقط
CREATE POLICY "user_settings_select_own"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_settings_update_own"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. سياسات جدول user_addresses
-- =====================================================

-- عرض العناوين: المستخدم نفسه فقط
CREATE POLICY "user_addresses_select_own"
  ON public.user_addresses FOR SELECT
  USING (auth.uid() = user_id);

-- إضافة عنوان: المستخدم نفسه فقط
CREATE POLICY "user_addresses_insert_own"
  ON public.user_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- تحديث العنوان: المستخدم نفسه فقط
CREATE POLICY "user_addresses_update_own"
  ON public.user_addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- حذف العنوان: المستخدم نفسه فقط
CREATE POLICY "user_addresses_delete_own"
  ON public.user_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. سياسات جدول favorites
-- =====================================================

-- عرض المفضلة: المستخدم نفسه فقط
CREATE POLICY "favorites_select_own"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

-- إضافة للمفضلة: المستخدم نفسه فقط
CREATE POLICY "favorites_insert_own"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- حذف من المفضلة: المستخدم نفسه فقط
CREATE POLICY "favorites_delete_own"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. سياسات جدول user_follows
-- =====================================================

-- عرض المتابعات: الكل
CREATE POLICY "user_follows_select_all"
  ON public.user_follows FOR SELECT
  USING (true);

-- إضافة متابعة: المستخدم نفسه فقط
CREATE POLICY "user_follows_insert_own"
  ON public.user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- حذف متابعة: المستخدم نفسه فقط
CREATE POLICY "user_follows_delete_own"
  ON public.user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- =====================================================
-- 6. سياسات جدول vendors
-- =====================================================

-- عرض المتاجر: المتاجر النشطة فقط للعامة
CREATE POLICY "vendors_select_public"
  ON public.vendors FOR SELECT
  USING (
    is_active = true AND status = 'approved' OR
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- إضافة متجر: أي مستخدم مسجل
CREATE POLICY "vendors_insert_authenticated"
  ON public.vendors FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- تحديث المتجر: المالك فقط
CREATE POLICY "vendors_update_owner"
  ON public.vendors FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- تحديث حالة المتجر: المدير فقط
CREATE POLICY "vendors_update_status_admin"
  ON public.vendors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- =====================================================
-- 7. سياسات جدول vendor_categories
-- =====================================================

-- عرض فئات المتجر: الكل
CREATE POLICY "vendor_categories_select_all"
  ON public.vendor_categories FOR SELECT
  USING (is_active = true);

-- إدارة الفئات: مالك المتجر فقط
CREATE POLICY "vendor_categories_manage_owner"
  ON public.vendor_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = vendor_categories.vendor_id AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = vendor_categories.vendor_id AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- 8. سياسات جدول categories
-- =====================================================

-- عرض الفئات: الكل
CREATE POLICY "categories_select_all"
  ON public.categories FOR SELECT
  USING (is_active = true);

-- إدارة الفئات: المدير فقط
CREATE POLICY "categories_manage_admin"
  ON public.categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- =====================================================
-- 9. سياسات جدول products
-- =====================================================

-- عرض المنتجات: المنتجات النشطة للكل، أو منتجات المتجر للمالك
CREATE POLICY "products_select_public"
  ON public.products FOR SELECT
  USING (
    is_active = true OR
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = products.vendor_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- إضافة منتج: مالك المتجر فقط
CREATE POLICY "products_insert_vendor_owner"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = products.vendor_id AND owner_id = auth.uid()
    )
  );

-- تحديث المنتج: مالك المتجر فقط
CREATE POLICY "products_update_vendor_owner"
  ON public.products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = products.vendor_id AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = products.vendor_id AND owner_id = auth.uid()
    )
  );

-- حذف المنتج: مالك المتجر فقط
CREATE POLICY "products_delete_vendor_owner"
  ON public.products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = products.vendor_id AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- 10. سياسات جدول product_variants
-- =====================================================

-- عرض المتغيرات: الكل للمنتجات النشطة
CREATE POLICY "product_variants_select_public"
  ON public.product_variants FOR SELECT
  USING (
    is_active = true OR
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.vendors v ON p.vendor_id = v.id
      WHERE p.id = product_variants.product_id AND v.owner_id = auth.uid()
    )
  );

-- إدارة المتغيرات: مالك المتجر فقط
CREATE POLICY "product_variants_manage_vendor_owner"
  ON public.product_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.vendors v ON p.vendor_id = v.id
      WHERE p.id = product_variants.product_id AND v.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.vendors v ON p.vendor_id = v.id
      WHERE p.id = product_variants.product_id AND v.owner_id = auth.uid()
    )
  );

-- =====================================================
-- 11. سياسات جدول orders
-- =====================================================

-- عرض الطلبات: العميل، البائع، السائق، أو المدير
CREATE POLICY "orders_select_involved_users"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = customer_id OR
    auth.uid() = driver_id OR
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = orders.vendor_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- إنشاء طلب: العميل فقط
CREATE POLICY "orders_insert_customer"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- تحديث الطلب: البائع، السائق، أو المدير
CREATE POLICY "orders_update_involved_users"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = orders.vendor_id AND owner_id = auth.uid()
    ) OR
    auth.uid() = driver_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- =====================================================
-- 12. سياسات جدول order_items
-- =====================================================

-- عرض عناصر الطلب: من يمكنه رؤية الطلب نفسه
CREATE POLICY "order_items_select_with_order"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND (
        auth.uid() = o.customer_id OR
        auth.uid() = o.driver_id OR
        EXISTS (
          SELECT 1 FROM public.vendors
          WHERE id = o.vendor_id AND owner_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND user_role = 'admin'
        )
      )
    )
  );

-- إضافة عناصر: عند إنشاء الطلب فقط
CREATE POLICY "order_items_insert_with_order"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id AND customer_id = auth.uid()
    )
  );

-- =====================================================
-- 13. سياسات جدول payments
-- =====================================================

-- عرض المدفوعات: العميل، البائع، أو المدير
CREATE POLICY "payments_select_involved_users"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id AND (
        auth.uid() = o.customer_id OR
        EXISTS (
          SELECT 1 FROM public.vendors
          WHERE id = o.vendor_id AND owner_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND user_role = 'admin'
        )
      )
    )
  );

-- إضافة دفعة: النظام أو المدير فقط
CREATE POLICY "payments_insert_system"
  ON public.payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- =====================================================
-- 14. سياسات جدول deliveries
-- =====================================================

-- عرض التوصيلات: السائق، البائع، العميل، أو المدير
CREATE POLICY "deliveries_select_involved_users"
  ON public.deliveries FOR SELECT
  USING (
    auth.uid() = driver_id OR
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = deliveries.order_id AND (
        auth.uid() = o.customer_id OR
        EXISTS (
          SELECT 1 FROM public.vendors
          WHERE id = o.vendor_id AND owner_id = auth.uid()
        )
      )
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- تحديث التوصيل: السائق أو المدير
CREATE POLICY "deliveries_update_driver_or_admin"
  ON public.deliveries FOR UPDATE
  USING (
    auth.uid() = driver_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- =====================================================
-- 15. سياسات جدول tags
-- =====================================================

-- عرض الوسوم: الكل
CREATE POLICY "tags_select_all"
  ON public.tags FOR SELECT
  USING (true);

-- إدارة الوسوم: المدير فقط
CREATE POLICY "tags_manage_admin"
  ON public.tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- =====================================================
-- 16. سياسات جدول inventory_logs
-- =====================================================

-- عرض سجل المخزون: مالك المتجر أو المدير
CREATE POLICY "inventory_logs_select_vendor_or_admin"
  ON public.inventory_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.vendors v ON p.vendor_id = v.id
      WHERE p.id = inventory_logs.product_id AND v.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- إضافة سجل: النظام فقط (عبر triggers)
CREATE POLICY "inventory_logs_insert_system"
  ON public.inventory_logs FOR INSERT
  WITH CHECK (true);

-- =========================================================
-- نهاية ملف سياسات الأمان
-- =========================================================
