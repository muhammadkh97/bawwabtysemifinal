-- =========================================================
-- 10-storage-setup.sql
-- إعداد التخزين والـ Storage Buckets
-- =========================================================

-- =====================================================
-- 1. إنشاء Storage Buckets
-- =====================================================

-- يتم هذا عبر Supabase Console أو API
-- لكن بنوثقه هنا للمرجعية

/*
STORAGE BUCKETS:
================

1. products/ (عام - صور المنتجات)
   - Max Size: 50 MB
   - Public: YES
   - Allowed Types: image/jpeg, image/png, image/webp

2. restaurants/ (عام - شعار وبانر المطاعم)
   - Max Size: 100 MB
   - Public: YES
   - Allowed Types: image/jpeg, image/png

3. menu-items/ (عام - صور الوجبات)
   - Max Size: 50 MB
   - Public: YES
   - Allowed Types: image/jpeg, image/png, image/webp

4. user-profiles/ (شبه عام - صور البروفايل)
   - Max Size: 20 MB
   - Public: YES
   - Allowed Types: image/jpeg, image/png

5. documents/ (خاص - وثائق التحقق)
   - Max Size: 100 MB
   - Public: NO
   - Allowed Types: application/pdf, image/jpeg, image/png

6. receipts/ (خاص - فواتير الطلبات)
   - Max Size: 50 MB
   - Public: NO (للمالك فقط)
   - Allowed Types: application/pdf, image/jpeg

7. chat-attachments/ (خاص - ملفات الدردشة)
   - Max Size: 20 MB
   - Public: NO
   - Allowed Types: image/jpeg, image/png, application/pdf

*/

-- =====================================================
-- 2. سياسات الأمان للـ Storage
-- =====================================================

-- Products Bucket - Public Read, Authenticated Write
/*
CREATE POLICY "Public Read" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');
*/

-- Documents Bucket - Private, Owner Only
/*
CREATE POLICY "Owner Read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND 
    auth.uid() = owner_id
  );

CREATE POLICY "Owner Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.uid() = auth.uid()
  );
*/

-- =====================================================
-- 3. جدول تتبع الملفات
-- =====================================================

CREATE TABLE public.file_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bucket_name VARCHAR(100) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  file_type VARCHAR(100),
  description TEXT,
  
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_file_storage_user_id ON public.file_storage(user_id);
CREATE INDEX idx_file_storage_bucket ON public.file_storage(bucket_name);

-- =====================================================
-- 4. دالة لتنظيف الملفات المحذوفة
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS void AS $$
BEGIN
  -- حذف سجلات الملفات للمستخدمين المحذوفين
  DELETE FROM public.file_storage
  WHERE user_id NOT IN (SELECT id FROM public.users);
END;
$$ LANGUAGE plpgsql;

SELECT 'تم إعداد نظام التخزين بنجاح ✓' AS status;
