-- جدول لإدارة شرائح Hero الديناميكية
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  image_url TEXT NOT NULL,
  button_text TEXT NOT NULL,
  button_text_ar TEXT NOT NULL,
  button_link TEXT NOT NULL,
  background_gradient TEXT NOT NULL DEFAULT 'linear-gradient(90deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس للأداء
CREATE INDEX IF NOT EXISTS idx_hero_slides_active_order ON hero_slides(is_active, display_order);

-- إضافة شرائح افتراضية
INSERT INTO hero_slides (title, title_ar, description, description_ar, image_url, button_text, button_text_ar, button_link, background_gradient, display_order) VALUES
('Welcome to Bawwabty', 'مرحباً بك في بوابتي 🛍️', 'Shop thousands of high-quality products at the best prices with fast and secure shipping', 'تسوق من آلاف المنتجات عالية الجودة بأفضل الأسعار مع شحن سريع وآمن', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200', 'Shop Now', 'تسوق الآن', '/products', 'linear-gradient(90deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)', 1),
('Exclusive Deals', 'عروض حصرية 🔥', 'Discounts up to 70% on selected products', 'خصومات تصل إلى 70% على منتجات مختارة', 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200', 'View Deals', 'اكتشف العروض', '/deals', 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 50%, #6BCB77 100%)', 2),
('Premium Quality', 'جودة فاخرة ✨', 'Authentic and certified products guaranteed', 'منتجات أصلية ومعتمدة 100%', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200', 'Discover', 'اكتشف المزيد', '/categories', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 3);

-- سياسات الصلاحية (RLS)
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بالقراءة
CREATE POLICY "Allow public read access" ON hero_slides FOR SELECT USING (is_active = true);

-- السماح للأدمن فقط بالإدارة
CREATE POLICY "Allow admin full access" ON hero_slides FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

COMMENT ON TABLE hero_slides IS 'جدول لإدارة شرائح Hero الديناميكية في الصفحة الرئيسية';
