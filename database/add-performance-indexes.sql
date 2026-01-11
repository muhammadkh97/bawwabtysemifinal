-- ============================================
-- إضافة Database Indexes للأداء - يناير 2026
-- ============================================
-- الهدف: تحسين أداء الاستعلامات الأكثر استخداماً
-- ============================================

BEGIN;

-- ============================================
-- 1️⃣ Products Table Indexes
-- ============================================

-- Index على vendor_id (للبحث عن منتجات بائع معين)
CREATE INDEX IF NOT EXISTS idx_products_vendor_id 
ON products(vendor_id) 
WHERE is_active = true;

-- Index على category_id (للبحث عن منتجات حسب التصنيف)
CREATE INDEX IF NOT EXISTS idx_products_category_id 
ON products(category_id) 
WHERE is_active = true;

-- Index على is_active و status (للمنتجات النشطة المعتمدة)
CREATE INDEX IF NOT EXISTS idx_products_active_status 
ON products(is_active, status) 
WHERE is_active = true AND status = 'approved';

-- Composite index للفلترة المتقدمة
CREATE INDEX IF NOT EXISTS idx_products_category_active_status 
ON products(category_id, is_active, status, rating DESC) 
WHERE is_active = true AND status = 'approved';

-- Index على price للفرز حسب السعر
CREATE INDEX IF NOT EXISTS idx_products_price 
ON products(price) 
WHERE is_active = true AND status = 'approved';

-- Index على stock للمنتجات المتوفرة
CREATE INDEX IF NOT EXISTS idx_products_stock 
ON products(stock) 
WHERE is_active = true AND stock > 0;

-- Index على created_at للمنتجات الجديدة
CREATE INDEX IF NOT EXISTS idx_products_created_at 
ON products(created_at DESC) 
WHERE is_active = true AND status = 'approved';

-- Index على rating للمنتجات الأعلى تقييماً
CREATE INDEX IF NOT EXISTS idx_products_rating 
ON products(rating DESC NULLS LAST) 
WHERE is_active = true AND status = 'approved';

-- Full-text search index على name و description
CREATE INDEX IF NOT EXISTS idx_products_search 
ON products USING gin(to_tsvector('arabic', name || ' ' || COALESCE(description, '')));

-- ============================================
-- 2️⃣ Orders Table Indexes
-- ============================================

-- Index على customer_id (للبحث عن طلبات مستخدم معين)
CREATE INDEX IF NOT EXISTS idx_orders_customer_id 
ON orders(customer_id);

-- Index على status (للبحث عن الطلبات حسب الحالة)
CREATE INDEX IF NOT EXISTS idx_orders_status 
ON orders(status);

-- Composite index للبحث عن طلبات مستخدم حسب الحالة
CREATE INDEX IF NOT EXISTS idx_orders_customer_status 
ON orders(customer_id, status, created_at DESC);

-- Index على created_at للترتيب الزمني
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON orders(created_at DESC);

-- Index على payment_status
CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
ON orders(payment_status);

-- ============================================
-- 3️⃣ Stores Table Indexes
-- ============================================

-- Index على user_id (للبحث عن متجر مستخدم معين)
CREATE INDEX IF NOT EXISTS idx_stores_user_id 
ON stores(user_id) 
WHERE is_active = true;

-- Index على is_active و approval_status
CREATE INDEX IF NOT EXISTS idx_stores_active_approval 
ON stores(is_active, approval_status) 
WHERE is_active = true AND approval_status = 'approved';

-- Index على business_type
CREATE INDEX IF NOT EXISTS idx_stores_business_type 
ON stores(business_type) 
WHERE is_active = true;

-- Index على rating للمتاجر الأعلى تقييماً
CREATE INDEX IF NOT EXISTS idx_stores_rating 
ON stores(rating DESC NULLS LAST) 
WHERE is_active = true AND approval_status = 'approved';

-- ============================================
-- 4️⃣ Reviews Table Indexes
-- ============================================

-- Index على product_id (للبحث عن تقييمات منتج معين)
CREATE INDEX IF NOT EXISTS idx_reviews_product_id 
ON reviews(product_id, created_at DESC);

-- Index على user_id (للبحث عن تقييمات مستخدم معين)
CREATE INDEX IF NOT EXISTS idx_reviews_user_id 
ON reviews(user_id);

-- Index على vendor_id (للبحث عن تقييمات متجر معين)
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id 
ON reviews(vendor_id, created_at DESC);

-- Index على rating
CREATE INDEX IF NOT EXISTS idx_reviews_rating 
ON reviews(rating);

-- ============================================
-- 5️⃣ Notifications Table Indexes
-- ============================================

-- Index على user_id (للبحث عن إشعارات مستخدم معين)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id, created_at DESC);

-- Index على is_read (للإشعارات غير المقروءة)
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications(user_id, is_read, created_at DESC) 
WHERE is_read = false;

-- Index على type
CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications(type);

-- ============================================
-- 6️⃣ Cart Items Table Indexes
-- ============================================

-- Index على user_id
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id 
ON cart_items(user_id);

-- Index على product_id
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id 
ON cart_items(product_id);

-- Composite index
CREATE INDEX IF NOT EXISTS idx_cart_items_user_product 
ON cart_items(user_id, product_id);

-- ============================================
-- 7️⃣ Wishlists Table Indexes
-- ============================================

-- Index على user_id
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id 
ON wishlists(user_id);

-- Index على product_id
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id 
ON wishlists(product_id);

-- Composite index
CREATE INDEX IF NOT EXISTS idx_wishlists_user_product 
ON wishlists(user_id, product_id);

-- ============================================
-- 8️⃣ Chats Table Indexes
-- ============================================

-- Index على customer_id
CREATE INDEX IF NOT EXISTS idx_chats_customer_id 
ON chats(customer_id, updated_at DESC);

-- Index على vendor_id
CREATE INDEX IF NOT EXISTS idx_chats_vendor_id 
ON chats(vendor_id, updated_at DESC);

-- ============================================
-- 9️⃣ Messages Table Indexes
-- ============================================

-- Index على chat_id
CREATE INDEX IF NOT EXISTS idx_messages_chat_id 
ON messages(chat_id, created_at DESC);

-- Index على sender_id
CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
ON messages(sender_id);

-- Index على is_read
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages(chat_id, is_read, created_at DESC) 
WHERE is_read = false;

-- ============================================
-- 🔟 Categories Table Indexes
-- ============================================

-- Index على is_active
CREATE INDEX IF NOT EXISTS idx_categories_active 
ON categories(is_active, display_order) 
WHERE is_active = true;

-- Index على parent_id
CREATE INDEX IF NOT EXISTS idx_categories_parent 
ON categories(parent_id) 
WHERE parent_id IS NOT NULL;

COMMIT;

-- ============================================
-- تحليل الجداول لتحديث إحصائيات المُحسّن
-- ============================================

ANALYZE products;
ANALYZE orders;
ANALYZE stores;
ANALYZE reviews;
ANALYZE notifications;
ANALYZE cart_items;
ANALYZE wishlists;
ANALYZE chats;
ANALYZE messages;
ANALYZE categories;

-- ============================================
-- النتيجة
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ تم إضافة جميع الـ Indexes بنجاح!';
  RAISE NOTICE '📊 تم تحليل الجداول لتحديث الإحصائيات';
  RAISE NOTICE '⚡ يجب أن يكون الأداء أفضل بكثير الآن';
END $$;
