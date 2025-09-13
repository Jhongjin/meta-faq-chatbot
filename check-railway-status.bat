@echo off
echo Checking Railway deployment status...
echo.

echo 1. Checking service status...
railway status
echo.

echo 2. Checking recent logs (last 20 lines)...
railway logs | head -20
echo.

echo 3. Checking if service is responding...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://ad-mate.railway.app/ || echo "Service not accessible via public URL"
echo.

echo 4. Checking Railway variables...
railway variables | findstr "PORT\|OLLAMA\|SUPABASE"
echo.

echo Status check completed!
pause
