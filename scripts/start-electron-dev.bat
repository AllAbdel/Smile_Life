@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║       🎮 SMILE LIFE - MODE DÉVELOPPEMENT ELECTRON        ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo 🚀 Démarrage du jeu en mode Electron...
echo.
echo ⚠️  Une fenêtre va s'ouvrir dans quelques secondes
echo ⚠️  Laissez cette console ouverte pendant le jeu
echo.

call npm run electron:dev
