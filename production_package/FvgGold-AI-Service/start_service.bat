@echo off
setlocal
title FvgGold AI Trader - Service Console
cd /d "%~dp0"

echo ===================================================
echo     FvgGold AI Trader - Python Service v2.20
echo ===================================================

if not exist .env (
    echo [ERROR] .env file not found!
    echo Please copy .env.example to .env and configure AI_SERVICE_TOKEN.
    pause
    exit /b 1
)

where py >nul 2>nul
if %errorlevel%==0 (
    py -3 app.py
) else (
    where python >nul 2>nul
    if %errorlevel%==0 (
        python app.py
    ) else (
        echo [ERROR] Python was not found in PATH!
        echo Please install Python 3 from https://www.python.org/
        pause
        exit /b 1
    )
)
pause
