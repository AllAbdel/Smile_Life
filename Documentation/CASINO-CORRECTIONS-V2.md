# 🎰 Casino - Corrections v2 (12 Nov 2025)

## 🐛 Problèmes corrigés

### 1. ❌ Casino disparaissait après le duel
**Problème** : Le casino se fermait (`casinoActive = false`) après chaque résolution  
**Solution** : 
- Backend `resolveCasinoBets()` : Suppression de `this.casinoActive = false`
- Le casino reste ouvert toute la partie
- Seuls les paris sont vidés (`this.casinoBets = []`)
- Permet des duels multiples

---

### 2. 👁️ Premier pari visible au lieu d'être caché
**Problème** : Les 2 paris affichaient le niveau du salaire  
**Solution** :
- Backend : Ajout de `isFirstBet: true` au premier pari
- Frontend : Affichage conditionnel :
  ```javascript
  idx === 0 ? 
    `${bet.playerName}: ❓ (Face cachée)` : 
    `${bet.playerName}: Niv.${bet.betAmount} 💰`
  ```
- Le 1er pari reste mystérieux jusqu'à la résolution
- Le 2ème pari est visible

---

### 3. 🎲 Bouton "Tirer au sort" inutile
**Problème** : Bouton qui ne servait à rien (résolution auto)  
**Solution** :
- Frontend : Suppression complète du bouton
- Suppression de la fonction `resolveCasino()`
- Backend : Suppression du handler `socket.on('casino-resolve')`
- La résolution est 100% automatique

---

### 4. 🃏 Pas de pioche après avoir parié
**Problème** : Parier au casino ne faisait pas piocher de carte  
**Résultat** : Joueur à 4 cartes au lieu de 5  
**Solution** :
- Backend `placeCasinoBet()` : Ajout de pioche automatique
  ```javascript
  if (this.deck.length > 0) {
    const drawnCard = this.deck.pop();
    player.hand.push(drawnCard);
  }
  ```
- Le joueur pioche 1 carte immédiatement après le pari
- Compense la carte de salaire perdue

---

### 5. ⏭️ Tour pas sauté après avoir parié
**Problème** : Le joueur qui parie garde son tour  
**Exemple bug** :
```
C'est au tour de Cél
Cél a parié !
[Duel résolu]
Cél: Carte défaussée  ← Cél joue encore !
C'est au tour de Abdel
```

**Solution** :
- Backend `placeCasinoBet()` : Retourne `skipTurn: true`
- Backend `socket.on('casino-bet')` : Appel de `game.nextTurn()` après le pari
- Le tour passe immédiatement au joueur suivant
- Les 2 joueurs qui parient sautent leur tour

**Comportement corrigé** :
```
C'est au tour de Cél
Cél a parié !
[Tour automatiquement passé]
C'est au tour de Abdel
```

---

## 📊 Flux complet corrigé

### Scénario : Alice ouvre le casino et parie

1. **Alice joue Casino**
   - Casino ouvert (`casinoActive = true`)
   - Prompt : "Veux-tu parier ?"

2. **Alice parie Salaire Niv.3**
   - Carte retirée de la main
   - Pioche 1 carte → reste à 5 cartes
   - Pari ajouté (caché : ❓)
   - **Tour sauté** → C'est au tour de Bob

3. **Bob parie Salaire Niv.2**
   - Carte retirée de la main
   - Pioche 1 carte → reste à 5 cartes
   - Pari ajouté (visible : Niv.2 💰)
   - **Tour sauté** → C'est au tour de Charlie

4. **Duel automatique (1 seconde de suspense)**
   - Niveaux révélés : Alice Niv.3 vs Bob Niv.2
   - Différents → Alice (1ère) gagne
   - Alice récupère les 2 salaires
   - **Casino reste ouvert** ✅

5. **Charlie peut parier pour un nouveau duel**
   - Le cycle recommence
   - Casino actif jusqu'à la fin

---

## 🔧 Modifications techniques

### Backend (server.js)

**Ligne ~759** : Ajout pioche + marqueur 1er pari
```javascript
this.casinoBets.push({
  playerId: player.id,
  playerName: player.name,
  salaryCard: salaryCard,
  betAmount: betAmount,
  isFirstBet: this.casinoBets.length === 0 // Nouveau
});

// Pioche automatique
if (this.deck.length > 0) {
  const drawnCard = this.deck.pop();
  player.hand.push(drawnCard);
}
```

