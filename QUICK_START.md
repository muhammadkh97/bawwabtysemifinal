# 🚀 دليل سريع: تطبيق دور Restaurant

## خطوات سريعة (5 دقائق)

### 1️⃣ تشغيل PART 1 (إضافة ENUM)
```
Supabase SQL Editor
↓
Copy: database/add_restaurant_role_PART1.sql
↓
Paste and Run
↓
Wait for ✅ SUCCESS
```

### 2️⃣ تشغيل PART 2 (إضافة Policies)
```
Supabase SQL Editor (نفس الملف)
↓
Copy: database/add_restaurant_role_PART2.sql
↓
Paste and Run
↓
Wait for ✅ SUCCESS
```

### 3️⃣ إعادة تحميل Schema Cache
```
Supabase Dashboard
↓
Settings → API
↓
Reload schema cache
↓
Wait for ✅ DONE
```

### 4️⃣ Build التطبيق
```powershell
npm run build
```

### 5️⃣ Deploy
```powershell
git add .
git commit -m "Add restaurant role"
git push
```

---

## ✅ الانتهاء!

جميع التغييرات جاهزة:
- ✅ دور restaurant مضاف
- ✅ RLS Policies محدثة
- ✅ التطبيق يعمل
- ✅ جاهز للـ Deploy

---

## في حالة مشاكل

**خطأ ENUM؟**
→ راجع `FIX_ENUM_ERROR.md`

**تريد أمثلة SQL؟**
→ شغّل `add_restaurant_role_PART3.sql`

**تريد تحديث مستخدمين؟**
→ استخدم `database/update_user_role.sql`

**معلومات كاملة؟**
→ راجع `RESTAURANT_ROLE_SETUP.md`

---

## الملفات المستخدمة

| الملف | الغرض | متى |
|------|-------|------|
| PART1.sql | إضافة ENUM | أولاً |
| PART2.sql | إضافة Policies | ثانياً |
| PART3.sql | أمثلة وتحقق | اختياري |
| Schema Cache | تحديث Cache | بعد PART 2 |

---

**تم! 🎉 الآن يمكنك استخدام دور restaurant**
