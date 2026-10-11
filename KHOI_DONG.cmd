@echo off
cd /d "%~dp0apptuvanhoctap"
echo Mo trinh duyet tai http://localhost:3000
echo Giu cua so nay mo khi su dung. Nhan Ctrl+C de dung may chu.
if not exist node_modules\pg call npm ci --omit=dev
call npm start
pause
