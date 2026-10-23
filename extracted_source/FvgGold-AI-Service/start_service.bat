@echo off
setlocal
cd /d "%~dp0"
if not exist .env (
  echo ERROR: .env not found. Copy .env.example to .env and configure it first.
  pause
  exit /b 1
)
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 ai_service.py
) else (
  python ai_service.py
)
