@echo off
chcp 65001 >nul
echo ╔══════════════════════════════════════════════════╗
echo ║         🎮 SMILE LIFE - MODE RÉSEAU LOCAL       ║
echo ╚══════════════════════════════════════════════════╝
echo.
echo 📡 Démarrage du serveur en mode LAN...
echo.
echo ⚠️  IMPORTANT : Partage l'adresse IP affichée ci-dessous
echo     avec tes amis pour qu'ils puissent rejoindre !
echo.
echo ════════════════════════════════════════════════════
echo.

REM Démarrer le backend
cd backend
start "Smile Life - Backend" cmd /k "npm start"
timeout /t 3 /nobreak >nul

REM Démarrer le frontend
cd ..\frontend
start "Smile Life - Frontend" cmd /k "npm start"

echo.
echo ✅ Serveur démarré !
echo.
echo 📝 Instructions pour tes amis :
echo    1. Regarde l'adresse IP dans la fenêtre "Backend"
echo    2. Ils doivent ouvrir leur navigateur
echo    3. Entrer : http://TON_IP:3000
echo    4. Cliquer sur ⚙️ en haut à droite
echo    5. Entrer l'adresse serveur : http://TON_IP:3001
echo.
echo 💡 TON_IP = l'adresse affichée dans la fenêtre Backend
echo    (exemple : http://192.168.1.10:3000)
echo.
pause
