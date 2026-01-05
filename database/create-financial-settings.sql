-- إنشاء جدول الإعدادات المالية

CREATE TABLE IF NOT EXISTS financial_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- نسب العمولات والضرائب
  default_commission_rate NUMERIC(5,2) DEFAULT 10.00, -- نسبة العمولة الافتراضية %
  tax_rate NUMERIC(5,2) DEFAULT 16.00, -- نسبة الضريبة %
  vat_rate NUMERIC(5,2) DEFAULT 16.00, -- ضريبة القيمة المضافة %
  
  -- حدود السحب
  min_payout_amount NUMERIC(10,2) DEFAULT 100.00, -- الحد الأدنى للسحب
  max_payout_amount NUMERIC(10,2) DEFAULT 10000.00, -- الحد الأقصى للسحب
  
  -- رسوم التوصيل (نسخة من shipping_settings)
  base_delivery_fee NUMERIC(10,2) DEFAULT 20.00,
  per_km_delivery_fee NUMERIC(10,2) DEFAULT 2.00,
  
  -- رسوم المنصة
  platform_fee NUMERIC(10,2) DEFAULT 0.00, -- رسوم ثابتة للمنصة
  platform_fee_percentage NUMERIC(5,2) DEFAULT 0.00, -- رسوم نسبية للمنصة %
  
  -- إعدادات المدفوعات
  auto_approve_payouts BOOLEAN DEFAULT FALSE,
  payout_processing_days INTEGER DEFAULT 3, -- أيام معالجة السحب
  
  -- العملة
  currency TEXT DEFAULT 'ILS',
  currency_symbol TEXT DEFAULT '₪',
  
  -- حالة التفعيل
  is_active BOOLEAN DEFAULT TRUE,
  
  -- التواريخ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- إدراج القيم الافتراضية
INSERT INTO financial_settings (
  default_commission_rate,
  tax_rate,
  vat_rate,
  min_payout_amount,
  max_payout_amount,
  base_delivery_fee,
  per_km_delivery_fee,
  currency,
  currency_symbol,
  is_active
) VALUES (
  10.00,
  16.00,
  16.00,
  100.00,
  10000.00,
  20.00,
  2.00,
  'ILS',
  '₪',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- إنشاء index
CREATE INDEX IF NOT EXISTS idx_financial_settings_active ON financial_settings(is_active);

-- التحقق
SELECT 
  default_commission_rate,
  tax_rate,
  min_payout_amount,
  base_delivery_fee,
  currency,
  is_active
FROM financial_settings
WHERE is_active = TRUE
LIMIT 1;
