# Active Context — Smile Life

> Dernière mise à jour : 2026-06-11

## Travail en cours : grande refonte
Le projet subit une refonte majeure demandée par AllAbdel :
1. ✅ Nettoyage du dépôt git (node_modules et logs hors suivi).
2. ✅ Création de la Memory Bank (ce dossier).
3. 🔄 Correction des bugs et incohérences backend.
4. 🔄 Nouveaux rôles/métiers à pouvoirs spéciaux.
5. 🔄 Refonte visuelle complète du frontend (design system, composants).
6. 🔄 Responsive mobile au maximum.
7. 🔄 Mise à jour de la documentation in-game.

## Bugs identifiés à corriger (audit du 2026-06-11)
- **Fuite d'info casino** : `getPublicGameState()` envoie `casinoBets` avec `betAmount` → le pari "caché" est visible dans les devtools.
- **Déconnexion en partie** : `removePlayer` ne réajuste pas `currentPlayerIndex` → tour bloqué ou sauté.
- **Drag & drop casino** : `App.js` teste `card.id === 'special-1'` (Adultère) au lieu de `special-4` (Casino).
- **Double modal Chance** : `showDiscardPicker` + `showChanceModal` font deux flux concurrents pour la même carte ; `takeDiscardCard` rejoue la carte avec un index potentiellement décalé.
- **Prison via Policier vs carte Prison** : le Policier retire les smiles du Bandit, la carte Prison non — incohérent.
- **Vol de flirt multiple** : la boucle peut voler à plusieurs joueurs mais n'en garde qu'un.
- **Fin de partie** : deux conditions différentes (`deck.length === 0` vs `isGameOver()`), scores parfois non triés, stats absentes sur certains chemins.
- **Anniversaire/Chance par id** : vérifications fragiles par `card.id` au lieu de `card.type`.

## Décisions récentes
- Chance et Tsunami sont retirées du jeu après usage (pas remises en défausse).
- Le casino reste ouvert toute la partie, duels de 2 paris cachés.
- Premier joueur du duel casino gagne si niveaux différents, deuxième si égalité.

## Prochaines étapes
Voir `progress.md` pour l'état détaillé.
