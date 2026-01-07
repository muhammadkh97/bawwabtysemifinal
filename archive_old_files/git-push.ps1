# Git Push Script for Bawwabty Rebuild
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "  BAWWABTY - GIT COMMIT & PUSH" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Step 1: Add new files
Write-Host "[1/4] Adding new files..." -ForegroundColor Yellow
git add database/force_rebuild.sql
git add types/index.ts
git add REBUILD_GUIDE.md
git add REBUILD_SUMMARY.md
git add README_REBUILD.md
git add REBUILD_COMPLETE.txt
git add FIX_432_ERRORS_AR.md
git add fix-errors.bat
git add .vscode/settings.json

Write-Host "✓ Files staged`n" -ForegroundColor Green

# Step 2: Commit
Write-Host "[2/4] Creating commit..." -ForegroundColor Yellow
$commitMessage = @"
feat: Complete system rebuild - Fixed 432 TypeScript errors

- Installed all dependencies (432 packages)
- Created force_rebuild.sql for clean database schema
- Updated TypeScript types to match new schema
- Added hybrid business_type support (retail/restaurant)
- Integrated PostGIS for location features
- Implemented comprehensive RLS policies
- Created detailed documentation

BREAKING CHANGE: Database schema requires rebuild
See REBUILD_GUIDE.md for execution steps
"@

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Commit created`n" -ForegroundColor Green
} else {
    Write-Host "✗ Commit failed or nothing to commit`n" -ForegroundColor Red
    Write-Host "Checking git status...`n" -ForegroundColor Yellow
    git status
    exit 1
}

# Step 3: Check remote
Write-Host "[3/4] Checking remote status..." -ForegroundColor Yellow
git fetch origin

$behind = git rev-list --count HEAD..origin/main 2>$null
$ahead = git rev-list --count origin/main..HEAD 2>$null

if ($behind -gt 0) {
    Write-Host "`n⚠️  WARNING: Your branch is $behind commits behind origin/main" -ForegroundColor Yellow
    Write-Host "You may need to pull and resolve conflicts first.`n" -ForegroundColor Yellow
    
    $response = Read-Host "Do you want to force push? (yes/no)"
    if ($response -eq "yes") {
        Write-Host "`n[4/4] Force pushing to origin..." -ForegroundColor Yellow
        git push origin main --force-with-lease
    } else {
        Write-Host "`nPush cancelled. You may need to:" -ForegroundColor Yellow
        Write-Host "1. git pull origin main" -ForegroundColor White
        Write-Host "2. Resolve any conflicts" -ForegroundColor White
        Write-Host "3. git push origin main" -ForegroundColor White
        exit 0
    }
} else {
    Write-Host "✓ Branch is up to date`n" -ForegroundColor Green
    Write-Host "[4/4] Pushing to origin..." -ForegroundColor Yellow
    git push origin main
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Successfully pushed to origin/main`n" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "  🎉 ALL CHANGES UPLOADED TO REPOSITORY!" -ForegroundColor Green
    Write-Host "================================================`n" -ForegroundColor Cyan
} else {
    Write-Host "`n✗ Push failed`n" -ForegroundColor Red
    Write-Host "You may need to resolve conflicts manually." -ForegroundColor Yellow
}
