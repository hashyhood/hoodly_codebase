@echo off
echo ========================================
echo    Uploading Hoodly Codebase to GitHub
echo ========================================
echo.

echo [1/4] Checking Git status...
git status --porcelain

echo.
echo [2/4] Adding all files to Git...
git add .

echo.
echo [3/4] Committing changes...
git commit -m "Add CI/CD pipeline: Jest testing, GitHub Actions, and security improvements"

echo.
echo [4/4] Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo    Upload Complete!
echo ========================================
echo.
echo Your codebase has been uploaded to:
echo https://github.com/hashyhood/hoodly_codebase
echo.
echo Check the Actions tab for CI/CD status.
echo.
pause
