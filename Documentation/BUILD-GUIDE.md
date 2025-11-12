# 🎮 Smile Life - Guide de Build et Distribution

## 🚀 Démarrage rapide

### En développement (avec hot-reload)

```powershell
# Démarrer backend + frontend
npm start

# OU démarrer avec Electron
npm run electron:dev
```

## 📦 Créer l'exécutable Windows (.exe)

### Méthode 1 : Installateur complet (recommandé)

```powershell
npm run dist
```

Cette commande va :
1. ✅ Builder le frontend React
2. ✅ Packager le backend Node.js
3. ✅ Créer un installateur Windows dans `dist/`

**Fichiers générés :**
- `dist/Smile Life Setup 1.0.0.exe` - Installateur NSIS
- `dist/Smile-Life-Portable.exe` - Version portable (sans installation)

### Méthode 2 : Version portable uniquement

```powershell
npm run dist:portable
```

Crée uniquement la version portable (un seul .exe à lancer).

## 📋 Prérequis

### Pour builder l'exe :
- Node.js installé
- NPM
- Windows (pour créer un .exe Windows)

### Pour exécuter l'exe final :
- ✅ **AUCUN prérequis !** 
- L'exe contient tout (Node.js, Chrome, votre jeu)
- Fonctionne sur n'importe quel PC Windows

## 🎨 Personnalisation

### Icône de l'application

Créez un fichier `icon.ico` à la racine du projet (256x256px recommandé).

Outils gratuits pour créer un .ico :
- https://convertio.co/png-ico/
- https://icoconvert.com/

### Modifier le nom / version

Éditez `package.json` :

```json
{
  "name": "smile-life",
  "version": "1.0.0",
  "description": "Votre description",
  "build": {
    "productName": "Smile Life"
  }
}
```

## 🔧 Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm start` | Lance backend + frontend en mode web |
| `npm run electron:dev` | Lance l'app Electron en développement |
| `npm run build` | Build le frontend React |
| `npm run dist` | Crée l'installateur + portable |
| `npm run dist:portable` | Crée seulement la version portable |
| `npm run pack` | Teste le packaging sans créer l'exe |

## 📁 Structure du build

```
dist/
├── Smile Life Setup 1.0.0.exe    # Installateur (avec désinstalleur)
├── Smile-Life-Portable.exe       # Version portable (sans installation)
└── win-unpacked/                 # Fichiers non packagés (debug)
```

## 🎯 Distribuer votre jeu

### Option 1 : Installateur (recommandé)
- Partager `Smile Life Setup 1.0.0.exe`
- L'utilisateur double-clique, installe, et lance
- Crée un raccourci bureau + menu démarrer
- Inclut un désinstalleur

### Option 2 : Portable
- Partager `Smile-Life-Portable.exe`
- L'utilisateur double-clique directement
- Aucune installation nécessaire
- Parfait pour clé USB ou partage rapide

## 🐛 Dépannage

### Le build échoue ?

1. Vérifiez que le frontend build correctement :
```powershell
cd frontend
npm run build
```

2. Vérifiez les dépendances backend :
```powershell
cd backend
npm install
```

3. Nettoyez et recommencez :
```powershell
rm -r dist, frontend/build
npm run dist
```

### L'exe ne démarre pas ?

1. Testez en mode développement d'abord :
```powershell
npm run electron:dev
```

2. Vérifiez les logs dans :
   - `%APPDATA%/smile-life/logs/` (Windows)

### Windows SmartScreen bloque l'exe ?

C'est normal pour les .exe non signés. Solutions :
- Cliquez "Informations complémentaires" → "Exécuter quand même"
- Pour distribution pro : signer l'exe avec un certificat

## 📊 Taille du fichier final

- **Installateur** : ~150-180 MB
- **Portable** : ~200-220 MB

Pourquoi si gros ? L'exe contient :
- ✅ Node.js complet
- ✅ Chromium (navigateur)
- ✅ Votre jeu

**Avantage** : Aucune dépendance à installer !

## 🎁 Astuces

### Tester avant distribution

```powershell
# Test rapide du packaging
npm run pack

# Lance l'exe non packagé
./dist/win-unpacked/Smile Life.exe
```

### Réduire la taille

Dans `package.json`, ajoutez :

```json
"build": {
  "compression": "maximum",
  "asar": true
}
```

### Auto-update (avancé)

Utiliser electron-updater pour les mises à jour automatiques :
https://www.electron.build/auto-update

## 📞 Support

En cas de problème, vérifiez :
1. Node.js version : `node --version` (v16+ recommandé)
2. Logs Electron : Ouvrir DevTools dans l'app
3. Documentation : https://www.electronjs.org/

---

**Bon jeu ! 🎮✨**
