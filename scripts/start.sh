#!/bin/bash

echo "╔═══════════════════════════════════════╗"
echo "║   😊 Smile Life - Démarrage 😊      ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Fonction pour vérifier si un processus tourne sur un port
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Vérification des dépendances..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    echo "Installez Node.js depuis https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) détecté${NC}"

# Installation des dépendances backend
if [ ! -d "backend/node_modules" ]; then
    echo ""
    echo "📦 Installation des dépendances backend..."
    cd backend && npm install && cd ..
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dépendances backend installées${NC}"
    else
        echo -e "${RED}❌ Erreur lors de l'installation du backend${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Dépendances backend déjà installées${NC}"
fi

# Installation des dépendances frontend
if [ ! -d "frontend/node_modules" ]; then
    echo ""
    echo "📦 Installation des dépendances frontend..."
    cd frontend && npm install && cd ..
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dépendances frontend installées${NC}"
    else
        echo -e "${RED}❌ Erreur lors de l'installation du frontend${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Dépendances frontend déjà installées${NC}"
fi

# Vérifier si les ports sont disponibles
echo ""
echo "🔌 Vérification des ports..."

if check_port 3001; then
    echo -e "${YELLOW}⚠️  Le port 3001 (backend) est déjà utilisé${NC}"
    echo "Arrêtez le processus qui utilise ce port et réessayez"
    exit 1
fi

if check_port 3000; then
    echo -e "${YELLOW}⚠️  Le port 3000 (frontend) est déjà utilisé${NC}"
    echo "Arrêtez le processus qui utilise ce port et réessayez"
    exit 1
fi

echo -e "${GREEN}✅ Ports disponibles${NC}"

# Démarrer le backend
echo ""
echo "🚀 Démarrage du serveur backend..."
cd backend
node server.js &
BACKEND_PID=$!
cd ..

# Attendre que le backend démarre
sleep 3

if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend lancé (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Échec du démarrage du backend${NC}"
    exit 1
fi

# Démarrer le frontend
echo ""
echo "🎨 Démarrage du frontend..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║         🎮 Serveur lancé ! 🎮       ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "📡 Backend : http://localhost:3001"
echo "🌐 Frontend : http://localhost:3000"
echo ""
echo "Le navigateur va s'ouvrir automatiquement..."
echo ""
echo "Pour arrêter le serveur : Ctrl+C"
echo ""

# Fonction de nettoyage lors de l'arrêt
cleanup() {
    echo ""
    echo "🛑 Arrêt du serveur..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Serveur arrêté"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Garder le script actif
wait
