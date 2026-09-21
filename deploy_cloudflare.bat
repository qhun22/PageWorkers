@echo off
cd /d "%~dp0"
echo ===================================================
echo [1/4] Kiem tra va cai dat dependencies...
call npm install
echo.
echo [2/4] Khoi tao va Migrate Database SQLite len Cloud...
:: Chạy migrate db lên Cloud (thêm --remote)
call npx wrangler d1 execute auth-db --remote --file=./migrations/schema.sql --yes
echo.
echo [3/4] Upload ngam cac Secret Key len Cloudflare...
:: Nhập key thật ở local shell hoặc set trong Cloudflare Dashboard để tránh lưu secret vào repo
echo <PASTE_RESEND_API_KEY> | npx wrangler secret put RESEND_API_KEY
echo <PASTE_JWT_SECRET> | npx wrangler secret put JWT_SECRET
echo.
echo [4/4] Bat dau build va Deploy Worker len Cloudflare...
call npx wrangler deploy
echo ===================================================
echo TIEN TRINH HOAN TAT! San sang quay video demo.
pause