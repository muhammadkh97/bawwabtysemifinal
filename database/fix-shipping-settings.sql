-- ============================================
-- إصلاح جدول shipping_settings - إضافة base_fee
-- ============================================

-- خيار 1: إضافة عمود base_fee كنسخة من base_rate
ALTER TABLE shipping_settings 
ADD COLUMN IF NOT EXISTS base_fee NUMERIC;

-- تحديث base_fee لتكون نفس قيمة base_rate
UPDATE shipping_settings 
SET base_fee = base_rate 
WHERE base_fee IS NULL;

-- خيار 2: إنشاء view يستخدم base_fee كـ alias
CREATE OR REPLACE VIEW shipping_settings_view AS
SELECT 
  id,
  base_rate AS base_fee,
  base_rate,
  per_km_rate,
  free_shipping_threshold,
  max_distance_km,
  is_active,
  created_at,
  updated_at
FROM shipping_settings;

-- التحقق
SELECT 
  '✅ تم إصلاح shipping_settings' AS الحالة,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'shipping_settings' 
      AND column_name = 'base_fee'
    ) THEN 'base_fee موجود الآن ✅'
    ELSE 'base_fee غير موجود ❌'
  END AS الحقل;
