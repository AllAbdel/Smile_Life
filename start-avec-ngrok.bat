@echo off
echo ╔════════════════════════════════════════╗
echo ║   🌐 Smile Life + ngrok               ║
echo ╚════════════════════════════════════════╝
echo.

REM Vérifier si ngrok est installé
where ngrok >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ngrok n'est pas installé ou pas dans le PATH
    echo.
    echo Télécharge ngrok depuis : https://ngrok.com/download
    echo Puis place ngrok.exe dans C:\ngrok\ ou ajoute-le au PATH
    echo.
    pause
    exit /b 1
)

echo ✅ ngrok détecté
echo.

REM Vérifier les dépendances
if not exist "backend\node_modules" (
    echo 📦 Installation backend...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo 📦 Installation frontend...
    cd frontend
    call npm install
    cd ..
)

echo.
echo 🚀 Lancement du backend...
start "Smile Life Backend" cmd /k "cd backend && node server.js"

timeout /t 3 /nobreak >nul

echo 🌐 Lancement du tunnel ngrok...
start "ngrok Tunnel" cmd /k "ngrok http 3001"

echo.
echo ⏳ Attente du tunnel ngrok (10 secondes)...
timeout /t 10 /nobreak >nul

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  📋 INSTRUCTIONS :                                        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 1. Dans la fenêtre "ngrok Tunnel", copie l'URL qui ressemble à :
echo    https://XXXX-XXX-XXX-XXX.ngrok-free.app
echo.
echo 2. Modifie frontend\src\App.js ligne 7 :
echo    const SOCKET_URL = 'https://TON-URL-NGROK-ICI';
echo.
echo 3. Appuie sur une touche pour lancer le frontend...
pause

echo.
echo 🎨 Lancement du frontend...
start "Smile Life Frontend" cmd /k "cd frontend && npm start"

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  ✅ Tout est lancé !                                      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📡 Backend local : http://localhost:3001
echo 🌐 Frontend local : http://localhost:3000
echo 🌍 URL publique : Voir la fenêtre ngrok
echo.
echo 💡 Partage l'URL ngrok avec tes amis pour jouer en ligne !
echo.
echo Pour arrêter : Ferme toutes les fenêtres ou utilise stop.bat
echo.
pause
