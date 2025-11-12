const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;
let serverModule;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false // Désactive la sécurité web pour permettre le chargement local
    },
    backgroundColor: '#667eea',
    title: 'Smile Life',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'smile.ico')
  });

  // En développement : charge depuis localhost:3000
  // En production : charge les fichiers buildés
  const isDev = process.env.ELECTRON_START_URL;
  
  if (isDev) {
    mainWindow.loadURL(isDev);
  } else {
    // En production, utilise un chemin file:// absolu
    const indexPath = path.join(__dirname, 'frontend', 'build', 'index.html');
    console.log('📂 Chargement de:', indexPath);
    mainWindow.loadFile(indexPath); // Utilise loadFile au lieu de loadURL
  }

  // Ouvre DevTools pour debug
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Gère les liens externes
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

function startBackend() {
  console.log('🚀 Démarrage du serveur backend intégré...');
  
  try {
    const backendDir = path.join(__dirname, 'backend');
    console.log('📂 Backend directory:', backendDir);
    console.log('📂 Current __dirname:', __dirname);
    
    // Sauvegarde le cwd original
    const originalCwd = process.cwd();
    
    // Change temporairement le répertoire pour que les require relatifs fonctionnent
    try {
      process.chdir(backendDir);
      console.log('📂 Changed working directory to:', process.cwd());
    } catch (err) {
      console.error('❌ Impossible de changer de répertoire:', err);
      // Si on ne peut pas changer de répertoire, essayons quand même
    }
    
    // Require le serveur backend
    const backendPath = path.join(backendDir, 'server.js');
    console.log('📂 Loading backend from:', backendPath);
    
    serverModule = require(backendPath);
    
    console.log('✅ Backend démarré avec succès');
    
    // Restaure le cwd original après 2 secondes (après que le backend ait tout chargé)
    setTimeout(() => {
      try {
        process.chdir(originalCwd);
        console.log('📂 Restored working directory to:', process.cwd());
      } catch (err) {
        console.error('Erreur lors de la restauration du répertoire:', err);
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du backend:', error);
    console.error('Stack:', error.stack);
  }
}

app.on('ready', () => {
  console.log('⚡ Application Electron démarrée');
  
  // Démarre le backend en premier
  startBackend();
  
  // Attend 2 secondes que le backend démarre, puis ouvre la fenêtre
  setTimeout(() => {
    console.log('🎮 Ouverture de la fenêtre de jeu...');
    createWindow();
  }, 2000);
});

app.on('window-all-closed', () => {
  // Arrête le serveur backend si nécessaire
  console.log('🛑 Fermeture de l\'application...');
  
  // Sur macOS, les apps restent actives jusqu'à Cmd+Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // Sur macOS, recrée la fenêtre si on clique sur l'icône du dock
  if (mainWindow === null) {
    createWindow();
  }
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturée:', error);
});

console.log('📦 Electron configuré pour Smile Life');
