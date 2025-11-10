# 🎨 Guide de création de cartes personnalisées

## 📖 Introduction

Ce guide vous explique comment créer vos propres cartes pour Smile Life !

## 🎯 Structure de base

Votre fichier JSON doit contenir un objet avec une clé `cards` qui contient un tableau de cartes :

```json
{
  "cards": [
    // Vos cartes ici
  ]
}
```

## 🃏 Types de cartes disponibles

### 1. 📚 Carte ÉTUDES (`type: "study"`)

**Utilité :** Permet d'accumuler des niveaux d'études pour débloquer des métiers.

**Propriétés requises :**
```json
{
  "id": "etude-1",
  "name": "Master en Informatique",
  "type": "study",
  "studyLevel": 2,
  "smiles": 2,
  "description": "Niveau d'études: Master",
  "image": "🎓",
  "quantity": 5
}
```

- `studyLevel` : Nombre de niveaux gagnés (généralement 1 ou 2)

### 2. 💼 Carte MÉTIER (`type: "job"`)

**Utilité :** Rapporte des smiles et permet d'obtenir des salaires.

**Propriétés requises :**
```json
{
  "id": "job-1",
  "name": "Développeur Web",
  "type": "job",
  "requiredStudies": 4,
  "smiles": 4,
  "description": "Métier: Développeur Web",
  "image": "💻",
  "quantity": 3
}
```

- `requiredStudies` : Niveau d'études minimum pour exercer ce métier

