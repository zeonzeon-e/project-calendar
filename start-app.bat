@echo off
set "URL=http://localhost:3002"

:: 1. Navigate to Client Dir
cd /d "%~dp0client"

echo [INFO] Attempting to start with local PM2...

:: Try Starting with Local PM2
call .\\node_modules\\.bin\\pm2 start ecosystem.config.js
if %errorlevel% equ 0 (
    echo [SUCCESS] App started with PM2.
    echo Server is running at %URL%
    echo (Browser will not open automatically.)
    exit /b 0
)

:: 2. Fallback: If PM2 fails, run standard npm start
echo [ERROR] Local PM2 failed to start. Falling back to 'npm start'.
echo [INFO] This will run in a visible window to keep the server alive.

start "Project Calendar Server" npm start

echo Server started. Access it at %URL%
timeout /t 5 >nul