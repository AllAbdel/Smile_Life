# 🍀 Carte Chance - Documentation

## 📋 Résumé

La carte **Chance** (🍀) est une carte spéciale qui permet au joueur de **récupérer n'importe quelle carte de la défausse** et de l'ajouter à sa main.

---

## 🎯 Fonctionnement

### Avant (ancienne version)
- ❌ Donnait simplement **+2 smiles** bonus
- ❌ Pas d'interaction avec la défausse
- ❌ Effet basique et peu stratégique

### Maintenant (nouvelle version)
- ✅ **Permet de choisir une carte de la défausse**
- ✅ La carte choisie est ajoutée à ta main
- ✅ Ne donne plus de smiles directement (0 smiles)
- ✅ Stratégique : récupère une carte importante !

---

## 🎮 Comment utiliser la carte Chance

### 1. Jouer la carte
- À ton tour, joue la carte **🍀 Chance** de ta main
- La carte est placée dans tes cartes jouées

### 2. Sélection
- Un modal s'ouvre automatiquement
- **Toutes les cartes de la défausse** sont affichées
- Les cartes sont triées de la plus récente à la plus ancienne

### 3. Choix
- Clique sur la carte que tu veux récupérer
- La carte est **retirée de la défausse**
- La carte est **ajoutée à ta main**

### 4. Résultat
- Tu peux maintenant jouer cette carte à ton prochain tour
- La défausse est mise à jour pour tous les joueurs

---

## 💡 Stratégies d'utilisation

### Récupérer des cartes puissantes
- **Salaire Niveau 4** 👑 : Récupère un gros salaire pour le casino ou un voyage
- **Mariage** 💒 : Si quelqu'un a défaussé un mariage et que tu as des flirts
- **Métier avancé** 🩺⚙️ : Récupère un Chirurgien ou Ingénieur défaussé

### Récupérer des cartes stratégiques
- **Études** 🎓 : Si tu as besoin d'études pour un métier
- **Logement** 🏠 : Récupère une Maison ou Villa défaussée
- **Voyage** ✈️ : Récupère un voyage que quelqu'un a défaussé

### Récupérer des cartes de protection
- **Militaire** 🪖 : Protège contre les attentats
- **Policier** 👮 : Arrête les bandits

### Bloquer les adversaires
- Récupère une carte qu'un adversaire voulait prendre de la défausse
- Empêche les autres de récupérer une carte importante

---

## 🔧 Modifications techniques

### Backend (server.js)

**Carte dans `default-cards.json`** :
```json
{
  "id": "special-2",
  "name": "Chance",
  "type": "chance",
  "smiles": 0,
  "description": "Coup de chance ! Choisis une carte dans la défausse",
  "image": "🍀",
  "quantity": 1
}
```

**Gestion dans `playCard()`** :
```javascript
case 'chance':
  player.playedCards.push(card);
  return { 
    success: true, 
    message: `${player.name} a joué la carte Chance ! 🍀`, 
    chanceActivated: true,
    availableCards: this.discardPile.length
  };
```

**Nouvelle méthode `takeCardFromDiscardWithChance()`** :
```javascript
takeCardFromDiscardWithChance(playerId, cardIndex) {
  const player = this.players.find(p => p.id === playerId);
  if (!player) return { success: false, message: "Joueur invalide" };
  
  if (cardIndex < 0 || cardIndex >= this.discardPile.length) {
    return { success: false, message: "Carte invalide" };
  }
  
  const card = this.discardPile.splice(cardIndex, 1)[0];
  player.hand.push(card);
  
  return { 
    success: true, 
    message: `${player.name} récupère ${card.name} de la défausse ! 🍀`,
    card: card
  };
}
```

**Socket handler `take-discard-card`** :
- Déjà existant, utilisé pour prendre une carte spécifique de la défausse
- Réutilisé pour la carte Chance

---

### Frontend (App.js)

**Nouveaux états** :
```javascript
const [showChanceModal, setShowChanceModal] = useState(false);
const [chanceDiscardPile, setChanceDiscardPile] = useState([]);
```

**Écouteur `chance-activated`** :
```javascript
newSocket.on('chance-activated', ({ message, discardPile }) => {
  addSystemMessage(message);
  setChanceDiscardPile(discardPile);
  setShowChanceModal(true);
});
```

**Fonction `selectChanceCard()`** :
```javascript
const selectChanceCard = (cardIndex) => {
  socket.emit('take-discard-card', { cardIndex });
  setShowChanceModal(false);
  setChanceDiscardPile([]);
};
```

