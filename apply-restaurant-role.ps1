# ==========================================
# سكريبت سريع لتطبيق دور restaurant
# ==========================================

Write-Host "🚀 بدء تطبيق دور restaurant..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Apply the database changes
Write-Host "📊 الخطوة 1: تطبيق التغييرات على قاعدة البيانات" -ForegroundColor Yellow
Write-Host "يرجى تنفيذ أحد الخيارات التالية:"
Write-Host ""
Write-Host "  خيار 1 (موصى به): تشغيل add_restaurant_role.sql" -ForegroundColor White
Write-Host "  - يضيف دور restaurant بدون حذف البيانات"
Write-Host "  - آمن للاستخدام على قاعدة بيانات موجودة"
Write-Host ""
Write-Host "  خيار 2: إعادة بناء كاملة باستخدام force_rebuild.sql" -ForegroundColor White
Write-Host "  - ⚠️  تحذير: سيحذف جميع البيانات" -ForegroundColor Red
Write-Host "  - استخدمه فقط في بيئة التطوير"
Write-Host ""

$response = Read-Host "هل قمت بتطبيق التغييرات على قاعدة البيانات؟ (y/n)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "❌ تم الإلغاء. يرجى تطبيق التغييرات على قاعدة البيانات أولاً." -ForegroundColor Red
    exit 1
}

# Step 2: Reminder to reload schema cache
Write-Host ""
Write-Host "📊 الخطوة 2: إعادة تحميل Schema Cache" -ForegroundColor Yellow
Write-Host "يرجى اتباع الخطوات التالية في Supabase Dashboard:"
Write-Host "  1. اذهب إلى Settings → API"
Write-Host "  2. اضغط على زر 'Reload schema cache'"
Write-Host "  3. انتظر حتى تكتمل العملية"
Write-Host ""

$response = Read-Host "هل قمت بإعادة تحميل Schema Cache؟ (y/n)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "❌ تم الإلغاء. يرجى إعادة تحميل Schema Cache." -ForegroundColor Red
    exit 1
}

# Step 3: Build the application
Write-Host ""
Write-Host "🔨 الخطوة 3: بناء التطبيق" -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ تم بناء التطبيق بنجاح" -ForegroundColor Green
} else {
    Write-Host "❌ فشل بناء التطبيق" -ForegroundColor Red
    exit 1
}

# Step 4: Summary
Write-Host ""
Write-Host "✅ تم تطبيق جميع التغييرات بنجاح!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 الخطوات التالية:" -ForegroundColor Cyan
Write-Host "  1. تحديث المستخدمين الحاليين (اختياري)"
Write-Host "     استخدم السكريبتات في database/update_user_role.sql"
Write-Host ""
Write-Host "  2. اختبار تسجيل الدخول لكل دور:"
Write-Host "     - Admin: /dashboard/admin"
Write-Host "     - Vendor: /dashboard/vendor"
Write-Host "     - Restaurant: /dashboard/restaurant" -ForegroundColor Yellow
Write-Host "     - Driver: /dashboard/driver"
Write-Host ""
Write-Host "  3. Deploy التطبيق"
Write-Host "     npm run deploy أو git push (حسب إعدادك)"
Write-Host ""
Write-Host "📖 للمزيد من المعلومات، راجع database/ROLES_GUIDE.md" -ForegroundColor Cyan
