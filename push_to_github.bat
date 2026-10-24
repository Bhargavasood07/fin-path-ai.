@echo off
title FinPath AI - Push to GitHub
echo ========================================================
echo Pushing FinPath AI to https://github.com/Bhargavasood07/FIN-PATH-AI.git
echo ========================================================
cd /d "%~dp0"

git branch -M main
git remote set-url origin https://github.com/Bhargavasood07/FIN-PATH-AI.git 2>nul || git remote add origin https://github.com/Bhargavasood07/FIN-PATH-AI.git

echo.
git push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo SUCCESS! Code successfully pushed to GitHub:
    echo https://github.com/Bhargavasood07/FIN-PATH-AI
    echo ========================================================
) else (
    echo An error occurred during push.
)
pause
