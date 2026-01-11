# ============================================
# Script لتنظيف console.log واستبدالها بـ logger
# يناير 2026
# ============================================

Write-Host "🧹 بدء تنظيف console.log من المشروع..." -ForegroundColor Cyan
Write-Host ""

# إحصائيات
$totalFiles = 0
$totalReplacements = 0
$errors = @()

# الملفات المستثناة
$excludePatterns = @(
    "node_modules",
    ".next",
    "dist",
    "build",
    ".git"
)

# الأنماط المراد استبدالها
$patterns = @(
    @{
        Old = 'console\.log\('
        New = 'logger.debug('
        Description = 'console.log → logger.debug'
    },
    @{
        Old = 'console\.error\('
        New = 'logger.error('
        Description = 'console.error → logger.error'
    },
    @{
        Old = 'console\.warn\('
        New = 'logger.warn('
        Description = 'console.warn → logger.warn'
    },
    @{
        Old = 'console\.info\('
        New = 'logger.info('
        Description = 'console.info → logger.info'
    }
)

# دالة للتحقق من استثناء الملف
function Should-Exclude($path) {
    foreach ($pattern in $excludePatterns) {
        if ($path -like "*$pattern*") {
            return $true
        }
    }
    return $false
}

# دالة لإضافة import للـ logger إذا لم يكن موجوداً
function Add-LoggerImport($filePath) {
    $content = Get-Content $filePath -Raw -Encoding UTF8
    
    # التحقق من وجود import للـ logger
    if ($content -notmatch "import.*logger.*from.*@/lib/logger") {
        # إضافة import في بداية الملف بعد أول import
        if ($content -match "(?sm)(import.*?from.*?;)") {
            $firstImport = $matches[1]
            $newContent = $content -replace [regex]::Escape($firstImport), "$firstImport`nimport logger from '@/lib/logger';"
            Set-Content $filePath -Value $newContent -Encoding UTF8 -NoNewline
            return $true
        }
    }
    return $false
}

# البحث عن جميع ملفات TypeScript و JavaScript
Write-Host "🔍 البحث عن ملفات TypeScript و JavaScript..." -ForegroundColor Yellow

$files = Get-ChildItem -Path "." -Include "*.ts","*.tsx","*.js","*.jsx" -Recurse -File |
    Where-Object { -not (Should-Exclude $_.FullName) }

Write-Host "✅ تم العثور على $($files.Count) ملف" -ForegroundColor Green
Write-Host ""

# معالجة كل ملف
foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        $fileChanged = $false
        $fileReplacements = 0
        
        # تطبيق جميع الأنماط
        foreach ($pattern in $patterns) {
            $matches = ([regex]::Matches($content, $pattern.Old)).Count
            if ($matches -gt 0) {
                $content = $content -replace $pattern.Old, $pattern.New
                $fileReplacements += $matches
                $fileChanged = $true
            }
        }
        
        # إذا تم تغيير الملف
        if ($fileChanged) {
            # إضافة import للـ logger
            $loggerAdded = $false
            if ($content -match "logger\." -and $content -notmatch "import.*logger.*from") {
                $content = "import logger from '@/lib/logger';`n" + $content
                $loggerAdded = $true
            }
            
            # حفظ الملف
            Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
            
            $totalFiles++
            $totalReplacements += $fileReplacements
            
            $relativePath = $file.FullName.Replace((Get-Location).Path, ".")
            Write-Host "✅ $relativePath" -ForegroundColor Green
            Write-Host "   📝 $fileReplacements تغيير" -ForegroundColor Gray
            if ($loggerAdded) {
                Write-Host "   📦 تم إضافة import logger" -ForegroundColor Gray
            }
        }
    }
    catch {
        $errors += @{
            File = $file.FullName
            Error = $_.Exception.Message
        }
        Write-Host "❌ خطأ في: $($file.FullName)" -ForegroundColor Red
        Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    }
}

# النتائج
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 النتائج النهائية" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📁 عدد الملفات المعالجة: $totalFiles" -ForegroundColor Green
Write-Host "🔄 عدد الاستبدالات: $totalReplacements" -ForegroundColor Green

if ($errors.Count -gt 0) {
    Write-Host "⚠️  عدد الأخطاء: $($errors.Count)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "الأخطاء:" -ForegroundColor Yellow
    foreach ($error in $errors) {
        Write-Host "  - $($error.File)" -ForegroundColor Red
        Write-Host "    $($error.Error)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✨ تم الانتهاء من التنظيف!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  ملاحظة: تأكد من مراجعة التغييرات قبل الـ commit" -ForegroundColor Yellow
Write-Host "   قد تحتاج بعض console.log للبقاء في حالات معينة" -ForegroundColor Yellow
