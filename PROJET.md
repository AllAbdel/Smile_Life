# 😊 Smile Life - Projet Complet

## 📦 Contenu du projet

Voici ton jeu Smile Life entièrement fonctionnel !

### 🗂️ Structure

```
smile-life-game/
├── 📱 backend/              → Serveur Node.js + Socket.io
│   ├── server.js           → Logique du jeu et multijoueur
│   ├── cards/
│   │   └── default-cards.json  → 200 cartes par défaut
│   └── package.json
│
├── 🎨 frontend/             → Interface React
│   ├── src/
│   │   ├── App.js          → Composant principal (1500 lignes)
│   │   ├── App.css         → Styles complets
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   └── package.json
│
├── 📖 Documentation
│   ├── README.md           → Doc complète (400 lignes)
│   ├── QUICKSTART.md       → Démarrage rapide
│   └── GUIDE-CARTES.md     → Guide création cartes custom (600 lignes)
│
├── 🎴 custom-cards-example.json  → Exemple cartes gaming
├── 🚀 start.sh             → Script démarrage Linux/Mac
├── 🚀 start.bat            → Script démarrage Windows
└── .gitignore

```

## ✨ Fonctionnalités implémentées

### ✅ Core Game
- [x] Système de cartes complet (10 types)
- [x] Logique de jeu fidèle à Smile Life
- [x] Gestion des tours
- [x] Calcul automatique des smiles
- [x] Règles de placement des cartes
- [x] Conditions de victoire

### ✅ Multijoueur
- [x] Création de partie avec code
- [x] 2-6 joueurs simultanés
- [x] Synchronisation en temps réel (Socket.io)
- [x] Reconnexion automatique
- [x] Gestion déconnexions

### ✅ Interface
- [x] Menu principal
- [x] Lobby d'attente
- [x] Interface de jeu complète
- [x] Écran de fin de partie
- [x] Design moderne et responsive
- [x] Animations et transitions

### ✅ Chat
- [x] Chat en jeu
- [x] Messages système
- [x] Historique des actions
- [x] Scroll automatique

### ✅ Cartes personnalisées
- [x] Import JSON
- [x] Validation des cartes
- [x] Guide de création complet
- [x] Exemple thématique

## 🎯 Types de cartes supportés

1. **📚 Études** - Niveaux d'études
2. **💼 Métiers** - Avec conditions requises
3. **❤️ Flirts** - Système de vol entre joueurs
4. **💒 Mariage** - Conditions vérifiées
5. **👶 Enfants** - Illimités si marié
6. **🐾 Animaux** - Sans conditions
7. **💰 Salaires** - Liés aux métiers
8. **✈️ Voyages** - Coût en salaires
9. **💔 Malus** - Effets spéciaux (divorce, licenciement, accidents)
10. **⭐ Spéciales** - Bonus divers

## 🚀 Comment démarrer

### Méthode automatique (recommandée)

**Windows :** Double-clic sur `start.bat`
**Mac/Linux :** `./start.sh`

### Méthode manuelle

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

Accédez à : `http://localhost:3000`

## 🌐 Jouer en ligne

### Réseau local (LAN)
- Tous sur le même WiFi
- Partagez votre IP : `192.168.x.x:3000`

### Internet
- Utilisez ngrok : `ngrok http 3001`
- Ou hébergez sur un serveur

## 🎨 Personnalisation

### Créer vos cartes

1. Copiez `custom-cards-example.json`
2. Modifiez selon le `GUIDE-CARTES.md`
3. Chargez dans le menu principal

### Modifier l'interface

- Styles : `frontend/src/App.css`
- Logique : `frontend/src/App.js`

### Ajouter des règles

- Backend : `backend/server.js`
- Méthodes : `applyCardToPlayer()`, `applyMalus()`

## 📊 Statistiques du code

- **Backend** : ~600 lignes
- **Frontend** : ~1500 lignes
- **CSS** : ~800 lignes
- **Documentation** : ~1500 lignes
- **Total** : ~4400 lignes de code

## 🛠️ Technologies

- **Backend** : Node.js 14+, Express, Socket.io
- **Frontend** : React 18, Socket.io-client
- **Communication** : WebSockets temps réel
- **Format** : JSON pour les cartes

## 📝 Notes importantes

### Équilibrage
- 200 cartes par défaut dans le deck
- Distribution automatique de 5 cartes
- Pioche automatiquement mélangée

### Règles implémentées
- Maximum 5 flirts (sauf adultère)
- Vol de flirt au même endroit
- Un seul métier à la fois
- Mariage unique (sans divorce)
- Salaires consommés pour voyages

### Sécurité
- Validation des actions côté serveur
- Vérification des tours
- Conditions de cartes vérifiées

## 🎓 Apprentissage

Ce projet est idéal pour apprendre :
- Architecture client-serveur
- WebSockets et temps réel
- React hooks et state management
- Logique de jeu complexe
- Multijoueur synchronisé

## 🚧 Améliorations possibles

- [ ] Persistance des parties (base de données)
- [ ] Système de comptes utilisateurs
- [ ] Statistiques et historique
- [ ] Animations des cartes
- [ ] Sons et musique
- [ ] Mode IA (solo)
- [ ] Replays de parties
- [ ] Tournois et classements

## 🐛 Debug

### Console navigateur (F12)
- Erreurs JavaScript
- Messages réseau
- État du jeu

### Console serveur
- Connexions/déconnexions
- Actions des joueurs
- Erreurs backend

## 📞 Support

**Problème ?** Consultez :
1. `QUICKSTART.md` - Solutions rapides
2. `README.md` - Documentation complète
3. Console (F12) - Messages d'erreur

## 🎉 C'est parti !

Tout est prêt pour jouer ! Lance `start.bat` (Windows) ou `./start.sh` (Mac/Linux) et amuse-toi bien !

---

**Développé avec ❤️ en JavaScript**

*Projet créé comme démonstration d'un jeu de cartes multijoueur complet*
