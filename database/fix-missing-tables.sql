-- ============================================
-- إصلاح شامل لقاعدة البيانات - الجزء 1: الجداول المفقودة
-- ============================================

-- 1. إنشاء جدول wallets
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  currency VARCHAR(3) DEFAULT 'JOD' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- إنشاء index على user_id
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- 2. إنشاء جدول restaurants
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone VARCHAR(20),
  email VARCHAR(255),
  logo_url TEXT,
  banner_url TEXT,
  is_active BOOLEAN DEFAULT false,
  approval_status VARCHAR(50) DEFAULT 'pending',
  rating DECIMAL(3, 2) DEFAULT 0.00,
  delivery_time VARCHAR(50),
  min_order DECIMAL(10, 2) DEFAULT 0.00,
  delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
  cuisine_type VARCHAR(100),
  opening_hours JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- إنشاء indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurants_approval_status ON restaurants(approval_status);

-- 3. إنشاء جدول approvals (للموافقات العامة)
CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL, -- 'store', 'product', 'restaurant', 'category'
  entity_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes
CREATE INDEX IF NOT EXISTS idx_approvals_entity_type ON approvals(entity_type);
CREATE INDEX IF NOT EXISTS idx_approvals_entity_id ON approvals(entity_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);

-- 4. إضافة حقول مفقودة
-- إضافة approval_status لجدول products إن لم يكن موجوداً
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved';

-- إضافة is_active لجدول pages إن لم يكن موجوداً
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 5. إصلاح جدول hero_sections - إضافة عمود page إن لم يكن موجوداً
ALTER TABLE hero_sections 
ADD COLUMN IF NOT EXISTS page VARCHAR(100);

-- إضافة display_order إن لم يكن موجوداً
ALTER TABLE hero_sections 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- رسالة نجاح
SELECT '✅ تم إنشاء الجداول والحقول المفقودة' AS الحالة,
       'wallets, restaurants, approvals' AS الجداول_المُنشأة;
