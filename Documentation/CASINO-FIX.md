# 🎰 Système Casino - Correctif Complet

## 🎯 Problème Identifié

### Ancien système (incorrect) :
- ❌ Plusieurs joueurs pouvaient parier
- ❌ Tirage au sort du gagnant
- ❌ Prenait les salaires déjà posés (`player.salary`)
- ❌ Ne proposait pas de parier immédiatement après avoir joué le casino
- ❌ Le tour était skip après avoir joué le casino

### Nouveau système (correct) :
- ✅ **Duel à 2 joueurs uniquement**
- ✅ **Paris cachés** (les niveaux ne sont pas révélés avant)
- ✅ **Salaires depuis la main** (`player.hand`)
- ✅ **Proposition automatique** de parier après avoir joué le casino
- ✅ **Résolution automatique** quand le 2ème joueur parie

---

## 🎲 Règles du Casino (Implémentées)

### 1. Ouverture du Casino
- Un joueur joue la carte **Casino**
- Le casino s'ouvre pour tous
- **Nouveau** : Proposition immédiate de parier un salaire

### 2. Premier Pari
- Le joueur (ou un autre) choisit un salaire de sa **main**
- Le niveau du salaire est **caché** des autres (affiché comme "❓ Face cachée")
- Le joueur **pioche 1 carte** immédiatement
- Le tour du joueur est **sauté** (passe au joueur suivant)
- Message : "En attente d'un adversaire..."

### 3. Deuxième Pari
- Un autre joueur parie un salaire de sa **main**
- Niveau **visible** cette fois (affiché clairement)
- Le joueur **pioche 1 carte** immédiatement
- Le tour du joueur est **sauté** également
- **Duel automatique** lancé après 1 seconde

### 4. Résolution du Duel

**Règle** :
```
SI niveau_joueur1 == niveau_joueur2
  ALORS joueur2 gagne (2ème à parier)
SINON
  joueur1 gagne (1er à parier)
```

**Exemple 1** :
- Joueur A parie : Salaire Niveau 2 (caché)
- Joueur B parie : Salaire Niveau 2 (caché)
- **Résultat** : Même niveau → Joueur B gagne !

**Exemple 2** :
- Joueur A parie : Salaire Niveau 3 (caché)
- Joueur B parie : Salaire Niveau 1 (caché)
- **Résultat** : Différent → Joueur A gagne !

### 5. Gain
- Le gagnant récupère **les 2 salaires**
- Les salaires vont dans `player.salary` (salaires posés)
- Smiles additionnés
- **Casino reste ouvert** pour un nouveau duel !
- Les paris sont vidés pour permettre 2 nouveaux joueurs de parier

---

## 🔧 Modifications Techniques

### Backend (server.js)

**Class Game** :
```javascript
constructor() {
  this.casinoBets = []; // Limité à 2
  this.casinoOpenedBy = null; // ID de celui qui a ouvert
}
```

**playCard()** - Cas 'casino' :
```javascript
return {
  success: true,
  casinoOpened: true,
  shouldPromptBet: true // Nouveau
};
```

**placeCasinoBet()** :
- Vérification : Max 2 paris
- Vérification : Pas de double pari du même joueur
- Utilise `player.hand` au lieu de `player.salary`
- **Fait piocher 1 carte** au joueur qui parie
- Marque le 1er pari comme caché (`isFirstBet: true`)
- Retourne `shouldResolve: true` si 2ème pari
- Retourne `skipTurn: true` pour sauter le tour du joueur

**resolveCasinoBets()** :
- Vérifie exactement 2 paris
- Applique la règle : même niveau → 2ème gagne, sinon 1er gagne
- **Ne ferme plus le casino** (reste ouvert)
- Vide juste les paris (`this.casinoBets = []`)
- Retourne détails complets (niveaux, gagnant, perdant)

**Socket 'casino-bet'** :
- Résolution automatique si 2ème pari
- **Passe au prochain joueur** (`game.nextTurn()`) après le pari
- Délai de 1 seconde pour le suspense avant résolution
- Émet `casino-bet-placed` avec `firstBetHidden` flag
- Émet `casino-resolved` avec tous les détails

**Socket 'play-card'** :
- Émet `casino-prompt-bet` au joueur qui a ouvert
- Permet de parier immédiatement

### Frontend (App.js)

**Nouveaux états** :
```javascript
const [showCasinoBetPrompt, setShowCasinoBetPrompt] = useState(false);
```

**Écouteur `casino-prompt-bet`** :
- Affiche le prompt automatiquement
- Permet de choisir de parier ou non

**Écouteur `casino-bet-placed`** :
- Affiche le nombre de paris (1/2)
- **Affiche le 1er pari comme "❓ Face cachée"**
- **Affiche le 2ème pari avec niveau visible**
- Message d'attente si 1 seul pari

**Écouteur `casino-resolved`** :
- Affiche les niveaux révélés
- Message détaillé du duel
- Animation de victoire

**Modal de pari** :
- Affiche uniquement les salaires de la **main**
- Pas les salaires déjà posés

**Interface Casino** :
- **Suppression du bouton "Tirer au sort"**
- Affichage du 1er pari caché : "Joueur: ❓ (Face cachée)"
- Affichage du 2ème pari visible : "Joueur: Niv.X 💰"

---

## 🎵 Sons Améliorés

