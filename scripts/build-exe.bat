@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║          🎮 SMILE LIFE - BUILD EXECUTABLE 🎮             ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

echo [1/4] 🧹 Nettoyage des anciens builds...
if exist dist rmdir /s /q dist
if exist frontend\build rmdir /s /q frontend\build
echo ✅ Nettoyage terminé
echo.

echo [2/4] 📦 Installation des dépendances backend...
cd backend
call npm install
cd ..
echo ✅ Backend prêt
echo.

echo [3/4] ⚛️ Build du frontend React...
cd frontend
call npm install
call npm run build
cd ..
echo ✅ Frontend buildé
echo.

echo [4/4] 🚀 Création de l'exécutable Windows...
call npm run dist
echo.

if exist dist\Smile-Life-Portable.exe (
    echo.
    echo ╔═══════════════════════════════════════════════════════════╗
    echo ║                ✅ BUILD RÉUSSI ! ✅                       ║
    echo ╚═══════════════════════════════════════════════════════════╝
    echo.
    echo 📁 Fichiers créés dans le dossier 'dist\' :
    echo.
    dir /b dist\*.exe
    echo.
    echo 💡 Vous pouvez maintenant distribuer ces fichiers !
    echo.
) else (
    echo.
    echo ╔═══════════════════════════════════════════════════════════╗
    echo ║                ❌ ERREUR DE BUILD ❌                      ║
    echo ╚═══════════════════════════════════════════════════════════╝
    echo.
    echo Consultez les messages d'erreur ci-dessus.
    echo.
)

pause
