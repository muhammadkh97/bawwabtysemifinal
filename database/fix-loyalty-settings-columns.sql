-- ====================================
-- إضافة الأعمدة المفقودة لجدول loyalty_settings
-- ====================================

-- إضافة signup_bonus (مكافأة التسجيل)
ALTER TABLE loyalty_settings 
ADD COLUMN IF NOT EXISTS signup_bonus INTEGER NOT NULL DEFAULT 50;

-- إضافة points_per_sar (نقاط لكل ريال)
ALTER TABLE loyalty_settings 
ADD COLUMN IF NOT EXISTS points_per_sar NUMERIC NOT NULL DEFAULT 1.0;

-- إضافة points_to_sar_rate (معدل تحويل النقاط للريال)
ALTER TABLE loyalty_settings 
ADD COLUMN IF NOT EXISTS points_to_sar_rate NUMERIC NOT NULL DEFAULT 0.1;

-- إضافة min_points_redeem (الحد الأدنى لاستبدال النقاط)
ALTER TABLE loyalty_settings 
ADD COLUMN IF NOT EXISTS min_points_redeem INTEGER NOT NULL DEFAULT 100;

-- تحديث البيانات الموجودة
UPDATE loyalty_settings 
SET 
  signup_bonus = 50,
  points_per_sar = points_per_currency,
  points_to_sar_rate = 0.1,
  min_points_redeem = min_redemption_points
WHERE signup_bonus IS NULL OR points_per_sar IS NULL;

-- التحقق من النتيجة
SELECT * FROM loyalty_settings;
