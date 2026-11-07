@echo off
title ClassPulse AI - Expo Mobile Dev Server
echo ===================================================
echo Starting ClassPulse AI Mobile Frontend (Expo)...
echo ===================================================
cd /d "c:\python\Machine Learning\ClassPulseAI\mobile"

if not exist node_modules (
    echo Installing node dependencies...
    call npm install
)

if not exist .env (
    echo Creating mobile/.env from template...
    copy .env.example .env
)

echo.
echo Starting Expo Metro Bundler...
echo Scan the QR code displayed below with Expo Go on your Android device!
echo.
call npx expo start
pause
