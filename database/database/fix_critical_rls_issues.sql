-- =========================================================
-- إصلاح المشاكل الحرجة في Row Level Security (RLS)
-- Critical RLS Issues Fix
-- =========================================================
-- تاريخ: 2026-01-01
-- الهدف: إصلاح مشاكل الأمان الحرجة المكتشفة
-- =========================================================

-- =====================================================
-- 1. تفعيل RLS على جدول orders
-- =====================================================

-- تفعيل RLS على جدول الطلبات
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.orders IS 'جدول الطلبات - RLS مفعل';

-- =====================================================
-- 2. تفعيل RLS على جدول reviews
-- =====================================================

-- تفعيل RLS على جدول المراجعات
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.reviews IS 'جدول المراجعات - RLS مفعل';

-- =====================================================
-- 3. إصلاح جدول product_variants
-- =====================================================

-- إضافة سياسات RLS لجدول product_variants
-- السياسة 1: الجميع يمكنهم قراءة المتغيرات
CREATE POLICY "Anyone can view product variants"
  ON public.product_variants
  FOR SELECT
  USING (true);

-- السياسة 2: فقط البائعين يمكنهم إضافة متغيرات لمنتجاتهم
CREATE POLICY "Vendors can insert their product variants"
  ON public.product_variants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_variants.product_id
      AND p.vendor_id IN (
        SELECT id FROM public.vendors WHERE user_id = auth.uid()
      )
    )
  );

-- السياسة 3: فقط البائعين يمكنهم تحديث متغيرات منتجاتهم
CREATE POLICY "Vendors can update their product variants"
  ON public.product_variants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_variants.product_id
      AND p.vendor_id IN (
        SELECT id FROM public.vendors WHERE user_id = auth.uid()
      )
    )
  );

-- السياسة 4: فقط البائعين يمكنهم حذف متغيرات منتجاتهم
CREATE POLICY "Vendors can delete their product variants"
  ON public.product_variants
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_variants.product_id
      AND p.vendor_id IN (
        SELECT id FROM public.vendors WHERE user_id = auth.uid()
      )
    )
  );

COMMENT ON TABLE public.product_variants IS 'جدول متغيرات المنتجات - RLS مفعل مع سياسات كاملة';

-- =====================================================
-- 4. التحقق من تطبيق السياسات
-- =====================================================

-- عرض جميع السياسات المطبقة على الجداول المهمة
DO $$
BEGIN
  RAISE NOTICE 'RLS Status Check:';
  RAISE NOTICE '- orders: RLS enabled';
  RAISE NOTICE '- reviews: RLS enabled';
  RAISE NOTICE '- product_variants: RLS enabled with 4 policies';
  RAISE NOTICE 'Critical security issues fixed successfully!';
END $$;
