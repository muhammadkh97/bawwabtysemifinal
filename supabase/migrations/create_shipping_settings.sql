-- إنشاء جدول إعدادات الشحن
CREATE TABLE IF NOT EXISTS shipping_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_fee DECIMAL(10, 2) NOT NULL DEFAULT 20.00,
  free_shipping_threshold DECIMAL(10, 2) NOT NULL DEFAULT 200.00,
  is_free BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة سجل افتراضي
INSERT INTO shipping_settings (base_fee, free_shipping_threshold, is_free)
VALUES (20.00, 200.00, false)
ON CONFLICT (id) DO NOTHING;

-- إنشاء index
CREATE INDEX IF NOT EXISTS idx_shipping_settings_updated_at ON shipping_settings(updated_at);

-- تفعيل RLS
ALTER TABLE shipping_settings ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة - الجميع يمكنهم قراءة إعدادات الشحن
CREATE POLICY "Anyone can read shipping settings"
  ON shipping_settings
  FOR SELECT
  USING (true);

-- سياسة التحديث - فقط المدراء يمكنهم تحديث الإعدادات
CREATE POLICY "Only admins can update shipping settings"
  ON shipping_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- سياسة الإدراج - فقط المدراء
CREATE POLICY "Only admins can insert shipping settings"
  ON shipping_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

COMMENT ON TABLE shipping_settings IS 'إعدادات الشحن والتوصيل';
COMMENT ON COLUMN shipping_settings.base_fee IS 'رسوم الشحن الأساسية بالشيكل';
COMMENT ON COLUMN shipping_settings.free_shipping_threshold IS 'حد الطلب للشحن المجاني بالشيكل';
COMMENT ON COLUMN shipping_settings.is_free IS 'هل الشحن مجاني للجميع؟';
