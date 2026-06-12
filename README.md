# 🎮 Smile Life - Jeu de Cartes Multijoueur

Un jeu de cartes stratégique et amusant en temps réel pour 2 à 6 joueurs !

## 🚀 Démarrage Rapide

### Jouer en Solo ou Réseau Local (LAN)

```bash
# Double-cliquer sur :
scripts/start-lan.bat
```

Ou manuellement :

```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend  
cd frontend
npm install
npm start
```

Le jeu s'ouvre automatiquement sur `http://localhost:3000`

## 🌐 Jouer avec des Amis

### Sur le même WiFi

1. Lance le jeu avec `scripts/start-lan.bat`
2. Note ton adresse IP affichée dans la console Backend
3. Tes amis vont sur `http://TON_IP:3000`
4. Ils configurent le serveur : `http://TON_IP:3001`
5. Créez/rejoignez un salon et jouez !

📖 **Guide complet** : `Documentation/GUIDE-LAN.md`

### Via Internet (Ngrok)

```bash
scripts/start-avec-ngrok.bat
```

📖 **Guide complet** : `Documentation/GUIDE-NGROK.md`

## 📚 Documentation

| Fichier | Description |
|---------|-------------|
| `Documentation/QUICKSTART.md` | Guide de démarrage complet |
| `Documentation/GUIDE-LAN.md` | Jouer en réseau local |
| `Documentation/GUIDE-NGROK.md` | Jouer via Internet |
| `Documentation/GUIDE-CARTES.md` | Créer des cartes personnalisées |

## 🎯 Fonctionnalités

- ✅ Multijoueur en temps réel (Socket.io)
- ✅ 2 à 6 joueurs
- ✅ Salons privés avec codes (copiables en un clic)
- ✅ Interface moderne (thème sombre, cartes colorées par type, avatars)
- ✅ 100% jouable sur mobile (barre d'action tactile, chat en overlay)
- ✅ Drag & drop des cartes sur desktop
- ✅ 15 métiers dont 8 à pouvoirs spéciaux (Policier, Bandit, Pompier, Astronaute...)
- ✅ Casino avec duels de paris secrets
- ✅ Cartes spéciales : Chance, Tsunami, Anniversaire, Adultère
- ✅ Chat intégré + soundboard synchronisé + musique YouTube
- ✅ Statistiques et récompenses de fin de partie
- ✅ Cartes personnalisables (JSON)

## 🛠️ Technologies

- **Backend** : Node.js, Express, Socket.io
- **Frontend** : React 18, Socket.io-client
- **Temps réel** : WebSocket

## 📁 Structure du Projet

```
Smile Life/
├── backend/          # Serveur Node.js
│   ├── server.js     # Logique du jeu
│   └── cards/        # Cartes par défaut
├── frontend/         # Interface React
│   └── src/          # Composants
├── scripts/          # Scripts de lancement
├── Documentation/    # Guides complets
└── README.md         # Ce fichier
```

## ⚙️ Configuration

### Prérequis

- Node.js 14+ ([Télécharger](https://nodejs.org/))
- npm (inclus avec Node.js)
- Navigateur moderne (Chrome, Firefox, Edge)

### Installation

```bash
# Installer les dépendances backend
cd backend
npm install

# Installer les dépendances frontend
cd ../frontend
npm install
```

## 🎮 Comment Jouer

1. Entre ton pseudo
2. **Créer un salon** (hôte) ou **Rejoindre** avec un code
3. L'hôte lance la partie quand tout le monde est prêt
4. À ton tour : joue ou défausse une carte (ta main se recomplète à 5)
5. Quand la pioche est vide, le joueur avec le plus de Smiles 😊 gagne !

### 💼 Les métiers à pouvoirs

| Métier | Pouvoir |
|--------|---------|
| 👮 Policier | Arrête automatiquement les Bandits (3 tours de prison) |
| 🦹 Bandit | Ne peut pas être licencié, salaire niv.4 sans études |
| 🪖 Militaire | Bloque tous les attentats tant qu'il est en jeu |
| ⚖️ Avocat | Immunisé contre le Divorce |
| 🚒 Pompier | Immunisé contre les Accidents |
| 🛋️ Psychologue | Immunisé contre le Burn-out |
| 👨‍🏫 Professeur | Chaque carte Études donne +1 niveau bonus |
| 🚀 Astronaute | Tous les voyages coûtent 2 salaires de moins |
| 🤳 Influenceur | +1 smile bonus sur chaque carte qui en rapporte |

## 🃏 Cartes Personnalisées

Crée ton propre deck de cartes :

```bash
# Copier l'exemple
cp custom-cards-example.json mon-deck.json

# Éditer mon-deck.json
# Charger dans le jeu via l'interface
```

📖 **Guide complet** : `Documentation/GUIDE-CARTES.md`

## 🐛 Dépannage

### Le jeu ne se lance pas

```bash
# Vérifier Node.js
node --version  # Doit afficher v14+

# Réinstaller les dépendances
cd backend && npm install
cd ../frontend && npm install
```

### Erreur de connexion en LAN

1. Vérifie ton pare-feu Windows
2. Autorise Node.js sur les réseaux privés
3. Utilise ton adresse IP locale (pas 127.0.0.1)

### Le frontend ne se connecte pas au backend

1. Vérifie que le backend est lancé (port 3001)
2. Configure l'adresse serveur via ⚙️
3. Vérifie la console pour les erreurs

## 📜 Licence

Projet personnel - Utilisation libre

## 🤝 Contribution

N'hésite pas à proposer des améliorations ou reporter des bugs !

---

**Bon jeu ! 🎉**
