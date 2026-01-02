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
