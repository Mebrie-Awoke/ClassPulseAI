@echo off
title ClassPulse AI - Launcher
echo ===================================================
echo Launching ClassPulse AI (Backend + Mobile)
echo ===================================================
echo.
echo 1. Launching Backend in a new window...
start "ClassPulse AI - Backend" cmd /k "c:\python\Machine Learning\ClassPulseAI\run_backend.bat"

echo 2. Launching Mobile Expo Dev Server in a new window...
start "ClassPulse AI - Mobile" cmd /k "c:\python\Machine Learning\ClassPulseAI\run_mobile.bat"

echo.
echo Both servers have been launched in separate terminal windows!
echo - Check the Mobile window for the Expo QR Code.
echo - Check the Backend window for the FastAPI logs.
echo.
pause
