# Tech Context — Smile Life

## Stack
| Couche | Techno | Version |
|---|---|---|
| Backend | Node.js + Express + Socket.io | express 4, socket.io 4 |
| Frontend | React (create-react-app) + socket.io-client | react 18, react-scripts 5 |
| Desktop | Electron + electron-builder | electron 39 |
| Styles | CSS pur (pas de framework) | — |

## Lancer le projet
```bash
# Backend (port 3001, écoute sur 0.0.0.0 pour le LAN)
cd backend && npm start

# Frontend (port 3000)
cd frontend && npm start

# Les deux en même temps (racine)
npm start

# Scripts Windows tout-en-un
scripts/start-lan.bat        # LAN
scripts/start-avec-ngrok.bat # Internet via ngrok
```

## Build
```bash
npm run build          # build frontend (CRA)
npm run dist           # exécutable Windows (NSIS + portable) via electron-builder
```

## Structure
```
backend/
  server.js                  # TOUT le serveur (classe Game + handlers socket)
  cards/default-cards.json   # définition du deck
frontend/src/
  App.js / App.css           # racine + styles principaux
  Documentation.js/.css      # guide in-game
  MediaPanel.js/.css         # musique + soundboard
  Confetti.js/.css           # effet confettis
  SoundManager.js            # sons procéduraux (Web Audio API)
memory-bank/                 # documentation projet (ce dossier)
Documentation/               # guides utilisateur (LAN, ngrok, build...)
scripts/                     # .bat de lancement Windows
electron.js                  # wrapper desktop
```

## Environnement de dev
- Windows 11, PowerShell. Le frontend détecte automatiquement l'hôte (`window.location.hostname`) pour joindre le backend sur le port 3001 ; URL serveur modifiable dans l'UI (ngrok).
- Pas de tests automatisés. Vérification manuelle en lançant deux clients dans deux navigateurs.
- Pas de linter configuré au-delà d'eslint CRA par défaut.

## Contraintes
- `node_modules` et `*.log` sont ignorés par git (nettoyé le 2026-06-11).
- Le serveur garde tout en mémoire : un redémarrage efface toutes les parties.
- CORS ouvert (`origin: *`) car usage LAN/amis uniquement.
