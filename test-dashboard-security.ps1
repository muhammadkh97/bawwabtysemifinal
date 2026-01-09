# 🧪 Dashboard Security Test Script

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🔐 Dashboard Security Verification" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if auth-server.ts exists
Write-Host "📋 Test 1: Server-side auth utility..." -NoNewline
if (Test-Path "lib\auth-server.ts") {
    Write-Host " ✅ PASS" -ForegroundColor Green
} else {
    Write-Host " ❌ FAIL" -ForegroundColor Red
}

# Test 2: Check middleware
Write-Host "📋 Test 2: Edge middleware..." -NoNewline
if (Test-Path "middleware.ts") {
    $middlewareContent = Get-Content "middleware.ts" -Raw
    if ($middlewareContent -match "authCookie" -and $middlewareContent -match "redirect") {
        Write-Host " ✅ PASS" -ForegroundColor Green
    } else {
        Write-Host " ⚠️  WARNING: Middleware may need update" -ForegroundColor Yellow
    }
} else {
    Write-Host " ❌ FAIL" -ForegroundColor Red
}

# Test 3: Check admin layout
Write-Host "📋 Test 3: Admin layout protection..." -NoNewline
if (Test-Path "app\dashboard\admin\layout.tsx") {
    $adminLayout = Get-Content "app\dashboard\admin\layout.tsx" -Raw
    if ($adminLayout -match "requireRole" -and $adminLayout -notmatch "'use client'") {
        Write-Host " ✅ PASS" -ForegroundColor Green
    } else {
        Write-Host " ❌ FAIL: Admin layout not properly protected" -ForegroundColor Red
    }
} else {
    Write-Host " ❌ FAIL: Admin layout missing" -ForegroundColor Red
}

# Test 4: Check vendor layout
Write-Host "📋 Test 4: Vendor layout protection..." -NoNewline
if (Test-Path "app\dashboard\vendor\layout.tsx") {
    $vendorLayout = Get-Content "app\dashboard\vendor\layout.tsx" -Raw
    if ($vendorLayout -match "requireRole" -and $vendorLayout -notmatch "'use client'") {
        Write-Host " ✅ PASS" -ForegroundColor Green
    } else {
        Write-Host " ❌ FAIL: Vendor layout not properly protected" -ForegroundColor Red
    }
} else {
    Write-Host " ❌ FAIL: Vendor layout missing" -ForegroundColor Red
}

# Test 5: Check restaurant layout
Write-Host "📋 Test 5: Restaurant layout protection..." -NoNewline
if (Test-Path "app\dashboard\restaurant\layout.tsx") {
    $restaurantLayout = Get-Content "app\dashboard\restaurant\layout.tsx" -Raw
    if ($restaurantLayout -match "requireRole" -and $restaurantLayout -notmatch "'use client'") {
        Write-Host " ✅ PASS" -ForegroundColor Green
    } else {
        Write-Host " ❌ FAIL: Restaurant layout not properly protected" -ForegroundColor Red
    }
} else {
    Write-Host " ❌ FAIL: Restaurant layout missing" -ForegroundColor Red
}

# Test 6: Check driver layout
Write-Host "📋 Test 6: Driver layout protection..." -NoNewline
if (Test-Path "app\dashboard\driver\layout.tsx") {
    $driverLayout = Get-Content "app\dashboard\driver\layout.tsx" -Raw
    if ($driverLayout -match "requireRole" -and $driverLayout -notmatch "'use client'") {
        Write-Host " ✅ PASS" -ForegroundColor Green
    } else {
        Write-Host " ❌ FAIL: Driver layout not properly protected" -ForegroundColor Red
    }
} else {
    Write-Host " ❌ FAIL: Driver layout missing" -ForegroundColor Red
}

# Test 7: Check loading states
Write-Host "📋 Test 7: Loading states..." -NoNewline
$loadingFiles = @(
    "app\dashboard\loading.tsx",
    "app\dashboard\admin\loading.tsx",
    "app\dashboard\vendor\loading.tsx",
    "app\dashboard\restaurant\loading.tsx",
    "app\dashboard\driver\loading.tsx"
)
$allExist = $true
foreach ($file in $loadingFiles) {
    if (-not (Test-Path $file)) {
        $allExist = $false
        break
    }
}
if ($allExist) {
    Write-Host " ✅ PASS" -ForegroundColor Green
} else {
    Write-Host " ⚠️  WARNING: Some loading files missing" -ForegroundColor Yellow
}

# Test 8: Check client wrappers
Write-Host "📋 Test 8: Client-side wrappers..." -NoNewline
$clientFiles = @(
    "app\dashboard\admin\AdminLayoutClient.tsx",
    "app\dashboard\vendor\VendorLayoutClient.tsx",
    "app\dashboard\restaurant\RestaurantLayoutClient.tsx",
    "app\dashboard\driver\DriverLayoutClient.tsx"
)
$allExist = $true
foreach ($file in $clientFiles) {
    if (-not (Test-Path $file)) {
        $allExist = $false
        break
    }
}
if ($allExist) {
    Write-Host " ✅ PASS" -ForegroundColor Green
} else {
    Write-Host " ⚠️  WARNING: Some client wrappers missing" -ForegroundColor Yellow
}

# Test 9: Check tsconfig
Write-Host "📋 Test 9: TypeScript configuration..." -NoNewline
if (Test-Path "tsconfig.json") {
    $tsconfig = Get-Content "tsconfig.json" -Raw
    if ($tsconfig -match '"types":\s*\["node"\]') {
        Write-Host " ✅ PASS" -ForegroundColor Green
    } else {
        Write-Host " ⚠️  WARNING: Node types may not be configured" -ForegroundColor Yellow
    }
} else {
    Write-Host " ❌ FAIL: tsconfig.json missing" -ForegroundColor Red
}

# Test 10: Check documentation
Write-Host "📋 Test 10: Security documentation..." -NoNewline
if (Test-Path "DASHBOARD_SECURITY_COMPLETE.md") {
    Write-Host " ✅ PASS" -ForegroundColor Green
} else {
    Write-Host " ⚠️  WARNING: Documentation missing" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Security verification complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run npm run dev to test locally" -ForegroundColor White
Write-Host "2. Test unauthenticated access to /dashboard/admin" -ForegroundColor White
Write-Host "3. Test wrong role access" -ForegroundColor White
Write-Host "4. Verify no FOUC occurs" -ForegroundColor White
Write-Host ""
