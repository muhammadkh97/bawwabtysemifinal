# Auth Fix Testing Script
Write-Host "Testing authentication fix..." -ForegroundColor Cyan
Write-Host ""

# 1. Check required packages
Write-Host "1. Checking packages..." -ForegroundColor Yellow
$packageJson = Get-Content -Path "package.json" -Raw | ConvertFrom-Json

if ($packageJson.dependencies.'@supabase/ssr') {
    Write-Host "[OK] @supabase/ssr installed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] @supabase/ssr not installed" -ForegroundColor Red
}
Write-Host ""

# 2. Check files
Write-Host "2. Checking files..." -ForegroundColor Yellow
$files = @("lib\supabase.ts", "lib\supabase-client.ts", "lib\supabase-server.ts", "lib\supabase-middleware.ts", "middleware.ts")
foreach ($file in $files) {
    if (Test-Path $file) { Write-Host "[OK] $file" -ForegroundColor Green }
    else { Write-Host "[ERROR] $file missing" -ForegroundColor Red }
}
Write-Host ""

# 3. Next steps
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Stop dev server (Ctrl+C)" -ForegroundColor White
Write-Host "2. Clear: Remove-Item -Recurse -Force .next" -ForegroundColor White
Write-Host "3. Start: npm run dev" -ForegroundColor White
Write-Host "4. Test login and check cookies in DevTools" -ForegroundColor White
Write-Host ""