### Nouveau son : Bravo!
- Mélodie de 4 notes : Do-Mi-Sol-Do
- Utilisé pour la victoire au casino
- Web Audio API (pas de fichier)

### Nouveau son : Alice
- Fichier MP3/WAV personnalisé
- Placé dans `frontend/public/assets/alice.mp3`
- Bouton dans la soundboard

**MediaPanel.js** :
```javascript
{ name: 'Alice 💕', emoji: '👩', file: '/assets/alice.mp3', local: true }
```

---

## 📁 Fichiers Créés/Modifiés

### Backend :
- ✅ `server.js` : Logique casino complète
- ✅ `assets/` : Dossier pour assets (vide pour l'instant)

### Frontend :
- ✅ `App.js` : Gestion événements casino
- ✅ `MediaPanel.js` : Bouton Alice
- ✅ `SoundManager.js` : Son "Bravo!" + support fichiers MP3
- ✅ `public/assets/` : Dossier pour alice.mp3
- ✅ `public/assets/README.md` : Instructions

### Documentation :
- ✅ `CASINO-FIX.md` : Ce fichier

---

## 🧪 Tests à Faire

### Test 1 : Ouverture et pari direct
1. Joue la carte Casino
2. Vérifie que le prompt apparaît : "Veux-tu parier ?"
3. Clique "Oui"
4. Choisis un salaire de ta **main**
5. Vérifie : Salaire retiré de la main
6. Vérifie : **Tu as pioché 1 carte**
7. Vérifie : **Ton tour a été sauté**
8. Vérifie : Pari affiché comme "❓ Face cachée"
9. Message : "En attente d'un adversaire..."

### Test 2 : Duel même niveau
1. Joueur A parie : Salaire Niv.2 (caché)
2. Vérifie : Tour de A sauté + pioche 1 carte
3. Joueur B parie : Salaire Niv.2 (visible)
4. Vérifie : Tour de B sauté + pioche 1 carte
5. Vérifie : "Même niveau ! Joueur B gagne !"
6. Vérifie : Joueur B a +2 salaires posés
7. **Vérifie : Casino reste ouvert**

### Test 3 : Duel niveaux différents
1. Joueur A parie : Salaire Niv.3 (caché)
2. Joueur B parie : Salaire Niv.1 (visible)
3. Vérifie : "Niveaux différents ! Joueur A gagne !"
4. Vérifie : Joueur A a +2 salaires posés
5. **Vérifie : Casino reste ouvert**

### Test 4 : Limitation 2 joueurs + Casino permanent
1. Joueur A parie
2. Joueur B parie → Duel résolu
3. **Casino reste ouvert**
4. Joueur C peut parier pour un nouveau duel
5. Joueur D peut parier → Nouveau duel
6. Casino reste ouvert jusqu'à la fin de la partie

### Test 5 : Pioche et skip de tour
1. Joueur A a 5 cartes
2. Joueur A parie au casino
3. Vérifie : A a toujours 5 cartes (perd 1, pioche 1)
4. Vérifie : Tour passé au joueur suivant
5. Joueur B parie
6. Vérifie : B a toujours 5 cartes
7. Vérifie : Tour passé au joueur suivant (pas B)

### Test 5 : Sons
1. Clique sur "Bravo !" dans la soundboard
2. Vérifie qu'une mélodie se joue
3. Place `alice.mp3` dans `frontend/public/assets/`
4. Clique sur "Alice 💕"
5. Vérifie que ton fichier se joue

---

## 🐛 Bugs Corrigés

| Bug | Solution |
|-----|----------|
| Tour skip après casino | Ajout de `shouldPromptBet` + événement `casino-prompt-bet` |
| Salaires posés utilisés | Changé vers `player.hand` |
| Plusieurs joueurs | Limite à 2 paris max |
| Tirage aléatoire | Règle fixe : même niveau → 2ème, sinon 1er |
| Niveaux visibles | 1er pari caché (❓), 2ème visible |
| Pas de prompt | Événement dédié envoyé au joueur |
| Son "Bravo" ne marche pas | Créé avec Web Audio API (mélodie) |
| Casino se ferme après duel | Casino reste ouvert toute la partie |
| Pas de pioche après pari | Pioche 1 carte automatiquement |
| Tour pas sauté après pari | `game.nextTurn()` appelé automatiquement |
| Bouton "Tirer au sort" inutile | Bouton supprimé (résolution auto) |

---

## 💡 À Savoir

### Salaires Main vs Posés
- **Main** (`player.hand`) : Cartes que tu peux jouer
- **Posés** (`player.salary`) : Salaires définitifs comptant pour la victoire

### Pioche après Casino+Pari
Si tu joues Casino ET paries immédiatement :
- Tu joues la carte Casino (1 carte)
- Tu paris un salaire (1 carte)
- **Tu pioches 1 carte** après le pari
- Total : -2 cartes + 1 pioche = tu as 4 cartes
- **Ton tour est sauté**, donc tu ne pioches pas normalement
- À ton prochain tour, tu piocheras jusqu'à 5 cartes

### Casino Permanent
- **Le casino ne se ferme JAMAIS** une fois ouvert
- Après chaque duel, seuls les paris sont vidés
- D'autres joueurs peuvent parier pour un nouveau duel
- Le casino reste actif jusqu'à la fin de la partie
- Permet des duels multiples tout au long du jeu

---

**Bon jeu ! 🎰🎉**
