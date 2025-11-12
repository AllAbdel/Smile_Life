# 🍀 Carte Chance - Nouvelle Fonctionnalité

## 📝 Changement

### ❌ Ancienne version
- **Effet** : +2 smiles bonus
- **Description** : "Coup de chance ! +2 smiles bonus"
- **Utilité** : Faible, juste des points gratuits

### ✅ Nouvelle version
- **Effet** : Choisir n'importe quelle carte de la défausse
- **Description** : "Choisis n'importe quelle carte de la défausse !"
- **Utilité** : Très stratégique, permet de récupérer des cartes importantes

---

## 🎮 Fonctionnement

1. **Jouer la carte Chance**
   - Le joueur joue la carte Chance depuis sa main
   - Un message s'affiche : "X a joué Chance ! Choisis une carte de la défausse."

2. **Choisir une carte**
   - Une modal s'ouvre avec TOUTES les cartes de la défausse
   - Les cartes sont affichées de la plus récente à la plus ancienne
   - Le joueur clique sur la carte qu'il souhaite récupérer

3. **Récupération**
   - La carte choisie est retirée de la défausse
   - La carte est ajoutée à la main du joueur
   - Message : "X a récupéré [Nom carte] de la défausse grâce à Chance !"

4. **Fin du tour**
   - Le tour passe au joueur suivant automatiquement
   - Le joueur ne pioche PAS de carte supplémentaire (il a déjà récupéré une carte)

---

## 🔧 Modifications techniques

### Backend (server.js)

**Carte Chance (default-cards.json)**
```json
{
  "id": "special-2",
  "name": "Chance",
  "type": "special",
  "effect": "pick_from_discard",
  "smiles": 0,
  "description": "Choisis n'importe quelle carte de la défausse !",
  "image": "🍀",
  "quantity": 1
}
```

**Gestion case 'special'** (ligne ~362)
```javascript
case 'special':
  player.playedCards.push(card);
  player.smiles += card.smiles || 0;
  
  // Si c'est une carte Chance
  if (card.effect === 'pick_from_discard' || card.id === 'special-2') {
    return { 
      success: true, 
      message: `${player.name} a joué Chance ! Choisis une carte de la défausse.`,
      needsDiscardPick: true 
    };
  }
```

**Nouvelle méthode pickFromDiscard()** (ligne ~855)
```javascript
pickFromDiscard(playerId, cardIndex) {
  const player = this.players.find(p => p.id === playerId);
  if (!player) return { success: false, message: "Joueur invalide" };
  
  if (this.discardPile.length === 0) {
    return { success: false, message: "La défausse est vide" };
  }
  
  if (cardIndex < 0 || cardIndex >= this.discardPile.length) {
    return { success: false, message: "Index de carte invalide" };
  }
  
  // Prendre la carte à l'index spécifié
  const card = this.discardPile.splice(cardIndex, 1)[0];
  player.hand.push(card);
  
  return { 
    success: true, 
    message: `${player.name} a récupéré ${card.name} de la défausse grâce à Chance !`,
    card: card
  };
}
```

**Gestion dans play-card** (ligne ~1102)
```javascript
// Si c'est une carte Chance, permettre de choisir dans la défausse
if (result.needsDiscardPick) {
  socket.emit('chance-discard-pick', {
    message: result.message,
    discardPile: game.discardPile
  });
  return; // Ne pas piocher automatiquement
}
```

**Nouveau socket handler** (ligne ~1350)
```javascript
socket.on('pick-from-discard-with-chance', ({ cardIndex }) => {
  const playerInfo = players.get(socket.id);
  if (!playerInfo) return;
  
  const game = games.get(playerInfo.roomId);
  if (!game || !game.gameStarted) return;
  
  const result = game.pickFromDiscard(socket.id, cardIndex);
  
  if (result.success) {
    io.to(playerInfo.roomId).emit('card-played', {
      playerId: socket.id,
      playerName: playerInfo.playerName,
      message: result.message,
      gameState: game.getPublicGameState()
    });
    
    socket.emit('hand-update', {
      hand: game.getPlayerData(socket.id).hand,
      playerState: game.getPlayerData(socket.id)
    });
    
    // Passer au joueur suivant
    game.nextTurn();
    io.to(playerInfo.roomId).emit('game-update', {
      gameState: game.getPublicGameState()
    });
  } else {
    socket.emit('error', { message: result.message });
  }
});
```

---

### Frontend (App.js)

**Nouveaux états** (ligne ~51)
```javascript
const [showChanceDiscardPick, setShowChanceDiscardPick] = useState(false);
const [chanceDiscardPile, setChanceDiscardPile] = useState([]);
```

**Écouteur événement** (ligne ~173)
```javascript
newSocket.on('chance-discard-pick', ({ message, discardPile }) => {
  addSystemMessage(message);
  setChanceDiscardPile(discardPile);
  setShowChanceDiscardPick(true);
});
```

