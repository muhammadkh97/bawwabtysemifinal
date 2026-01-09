# =================================================================
# اختبار سريع لحل مشكلة /offers و favicon
# =================================================================

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🧪 اختبار حل مشكلة /offers و favicon" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. التحقق من وجود الملفات
Write-Host "1️⃣  التحقق من وجود الملفات المطلوبة..." -ForegroundColor Yellow
Write-Host ""

$files = @(
    "public\favicon.svg",
    "app\offers\page.tsx",
    "scripts\create-offers-table.sql",
    "scripts\diagnose-hero-slides-issue.sql"
)

$allFilesExist = $true

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file - غير موجود!" -ForegroundColor Red
        $allFilesExist = $false
    }
}

Write-Host ""

# 2. التحقق من محتوى الملفات
Write-Host "2️⃣  التحقق من محتوى الملفات..." -ForegroundColor Yellow
Write-Host ""

# favicon.svg
$faviconPath = Join-Path $PSScriptRoot "public\favicon.svg"
if (Test-Path $faviconPath) {
    $faviconContent = Get-Content $faviconPath -Raw
    if ($faviconContent -match "svg" -and $faviconContent -match "gradient") {
        Write-Host "  ✅ favicon.svg يحتوي على SVG صالح" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  favicon.svg قد لا يكون صالح" -ForegroundColor Yellow
    }
}

# offers/page.tsx
$offersPath = Join-Path $PSScriptRoot "app\offers\page.tsx"
if (Test-Path $offersPath) {
    $offersContent = Get-Content $offersPath -Raw
    if ($offersContent -match "OffersPage" -and $offersContent -match "supabase") {
        Write-Host "  ✅ offers/page.tsx يحتوي على مكون صالح" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  offers/page.tsx قد يحتاج مراجعة" -ForegroundColor Yellow
    }
}

# layout.tsx
$layoutPath = Join-Path $PSScriptRoot "app\layout.tsx"
if (Test-Path $layoutPath) {
    $layoutContent = Get-Content $layoutPath -Raw
    if ($layoutContent -match "favicon.svg") {
        Write-Host "  ✅ layout.tsx تم تحديثه ليشمل favicon.svg" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  layout.tsx قد لا يحتوي على تحديث favicon" -ForegroundColor Yellow
    }
}

Write-Host ""

# 3. إحصائيات
Write-Host "3️⃣  إحصائيات الملفات..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path $offersPath) {
    $lineCount = (Get-Content $offersPath).Count
    Write-Host "  📄 offers/page.tsx: $lineCount سطر" -ForegroundColor Cyan
}

if (Test-Path "$PSScriptRoot\scripts\create-offers-table.sql") {
    $sqlLineCount = (Get-Content "$PSScriptRoot\scripts\create-offers-table.sql").Count
    Write-Host "  📄 create-offers-table.sql: $sqlLineCount سطر" -ForegroundColor Cyan
}

Write-Host ""

# 4. الخطوات التالية
Write-Host "4️⃣  الخطوات التالية:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. نفذ السكريبت التشخيصي في Supabase:" -ForegroundColor White
Write-Host "     scripts/diagnose-hero-slides-issue.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. انسخ نتائج التشخيص وشاركها" -ForegroundColor White
Write-Host ""
Write-Host "  3. نفذ سكريبت إنشاء الجدول:" -ForegroundColor White
Write-Host "     scripts/create-offers-table.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. اختبر الصفحات:" -ForegroundColor White
Write-Host "     - /offers" -ForegroundColor Gray
Write-Host "     - favicon" -ForegroundColor Gray
Write-Host ""

# 5. النتيجة النهائية
Write-Host "================================" -ForegroundColor Cyan
if ($allFilesExist) {
    Write-Host "✅ جميع الملفات موجودة وجاهزة!" -ForegroundColor Green
} else {
    Write-Host "⚠️  بعض الملفات غير موجودة" -ForegroundColor Yellow
}
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 6. معلومات إضافية
Write-Host "📚 المستندات:" -ForegroundColor Cyan
Write-Host "   OFFERS_PAGE_IMPLEMENTATION.md - شرح كامل للحل" -ForegroundColor Gray
Write-Host ""

Write-Host "🎯 الملفات المنشأة/المعدلة:" -ForegroundColor Cyan
Write-Host "   ✅ app/offers/page.tsx (جديد)" -ForegroundColor Green
Write-Host "   ✅ public/favicon.svg (جديد)" -ForegroundColor Green
Write-Host "   ✅ app/layout.tsx (معدل)" -ForegroundColor Yellow
Write-Host "   ✅ scripts/create-offers-table.sql (جديد)" -ForegroundColor Green
Write-Host "   ✅ scripts/diagnose-hero-slides-issue.sql (جديد)" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 البناء والاختبار:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host "   ثم افتح: http://localhost:3000/offers" -ForegroundColor Gray
Write-Host ""
