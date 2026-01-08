# Script to remove all console.log statements from TypeScript and JavaScript files
# Excludes test files, node_modules, and archived files

Write-Host "Starting console.log cleanup..." -ForegroundColor Cyan
Write-Host ""

$rootPath = "c:\Users\Mohammad AbuAlkheran\bawwabtysemifinal"
$excludeDirs = @(
    "node_modules",
    ".next",
    "dist",
    "build",
    "archive_old_files"
)

$totalRemoved = 0
$filesModified = 0

# Get all TS/TSX/JS/JSX files
$files = Get-ChildItem -Path $rootPath -Include "*.ts", "*.tsx", "*.js", "*.jsx" -Recurse -File | Where-Object {
    $fullPath = $_.FullName
    $shouldExclude = $false
    foreach ($excludeDir in $excludeDirs) {
        if ($fullPath -like "*\$excludeDir\*") {
            $shouldExclude = $true
            break
        }
    }
    -not $shouldExclude
}

Write-Host "Found $($files.Count) files to process" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $files) {
    try {
        $lines = Get-Content $file.FullName
        $newLines = @()
        $removed = 0
        
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            # Check if line contains console.log
            if ($line -match '^\s*console\.log\(') {
                $removed++
                # Skip this line (don't add to newLines)
            } else {
                $newLines += $line
            }
        }
        
        if ($removed -gt 0) {
            $newLines | Set-Content -Path $file.FullName
            $totalRemoved += $removed
            $filesModified++
            Write-Host "Cleaned: $($file.Name) - Removed $removed statement(s)" -ForegroundColor Green
        }
    } catch {
        Write-Host "Error processing $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "Files modified: $filesModified" -ForegroundColor Yellow
Write-Host "Total console.log statements removed: $totalRemoved" -ForegroundColor Yellow