**Règles :**
- On ne peut avoir qu'un seul métier à la fois
- Pour changer de métier, il faut démissionner (défausser l'ancien métier)

### 3. ❤️ Carte FLIRT (`type: "flirt"`)

**Utilité :** Permet de se marier (nécessite au moins 1 flirt).

**Propriétés requises :**
```json
{
  "id": "flirt-1",
  "name": "Flirt à la bibliothèque",
  "type": "flirt",
  "location": "bibliothèque",
  "smiles": 1,
  "canMakeBaby": false,
  "description": "Rencontre à la bibliothèque",
  "image": "📚❤️",
  "quantity": 5
}
```

- `location` : Lieu du flirt (important pour le vol de flirt)
- `canMakeBaby` : Si true, permet de faire un enfant directement

**Règles spéciales :**
- Maximum 5 flirts en même temps (sauf si en adultère)
- Si deux joueurs flirtent au même endroit, le nouveau joueur vole le flirt de l'autre !
- Impossible de flirter si marié (sauf avec carte Adultère)

### 4. 💒 Carte MARIAGE (`type: "marriage"`)

**Utilité :** Permet d'avoir des enfants et rapporte beaucoup de smiles.

**Propriétés requises :**
```json
{
  "id": "marriage-1",
  "name": "Mariage",
  "type": "marriage",
  "smiles": 5,
  "description": "Vous vous mariez!",
  "image": "💒",
  "quantity": 6
}
```

**Règles :**
- Nécessite au moins 1 flirt pour se marier
- On ne peut pas se remarier sans divorcer d'abord

### 5. 👶 Carte ENFANT (`type: "child"`)

**Utilité :** Rapporte des smiles.

**Propriétés requises :**
```json
{
  "id": "child-1",
  "name": "Bébé",
  "type": "child",
  "smiles": 3,
  "description": "Naissance d'un enfant",
  "image": "👶",
  "quantity": 8
}
```

**Règles :**
- Nécessite d'être marié
- Pas de limite au nombre d'enfants

### 6. 🐾 Carte ANIMAL (`type: "pet"`)

**Utilité :** Gratuit et apporte des smiles.

**Propriétés requises :**
```json
{
  "id": "pet-1",
  "name": "Perroquet",
  "type": "pet",
  "smiles": 2,
  "description": "Adoption d'un perroquet bavard",
  "image": "🦜",
  "quantity": 4
}
```

**Règles :**
- Aucune condition requise
- Pas de limite

### 7. 💰 Carte SALAIRE (`type: "salary"`)

**Utilité :** Permet d'acheter des voyages.

**Propriétés requises :**
```json
{
  "id": "salary-1",
  "name": "Salaire",
  "type": "salary",
  "smiles": 1,
  "description": "Vous recevez un salaire",
  "image": "💰",
  "quantity": 15
}
```

**Règles :**
- Nécessite d'avoir un métier
- Les salaires dépensés pour voyager sont retirés définitivement

### 8. ✈️ Carte VOYAGE (`type: "travel"`)

**Utilité :** Coûte des salaires mais rapporte beaucoup de smiles.

**Propriétés requises :**
```json
{
  "id": "travel-1",
  "name": "Voyage au Japon",
  "type": "travel",
  "cost": 3,
  "smiles": 5,
  "description": "Voyage au Japon",
  "image": "🗾",
  "quantity": 2
}
```

- `cost` : Nombre de salaires nécessaires

**Règles :**
- Doit avoir suffisamment de salaires
- Les salaires sont consommés lors de l'achat

### 9. 💔 Carte MALUS (`type: "malus"`)

**Utilité :** À jouer sur les adversaires pour les pénaliser.

**Propriétés requises :**
```json
{
  "id": "malus-1",
  "name": "Cambriolage",
  "type": "malus",
  "effect": "accident",
  "smilesLoss": 3,
  "description": "Vous vous faites cambrioler: -3 smiles",
  "image": "🦹",
  "quantity": 4
}
```

- `effect` : Type de malus (voir ci-dessous)
- `smilesLoss` : Smiles perdus (seulement pour effect: "accident")

**Types d'effets :**

- `"divorce"` : Force le divorce (perte du mariage, mais garde enfants et flirts)
- `"fired"` : Licenciement (perte du métier et de tous les salaires)
- `"accident"` : Perte directe de smiles (utiliser `smilesLoss`) + **saute le prochain tour**
- `"skip_turn"` : Fait sauter le prochain tour du joueur (sans perte de smiles)

Exemples :
```json
// Divorce
{
  "id": "malus-divorce",
  "name": "Divorce",
  "type": "malus",
  "effect": "divorce",
  "description": "Divorce forcé",
  "image": "💔",
  "quantity": 4
}

// Licenciement
{
  "id": "malus-fired",
  "name": "Licenciement",
  "type": "malus",
  "effect": "fired",
  "description": "Vous êtes licencié",
  "image": "📉",
  "quantity": 4
}

// Accident
{
  "id": "malus-accident",
  "name": "Accident de voiture",
  "type": "malus",
  "effect": "accident",
  "smilesLoss": 2,
  "description": "Accident: -2 smiles et saute le prochain tour",
  "image": "🚗💥",
  "quantity": 5
}

// Maladie (saute juste le tour sans perte de smiles)
{
  "id": "malus-maladie",
  "name": "Grippe",
  "type": "malus",
  "effect": "skip_turn",
  "description": "Maladie: saute le prochain tour",
  "image": "🤒",
  "quantity": 4
}
```

### 10. ⭐ Carte SPÉCIALE (`type: "special"`)

**Utilité :** Cartes bonus ou avec des effets uniques.

**Propriétés requises :**
```json
{
  "id": "special-1",
  "name": "Loto",
  "type": "special",
  "smiles": 3,
  "description": "Vous gagnez au loto!",
  "image": "🎰",
  "quantity": 3
}
```

**Note :** Les cartes spéciales sont simplement des bonus de smiles sans conditions.

### 11. 😈 Carte ADULTÈRE (`type: "adultery"`)

**Utilité :** Permet de flirter en étant marié.

**Propriétés requises :**
```json
{
  "id": "adultery-1",
  "name": "Adultère",
  "type": "adultery",
  "smiles": 0,
  "description": "Permet de flirter en étant marié",
  "image": "😈",
  "quantity": 3
}
```

**Règles :**
- Utilisable seulement si marié
- Permet de dépasser la limite de 5 flirts

## 🎨 Conseils pour les emojis/images

Utilisez des emojis pour une meilleure expérience visuelle :

**Études :** 🎓 📚 📖 🎯 🏆 📜 🔬 🧪 🎨 🎭
**Métiers :** 💼 👨‍💻 👩‍⚕️ 👨‍🍳 👩‍🏫 ⚖️ 🎨 🔧 💉 ✈️
**Flirts :** ❤️ 💕 💖 💗 💘 💝 (combinez avec lieux : ☕❤️, 🎬❤️)
**Mariage :** 💒 💍 👰 🤵 💐
**Enfants :** 👶 🍼 🧸 👨‍👩‍👧 👨‍👩‍👧‍👦
**Animaux :** 🐱 🐶 🐰 🐹 🦜 🐠 🐴 🐷
**Argent :** 💰 💵 💴 💶 💷 💳 🏦
**Voyages :** ✈️ 🗼 🗽 🗾 🏝️ 🌴 🏖️ 🗻
**Malus :** 💔 😰 😡 💥 🚨 ⚠️ ❌
**Bonus :** ⭐ 🌟 ✨ 💫 🍀 🎁 🎉

## ⚙️ Équilibrage du jeu

### Quantités recommandées :

- **Études** : 20-30 cartes total
- **Métiers** : 15-20 cartes
- **Flirts** : 20-25 cartes
- **Mariage** : 6-8 cartes
- **Enfants** : 8-10 cartes
- **Animaux** : 8-12 cartes
- **Salaires** : 15-20 cartes
- **Voyages** : 6-10 cartes
- **Malus** : 10-15 cartes
- **Spéciales** : 5-10 cartes

### Smiles recommandés :

- Études : 1-2 smiles
- Métiers : 2-5 smiles (selon niveau requis)
- Flirts : 1-2 smiles
- Mariage : 5 smiles
- Enfants : 3 smiles
- Animaux : 1-2 smiles
- Salaires : 1 smile
- Voyages : 3-6 smiles (selon coût)
- Malus : -2 à -4 smiles
- Spéciales : 1-3 smiles

## ✅ Validation de votre fichier

Avant de charger vos cartes, vérifiez :

1. ✅ Le fichier est un JSON valide
2. ✅ Tous les `id` sont uniques
3. ✅ Tous les `type` sont corrects
4. ✅ Les propriétés requises sont présentes
5. ✅ Les `quantity` sont supérieures à 0
6. ✅ Le total fait environ 100-150 cartes

Utilisez un validateur JSON en ligne : https://jsonlint.com/

## 🎯 Exemples thématiques

### Thème "Gaming" :
```json
{
  "cards": [
    {
      "id": "study-gaming",
      "name": "École de Gaming",
      "type": "study",
      "studyLevel": 2,
      "smiles": 2,
      "image": "🎮",
      "quantity": 5
    },
    {
      "id": "job-streamer",
      "name": "Streamer",
      "type": "job",
      "requiredStudies": 0,
      "smiles": 4,
      "image": "📹",
      "quantity": 3
    },
    {
      "id": "pet-gaming-cat",
      "name": "Chat Gamer",
      "type": "pet",
      "smiles": 2,
      "image": "🐱🎮",
      "quantity": 4
    }
  ]
}
```

### Thème "Science-Fiction" :
```json
{
  "cards": [
    {
      "id": "study-space",
      "name": "Académie Spatiale",
      "type": "study",
      "studyLevel": 2,
      "smiles": 3,
      "image": "🚀",
      "quantity": 5
    },
    {
      "id": "job-astronaut",
      "name": "Astronaute",
      "type": "job",
      "requiredStudies": 5,
      "smiles": 6,
      "image": "👨‍🚀",
      "quantity": 2
    },
    {
      "id": "travel-mars",
      "name": "Voyage sur Mars",
      "type": "travel",
      "cost": 10,
      "smiles": 10,
      "image": "🔴",
      "quantity": 1
    }
  ]
}
```

## 🐛 Débogage

Si vos cartes ne fonctionnent pas :

1. **Vérifiez la console du navigateur** (F12) pour les erreurs
2. **Testez votre JSON** sur jsonlint.com
3. **Vérifiez les types** : ils doivent être exactement comme indiqué
4. **Vérifiez les propriétés requises** pour chaque type de carte

## 💡 Astuces créatives

- Créez des **thèmes cohérents** (fantasy, sci-fi, historique...)
- Équilibrez les **coûts et récompenses**
- Ajoutez de l'**humour** dans les descriptions
- Utilisez des **emojis combinés** (🏨❤️, 💻💥)
- Testez vos cartes et **ajustez l'équilibrage**

---

**Amusez-vous bien à créer vos propres cartes ! 🎨**
