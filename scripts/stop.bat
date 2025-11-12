@echo off
echo  Arret de Smile Life...
echo.

echo Arret du serveur Node.js...
taskkill /F /IM node.exe >nul 2>&1

echo Arret des processus npm...
taskkill /F /IM npm.cmd >nul 2>&1

echo.
echo Serveurs arretes !
echo.
timeout /t 2 >nul
