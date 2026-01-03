#!/bin/bash

# ==========================================
# سكريبت سريع لتطبيق دور restaurant
# ==========================================

echo "🚀 بدء تطبيق دور restaurant..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Apply the database changes
echo "${YELLOW}📊 الخطوة 1: تطبيق التغييرات على قاعدة البيانات${NC}"
echo "يرجى تنفيذ أحد الخيارات التالية:"
echo ""
echo "  خيار 1 (موصى به): تشغيل add_restaurant_role.sql"
echo "  - يضيف دور restaurant بدون حذف البيانات"
echo "  - آمن للاستخدام على قاعدة بيانات موجودة"
echo ""
echo "  خيار 2: إعادة بناء كاملة باستخدام force_rebuild.sql"
echo "  - ⚠️  تحذير: سيحذف جميع البيانات"
echo "  - استخدمه فقط في بيئة التطوير"
echo ""
read -p "هل قمت بتطبيق التغييرات على قاعدة البيانات؟ (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "${RED}❌ تم الإلغاء. يرجى تطبيق التغييرات على قاعدة البيانات أولاً.${NC}"
    exit 1
fi

# Step 2: Reminder to reload schema cache
echo ""
echo "${YELLOW}📊 الخطوة 2: إعادة تحميل Schema Cache${NC}"
echo "يرجى اتباع الخطوات التالية في Supabase Dashboard:"
echo "  1. اذهب إلى Settings → API"
echo "  2. اضغط على زر 'Reload schema cache'"
echo "  3. انتظر حتى تكتمل العملية"
echo ""
read -p "هل قمت بإعادة تحميل Schema Cache؟ (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "${RED}❌ تم الإلغاء. يرجى إعادة تحميل Schema Cache.${NC}"
    exit 1
fi

# Step 3: Build the application
echo ""
echo "${YELLOW}🔨 الخطوة 3: بناء التطبيق${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ تم بناء التطبيق بنجاح${NC}"
else
    echo "${RED}❌ فشل بناء التطبيق${NC}"
    exit 1
fi

# Step 4: Summary
echo ""
echo "${GREEN}✅ تم تطبيق جميع التغييرات بنجاح!${NC}"
echo ""
echo "📋 الخطوات التالية:"
echo "  1. تحديث المستخدمين الحاليين (اختياري)"
echo "     استخدم السكريبتات في database/update_user_role.sql"
echo ""
echo "  2. اختبار تسجيل الدخول لكل دور:"
echo "     - Admin: /dashboard/admin"
echo "     - Vendor: /dashboard/vendor"
echo "     - Restaurant: /dashboard/restaurant"
echo "     - Driver: /dashboard/driver"
echo ""
echo "  3. Deploy التطبيق"
echo "     npm run deploy أو git push (حسب إعدادك)"
echo ""
echo "📖 للمزيد من المعلومات، راجع database/ROLES_GUIDE.md"
