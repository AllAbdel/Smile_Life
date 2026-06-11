# System Patterns — Smile Life

## Architecture globale
```
frontend (React, port 3000)  ←─ WebSocket (socket.io) ─→  backend (Node/Express, port 3001)
                                                            └── cards/default-cards.json (deck)
electron.js : enrobe le tout en app desktop (optionnel)
```

## Principes
- **Le serveur fait autorité** : toutes les règles sont validées côté backend (`Game.applyCardToPlayer`). Le frontend ne fait que des pré-validations UX (zones de drop).
- **État par salon** : `games: Map<roomId, Game>` et `players: Map<socketId, {roomId, playerName}>`. Tout est en mémoire, rien n'est persisté.
- **Diffusion** : événements socket.io vers la room (`io.to(roomId).emit`) pour l'état public, vers le socket individuel pour la main privée (`hand-update`).
- **État public vs privé** : `getPublicGameState()` ne doit JAMAIS exposer les mains ni les infos cachées (ex : niveau du premier pari casino). La main passe uniquement par `hand-update`.

## Backend (`backend/server.js`)
- Classe `Game` : deck, défausse, joueurs, tour, casino. Méthodes clés :
  - `playCard(playerId, cardIndex, targetId, action)` — point d'entrée des actions (`play-self`, `play-opponent`, `discard`).
  - `applyCardToPlayer(card, player, isNegative)` — switch sur `card.type` : study, job, salary, flirt, marriage, child, pet, travel, housing, malus, adultery, chance, casino, tsunami, special...
  - `applyMalus(card, player)` — switch sur `card.effect` : divorce, fired, accident, burnout, skip_turn, prison, attack...
  - `nextTurn()` — gère prison (`prisonTurns`) et tours sautés (`skipNextTurn`).
- **Cartes à usage unique** (chance, tsunami) : ne sont PAS ajoutées à `playedCards` ni à la défausse → retirées du jeu.
- **Pouvoirs de métiers = flags sur la carte JSON** : `arrestsBandit`, `cannotBeFired`, `preventAttacks`, `canStudyWhileWorking`, `canQuitInstantly`, `maxSalaryLevel`, `requiredStudies`. Pour ajouter un pouvoir : ajouter un flag dans le JSON + le gérer dans `applyCardToPlayer`/`applyMalus`.

## Frontend (`frontend/src/`)
- `App.js` : composant racine, gère le socket, les écrans (menu / lobby / playing / gameover) et tout l'état du jeu.
- Composants : `Documentation` (guide in-game), `MediaPanel` (musique YouTube + soundboard), `Confetti`, `SoundManager` (sons procéduraux Web Audio, pas de fichiers).
- **Drag & drop** : cartes de la main → zones de drop (soi-même, adversaire, casino, défausse). Ghost custom suivant la souris. Sur mobile : sélection par tap + boutons d'action.
- Le frontend reconstruit `playerData` à partir de `gameState.players` + `hand` privée.

## Conventions
- Code et messages en **français** (UI, messages serveur, commits).
- IDs de cartes : `type-n` (ex : `job-3`, `malus-7`). Attention : les vérifications par id (`special-2`...) sont fragiles — préférer `card.type`.
- Les cartes ont : `id, name, type, smiles, description, image (emoji), quantity` + champs spécifiques au type.
- Cartes custom : même schéma JSON, chargées côté client et envoyées au serveur à la création de la partie.

## Pièges connus
- `cardIndex` envoyé par le client référence la main au moment du clic — toute mutation de main côté serveur entre-temps désynchronise les index.
- Un joueur qui se déconnecte en pleine partie est retiré du tableau `players` → l'index du tour doit être réajusté.
- `socket.id` change à la reconnexion : pas de reprise de partie possible (limitation actuelle).