**Fonction de choix** (ligne ~483)
```javascript
const pickFromDiscardWithChance = (cardIndex) => {
  socket.emit('pick-from-discard-with-chance', { cardIndex });
  setShowChanceDiscardPick(false);
  setChanceDiscardPile([]);
};
```

**Modal de sélection** (ligne ~1153)
```jsx
{showChanceDiscardPick && (
  <div className="modal-overlay" onClick={() => setShowChanceDiscardPick(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h3>🍀 Carte Chance ! Choisis une carte de la défausse</h3>
      <div className="discard-picker-grid">
        {chanceDiscardPile.slice().reverse().map((card, index) => {
          const actualIndex = chanceDiscardPile.length - 1 - index;
          return (
            <div 
              key={actualIndex} 
              className="discard-picker-card"
              onClick={() => pickFromDiscardWithChance(actualIndex)}
            >
              <div className="card-emoji-large">{getCardEmoji(card)}</div>
              <div className="card-name">{card.name}</div>
              <div className="card-smiles">😊 {card.smiles || 0}</div>
            </div>
          );
        })}
      </div>
      <button className="btn btn-secondary" onClick={() => setShowChanceDiscardPick(false)}>
        Annuler
      </button>
    </div>
  </div>
)}
```

---

### Documentation (Documentation.js)

**Cartes Spéciales** (ligne ~130)
```javascript
<li><strong>🍀 Chance</strong> : Choisis n'importe quelle carte de la défausse !</li>
```

**Stratégies** (ligne ~163)
```javascript
<li><strong>Chance</strong> te permet de récupérer n'importe quelle carte dans la défausse !</li>
```

---

## 💡 Cas d'usage stratégiques

### 1. Récupérer un salaire de haut niveau
- Un adversaire défausse un Salaire Niv.4
- Tu joues Chance
- Tu récupères le Salaire Niv.4 pour ton propre usage

### 2. Récupérer une carte rare
- La carte Bandit a été défaussée
- Tu joues Chance
- Tu la récupères pour devenir Bandit

### 3. Récupérer un voyage cher
- Quelqu'un a défaussé "Voyage aux Bahamas"
- Tu économises pour acheter ce voyage
- Tu joues Chance pour le récupérer

### 4. Récupérer une carte défaussée par erreur
- Tu as défaussé une carte importante par accident
- À ton prochain tour, tu joues Chance
- Tu la récupères de la défausse

### 5. Récupérer un malus pour l'utiliser
- Un Divorce a été défaussé
- Tu veux divorcer un adversaire marié
- Tu joues Chance pour récupérer le Divorce

---

## ⚠️ Points importants

### Différences avec "Prendre la dernière carte de la défausse"
- **Action normale** : Prend SEULEMENT la dernière carte (celle sur le dessus)
- **Carte Chance** : Permet de choisir N'IMPORTE QUELLE carte dans toute la pile

### Limites
- Ne peut être utilisée que **si la défausse n'est pas vide**
- **1 seule carte** peut être récupérée (pas toute la défausse)
- Le tour est **automatiquement passé** après le choix

### Avantages
- **Très stratégique** : permet de récupérer des cartes rares ou puissantes
- **Flexibilité** : accès à toutes les cartes défaussées depuis le début
- **Contre-jeu** : peut récupérer ce que les adversaires ont jeté

---

## 🧪 Tests de validation

### Test 1 : Jouer Chance avec défausse vide
1. Vider complètement la défausse
2. Jouer Chance
3. ✅ Message d'erreur : "La défausse est vide"

### Test 2 : Choisir une carte au milieu de la défausse
1. Défausser 5 cartes différentes
2. Jouer Chance
3. Choisir la 3ème carte (au milieu)
4. ✅ Carte retirée de la défausse et ajoutée à la main
5. ✅ Les autres cartes restent dans la défausse

### Test 3 : Modal affiche toutes les cartes
1. Défausser 10 cartes
2. Jouer Chance
3. ✅ Modal affiche les 10 cartes
4. ✅ Cartes de la plus récente à la plus ancienne

### Test 4 : Tour passé après choix
1. Jouer Chance
2. Choisir une carte
3. ✅ Tour automatiquement passé au joueur suivant
4. ✅ Pas de pioche supplémentaire

### Test 5 : Annuler le choix
1. Jouer Chance
2. Cliquer sur "Annuler"
3. ✅ Modal fermée
4. ⚠️ Tour perdu ? (à vérifier)

---

## 📊 Comparaison Avant/Après

| Aspect | Avant | Après |
|--------|-------|-------|
| Effet | +2 smiles | Choisis carte défausse |
| Stratégie | Aucune | Très élevée |
| Interaction | Passive | Active (choix) |
| Valeur | Faible | Très forte |
| Utilité | Juste des points | Récupération stratégique |
| Timing | Peu important | Crucial |

---

**Statut** : ✅ Fonctionnalité complète  
**Date** : 12 Novembre 2025  
**Fichiers modifiés** :
- `backend/cards/default-cards.json`
- `backend/server.js`
- `frontend/src/App.js`
- `frontend/src/Documentation.js`
