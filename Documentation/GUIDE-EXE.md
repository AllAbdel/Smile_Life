# Guide : Transformer Smile Life en .exe

## 📦 Solution 1 : Electron (Recommandée)

Electron permet de créer une vraie application de bureau Windows avec votre jeu.

### Installation et configuration

1. **Installer Electron et les outils de build**
```powershell
npm install --save-dev electron electron-builder concurrently wait-on
```

2. **Créer le fichier principal Electron** (`electron.js` à la racine)
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'icon.ico') // Optionnel
  });

  // En développement, charge depuis localhost
  // En production, charge les fichiers buildés
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, './frontend/build/index.html')}`;
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  // Démarre le serveur Node.js backend
  const backendPath = path.join(__dirname, 'backend/server.js');
  backendProcess = spawn('node', [backendPath], {
    stdio: 'inherit'
  });

  backendProcess.on('error', (err) => {
    console.error('Erreur backend:', err);
  });
}

app.on('ready', () => {
  startBackend();
  setTimeout(createWindow, 2000); // Attend que le backend démarre
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
```

3. **Modifier package.json racine**

Ajouter ces scripts et configurations :

```json
{
  "name": "smile-life",
  "version": "1.0.0",
  "description": "Jeu de cartes Smile Life",
  "main": "electron.js",
  "scripts": {
    "start": "concurrently \"npm run start:backend\" \"npm run start:frontend\"",
    "start:backend": "cd backend && node server.js",
    "start:frontend": "cd frontend && npm start",
    "electron": "electron .",
    "electron:dev": "concurrently \"npm run start:backend\" \"wait-on http://localhost:3000 && electron .\"",
    "build:frontend": "cd frontend && npm run build",
    "build:exe": "npm run build:frontend && electron-builder",
    "dist": "npm run build:frontend && electron-builder --win"
  },
  "build": {
    "appId": "com.smilelife.app",
    "productName": "Smile Life",
    "directories": {
      "output": "dist"
    },
    "files": [
      "electron.js",
      "backend/**/*",
      "frontend/build/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": ["nsis", "portable"],
      "icon": "icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  },
  "devDependencies": {
    "electron": "^27.0.0",
    "electron-builder": "^24.9.1",
    "concurrently": "^8.2.2",
    "wait-on": "^7.2.0"
  }
}
```

4. **Créer l'exécutable**
```powershell
# Builder le frontend React
cd frontend
npm run build
cd ..

# Créer l'exécutable Windows
npm run build:exe
```

Le fichier .exe sera dans le dossier `dist/`

---

## 📦 Solution 2 : pkg (Plus simple mais moins recommandée)

`pkg` permet de packager une app Node.js en .exe, mais ne gère pas bien React.

### Pour le backend uniquement :

```powershell
npm install -g pkg

# Créer un exe du backend
pkg backend/server.js --targets node18-win-x64 --output smile-life-backend.exe
```

⚠️ Le frontend devra être servi séparément ou inclus manuellement.

---

## 📦 Solution 3 : nexe (Alternative à pkg)

```powershell
npm install -g nexe

nexe backend/server.js -t windows-x64 -o smile-life.exe
```

---

## 🎨 Solution 4 : Application portable complète

Créer un package portable sans Electron :

1. **Créer un script de lancement** (`start-smile-life.bat`)
```batch
@echo off
echo Démarrage de Smile Life...
start /B cmd /c "cd backend && node server.js"
timeout /t 2 /nobreak > nul
start http://localhost:3001
echo Smile Life est lancé !
pause
```

2. **Utiliser un outil comme Advanced Installer ou Inno Setup**
   - Packager tous les fichiers
   - Node.js portable inclus
   - Créer un vrai installateur Windows

---

## 🚀 Solution recommandée finale : Electron

### Avantages :
✅ Application de bureau native Windows
✅ Une seule fenêtre, pas de navigateur visible
✅ Icône personnalisée
✅ Installateur professionnel
✅ Backend et frontend packagés ensemble
✅ Aucune dépendance externe nécessaire

### Commandes rapides :

```powershell
# Installation
npm install --save-dev electron electron-builder concurrently wait-on

# Développement
npm run electron:dev

# Build final
npm run dist
```

### Taille approximative :
- ~150-200 MB (inclut Node.js, Chrome, et votre app)

---

## 📋 Checklist avant de distribuer :

- [ ] Tester l'exe sur un PC sans Node.js
- [ ] Vérifier que le backend démarre automatiquement
- [ ] Tester toutes les fonctionnalités du jeu
- [ ] Ajouter une icône personnalisée (.ico)
- [ ] Créer un fichier README pour les utilisateurs
- [ ] Signer l'exe (optionnel, évite les warnings Windows)

---

## 🎯 Prochaines étapes recommandées :

1. Je peux créer le fichier `electron.js` pour vous
2. Configurer le `package.json` avec les scripts
3. Créer une icône pour votre jeu
4. Tester et builder l'exe

Voulez-vous que je configure Electron pour votre projet maintenant ?
