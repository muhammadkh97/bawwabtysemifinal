# كيفية رفع التغييرات إلى GitHub
## How to Push Changes to GitHub

تم إنشاء الإصلاحات الأمنية في فرع جديد: `security-fixes-critical`

---

## الطريقة 1: استخدام GitHub CLI (الموصى بها)

```bash
# 1. تسجيل الدخول إلى GitHub
gh auth login

# 2. اختر: GitHub.com
# 3. اختر: HTTPS
# 4. اختر: Login with a web browser
# 5. انسخ الكود واتبع التعليمات

# 6. بعد تسجيل الدخول، ارفع الفرع:
cd /home/ubuntu/bawwabtysemifinal
git push -u origin security-fixes-critical

# 7. إنشاء Pull Request:
gh pr create --title "🔒 Critical Security Fixes" \
  --body "## ملخص الإصلاحات

### الثغرات المحلولة:
- **FM-001 إلى FM-005**: ثغرات التلاعب المالي
- **DL-002**: تشفير معلومات البنك
- **DL-003**: تأمين دوال SECURITY DEFINER
- **OTP-001**: Rate Limiting على OTP

### الملفات المضافة:
1. \`database/create-secure-order-function.sql\` - دالة آمنة لإنشاء الطلبات
2. \`database/encrypt-bank-info.sql\` - تشفير معلومات البنك
3. \`database/secure-definer-functions.sql\` - تأمين دوال OTP
4. \`database/enable-rls-policies-fixed.sql\` - سياسات RLS
5. \`app/checkout/page-secure.tsx\` - مثال على استخدام الدالة الآمنة

### الخطوات التالية:
1. مراجعة الكود
2. تطبيق التغييرات في قاعدة البيانات
3. تحديث \`app/checkout/page.tsx\` لاستخدام الدالة الآمنة
4. تحديث \`app/dashboard/vendor/wallet/page.tsx\`
5. اختبار شامل
6. دمج الفرع في main

⚠️ **تحذير**: يجب تغيير مفتاح التشفير في \`encrypt-bank-info.sql\` قبل النشر!

راجع \`security-fixes-implementation-guide.md\` للتفاصيل الكاملة."
```

---

## الطريقة 2: استخدام Git مباشرة

إذا كنت تفضل استخدام Git مباشرة:

```bash
cd /home/ubuntu/bawwabtysemifinal

# إعداد Personal Access Token
# 1. اذهب إلى: https://github.com/settings/tokens
# 2. اضغط "Generate new token (classic)"
# 3. اختر الصلاحيات: repo (كل الصلاحيات)
# 4. انسخ الـ token

# استخدم الـ token بدلاً من كلمة المرور:
git push -u origin security-fixes-critical
# Username: muhammadkh97
# Password: [الصق الـ token هنا]
```

---

## الطريقة 3: من واجهة GitHub مباشرة

1. اذهب إلى: https://github.com/muhammadkh97/bawwabtysemifinal
2. اضغط على "Branches"
3. ستجد فرع `security-fixes-critical`
4. اضغط "New pull request"
5. أضف العنوان والوصف من الأعلى
6. اضغط "Create pull request"

---

## ملاحظات مهمة

### قبل الدمج (Merge):

1. **راجع جميع الملفات المضافة**
2. **اقرأ `security-fixes-implementation-guide.md` بالكامل**
3. **غيّر مفتاح التشفير في `encrypt-bank-info.sql`**
4. **اختبر الدالة `create_order_secure` في بيئة التطوير**
5. **تأكد من تطبيق جميع التغييرات في Frontend**

### بعد الدمج:

1. **طبّق ملفات SQL في قاعدة بيانات الإنتاج**
2. **حدّث ملفات Frontend**
3. **اختبر شامل للموقع**
4. **راقب الأخطاء في Vercel**

---

## الملفات الموجودة في الفرع

```
database/
├── create-secure-order-function.sql     # دالة آمنة لإنشاء الطلبات
├── encrypt-bank-info.sql                # تشفير معلومات البنك
├── secure-definer-functions.sql         # تأمين دوال OTP
└── enable-rls-policies-fixed.sql        # سياسات RLS

app/
└── checkout/
    └── page-secure.tsx                  # مثال على استخدام الدالة الآمنة
```

---

## جهات الاتصال

إذا واجهت أي مشاكل:
1. راجع `final_security_audit_report.md`
2. راجع `security-fixes-implementation-guide.md`
3. راجع `penetration_test_findings.md`
