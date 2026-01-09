# OAuth Testing Script - Login Page
# This script tests all OAuth providers integration

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  OAuth Testing - Login Page" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check Supabase environment variables
Write-Host "1. Checking Environment Variables..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_URL") {
        Write-Host "   [OK] NEXT_PUBLIC_SUPABASE_URL found" -ForegroundColor Green
    } else {
        Write-Host "   [X] NEXT_PUBLIC_SUPABASE_URL missing" -ForegroundColor Red
    }
    
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
        Write-Host "   [OK] NEXT_PUBLIC_SUPABASE_ANON_KEY found" -ForegroundColor Green
    } else {
        Write-Host "   [X] NEXT_PUBLIC_SUPABASE_ANON_KEY missing" -ForegroundColor Red
    }
} else {
    Write-Host "   [X] .env.local file not found" -ForegroundColor Red
}
Write-Host ""

# Check required files
Write-Host "2. Checking Required Files..." -ForegroundColor Yellow

$requiredFiles = @(
    "app\auth\login\page.tsx",
    "app\auth\callback\page.tsx",
    "lib\auth.ts",
    "lib\supabase.ts"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   [OK] $file exists" -ForegroundColor Green
    } else {
        Write-Host "   [X] $file missing" -ForegroundColor Red
    }
}
Write-Host ""

# Check OAuth functions in auth.ts
Write-Host "3. Checking OAuth Functions..." -ForegroundColor Yellow

if (Test-Path "lib\auth.ts") {
    $authContent = Get-Content "lib\auth.ts" -Raw
    
    $oauthFunctions = @(
        "signInWithGoogle",
        "signInWithFacebook",
        "signInWithApple",
        "signInWithOAuth"
    )
    
    foreach ($func in $oauthFunctions) {
        if ($authContent -match $func) {
            Write-Host "   [OK] $func found" -ForegroundColor Green
        } else {
            Write-Host "   [X] $func missing" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   [X] lib\auth.ts not found" -ForegroundColor Red
}
Write-Host ""

# Check login page features
Write-Host "4. Checking Login Page Features..." -ForegroundColor Yellow

if (Test-Path "app\auth\login\page.tsx") {
    $loginContent = Get-Content "app\auth\login\page.tsx" -Raw
    
    $featuresList = @(
        @{Name="rememberMe"; Desc="Remember Me checkbox"},
        @{Name="validateEmail"; Desc="Email validation"},
        @{Name="validatePassword"; Desc="Password validation"},
        @{Name="handleSocialLogin"; Desc="Social login handler"},
        @{Name="success"; Desc="Success message"},
        @{Name="error"; Desc="Error message"},
        @{Name="loading"; Desc="Loading state"}
    )
    
    foreach ($feature in $featuresList) {
        if ($loginContent -match $feature.Name) {
            Write-Host "   [OK] $($feature.Desc)" -ForegroundColor Green
        } else {
            Write-Host "   [X] $($feature.Desc)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   [X] Login page not found" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All required files and functions are checked!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure OAuth providers in Supabase Dashboard" -ForegroundColor White
Write-Host "2. Add redirect URIs for each provider" -ForegroundColor White
Write-Host "3. Test each provider on localhost:3000/auth/login" -ForegroundColor White
Write-Host "4. Check console logs for any errors" -ForegroundColor White
Write-Host ""
Write-Host "For detailed setup instructions, see:" -ForegroundColor Yellow
Write-Host "docs/OAUTH_SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
