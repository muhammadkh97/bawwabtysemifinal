# Quick restart script with cache cleanup
Write-Host "Cleaning and restarting..." -ForegroundColor Cyan
Write-Host ""

# 1. Clear .next cache
if (Test-Path ".next") {
    Write-Host "Removing .next folder..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .next
    Write-Host "[OK] Cleared" -ForegroundColor Green
}
Write-Host ""

# 2. Start dev server
Write-Host "Starting dev server..." -ForegroundColor Cyan
Write-Host ""
npm run dev
