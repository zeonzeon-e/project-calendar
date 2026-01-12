@echo off
echo Building Static Site...
cd client
call npm install
call npm run build
echo Build complete! The static files are in the 'client/out' folder.
echo You can upload the contents of 'client/out' to GitHub Pages, Netlify, or any static hosting.
pause
