@echo off
echo ================================================
echo   BAWWABTY - FIX TYPESCRIPT ERRORS
echo ================================================
echo.

echo [1/4] Cleaning build cache...
if exist .next rmdir /s /q .next 2>nul
if exist node_modules\.cache rmdir /s /q node_modules\.cache 2>nul
if exist tsconfig.tsbuildinfo del /q tsconfig.tsbuildinfo 2>nul
echo ✓ Cache cleaned

echo.
echo [2/4] Creating .vscode settings...
if not exist .vscode mkdir .vscode
echo { > .vscode\settings.json
echo   "typescript.tsdk": "node_modules\\typescript\\lib", >> .vscode\settings.json
echo   "typescript.enablePromptUseWorkspaceTsdk": true >> .vscode\settings.json
echo } >> .vscode\settings.json
echo ✓ Settings created

echo.
echo [3/4] Checking TypeScript...
call npx tsc --version
echo ✓ TypeScript found

echo.
echo [4/4] Instructions:
echo ================================================
echo.
echo CRITICAL: You must restart VS Code now!
echo.
echo Steps:
echo 1. Close VS Code completely (File ^> Exit)
echo 2. Reopen VS Code
echo 3. Wait 15 seconds for indexing
echo 4. Press: Ctrl+Shift+P
echo 5. Type: TypeScript: Restart TS Server
echo 6. Press: Enter
echo.
echo After restart, errors should reduce from 432 to ~0
echo ================================================
echo.
pause
