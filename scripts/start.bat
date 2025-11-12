@echo off
echo ╔═══════════════════════════════════════╗
echo ║   😊 Smile Life - Démarrage 😊      ║
echo ╚═══════════════════════════════════════╝
echo.

echo 🔍 Vérification des dépendances...
echo.

REM Vérifier Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js n'est pas installé
    echo Installez Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js détecté
echo.

REM Installation des dépendances backend
if not exist "backend\node_modules" (
    echo 📦 Installation des dépendances backend...
    cd backend
    call npm install
    cd ..
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Erreur lors de l'installation du backend
        pause
        exit /b 1
    )
    echo ✅ Dépendances backend installées
) else (
    echo ✅ Dépendances backend déjà installées
)

echo.

REM Installation des dépendances frontend
if not exist "frontend\node_modules" (
    echo 📦 Installation des dépendances frontend...
    cd frontend
    call npm install
    cd ..
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Erreur lors de l'installation du frontend
        pause
        exit /b 1
    )
    echo ✅ Dépendances frontend installées
) else (
    echo ✅ Dépendances frontend déjà installées
)

echo.
echo ╔═══════════════════════════════════════╗
echo ║         🎮 Lancement... 🎮          ║
echo ╚═══════════════════════════════════════╝
echo.

REM Démarrer le backend dans une nouvelle fenêtre
echo 🚀 Démarrage du serveur backend...
start "Smile Life Backend" cmd /k "cd backend && node server.js"

timeout /t 3 /nobreak >nul

REM Démarrer le frontend dans une nouvelle fenêtre
echo 🎨 Démarrage du frontend...
start "Smile Life Frontend" cmd /k "cd frontend && npm start"

echo.
echo ╔═══════════════════════════════════════╗
echo ║         🎮 Serveur lancé ! 🎮       ║
echo ╚═══════════════════════════════════════╝
echo.
echo 📡 Backend : http://localhost:3001
echo 🌐 Frontend : http://localhost:3000
echo.
echo Le navigateur va s'ouvrir automatiquement...
echo.
echo Pour arrêter : Fermez les fenêtres de commande
echo.
pause
