# ✅ نظام الموافقات للتصنيفات - تم بنجاح!

## 🎉 ما تم إنجازه

تم إضافة نظام موافقات احترافي كامل للتصنيفات يوفر:

### ✨ الميزات الأساسية
1. **خياران للنشر**:
   - ✅ نشر مباشر (approved)
   - ⏳ يحتاج موافقة من المدير (pending)

2. **لوحة الموافقات المعلقة**:
   - عرض جميع التصنيفات المعلقة
   - معلومات مفصلة عن كل طلب
   - أزرار موافقة/رفض سريعة
   - عداد مباشر للمعلقة

3. **نظام الرفض المتقدم**:
   - modal منفصل للرفض
   - إلزامية كتابة سبب الرفض
   - تسجيل من ومتى

4. **إحصائيات محدثة**:
   - عداد التصنيفات المعلقة (برتقالي)
   - قابل للنقر للانتقال للمعلقة

5. **نظام تبويبات**:
   - تبويب التصنيفات المعتمدة
   - تبويب الموافقات المعلقة (مع عداد)

## 🚨 خطوة إلزامية - تطبيق SQL

### يجب تنفيذ هذا الكود في Supabase Dashboard:

1. افتح: https://app.supabase.com
2. اختر مشروع: `itptinhxsylzvfcpxwpl`
3. SQL Editor → New Query
4. انسخ والصق:

```sql
-- إضافة الحقول الجديدة
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- إضافة فهارس
CREATE INDEX IF NOT EXISTS idx_categories_approval_status ON categories(approval_status);
CREATE INDEX IF NOT EXISTS idx_categories_created_by ON categories(created_by);

-- تحديث التصنيفات الموجودة
UPDATE categories 
SET approval_status = 'approved',
    requires_approval = false
WHERE approval_status IS NULL;

-- Trigger لتتبع المنشئ
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

-- Trigger لتتبع الموافقة
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

-- تحديث سياسات RLS
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_admin_all" ON categories;
DROP POLICY IF EXISTS "categories_vendor_read" ON categories;
DROP POLICY IF EXISTS "categories_vendor_create" ON categories;
DROP POLICY IF EXISTS "categories_vendor_own_pending" ON categories;

-- قراءة عامة للمعتمد فقط
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
```

5. اضغط **Run** أو Ctrl+Enter
6. انتظر رسالة "Success" ✅

## 📸 لقطات الشاشة (توقع)

### التبويبات
```
┌──────────────────────┐  ┌───────────────────────┐
│ ✅ التصنيفات المعتمدة │  │ ⏳ الموافقات المعلقة 🔴3 │
└──────────────────────┘  └───────────────────────┘
```

### الإحصائيات
```
📊 إجمالي: 15  |  🟣 رئيسية: 6  |  🟢 نشطة: 13  |  🟠 معلقة: 3
```

### قسم الموافقات المعلقة
```
┌─────────────────────────────────────────────────┐
│ 📦 أدوية                              [⏳ معلق] │
│                                                 │
│ الاسم الإنجليزي: Medicines                     │
│ الوصف: تصنيف خاص بالأدوية والمستحضرات الطبية   │
│ تم الإنشاء بواسطة: محمد علي                    │
│ تاريخ الطلب: 3 يناير 2026، 2:30 م              │
│                                                 │
│ [✅ موافقة]  [❌ رفض]  [👁️ عرض]               │
└─────────────────────────────────────────────────┘
```

### خيار في النموذج
```
☑️ يحتاج موافقة من المدير
   عند تفعيل هذا الخيار، سيتم إرسال التصنيف للمدير
   للموافقة عليه قبل نشره في الموقع.
```

## 🎯 كيفية الاستخدام

### 1. إنشاء تصنيف يحتاج موافقة
```
1. انقر "إضافة تصنيف رئيسي"
2. املأ بيانات التصنيف (مثلاً: أدوية)
3. فعّل ☑️ "يحتاج موافقة من المدير"
4. اضغط "حفظ التغييرات"
➡️ التصنيف يُرسل للموافقة
```

### 2. الموافقة على تصنيف
```
1. اذهب لتبويب "الموافقات المعلقة" (🔴3)
2. راجع التصنيف
3. انقر زر "موافقة" ✅
➡️ التصنيف يصبح معتمداً ويظهر في الموقع
```

### 3. رفض تصنيف
```
1. اذهب لتبويب "الموافقات المعلقة"
2. انقر زر "رفض" ❌
3. اكتب سبب الرفض (إلزامي)
4. انقر "تأكيد الرفض"
➡️ التصنيف يُرفض مع حفظ السبب
```

## 📁 الملفات

### جديد:
- `supabase/migrations/add_categories_approval_system.sql` ⭐ الأهم
- `CATEGORIES_APPROVAL_SYSTEM_GUIDE.md` - دليل شامل
- `CATEGORIES_APPROVAL_QUICK_START.md` - هذا الملف

### محدث:
- `app/admin/categories/page.tsx` - الصفحة الرئيسية

### نسخة احتياطية:
- `app/admin/categories/page.tsx.backup`

## ✅ التحقق من نجاح التطبيق

بعد تطبيق SQL:

1. افتح: `http://localhost:3000/admin/categories`
2. يجب أن ترى:
   - ✅ تبويبين (معتمد + معلق)
   - ✅ إحصائية برتقالية "التصنيفات المعلقة"
   - ✅ خيار "يحتاج موافقة" في النموذج
3. جرب إنشاء تصنيف معلق
4. يجب أن يظهر في تبويب المعلقة
5. جرب الموافقة عليه
6. يجب أن يختفي من المعلقة ويظهر في المعتمد

## 🐛 استكشاف الأخطاء

### المشكلة: لا يظهر التبويب
**الحل**: امسح cache المتصفح وأعد تحميل

### المشكلة: خطأ عند الحفظ
**الحل**: تأكد من تطبيق SQL في Supabase

### المشكلة: لا تظهر التصنيفات المعلقة
**الحل**: تحقق من أنك أنشأت تصنيف بخيار "يحتاج موافقة"

## 📞 للمزيد

- **دليل شامل**: `CATEGORIES_APPROVAL_SYSTEM_GUIDE.md`
- **دليل التصنيفات الأساسي**: `CATEGORIES_SYSTEM_GUIDE.md`
- **إصلاح 403**: `FIX_CATEGORIES_403.md`

---

## 🎊 مبروك!

تم إضافة نظام موافقات احترافي كامل للتصنيفات!
الآن يمكنك التحكم في نشر التصنيفات قبل ظهورها في الموقع.

**لا تنسى تطبيق SQL أولاً!** ⚠️

---

**التاريخ**: 3 يناير 2026  
**الحالة**: ✅ جاهز للاستخدام  
**المطور**: GitHub Copilot
