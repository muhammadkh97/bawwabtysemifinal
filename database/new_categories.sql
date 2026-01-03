-- إعادة بناء نظام التصنيفات بشكل احترافي
DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_ar TEXT,
  icon TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. الإلكترونيات
INSERT INTO categories (id, name, name_ar, slug, icon, level, display_order) VALUES
('df59a0d5-9f80-4dc6-a7b5-81d81557bea3', 'Electronics', 'إلكترونيات', 'electronics', 'Smartphone', 0, 1);

INSERT INTO categories (name, name_ar, slug, icon, parent_id, level, display_order) VALUES
('Smartphones', 'هواتف ذكية', 'smartphones', 'Smartphone', 'df59a0d5-9f80-4dc6-a7b5-81d81557bea3', 1, 1),
('Laptops', 'أجهزة لابتوب', 'laptops', 'Laptop', 'df59a0d5-9f80-4dc6-a7b5-81d81557bea3', 1, 2),
('Accessories', 'إكسسوارات', 'electronics-accessories', 'Headphones', 'df59a0d5-9f80-4dc6-a7b5-81d81557bea3', 1, 3),
('Cameras', 'كاميرات', 'cameras', 'Camera', 'df59a0d5-9f80-4dc6-a7b5-81d81557bea3', 1, 4);

-- 2. الأزياء
INSERT INTO categories (id, name, name_ar, slug, icon, level, display_order) VALUES
('fd20913c-6126-4394-9aaa-27bfef6ea3c9', 'Fashion', 'أزياء', 'fashion', 'Shirt', 0, 2);

INSERT INTO categories (name, name_ar, slug, icon, parent_id, level, display_order) VALUES
('Men Clothing', 'ملابس رجالية', 'men-clothing', 'User', 'fd20913c-6126-4394-9aaa-27bfef6ea3c9', 1, 1),
('Women Clothing', 'ملابس نسائية', 'women-clothing', 'User', 'fd20913c-6126-4394-9aaa-27bfef6ea3c9', 1, 2),
('Kids', 'أطفال', 'kids-fashion', 'Baby', 'fd20913c-6126-4394-9aaa-27bfef6ea3c9', 1, 3),
('Shoes', 'أحذية', 'shoes', 'Footprints', 'fd20913c-6126-4394-9aaa-27bfef6ea3c9', 1, 4),
('Watches & Jewelry', 'ساعات ومجوهرات', 'watches-jewelry', 'Watch', 'fd20913c-6126-4394-9aaa-27bfef6ea3c9', 1, 5);

-- 3. المنزل والمطبخ
INSERT INTO categories (id, name, name_ar, slug, icon, level, display_order) VALUES
('5d49f809-3f74-42ad-a6bb-b2e521cc266f', 'Home & Kitchen', 'المنزل والمطبخ', 'home-kitchen', 'Home', 0, 3);

INSERT INTO categories (name, name_ar, slug, icon, parent_id, level, display_order) VALUES
('Furniture', 'أثاث', 'furniture', 'Armchair', '5d49f809-3f74-42ad-a6bb-b2e521cc266f', 1, 1),
('Kitchenware', 'أدوات المطبخ', 'kitchenware', 'Utensils', '5d49f809-3f74-42ad-a6bb-b2e521cc266f', 1, 2),
('Home Decor', 'ديكور المنزل', 'home-decor', 'Palette', '5d49f809-3f74-42ad-a6bb-b2e521cc266f', 1, 3),
('Appliances', 'أجهزة منزلية', 'home-appliances', 'Tv', '5d49f809-3f74-42ad-a6bb-b2e521cc266f', 1, 4);

-- 4. السوبر ماركت والأغذية
INSERT INTO categories (id, name, name_ar, slug, icon, level, display_order) VALUES
('73b63bce-421d-4cc6-83db-2870c58d1d59', 'Supermarket', 'سوبر ماركت', 'supermarket', 'ShoppingBasket', 0, 4);

INSERT INTO categories (name, name_ar, slug, icon, parent_id, level, display_order) VALUES
('Fresh Food', 'أغذية طازجة', 'fresh-food', 'Apple', '73b63bce-421d-4cc6-83db-2870c58d1d59', 1, 1),
('Beverages', 'مشروبات', 'beverages', 'Coffee', '73b63bce-421d-4cc6-83db-2870c58d1d59', 1, 2),
('Canned Food', 'معلبات', 'canned-food', 'Container', '73b63bce-421d-4cc6-83db-2870c58d1d59', 1, 3),
('Bakery', 'مخبوزات', 'bakery', 'Croissant', '73b63bce-421d-4cc6-83db-2870c58d1d59', 1, 4);

-- 5. الصحة والجمال
INSERT INTO categories (id, name, name_ar, slug, icon, level, display_order) VALUES
('61210f21-7b76-4b95-989a-ff249d308046', 'Health & Beauty', 'صحة وجمال', 'health-beauty', 'Sparkles', 0, 5);

INSERT INTO categories (name, name_ar, slug, icon, parent_id, level, display_order) VALUES
('Makeup', 'مكياج', 'makeup', 'Smile', '61210f21-7b76-4b95-989a-ff249d308046', 1, 1),
('Skin Care', 'عناية بالبشرة', 'skin-care', 'Heart', '61210f21-7b76-4b95-989a-ff249d308046', 1, 2),
('Perfumes', 'عطور', 'perfumes', 'Wind', '61210f21-7b76-4b95-989a-ff249d308046', 1, 3),
('Personal Care', 'عناية شخصية', 'personal-care', 'UserCheck', '61210f21-7b76-4b95-989a-ff249d308046', 1, 4);

-- 6. المطاعم
INSERT INTO categories (id, name, name_ar, slug, icon, level, display_order) VALUES
('3a1516f0-3d4a-4bb8-8f03-def79eecd818', 'Restaurants', 'مطاعم', 'restaurants', 'UtensilsCrossed', 0, 6);

INSERT INTO categories (name, name_ar, slug, icon, parent_id, level, display_order) VALUES
('Fast Food', 'وجبات سريعة', 'fast-food', 'Pizza', '3a1516f0-3d4a-4bb8-8f03-def79eecd818', 1, 1),
('Arabic Food', 'أكل عربي', 'arabic-food', 'Soup', '3a1516f0-3d4a-4bb8-8f03-def79eecd818', 1, 2),
('Sweets & Desserts', 'حلويات', 'sweets-desserts', 'IceCream', '3a1516f0-3d4a-4bb8-8f03-def79eecd818', 1, 3),
('Healthy Food', 'أكل صحي', 'healthy-food', 'Salad', '3a1516f0-3d4a-4bb8-8f03-def79eecd818', 1, 4);

-- 7. عام
INSERT INTO categories (id, name, name_ar, slug, icon, level, display_order) VALUES
('32970b81-ffa0-4acd-aa2e-303885916c13', 'General', 'عام', 'general', 'Box', 0, 99);

-- تحديث المنتجات
UPDATE products SET category_id = '32970b81-ffa0-4acd-aa2e-303885916c13' WHERE category_id IS NULL;
