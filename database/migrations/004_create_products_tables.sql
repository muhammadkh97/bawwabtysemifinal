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
