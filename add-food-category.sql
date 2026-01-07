-- ============================================================================
-- إنشاء تصنيف "طعام ومشروبات" للمطاعم
-- ============================================================================

-- إنشاء التصنيف مع الـ ID المستخدم في الكود
INSERT INTO categories (
  id,
  name,
  name_ar,
  slug,
  parent_id,
  is_active
) VALUES (
  'f4573c7e-b55a-4dd5-8e4b-22e51dcec6a0',
  'Food & Beverages',
  'طعام ومشروبات',
  'food-beverages',
  NULL,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  is_active = true;

-- التحقق من النتيجة
SELECT 
  id,
  name,
  name_ar,
  slug,
  is_active
FROM categories
WHERE id = 'f4573c7e-b55a-4dd5-8e4b-22e51dcec6a0';
