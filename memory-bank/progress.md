# Progress — Smile Life

> Dernière mise à jour : 2026-06-11

## ✅ Ce qui fonctionne
- Création/rejoindre un salon (code à 6 caractères), lobby, démarrage à 2-6 joueurs.
- Boucle de jeu complète : jouer/défausser une carte, pioche auto à 5, tour suivant, fin de partie quand pioche vide, classement + stats.
- Types de cartes : études, métiers, salaires, flirts (avec vol), mariage, adultère, enfants, animaux, voyages, logements, malus, anniversaire, chance, casino, tsunami.
- Pouvoirs : Policier arrête les Bandits, Bandit non licenciable, Militaire bloque les attentats.
- Casino : duels de paris cachés à 2 joueurs.
- Drag & drop des cartes avec ghost, sons procéduraux, soundboard synchronisé, chat, musiques YouTube, confettis.
- Jeu en LAN et via ngrok, build Electron Windows.

## ✅ Refonte 2026-06 (terminée le 2026-06-12)
- [x] Nettoyage dépôt git
- [x] Memory Bank
- [x] Corrections bugs backend (casino secret, flux Chance, déconnexions, paiements exacts...)
- [x] Nouveaux rôles à pouvoirs (Pompier, Psychologue, Professeur, Astronaute, Influenceur, Avocat)
- [x] Refonte visuelle complète (design system sombre, GameCard, barre d'action tactile)
- [x] Responsive mobile (mobile-first, chat overlay, safe areas)
- [x] Documentation à jour (guide in-game + README)
- [x] Déploiement du frontend sur Vercel (le backend reste auto-hébergé : LAN/ngrok)

## ❌ Limitations connues
- Pas de reconnexion en cours de partie (socket.id = identité).
- Pas de persistance serveur (tout en mémoire).
- Pas de tests automatisés.
- Cartes custom : aucune validation de schéma côté serveur.

## Historique des jalons
- 2026-06-11 : début de la grande refonte (visuel + bugs + rôles + mobile + memory bank).
- Avant : itérations gameplay (tsunami rework, casino v2, carte chance, drag & drop, soundboard, LAN/ngrok, build .exe).
