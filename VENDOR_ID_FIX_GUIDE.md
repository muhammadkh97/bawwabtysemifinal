# دليل إصلاح مشكلة vendor_id

## المشكلة
عند محاولة إضافة منتج جديد، يظهر خطأ:
```
operator does not exist: uuid = text
```

## السبب
- جدول `vendors` يستخدم عمود `owner_id`
- الكود يستخدم `.eq('user_id', userId)`
- سياسات RLS تحاول مقارنة UUID مع TEXT بدون تحويل صريح

## الحل

### الخطوة 1: تنفيذ SQL في Supabase Dashboard

1. افتح [Supabase Dashboard](https://supabase.com/dashboard)
2. اذهب إلى مشروعك
3. اذهب إلى **SQL Editor**
4. انسخ والصق الكود التالي:

```sql
-- إضافة عمود user_id إلى جدول vendors
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS user_id UUID;

-- نسخ البيانات من owner_id إلى user_id
UPDATE public.vendors SET user_id = owner_id WHERE user_id IS NULL;

-- جعل الحقل NOT NULL
ALTER TABLE public.vendors ALTER COLUMN user_id SET NOT NULL;

-- إضافة UNIQUE constraint
ALTER TABLE public.vendors DROP CONSTRAINT IF EXISTS vendors_user_id_unique;
ALTER TABLE public.vendors ADD CONSTRAINT vendors_user_id_unique UNIQUE (user_id);

-- إضافة foreign key constraint
ALTER TABLE public.vendors DROP CONSTRAINT IF EXISTS vendors_user_id_fkey;
ALTER TABLE public.vendors 
  ADD CONSTRAINT vendors_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- إنشاء index
DROP INDEX IF EXISTS idx_vendors_user_id;
CREATE INDEX idx_vendors_user_id ON public.vendors(user_id);

-- حذف السياسات القديمة
DROP POLICY IF EXISTS products_insert_vendor ON products;
DROP POLICY IF EXISTS products_update_vendor ON products;
DROP POLICY IF EXISTS products_delete_vendor ON products;
DROP POLICY IF EXISTS products_select_all ON products;
DROP POLICY IF EXISTS products_admin_all ON products;
DROP POLICY IF EXISTS products_restaurants_manage ON products;

-- سياسة SELECT: الجميع يمكنهم رؤية المنتجات
CREATE POLICY products_select_all ON products
FOR SELECT TO public
USING (true);

-- سياسة INSERT: البائع يمكنه إضافة منتجات فقط لمتجره
CREATE POLICY products_insert_vendor ON products
FOR INSERT TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_id
    AND v.user_id = auth.uid()
  )
);

-- سياسة UPDATE: البائع يمكنه تحديث منتجاته فقط
CREATE POLICY products_update_vendor ON products
FOR UPDATE TO public
USING (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_id
    AND v.user_id = auth.uid()
  )
);

-- سياسة DELETE: البائع يمكنه حذف منتجاته فقط
CREATE POLICY products_delete_vendor ON products
FOR DELETE TO public
USING (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_id
    AND v.user_id = auth.uid()
  )
);

-- سياسة للمدير: المدير له صلاحيات كاملة
CREATE POLICY products_admin_all ON products
FOR ALL TO public
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);
```

5. اضغط على **Run** أو **F5**

### الخطوة 2: اختبار الحل

1. ارجع إلى صفحة إضافة منتج جديد
2. املأ البيانات المطلوبة
3. اضغط على زر "حفظ"
4. يجب أن يتم حفظ المنتج بنجاح الآن

## ملاحظات
- تم إضافة عمود `user_id` كنسخة من `owner_id` لتوافق الكود
- يمكنك الاحتفاظ بالعمودين معاً للتوافق مع الكود القديم
- سياسات RLS تم تحديثها لاستخدام المقارنة الصحيحة بدون تحويل نوع البيانات
