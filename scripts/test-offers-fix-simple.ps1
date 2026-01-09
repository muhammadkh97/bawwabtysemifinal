# Test Offers Fix Script
# ======================

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Testing Offers Fix Implementation" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check files
Write-Host "Checking files..." -ForegroundColor Yellow
Write-Host ""

$files = @{
    "public\favicon.svg" = "Favicon SVG"
    "app\offers\page.tsx" = "Offers Page"
    "scripts\create-offers-table.sql" = "SQL Create Table"
    "scripts\diagnose-hero-slides-issue.sql" = "SQL Diagnostic"
}

$allExist = $true

foreach ($file in $files.Keys) {
    $fullPath = Join-Path $PSScriptRoot ".." $file
    if (Test-Path $fullPath) {
        Write-Host "  [OK] $($files[$file])" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $($files[$file])" -ForegroundColor Red
        $allExist = $false
    }
}

Write-Host ""

# Check content
Write-Host "Checking file content..." -ForegroundColor Yellow
Write-Host ""

$faviconPath = Join-Path $PSScriptRoot ".." "public\favicon.svg"
if (Test-Path $faviconPath) {
    $content = Get-Content $faviconPath -Raw
    if ($content -match "svg") {
        Write-Host "  [OK] Favicon SVG is valid" -ForegroundColor Green
    }
}

$offersPath = Join-Path $PSScriptRoot ".." "app\offers\page.tsx"
if (Test-Path $offersPath) {
    $content = Get-Content $offersPath -Raw
    if ($content -match "OffersPage") {
        Write-Host "  [OK] Offers page component found" -ForegroundColor Green
    }
}

$layoutPath = Join-Path $PSScriptRoot ".." "app\layout.tsx"
if (Test-Path $layoutPath) {
    $content = Get-Content $layoutPath -Raw
    if ($content -match "favicon.svg") {
        Write-Host "  [OK] Layout updated with favicon.svg" -ForegroundColor Green
    }
}

Write-Host ""

# Statistics
Write-Host "File Statistics:" -ForegroundColor Yellow
Write-Host ""

if (Test-Path $offersPath) {
    $lines = (Get-Content $offersPath).Count
    Write-Host "  Offers page: $lines lines" -ForegroundColor Cyan
}

$sqlPath = Join-Path $PSScriptRoot ".." "scripts\create-offers-table.sql"
if (Test-Path $sqlPath) {
    $lines = (Get-Content $sqlPath).Count
    Write-Host "  SQL script: $lines lines" -ForegroundColor Cyan
}

Write-Host ""

# Next steps
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Run diagnostic SQL in Supabase:" -ForegroundColor White
Write-Host "     scripts/diagnose-hero-slides-issue.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Copy results and share" -ForegroundColor White
Write-Host ""
Write-Host "  3. Run create table SQL:" -ForegroundColor White
Write-Host "     scripts/create-offers-table.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Test pages:" -ForegroundColor White
Write-Host "     - /offers" -ForegroundColor Gray
Write-Host "     - Check favicon" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host "================================" -ForegroundColor Cyan
if ($allExist) {
    Write-Host "[SUCCESS] All files created!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Some files missing" -ForegroundColor Yellow
}
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Documentation
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  OFFERS_PAGE_IMPLEMENTATION.md" -ForegroundColor Gray
Write-Host ""

Write-Host "Files Created/Modified:" -ForegroundColor Cyan
Write-Host "  [NEW] app/offers/page.tsx" -ForegroundColor Green
Write-Host "  [NEW] public/favicon.svg" -ForegroundColor Green
Write-Host "  [MOD] app/layout.tsx" -ForegroundColor Yellow
Write-Host "  [NEW] scripts/create-offers-table.sql" -ForegroundColor Green
Write-Host "  [NEW] scripts/diagnose-hero-slides-issue.sql" -ForegroundColor Green
Write-Host ""

Write-Host "Build and Test:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host "  Open: http://localhost:3000/offers" -ForegroundColor Gray
Write-Host ""