**Modal Chance** :
- Grille responsive avec toutes les cartes de la défausse
- Animation au survol (scale + rotation du trèfle)
- Couleurs : Vert (bordure) → Or (survol)
- Emoji 🍀 qui tourne au survol

---

### CSS (App.css)

**Styles principaux** :
```css
.chance-modal {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.chance-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 15px;
  max-height: 500px;
  overflow-y: auto;
}

.chance-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border: 3px solid #4CAF50;
  transition: all 0.3s;
}

.chance-card:hover {
  transform: translateY(-10px) scale(1.08);
  box-shadow: 0 15px 35px rgba(76, 175, 80, 0.6);
  border-color: #FFD700;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
}
```

---

## 📝 Documentation mise à jour

### In-game (Documentation.js)
```
✨ CARTES SPÉCIALES
- 🍀 Chance : Choisis une carte de la défausse et récupère-la dans ta main !
```

### Stratégies
```
Chance te permet de récupérer une carte importante de la défausse !
```

---

## 🧪 Tests à effectuer

### Test 1 : Jouer la carte Chance
1. Avoir la carte Chance dans sa main
2. Jouer la carte Chance
3. ✅ Vérifier que le modal s'ouvre
4. ✅ Vérifier que toutes les cartes de la défausse sont affichées

### Test 2 : Sélectionner une carte
1. Carte Chance jouée, modal ouvert
2. Cliquer sur une carte de la défausse
3. ✅ La carte est retirée de la défausse
4. ✅ La carte est ajoutée à la main
5. ✅ Le modal se ferme
6. ✅ Message système : "Joueur récupère [Carte] de la défausse ! 🍀"

### Test 3 : Défausse vide
1. Jouer la carte Chance quand la défausse est vide
2. ✅ Modal affiche "Défausse vide !"
3. ✅ Possibilité d'annuler

### Test 4 : Annulation
1. Ouvrir le modal Chance
2. Cliquer sur "Annuler"
3. ✅ Modal se ferme
4. ✅ Aucune carte récupérée
5. ✅ Tour continue normalement

### Test 5 : Stratégie avancée
1. Joueur A défausse un Salaire Niveau 4
2. Joueur B joue Chance
3. Joueur B récupère le Salaire Niveau 4
4. ✅ Joueur B peut maintenant utiliser ce salaire

---

## ⚠️ Points importants

### Différences avec prendre la dernière carte
- **Prendre la dernière carte** : Récupère uniquement la carte du dessus
- **Carte Chance** : **Choisis n'importe quelle carte** de la défausse

### Limitations
- ✅ 1 seule carte Chance dans le deck
- ✅ Ne peux récupérer qu'**une seule carte**
- ✅ Ne donne **aucun smile** directement
- ✅ La carte choisie est retirée de la défausse

### Timing
- Jouer Chance **compte comme ton action** du tour
- La carte récupérée ne peut être jouée qu'au **prochain tour**
- Utile pour **planifier à l'avance**

---

## 🎯 Avantages de la nouvelle version

| Aspect | Ancienne | Nouvelle |
|--------|----------|----------|
| Smiles | +2 direct | 0 (mais carte récupérée) |
| Interaction | Aucune | Choix dans défausse |
| Stratégie | Faible | **Très élevée** |
| Rejoabilité | Faible | **Élevée** (dépend de la défausse) |
| Impact | Mineur | **Majeur** (peut changer la partie) |

---

## 💎 Exemples d'utilisation avancée

### Scénario 1 : Récupérer un métier
```
Alice a BAC+5 mais pas de métier
Bob défausse "Chirurgien 🩺" (BAC+6 requis)
Alice joue Chance
Alice récupère Chirurgien
❌ Alice ne peut pas le jouer (pas assez d'études)
→ Alice garde pour plus tard ou échange avec quelqu'un
```

### Scénario 2 : Combo Casino
```
Charlie a besoin d'un gros salaire pour le casino
Quelqu'un a défaussé "Salaire Niveau 4"
Charlie joue Chance
Charlie récupère le Salaire Niveau 4
→ Charlie peut maintenant parier gros au casino
```

### Scénario 3 : Bloquer un adversaire
```
David va prendre la dernière carte de la défausse (Mariage)
Ève joue Chance AVANT David
Ève récupère le Mariage
→ David ne peut plus le prendre
→ Ève bloque la stratégie de David
```

---

**Conclusion** : La carte Chance est maintenant une carte **stratégique puissante** qui permet de récupérer des cartes clés et de modifier le cours de la partie ! 🍀✨
