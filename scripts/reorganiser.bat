@echo off
echo ╔════════════════════════════════════════╗
echo ║  Reorganisation des fichiers...      ║
echo ╚════════════════════════════════════════╝
echo.

REM Créer la structure de dossiers
echo 📁 Creation de la structure de dossiers...
mkdir backend 2>nul
mkdir backend\cards 2>nul
mkdir frontend 2>nul
mkdir frontend\src 2>nul
mkdir frontend\public 2>nul

echo.
echo 📦 Deplacement des fichiers backend...
move server.js backend\ 2>nul
move default-cards.json backend\cards\ 2>nul

REM Créer le package.json du backend
echo {   "name": "smile-life-backend",   "version": "1.0.0",   "main": "server.js",   "scripts": {     "start": "node server.js"   },   "dependencies": {     "express": "^4.18.2",     "socket.io": "^4.6.1",     "cors": "^2.8.5"   } } > backend\package.json

echo.
echo 📦 Deplacement des fichiers frontend...
move App.js frontend\src\ 2>nul
move App.css frontend\src\ 2>nul
move index.js frontend\src\ 2>nul
move index.css frontend\src\ 2>nul
move index.html frontend\public\ 2>nul

REM Utiliser le BON package.json du frontend (celui dans mnt)
move mnt\user-data\outputs\smile-life-game\frontend\package.json frontend\ 2>nul

echo.
echo 🧹 Nettoyage...
REM Supprimer le mauvais package.json à la racine
del package.json 2>nul
REM Supprimer le dossier mnt complet
rmdir /s /q mnt 2>nul

echo.
echo ╔════════════════════════════════════════╗
echo ║  ✅ Reorganisation terminee !         ║
echo ╚════════════════════════════════════════╝
echo.
echo Structure finale:
echo.
echo smile-life-game\
echo ├── backend\
echo │   ├── server.js
echo │   ├── package.json
echo │   └── cards\
echo │       └── default-cards.json
echo ├── frontend\
echo │   ├── package.json  ^(le bon avec React^)
echo │   ├── src\
echo │   │   ├── App.js
echo │   │   ├── App.css
echo │   │   ├── index.js
echo │   │   └── index.css
echo │   └── public\
echo │       └── index.html
echo ├── README.md
echo ├── GUIDE-CARTES.md
echo ├── start.bat
echo └── ...
echo.
echo 🚀 Tu peux maintenant lancer: start.bat
echo.
pause