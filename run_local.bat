@echo off
cd /d "%~dp0"
echo ===================================================
echo Dang chuan bi moi truong test Local...
call npm install
echo.
echo Khoi tao Database SQLite Local...
call npx wrangler d1 execute auth-db --local --file=./migrations/schema.sql --yes
echo.
echo Dang khoi dong Server Local (http://localhost:8788)...
call npx wrangler dev --port 8788
echo ===================================================
pause
