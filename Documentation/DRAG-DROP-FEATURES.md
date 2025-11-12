# 🎮 Nouvelles Fonctionnalités Drag & Drop

## ✨ Ce qui a été ajouté

### 1. **Sons Immersifs** 🎵

#### Sons disponibles :
- **Whoosh** 🌬️ : Quand tu commences à glisser une carte
- **Ding** ✅ : Quand tu poses une carte avec succès
- **Error** ❌ : Quand tu essayes de poser une carte dans une zone invalide

#### Technologie :
- Utilise Web Audio API (pas besoin de fichiers audio)
- Sons générés de façon procédurale
- Volume ajustable
- Peut être désactivé

---

### 2. **Trainée Visuelle** 👻

Quand tu glisses une carte :
- Un **fantôme transparent** suit ta souris
- Affiche la carte en train d'être déplacée
- Animation de flottement fluide
- Ombre portée pour effet de profondeur

**Effet visuel** :
```
┌─────────────┐
│   😊        │  ← Suit ta souris
│  Voyage     │
└─────────────┘
     💨 Trainée
```

---

### 3. **Animation Shake** 💥

Si tu lâches une carte dans une zone invalide :
- La zone **tremble** pendant 0.5 seconde
- Bordure rouge
- Fond rouge clair
- Message d'erreur affiché

**Exemples d'erreurs** :
- Malus sur toi → Zone "self" shake
- Bonus sur adversaire → Zone adversaire shake
- Carte non-salaire au casino → Zone casino shake

---

### 4. **Système Casino Amélioré** 🎰

#### Ancien système (❌ Problème) :
- Prenait les salaires déjà posés (`player.salary`)
- Ne permettait pas de parier depuis la main
- Nécessitait 2 tours séparés

#### Nouveau système (✅ Corrigé) :

**A) Parier un salaire depuis ta main**
- Glisse un salaire de ta main directement au casino
- Le salaire est retiré de ta main
- Pari enregistré instantanément

**B) Pari automatique après Casino**
Quand tu joues la carte Casino :

1. Tu poses le Casino devant toi
2. **Popup instantané** : "Veux-tu parier un salaire ?"
3. **Si OUI** :
   - Tu choisis un salaire de ta main
   - Tu joues 2 cartes ce tour (Casino + Salaire)
   - Tu piocheras **2 cartes** à la fin du tour
4. **Si NON** :
   - Tu as juste posé le Casino
   - Tu piocheras 1 carte normalement

**Avantage** : Économise un tour et permet une action combo !

---

## 🎯 Zones de Drop

| Zone | Icône | Action | Validation |
|------|-------|--------|------------|
| **Ta zone** | 🎯 | Jouer sur toi | ❌ Bloque malus |
| **Adversaires** | 💢 | Malus | ❌ Bloque bonus |
| **Casino** | 🎰 | Parier | ✅ Salaires uniquement |
| **Défausse** | 🗑️ | Défausser | ✅ Toutes cartes |

---

## 💡 Astuces

### Feedback Visuel

**Pendant le drag** :
- Bordures en pointillés apparaissent
- Les zones valides **pulsent** (glow)
- Messages contextuels s'affichent

**Au survol d'une zone** :
- Bordure **verte** = Zone valide
- Bordure **rouge** = Zone invalide (malus)
- Bordure **dorée** = Casino
- Bordure **grise** = Défausse

### Contrôles Hybrides

Tu peux **TOUJOURS** utiliser :
- ✅ Drag & Drop (nouveau)
- ✅ Clic + Boutons (ancien système)

Les deux fonctionnent en parallèle !

---

## 🛠️ Fichiers Modifiés

### Frontend :

**App.js** :
- Import de `SoundManager`
- Nouveaux états : `dragGhostPos`, `shakeZone`, `showCasinoBetPrompt`
- Fonctions drag améliorées avec sons
- Gestion du casino depuis la main
- Prompt de pari automatique

**App.css** :
- Styles `.drag-ghost` et `.drag-ghost-card`
- Animation `@keyframes shakeError`
- Styles `.casino-prompt`
- Animations de flottement

**SoundManager.js** (nouveau) :
- Gestionnaire de sons avec Web Audio API
- 3 sons : whoosh, ding, error
- Contrôle de volume
- Toggle on/off

### Backend :

**server.js** :
- `placeCasinoBet()` : Utilise `player.hand` au lieu de `player.salary`
- Filtre les salaires de la main
- Émet `playerId` dans `casino-opened` pour déclencher le prompt

---

## 🧪 Tests

### Test 1 : Drag & Drop basique
1. Crée une partie
2. Attends ton tour
3. Glisse une carte devant toi
4. **Résultat** : Whoosh → Trainée → Ding → Carte jouée

### Test 2 : Validation
1. Essaye de glisser un **malus** sur toi
2. **Résultat** : Ta zone shake + son d'erreur + message

### Test 3 : Casino combo
1. Joue la carte **Casino** (drag ou clic)
2. **Popup** : "Veux-tu parier ?"
3. Clique **"Oui"**
4. Choisis un salaire dans ta main
5. **Résultat** : Casino posé + salaire parié + piocher 2 cartes

### Test 4 : Pari direct au casino
1. Assure-toi que le casino est ouvert
2. Glisse un **salaire** de ta main sur le **casino**
3. **Résultat** : Salaire retiré de la main + pari enregistré

---

## 🐛 Dépannage

### Sons ne marchent pas
- Vérifie que le navigateur autorise l'audio
- Chrome peut bloquer l'audio sans interaction utilisateur
- Essaye de cliquer une fois sur la page d'abord

### Trainée ne suit pas la souris
- Normal : peut être légèrement décalée
- Le navigateur limite les événements drag
- C'est voulu pour les performances

### Shake ne s'affiche pas
- L'animation dure 0.5s
- Vérifie la console pour les erreurs
- Assure-toi que les classes CSS sont chargées

---

## 📈 Améliorations Futures (Idées)

- [ ] Son différent pour chaque type de carte
- [ ] Trainée avec particules
- [ ] Vibration sur mobile (Vibration API)
- [ ] Historique des actions avec animations
- [ ] Drag & drop sur mobile (touch events)
- [ ] Confettis au drop réussi
- [ ] Effet de zoom sur la carte dragged

---

**Bon jeu ! 🎉**
