# Project Brief — Smile Life

## Vision
Smile Life est un jeu de cartes multijoueur en temps réel (2 à 6 joueurs) inspiré du jeu de société du même nom. Chaque joueur construit sa vie (études, métier, amour, famille, voyages...) pour accumuler un maximum de **smiles (😊)** tout en sabotant la vie des adversaires avec des malus.

## Objectifs principaux
1. **Jouable entre amis** : en LAN, via ngrok, ou en local — zéro friction pour lancer une partie.
2. **Fun avant tout** : soundboard, musiques d'ambiance, chat, confettis, animations.
3. **Fidèle à l'esprit du jeu original** mais avec des règles maison (casino, tsunami, rôles à pouvoirs...).
4. **Beau et moderne** : interface soignée, responsive mobile au maximum.

## Périmètre
- Backend Node.js (Express + Socket.io) qui fait autorité sur toutes les règles.
- Frontend React (create-react-app) connecté en WebSocket.
- Distribution possible en exécutable Windows via Electron.
- Cartes personnalisables via fichier JSON chargeable au lancement.

## Hors périmètre (pour l'instant)
- Comptes utilisateurs / persistance des parties.
- Matchmaking public en ligne.
- Application mobile native (le web mobile doit suffire).

## Critères de succès
- Une partie complète se déroule sans bug ni blocage de tour.
- L'interface est agréable sur desktop ET sur téléphone.
- Les règles sont cohérentes et documentées en jeu (panneau Guide).
