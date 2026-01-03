# 🚀 ابدأ الآن - تطبيق نظام الموافقات

## ⚡ 3 خطوات فقط!

### الخطوة 1️⃣: افتح Supabase
```
🌐 https://app.supabase.com
🔑 مشروع: itptinhxsylzvfcpxwpl
📝 SQL Editor → + New Query
```

### الخطوة 2️⃣: نفذ هذا الكود

انسخ والصق الكود التالي كاملاً واضغط **Run**:

```sql
-- ═══════════════════════════════════════════════════════════
-- نظام الموافقات للتصنيفات
-- ═══════════════════════════════════════════════════════════

-- 1️⃣ إضافة الحقول الجديدة
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' 
  CHECK (approval_status IN ('pending', 'approved', 'rejected')),
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

-- 4️⃣ Trigger لتتبع من أنشأ التصنيف
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
  IF NEW.approval_status != OLD.approval_status AND 
     NEW.approval_status IN ('approved', 'rejected') THEN
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

-- العامة: قراءة المعتمد فقط
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

### الخطوة 3️⃣: اختبر النظام

1. افتح: **http://localhost:3000/admin/categories**
2. ابحث عن:
   - ✅ تبويبين (معتمد + معلق)
   - ✅ إحصائية برتقالية "التصنيفات المعلقة"
   - ✅ عداد أحمر للمعلقة
3. جرب:
   - ➕ إنشاء تصنيف عادي
   - ⏳ إنشاء تصنيف معلق (فعّل "يحتاج موافقة")
   - ✅ الموافقة على تصنيف
   - ❌ رفض تصنيف (مع كتابة السبب)

---

## 🎯 كيفية الاستخدام

### إنشاء تصنيف يحتاج موافقة:
```
1. انقر "إضافة تصنيف رئيسي" ➕
2. املأ البيانات (مثلاً: أدوية)
3. فعّل ☑️ "يحتاج موافقة من المدير"
4. احفظ 💾
→ التصنيف يذهب للموافقات المعلقة
```

### الموافقة على تصنيف:
```
1. اذهب لتبويب "الموافقات المعلقة" (🔴3)
2. راجع التصنيف 👀
3. انقر "موافقة" ✅
→ التصنيف يصبح معتمداً ويظهر في الموقع
```

### رفض تصنيف:
```
1. في تبويب "الموافقات المعلقة"
2. انقر "رفض" ❌
3. اكتب سبب الرفض ✍️ (إلزامي)
4. أكد الرفض
→ التصنيف يُرفض مع حفظ السبب
```

---

## 🎨 ما ستراه

### التبويبات:
```
┌──────────────────────┐  ┌───────────────────────┐
│ ✅ التصنيفات المعتمدة │  │ ⏳ الموافقات المعلقة 🔴3 │
└──────────────────────┘  └───────────────────────┘
```

### الإحصائيات:
```
📊 15  |  🟣 6  |  🟢 13  |  🟠 3
إجمالي | رئيسية | نشطة   | معلقة
```

### بطاقة تصنيف معلق:
```
┌─────────────────────────────────────────────┐
│ 💊 أدوية                          [⏳ معلق] │
│ Medicines                                    │
│                                              │
│ من: محمد علي                                │
│ متى: 3 يناير 2026، 2:30 م                   │
│                                              │
│  [✅ موافقة]  [❌ رفض]  [👁️ عرض]           │
└─────────────────────────────────────────────┘
```

---

## ⚠️ مهم جداً!

### إذا رأيت خطأ 403:
```
❌ permission denied for table categories
```

**الحل**: تأكد من تنفيذ كود SQL أعلاه ✅

---

## 🐛 استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| لا يظهر التبويب | امسح cache المتصفح |
| خطأ 403 | نفذ كود SQL |
| لا تظهر المعلقة | أنشئ تصنيف بخيار "يحتاج موافقة" |
| الزر معطل | اكتب سبب الرفض أولاً |

---

## ✅ قائمة التحقق

قبل البدء:
- ☑️ نفذت كود SQL في Supabase
- ☑️ رأيت رسالة "Success"
- ☑️ مسجل دخول كمدير (admin)

بعد التطبيق:
- ☑️ أرى تبويبين
- ☑️ أرى الإحصائية البرتقالية
- ☑️ أرى خيار "يحتاج موافقة" في النموذج
- ☑️ يمكنني إنشاء تصنيف معلق
- ☑️ يمكنني الموافقة/الرفض

---

## 📚 ملفات مساعدة

- **دليل سريع**: `CATEGORIES_APPROVAL_QUICK_START.md`
- **دليل شامل**: `CATEGORIES_APPROVAL_SYSTEM_GUIDE.md`
- **ملخص كامل**: `COMPLETE_CATEGORIES_SUMMARY.md`

---

## 🎉 مبروك!

نظام الموافقات جاهز للاستخدام!

**لا تنسى**: تنفيذ كود SQL أولاً ⚠️

---

**التاريخ**: 3 يناير 2026  
**المطور**: GitHub Copilot  
**الحالة**: ✅ جاهز
