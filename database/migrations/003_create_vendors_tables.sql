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
