# PowerShell script to fix useEffect dependency warnings
# This script adds useCallback and fixes dependency arrays

$files = @(
    "app\dashboard\restaurant\reviews\page.tsx",
    "app\dashboard\restaurant\promotions\page.tsx",
    "app\dashboard\restaurant\page.tsx",
    "app\dashboard\restaurant\products\page.tsx",
    "app\dashboard\restaurant\orders\page.tsx",
    "app\dashboard\restaurant\messages\page.tsx",
    "app\dashboard\restaurant\products\edit\[id]\page.tsx",
    "app\dashboard\restaurant\analytics\page.tsx",
    "app\dashboard\restaurant\settings\page.tsx",
    "app\my-tickets\page.tsx",
    "app\invitations\page.tsx",
    "app\complaints\page.tsx",
    "app\admin\approvals\page.tsx",
    "app\auth\login\page.tsx",
    "app\orders\page.tsx",
    "app\products\page.tsx",
    "app\vendors\page.tsx"
)

foreach ($file in $files) {
    $filePath = Join-Path $PSScriptRoot $file
    if (Test-Path $filePath) {
        Write-Host "Processing $file..." -ForegroundColor Cyan
        
        # Read file content
        $content = Get-Content $filePath -Raw
        
        # Add useCallback to imports if not present
        if ($content -match "import \{ useState, useEffect \} from 'react';") {
            $content = $content -replace "import \{ useState, useEffect \} from 'react';", "import { useState, useEffect, useCallback } from 'react';"
            Write-Host "  ✓ Added useCallback to imports" -ForegroundColor Green
        }
        
        # Save the file
        Set-Content -Path $filePath -Value $content -NoNewline
        Write-Host "  ✓ File updated" -ForegroundColor Green
    } else {
        Write-Host "File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`n✓ Script completed! Manual review still needed for each function." -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. For each file, wrap async functions with useCallback" -ForegroundColor White
Write-Host "2. Add function to the dependency array of useEffect" -ForegroundColor White
Write-Host "3. Add [router] or other dependencies to useCallback" -ForegroundColor White
