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
- Le niveau du salaire est **caché** des autres
- Message : "En attente d'un adversaire..."

### 3. Deuxième Pari
- Un autre joueur parie un salaire de sa **main**
- Niveau également **caché**
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
- Casino fermé

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
- Retourne `shouldResolve: true` si 2ème pari

**resolveCasinoBets()** :
- Vérifie exactement 2 paris
- Applique la règle : même niveau → 2ème gagne, sinon 1er gagne
- Ferme le casino automatiquement
- Retourne détails complets (niveaux, gagnant, perdant)

**Socket 'casino-bet'** :
- Résolution automatique si 2ème pari
- Délai de 1 seconde pour le suspense
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
- Message d'attente si 1 seul pari

**Écouteur `casino-resolved`** :
- Affiche les niveaux révélés
- Message détaillé du duel
- Animation de victoire

**Modal de pari** :
- Affiche uniquement les salaires de la **main**
- Pas les salaires déjà posés

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
6. Message : "En attente d'un adversaire..."

### Test 2 : Duel même niveau
1. Joueur A parie : Salaire Niv.2
2. Joueur B parie : Salaire Niv.2
3. Vérifie : "Même niveau ! Joueur B gagne !"
4. Vérifie : Joueur B a +2 salaires posés

### Test 3 : Duel niveaux différents
1. Joueur A parie : Salaire Niv.3
2. Joueur B parie : Salaire Niv.1
3. Vérifie : "Niveaux différents ! Joueur A gagne !"
4. Vérifie : Joueur A a +2 salaires posés

### Test 4 : Limitation 2 joueurs
1. Joueur A parie
2. Joueur B parie → Duel résolu
3. Casino fermé automatiquement
4. Joueur C ne peut plus parier

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
| Niveaux visibles | Paris cachés, révélés à la résolution |
| Pas de prompt | Événement dédié envoyé au joueur |
| Son "Bravo" ne marche pas | Créé avec Web Audio API (mélodie) |

---

## 💡 À Savoir

### Salaires Main vs Posés
- **Main** (`player.hand`) : Cartes que tu peux jouer
- **Posés** (`player.salary`) : Salaires définitifs comptant pour la victoire

### Pioche après Casino+Pari
Si tu joues Casino ET paries immédiatement :
- Tu as joué 2 cartes ce tour
- **Bug potentiel** : Tu piocheras qu'1 carte (pas 2)
- **À corriger** : Système de pioche multiple si combo

---

**Bon jeu ! 🎰🎉**
