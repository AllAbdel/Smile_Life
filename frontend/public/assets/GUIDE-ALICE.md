# 🎵 Guide : Ajouter le son Alice

## 📍 Emplacement du fichier

Place ton fichier audio ici :
```
frontend/public/assets/alice.mp3
```

OU

```
frontend/public/assets/alice.wav
```

## ✅ Étapes

### 1. Prépare ton fichier audio
- **Nom** : Renomme-le en `alice.mp3` ou `alice.wav`
- **Format** : MP3 (recommandé) ou WAV
- **Durée** : 1 à 5 secondes idéalement
- **Qualité** : Normalise le volume (pas trop fort !)

### 2. Place le fichier
1. Ouvre le dossier : `E:\Perso\Smile Life\frontend\public\assets\`
2. Copie ton fichier `alice.mp3` (ou `alice.wav`) dedans
3. Vérifie que le nom est exactement `alice.mp3` ou `alice.wav`

### 3. Teste
1. Relance le jeu (si déjà en cours)
2. Ouvre le panneau **Média & Sons** (🎬)
3. Dans la section **Soundboard**, clique sur **"Alice 💕"**
4. Le son devrait se jouer ! 🎉

## 🐛 Dépannage

### Le son ne se joue pas ?

**Vérifications** :
1. ✅ Le fichier est bien dans `frontend/public/assets/`
2. ✅ Le nom est exactement `alice.mp3` (pas `Alice.mp3`, pas `alice .mp3`)
3. ✅ Le format est MP3 ou WAV
4. ✅ Le frontend a été relancé après avoir ajouté le fichier

**Console navigateur** :
1. Ouvre les DevTools (F12)
2. Clique sur **Console**
3. Clique sur "Alice 💕" dans la soundboard
4. Regarde les erreurs éventuelles

**Erreurs possibles** :
- `404 Not Found` → Le fichier n'est pas au bon endroit
- `Unsupported format` → Convertis ton fichier en MP3
- `CORS error` → Relance le serveur frontend

## 📝 Alternatives

Si `alice.mp3` ne fonctionne pas, essaie `alice.wav` :
- Le code essaie automatiquement `.wav` si `.mp3` échoue
- Assure-toi d'avoir le fichier avec l'extension correspondante

## 🔊 Format recommandé

**MP3** :
- Bitrate : 128 kbps ou plus
- Sample rate : 44.1 kHz
- Mono ou Stéréo

**WAV** :
- Sample rate : 44.1 kHz
- Bit depth : 16-bit
- Plus gros que MP3, mais meilleure compatibilité

## 🎯 Résultat attendu

Une fois configuré :
- ✅ Cliquer sur "Alice 💕" joue le son
- ✅ Les autres joueurs entendent aussi le son
- ✅ Message dans le chat : "🔊 [Joueur] a joué: Alice 💕"

Bon jeu ! 🎮
