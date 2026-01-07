# تثبيت مكتبة Google Maps للتطبيق
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   تثبيت Location Picker Dependencies   " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من وجود package.json
if (-not (Test-Path "package.json")) {
    Write-Host "❌ خطأ: لم يتم العثور على package.json" -ForegroundColor Red
    Write-Host "   تأكد من أنك في المجلد الرئيسي للمشروع" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 جاري تثبيت @react-google-maps/api..." -ForegroundColor Green
Write-Host ""

# تحديد package manager
$usesPnpm = Test-Path "pnpm-lock.yaml"
$usesYarn = Test-Path "yarn.lock"

if ($usesPnpm) {
    Write-Host "🔍 اكتشاف pnpm package manager" -ForegroundColor Cyan
    pnpm install @react-google-maps/api
} elseif ($usesYarn) {
    Write-Host "🔍 اكتشاف yarn package manager" -ForegroundColor Cyan
    yarn add @react-google-maps/api
} else {
    Write-Host "🔍 استخدام npm package manager" -ForegroundColor Cyan
    npm install @react-google-maps/api
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ تم التثبيت بنجاح!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   الخطوات التالية:                    " -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1️⃣  احصل على Google Maps API Key من:" -ForegroundColor White
    Write-Host "   https://console.cloud.google.com/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2️⃣  أضف المفتاح إلى ملف .env.local:" -ForegroundColor White
    Write-Host "   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3️⃣  أعد تشغيل السيرفر:" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4️⃣  اذهب إلى:" -ForegroundColor White
    Write-Host "   - لوحة البائع: /dashboard/vendor/my-store" -ForegroundColor Gray
    Write-Host "   - لوحة المطعم: /dashboard/restaurant/settings" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📖 للمزيد من التفاصيل، راجع:" -ForegroundColor Cyan
    Write-Host "   LOCATION_PICKER_IMPLEMENTATION.md" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ فشل التثبيت!" -ForegroundColor Red
    Write-Host "   جرب تشغيل الأمر يدوياً:" -ForegroundColor Yellow
    Write-Host "   npm install @react-google-maps/api" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
