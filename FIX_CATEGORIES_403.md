## 🔧 إصلاح خطأ 403 للتصنيفات - خطوات سريعة

### المشكلة
```
Error: permission denied for table categories
```

### الحل السريع (3 دقائق)

#### الخطوة 1: افتح Supabase Dashboard
1. اذهب إلى: https://app.supabase.com
2. اختر مشروعك: `itptinhxsylzvfcpxwpl`
3. من القائمة الجانبية → **SQL Editor**
4. انقر **+ New Query**

#### الخطوة 2: نسخ ولصق هذا الكود

```sql
-- إصلاح سياسات RLS للتصنيفات
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "allow_read_categories" ON categories;
DROP POLICY IF EXISTS "allow_admin_manage_categories" ON categories;
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_admin_all" ON categories;
DROP POLICY IF EXISTS "categories_vendor_read" ON categories;

-- سياسة 1: قراءة عامة للتصنيفات النشطة
CREATE POLICY "categories_public_read"
ON categories FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- سياسة 2: المدراء لهم كل الصلاحيات
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

-- سياسة 3: البائعين يمكنهم القراءة فقط
CREATE POLICY "categories_vendor_read"
ON categories FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('vendor', 'restaurant')
  )
);
```

#### الخطوة 3: تنفيذ الكود
- اضغط **Run** أو `Ctrl+Enter`
- انتظر حتى تظهر رسالة "Success" ✅

#### الخطوة 4: اختبار
1. افتح الصفحة: `http://localhost:3000/admin/categories`
2. جرب إضافة تصنيف جديد
3. يجب أن يعمل بدون أخطاء! 🎉

---

### ملاحظة مهمة ⚠️
تأكد من أنك مسجل دخول كمدير (role = 'admin')

### في حالة استمرار المشكلة
1. امسح cache المتصفح
2. أعد تحميل الصفحة (Ctrl+Shift+R)
3. تحقق من console المتصفح

---

✅ **تم!** الآن يمكنك إدارة التصنيفات بحرية
