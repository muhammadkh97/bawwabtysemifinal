# 🔧 إصلاح خطأ VIEW في نظام الموافقات

## ❌ الخطأ الذي رأيته:
```
ERROR: 42809: "admin_pending_categories" is not a table
```

## ✅ المشكلة وحلها:

### المشكلة:
الكود حاول إنشاء سياسة RLS على VIEW، وهذا غير ممكن في Supabase. السياسات RLS تُطبق على الجداول فقط وليس على الـ views.

### الحل:
تم حذف الـ VIEW والسياسة لأنها غير ضرورية. البيانات المعلقة يمكن جلبها مباشرة من الصفحة.

---

## 🚀 الكود الصحيح والجاهز:

انسخ هذا الكود واستخدمه بدلاً من الكود السابق:

```sql
-- ✅ إضافة نظام الموافقات للتصنيفات
-- التاريخ: 3 يناير 2026

-- 1️⃣ إضافة الحقول الجديدة
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- 2️⃣ إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_categories_approval_status ON categories(approval_status);
CREATE INDEX IF NOT EXISTS idx_categories_created_by ON categories(created_by);
CREATE INDEX IF NOT EXISTS idx_categories_approved_by ON categories(approved_by);

-- 3️⃣ تحديث التصنيفات الموجودة
UPDATE categories 
SET approval_status = 'approved',
    requires_approval = false
WHERE approval_status IS NULL;

-- 4️⃣ Trigger لتتبع المنشئ
CREATE OR REPLACE FUNCTION set_category_creator()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  
  IF NEW.requires_approval = true AND NEW.approval_status = 'approved' THEN
    NEW.approval_status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS categories_set_creator ON categories;
CREATE TRIGGER categories_set_creator
  BEFORE INSERT ON categories
  FOR EACH ROW
  EXECUTE FUNCTION set_category_creator();

-- 5️⃣ Trigger لتتبع الموافقة
CREATE OR REPLACE FUNCTION track_category_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.approval_status != OLD.approval_status AND NEW.approval_status IN ('approved', 'rejected') THEN
    NEW.approved_by = auth.uid();
    NEW.approved_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS categories_track_approval ON categories;
CREATE TRIGGER categories_track_approval
  BEFORE UPDATE ON categories
  FOR EACH ROW
  WHEN (OLD.approval_status IS DISTINCT FROM NEW.approval_status)
  EXECUTE FUNCTION track_category_approval();

-- 6️⃣ تحديث سياسات RLS
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_admin_all" ON categories;
DROP POLICY IF EXISTS "categories_vendor_read" ON categories;
DROP POLICY IF EXISTS "categories_vendor_create" ON categories;
DROP POLICY IF EXISTS "categories_vendor_own_pending" ON categories;

-- قراءة عامة للمعتمد والنشط فقط
CREATE POLICY "categories_public_read"
ON categories FOR SELECT
TO authenticated, anon
USING (is_active = true AND approval_status = 'approved');

-- المدراء: كل الصلاحيات
CREATE POLICY "categories_admin_all"
ON categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- البائعين: قراءة المعتمد
CREATE POLICY "categories_vendor_read"
ON categories FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('vendor', 'restaurant')
  )
  AND approval_status = 'approved'
);

-- البائعين: إنشاء معلق
CREATE POLICY "categories_vendor_create"
ON categories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('vendor', 'restaurant')
  )
  AND requires_approval = true
  AND approval_status = 'pending'
);

-- البائعين: قراءة تصنيفاتهم المعلقة
CREATE POLICY "categories_vendor_own_pending"
ON categories FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('vendor', 'restaurant')
  )
);

-- ✅ تم بنجاح!
```

---

## 📝 خطوات التطبيق:

### 1. افتح Supabase Dashboard
- URL: https://app.supabase.com
- المشروع: `itptinhxsylzvfcpxwpl`

### 2. SQL Editor
- اضغط "+ New Query"

### 3. انسخ الكود أعلاه
```
ملاحظة: حذفنا جزء VIEW الذي كان يسبب الخطأ
```

### 4. اضغط Run
- يجب أن ترى: ✅ **Success**

### 5. اختبر في الموقع
- افتح: `http://localhost:3000/admin/categories`
- يجب أن تعمل الآن بدون أخطاء!

---

## 📂 الملفات المحدثة:

1. ✅ `supabase/migrations/add_categories_approval_system.sql` - مصحح
2. ✅ `APPROVAL_SYSTEM_FIXED.sql` - نسخة نظيفة جاهزة
3. ✅ `app/admin/categories/page.tsx` - الصفحة الأساسية

---

## ✨ التحسينات:

✅ إزالة الـ VIEW غير الضرورية  
✅ إزالة السياسة على الـ VIEW  
✅ الحفاظ على جميع الميزات  
✅ كود أنظف وأبسط  
✅ جاهز للاستخدام الآن!

---

## 🎉 هذا كل شيء!

الآن يمكنك:
- ✅ إنشاء تصنيفات معلقة
- ✅ الموافقة على التصنيفات
- ✅ رفض التصنيفات مع السبب
- ✅ تتبع المنشئ والموافق

**مبروك! النظام جاهز الآن! 🚀**
