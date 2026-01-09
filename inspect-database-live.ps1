# Database Inspection Script - Direct Connection to Supabase
# This script connects to Supabase and retrieves the actual database structure

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Database Structure Inspection" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "ERROR: .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with SUPABASE credentials" -ForegroundColor Yellow
    exit 1
}

# Read environment variables
$envContent = Get-Content ".env.local" -Raw
$supabaseUrl = if ($envContent -match 'NEXT_PUBLIC_SUPABASE_URL=(.+)') { $matches[1].Trim() } else { $null }
$supabaseKey = if ($envContent -match 'NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)') { $matches[1].Trim() } else { $null }

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "ERROR: Missing Supabase credentials in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "Supabase URL: $supabaseUrl" -ForegroundColor Green
Write-Host ""

# Create SQL inspection script
$inspectionSQL = @"
-- Get users table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'users'
ORDER BY ordinal_position;
"@

Write-Host "Fetching users table structure from Supabase..." -ForegroundColor Yellow
Write-Host ""

# Use Supabase REST API to execute query
$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
}

# Query using PostgREST
try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method POST -Headers $headers -Body (@{
        query = $inspectionSQL
    } | ConvertTo-Json) -ErrorAction Stop
    
    Write-Host "SUCCESS: Connected to database!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Using alternative method to inspect database..." -ForegroundColor Yellow
    Write-Host ""
    
    # Try to query users table directly to see available columns
    try {
        $usersResponse = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/users?limit=0" -Method GET -Headers $headers -ErrorAction Stop
        Write-Host "SUCCESS: Can access users table" -ForegroundColor Green
    } catch {
        $errorDetail = $_.Exception.Message
        if ($errorDetail -like "*column*does not exist*") {
            Write-Host "ERROR: Some columns are missing or have different names" -ForegroundColor Red
            Write-Host $errorDetail -ForegroundColor Yellow
        } else {
            Write-Host "ERROR: Cannot access users table" -ForegroundColor Red
            Write-Host $errorDetail -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Manual Inspection Required" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please run these queries directly in Supabase SQL Editor:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Check users table structure:" -ForegroundColor White
Write-Host "   SELECT column_name, data_type FROM information_schema.columns" -ForegroundColor Cyan
Write-Host "   WHERE table_name = 'users' ORDER BY ordinal_position;" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Check auth.users table:" -ForegroundColor White
Write-Host "   SELECT id, email, raw_user_meta_data FROM auth.users LIMIT 1;" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Check if public.users exists:" -ForegroundColor White
Write-Host "   SELECT * FROM users LIMIT 1;" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. List all tables:" -ForegroundColor White
Write-Host "   SELECT table_name FROM information_schema.tables" -ForegroundColor Cyan
Write-Host "   WHERE table_schema = 'public';" -ForegroundColor Cyan
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After running these queries, paste the results here." -ForegroundColor Green
Write-Host ""
