# Product Context — Smile Life

## Pourquoi ce projet existe
Jouer à Smile Life entre amis à distance, avec des règles maison et une ambiance fun (sons, musiques, chat). Le jeu physique nécessite d'être réunis ; cette version web permet de jouer en LAN ou via Internet.

## Expérience visée
- **Lancer une partie en moins d'une minute** : créer un salon → partager le code → jouer.
- **Tour par tour fluide** : à son tour, on joue UNE carte (sur soi, sur un adversaire, ou en défausse), puis la main est automatiquement complétée à 5 cartes.
- **Lisibilité** : voir d'un coup d'œil la vie de chaque joueur (métier, famille, smiles, cartes posées).
- **Interactions principales** : drag & drop sur desktop, tap + boutons d'action sur mobile.

## Règles du jeu (référence rapide)
- **But** : avoir le plus de smiles quand la pioche est vide.
- **Tour** : jouer ou défausser 1 carte → pioche automatique jusqu'à 5 cartes → joueur suivant.
- **Études** : max 8 niveaux, requis pour certains métiers. Certains métiers permettent d'étudier en travaillant.
- **Métier** : un seul à la fois. Détermine le niveau max de salaire posable. Démission possible (saute le tour sauf métiers "démission instantanée").
- **Salaires** : niveaux 1-4, nécessitent un métier. Servent à payer voyages et logements.
- **Flirts** : max 5 (sauf adultère). Poser un flirt au même lieu que le DERNIER flirt d'un adversaire le lui vole.
- **Mariage** : nécessite ≥1 flirt. Permet les enfants et -50% sur les logements.
- **Adultère** : permet de flirter marié. Si divorce après re-flirt → perd tous les enfants.
- **Malus** : divorce, licenciement, accident, burn-out, maladie, prison (bandit), attentat (tue les enfants).
- **Casino** (règle maison) : duel de paris cachés à 2 joueurs. Même niveau → le 2e gagne ; différent → le 1er gagne. Le casino reste ouvert toute la partie.
- **Tsunami** (règle maison) : mélange et redistribue les mains de tous les joueurs. Carte retirée du jeu après usage.
- **Chance** (règle maison) : récupère n'importe quelle carte de la défausse. Carte retirée du jeu après usage.
- **Anniversaire** : vole le dernier salaire posé de chaque adversaire.

## Rôles à pouvoirs
- **Policier** : arrête automatiquement les Bandits (3 tours de prison).
- **Bandit** : ne peut pas être licencié, salaire max niv.4 sans études, mais risque la prison.
- **Militaire** : empêche tous les attentats tant qu'il est en jeu.
- Voir `systemPatterns.md` et `backend/cards/default-cards.json` pour la liste complète et les flags de pouvoir.

## Utilisateurs
Le développeur (AllAbdel) et son groupe d'amis. Public familier du jeu physique, joue souvent sur téléphone.
