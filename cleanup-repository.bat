@echo off
echo ========================================
echo    Cleaning Up Repository
echo ========================================
echo.

echo [1/4] Removing sensitive files from Git tracking...
git rm --cached -r node_modules/ 2>nul
git rm --cached .env 2>nul
git rm --cached .env.local 2>nul
git rm --cached .env.production 2>nul
git rm --cached package-lock.json 2>nul

echo.
echo [2/4] Adding updated .gitignore...
git add .gitignore

echo.
echo [3/4] Committing cleanup changes...
git commit -m "Remove sensitive files and update .gitignore"

echo.
echo [4/4] Pushing cleanup to GitHub...
git push origin main

echo.
echo ========================================
echo    Cleanup Complete!
echo ========================================
echo.
echo Sensitive files have been removed from:
echo - node_modules/
echo - .env files
echo - package-lock.json
echo.
echo Your .gitignore is now properly enforced.
echo.
pause
