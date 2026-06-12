# Active Context — Smile Life

> Dernière mise à jour : 2026-06-12

## État : grande refonte terminée
La refonte complète demandée par AllAbdel est livrée (voir `progress.md`) :
backend refactorisé (`game.js` + `server.js`), bugs corrigés, 5 nouveaux métiers
à pouvoirs, refonte visuelle totale (design system sombre, composants GameCard /
CategoryPiles, barre d'action tactile), responsive mobile, documentation à jour.

## Décisions de règles (référence)
- Chance et Tsunami sont retirées du jeu après usage (pas remises en défausse).
- La carte Chance suspend le tour : le joueur DOIT choisir une carte de la défausse
  (`chancePending` côté serveur) avant que le tour passe.
- Le casino reste ouvert toute la partie ; duels de 2 paris dont les niveaux sont
  réellement secrets (jamais exposés dans l'état public).
- Parier au casino coûte un tour : pendant son tour → le tour passe ; hors de son
  tour → `skipNextTurn`.
- Premier parieur gagne si niveaux différents, deuxième si égalité.
- Licenciement ET démission : on garde les salaires posés (cohérence).
- Paiement voyages/logements : recherche de paiement exact (subset-sum), les
  salaires dépensés sortent aussi des cartes posées.
- Seuls les malus sont jouables sur un adversaire (validé serveur).
- Partie terminée si pioche vide OU s'il reste moins de 2 joueurs connectés.

## Pouvoirs de métiers (flags JSON gérés dans game.js)
`immuneEffects: [...]` (Avocat/divorce, Pompier/accident, Psychologue/burnout),
`studyBonus` (Professeur), `travelDiscount` (Astronaute), `smileAura` (Influenceur),
`arrestsBandit` (Policier), `cannotBeFired` (Bandit), `preventAttacks` (Militaire).

## Déploiement
- Frontend déployé sur Vercel (projet `smile-life`). Le backend socket.io ne peut
  PAS tourner sur Vercel (serverless) : il reste auto-hébergé (LAN ou ngrok), et
  son URL se configure dans « Options avancées » du menu du jeu.

## Prochaines étapes possibles
- Reconnexion en cours de partie (identité persistante au-delà du socket.id).
- Validation de schéma des cartes custom côté serveur.
- Tests automatisés sur game.js.
