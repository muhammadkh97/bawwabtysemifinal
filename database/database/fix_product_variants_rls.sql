-- =========================================================
-- إصلاح سياسات RLS لجدول product_variants
-- Fix product_variants RLS Policies
-- =========================================================
-- تاريخ: 2026-01-02
-- الهدف: إضافة سياسات RLS مفقودة لجدول product_variants
-- =========================================================

-- حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Anyone can view product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Vendors can insert their product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Vendors can update their product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Vendors can delete their product variants" ON public.product_variants;

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

-- تأكيد تفعيل RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.product_variants IS 'جدول متغيرات المنتجات - RLS مفعل مع سياسات كاملة';
