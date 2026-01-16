@echo off
echo Checking Application Status...
cd /d "%~dp0client"
call .\\node_modules\\.bin\\pm2 status
pause