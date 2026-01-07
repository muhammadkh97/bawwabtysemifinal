#!/bin/bash

# بوابتي Marketplace - سكريبت التثبيت الشامل
# Bawabty Marketplace - Complete Installation Script

echo "=========================================="
echo "بوابتي Marketplace - تثبيت قاعدة البيانات"
echo "Bawabty Marketplace - Database Installation"
echo "=========================================="
echo ""

# التحقق من المتغيرات
if [ -z "$DATABASE_URL" ]; then
    echo "❌ خطأ: DATABASE_URL غير محدد"
    echo "❌ Error: DATABASE_URL is not set"
    echo ""
    echo "استخدم: export DATABASE_URL='postgresql://user:pass@host:port/dbname'"
    echo "Usage: export DATABASE_URL='postgresql://user:pass@host:port/dbname'"
    exit 1
fi

echo "✅ تم العثور على DATABASE_URL"
echo "✅ DATABASE_URL found"
echo ""

# قائمة الملفات بالترتيب
FILES=(
    "01-main-schema.sql"
    "02-orders-delivery.sql"
    "03-financial-system.sql"
    "04-marketing-loyalty.sql"
    "05-communication-support.sql"
    "06-system-settings.sql"
    "07-functions-triggers.sql"
    "08-notification-triggers.sql"
    "09-rls-policies.sql"
    "10-storage-setup.sql"
    "11-initial-data.sql"
    "12-views-indexes.sql"
)

# عداد
TOTAL=${#FILES[@]}
CURRENT=0
FAILED=0

echo "📦 سيتم تثبيت $TOTAL ملف"
echo "📦 Installing $TOTAL files"
echo ""

# تنفيذ كل ملف
for FILE in "${FILES[@]}"; do
    CURRENT=$((CURRENT + 1))
    echo "[$CURRENT/$TOTAL] 🔄 تنفيذ $FILE..."
    echo "[$CURRENT/$TOTAL] 🔄 Executing $FILE..."
    
    if psql "$DATABASE_URL" -f "$FILE" > /dev/null 2>&1; then
        echo "[$CURRENT/$TOTAL] ✅ تم بنجاح"
        echo ""
    else
        echo "[$CURRENT/$TOTAL] ❌ فشل"
        echo ""
        FAILED=$((FAILED + 1))
    fi
done

echo "=========================================="
echo "📊 النتائج | Results"
echo "=========================================="
echo "✅ نجح: $((TOTAL - FAILED)) ملف"
echo "✅ Success: $((TOTAL - FAILED)) files"
echo "❌ فشل: $FAILED ملف"
echo "❌ Failed: $FAILED files"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 تم التثبيت بنجاح!"
    echo "🎉 Installation completed successfully!"
    echo ""
    echo "الخطوات التالية:"
    echo "Next steps:"
    echo "1. تحديث Materialized Views: SELECT refresh_all_materialized_views();"
    echo "2. التحقق من الجداول: SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
    echo "3. اختبار الدوال: SELECT * FROM search_products('test');"
    exit 0
else
    echo "⚠️  بعض الملفات فشلت في التثبيت"
    echo "⚠️  Some files failed to install"
    echo "راجع الأخطاء أعلاه"
    echo "Review the errors above"
    exit 1
fi