**Ligne ~768** : Skip turn pour le 2ème pari
```javascript
if (this.casinoBets.length === 2) {
  return { 
    success: true, 
    message: `${player.name} a parié ! Le duel commence !`,
    cardPlayed: true,
    shouldResolve: true,
    skipTurn: true // Ajouté
  };
}
```

**Ligne ~777** : Skip turn pour le 1er pari
```javascript
return { 
  success: true, 
  message: `${player.name} a parié au casino ! En attente d'un adversaire...`,
  cardPlayed: true,
  skipTurn: true // Ajouté
};
```

**Ligne ~818** : Casino reste ouvert
```javascript
// NE PAS FERMER LE CASINO
// this.casinoActive = false; ← Supprimé
// this.casinoOpenedBy = null; ← Supprimé
this.casinoBets = []; // Juste vider les paris
```

**Ligne ~1246** : Gestion skip turn
```javascript
io.to(playerInfo.roomId).emit('casino-bet-placed', {
  playerName: playerInfo.playerName,
  message: result.message,
  gameState: game.getPublicGameState(),
  betCount: game.casinoBets.length,
  firstBetHidden: game.casinoBets.length === 1 // Nouveau
});

// Passer au prochain joueur
if (result.skipTurn) {
  game.nextTurn();
  io.to(playerInfo.roomId).emit('game-update', {
    gameState: game.getPublicGameState()
  });
}
```

**Ligne ~1307** : Suppression handler casino-resolve
```javascript
// socket.on('casino-resolve', () => { ... }); ← Supprimé complètement
```

---

### Frontend (App.js)

**Ligne ~863** : Affichage conditionnel des paris
```javascript
{gameData.casinoBets.map((bet, idx) => (
  <div key={idx} className="casino-bet-item">
    {idx === 0 ? (
      `${bet.playerName}: ❓ (Face cachée)` // 1er caché
    ) : (
      `${bet.playerName}: Niv.${bet.betAmount} 💰` // 2ème visible
    )}
  </div>
))}
```

**Ligne ~873** : Suppression bouton "Tirer au sort"
```javascript
// Bouton supprimé :
// <button className="btn-casino-resolve" onClick={resolveCasino}>
//   Tirer au sort
// </button>
```

**Ligne ~470** : Suppression fonction resolveCasino
```javascript
// const resolveCasino = () => { ... }; ← Supprimé
```

---

## ✅ Tests de validation

### Test A : Pioche après pari
1. Alice a 5 cartes
2. Alice parie au casino (perd 1 salaire)
3. ✅ Alice pioche 1 carte → 5 cartes
4. ✅ Tour d'Alice sauté

### Test B : Tour sauté
1. Tour de Bob
2. Bob parie au casino
3. ✅ Tour passe à Charlie (pas Bob)
4. Bob ne joue pas 2 fois

### Test C : Casino permanent
1. Alice vs Bob → Alice gagne
2. ✅ Casino reste ouvert
3. Charlie peut parier
4. David peut parier
5. Charlie vs David → Duel
6. ✅ Casino toujours ouvert

### Test D : 1er pari caché
1. Alice parie Niv.3
2. ✅ Affichage : "Alice: ❓ (Face cachée)"
3. Bob parie Niv.2
4. ✅ Affichage : "Bob: Niv.2 💰"
5. Résolution révèle les 2 niveaux

### Test E : Pas de bouton "Tirer au sort"
1. Ouvrir le casino
2. ✅ Seul bouton visible : "Parier"
3. 2 joueurs parient
4. ✅ Résolution automatique (1 sec)

---

## 📈 Récapitulatif des changements

| Élément | Avant | Après |
|---------|-------|-------|
| Casino après duel | Fermé | ✅ Reste ouvert |
| 1er pari | Visible | ✅ Caché (❓) |
| 2ème pari | Caché | ✅ Visible (Niv.X) |
| Pioche après pari | ❌ Non | ✅ Oui (1 carte) |
| Tour après pari | Conservé | ✅ Sauté |
| Bouton "Tirer au sort" | Présent | ✅ Supprimé |
| Résolution | Manuelle | ✅ Automatique |

---

**Statut** : ✅ Tous les bugs corrigés  
**Date** : 12 Novembre 2025  
**Fichiers modifiés** : `backend/server.js`, `frontend/src/App.js`  
**Tests requis** : A, B, C, D, E (ci-dessus)
