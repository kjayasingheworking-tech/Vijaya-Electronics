@echo off
echo This script will help free up port 5001 for your Node.js server
echo You need to run this as Administrator

echo.
echo Checking what's using port 5001...
netstat -aon | findstr :5001

echo.
echo Attempting to exclude port 5001 from Windows reserved ports...
netsh int ipv4 add excludedportrange protocol=tcp startport=5001 numberofports=1

echo.
echo If the above failed, you may need to:
echo 1. Run this command as Administrator
echo 2. Or temporarily disable the SSDP Discovery service:
echo    net stop SSDPSRV
echo 3. Then restart your Node.js server
echo 4. Re-enable SSDP later with: net start SSDPSRV

pause