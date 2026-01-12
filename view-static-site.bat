@echo off
echo Starting Static Web Server...
echo This will allow you to view the exported site locally.
cd client
echo Serving 'out' directory on http://localhost:3000
npx serve out
pause
