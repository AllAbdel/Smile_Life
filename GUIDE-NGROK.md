# 🌐 Guide ngrok - Jouer via Internet

## Étape 1 : Installer ngrok

1. Va sur https://ngrok.com/download
2. Télécharge la version Windows
3. Décompresse `ngrok.exe` dans un dossier (ex: `C:\ngrok\`)
4. Crée un compte gratuit sur ngrok.com
5. Copie ton authtoken depuis le dashboard
35Ftq5GTWyhf7vLHKU6Go6Pnd96_7FaeYyZvndeuX6uBZ14xQ
## Étape 2 : Configurer ngrok

Ouvre CMD et tape :

```bash
cd C:\ngrok
ngrok config add-authtoken 35Ftq5GTWyhf7vLHKU6Go6Pnd96_7FaeYyZvndeuX6uBZ14xQ
```

## Étape 3 : Lancer le tunnel

### Méthode automatique (recommandée)

1. Utilise le script `start-avec-ngrok.bat` fourni
2. Double-clique dessus
3. Ça lance automatiquement :
   - Le backend
   - Le frontend  
   - Le tunnel ngrok
4. Une URL publique s'affiche !

### Méthode manuelle

Terminal 1 - Backend :
```bash
cd backend
npm start
```

Terminal 2 - Frontend :
```bash
cd frontend
npm start
```

Terminal 3 - Tunnel ngrok :
```bash
cd C:\ngrok
ngrok http 3001
```

## Étape 4 : Récupérer l'URL

Dans la fenêtre ngrok, tu verras :

```
Forwarding  https://abc123-random.ngrok-free.app -> http://localhost:3001
```

Copie cette URL (ex: `https://abc123-random.ngrok-free.app`)

## Étape 5 : Modifier App.js

Ouvre `frontend/src/App.js` et modifie la ligne 7 :

```javascript
// REMPLACE par ton URL ngrok (SANS le /3001 à la fin)
const SOCKET_URL = 'https://abc123-random.ngrok-free.app';
```

## Étape 6 : Redémarrer le frontend

1. Arrête le frontend (Ctrl+C)
2. Relance : `npm start`

## Étape 7 : Partager avec tes amis

Tes amis vont sur :
```
https://abc123-random.ngrok-free.app:3000
```

Ou si ça marche pas, donne-leur l'URL sans le port :
```
https://abc123-random.ngrok-free.app
```

Et modifie `server.js` pour écouter sur le port 80.

## ⚠️ Important

- L'URL ngrok CHANGE à chaque redémarrage (version gratuite)
- Limite de 40 connexions/minute en gratuit
- Le tunnel reste actif tant que la fenêtre est ouverte

## 🚀 Version payante ngrok (optionnel)

- URL fixe : 8$/mois
- Plus de bande passante
- Plus de connexions

## 🔒 Sécurité

Pour protéger ton serveur, ajoute un mot de passe :

1. Va dans `backend/server.js`
2. Ajoute une vérification de mot de passe
3. Ou utilise la protection ngrok : `ngrok http 3001 --basic-auth "user:password"`

## 📱 Sur mobile

Le jeu est responsive, tes amis peuvent jouer directement depuis leur téléphone !

## 🐛 Problèmes courants

### "Tunnel not found"
→ Vérifie que ngrok est bien lancé et que l'URL est correcte

### "ERR_CONNECTION_REFUSED"
→ Vérifie que le backend tourne bien sur le port 3001

### "ngrok command not found"
→ Ajoute ngrok.exe au PATH de Windows ou utilise le chemin complet

## 💡 Astuce

Crée un raccourci avec cette commande pour lancer rapidement :
```bash
C:\ngrok\ngrok.exe http 3001
```
