@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 pause ^& exit /b 1
)

if exist "src\img\ip17prm.webp" (
  echo Updating product images from src\img...
  powershell -NoProfile -Command "$b1 = [Convert]::ToBase64String([IO.File]::ReadAllBytes('src/img/ip17prm.webp')); $b2 = [Convert]::ToBase64String([IO.File]::ReadAllBytes('src/img/ip18prm.webp')); $c = 'export const IP17_BASE64: string = ''data:image/webp;base64,' + $b1 + ''';' + [Environment]::NewLine + 'export const IP18_BASE64: string = ''data:image/webp;base64,' + $b2 + ''';' + [Environment]::NewLine; [IO.File]::WriteAllText('src/images.ts', $c)"
)

echo Starting Wrangler dev server on port 8788...
start "Pageworkers Wrangler Dev" /D "%~dp0" cmd /k "npx wrangler dev --port 8788"



echo Waiting for the local Worker...
for /l %%i in (1,1,20) do (
  curl.exe -sS -X GET "http://localhost:8788/init-db" >nul 2>&1
  if not errorlevel 1 (
    echo Local database initialized.
    exit /b 0
  )
  timeout /t 1 /nobreak >nul
)

echo Could not reach http://localhost:8788/init-db.
pause
exit /b 1