@echo off
echo Stopping Application...
cd /d "%~dp0client"
call .\\node_modules\\.bin\\pm2 stop calendar-client
call .\\node_modules\\.bin\\pm2 delete calendar-client
echo Application Stopped.
pause