@echo off
title ClassPulse AI - FastAPI Backend
echo ===================================================
echo Starting ClassPulse AI Backend...
echo ===================================================
cd /d "c:\python\Machine Learning\ClassPulseAI\backend"

if not exist .venv (
    echo Creating Python virtual environment...
    python -m venv .venv
)

echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo Installing / verifying dependencies...
pip install -r requirements.txt

echo.
echo Starting FastAPI with Uvicorn on port 8000...
echo Swagger UI docs available at: http://localhost:8000/docs
echo Health check: http://localhost:8000/api/v1/health
echo Readiness check: http://localhost:8000/api/v1/ready
echo.

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
