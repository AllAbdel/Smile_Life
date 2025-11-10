# 🚀 DÉMARRAGE RAPIDE - Smile Life

## ⚡ En 3 étapes

### 1️⃣ Installation (une seule fois)

**Windows :**
```bash
Double-cliquez sur start.bat
```

**Mac/Linux :**
```bash
./start.sh
```

Le script va automatiquement :
- ✅ Vérifier Node.js
- ✅ Installer les dépendances
- ✅ Lancer le serveur
- ✅ Ouvrir le navigateur

### 2️⃣ Créer une partie

1. Entrez votre nom
2. Cliquez sur "Créer une partie"
3. Partagez le code avec vos amis

### 3️⃣ Vos amis rejoignent

1. Ils vont sur `http://localhost:3000` (même réseau WiFi)
2. Entrent leur nom
3. Entrent le code de la partie
4. Cliquent sur "Rejoindre"

**C'EST TOUT ! 🎉**

---

## 📱 Jouer via Internet

Pour jouer avec des amis à distance :

### Option rapide : ngrok

```bash
# 1. Installez ngrok : https://ngrok.com/
# 2. Lancez le tunnel :
ngrok http 3001

# 3. Partagez l'URL fournie (ex: https://abc123.ngrok.io)
# 4. Vos amis modifient SOCKET_URL dans frontend/src/App.js
```

---

## 🎨 Cartes personnalisées

1. Créez un fichier `mes-cartes.json`
2. Copiez la structure de `custom-cards-example.json`
3. Chargez-le au moment de créer la partie

**Voir GUIDE-CARTES.md pour les détails**

---

## 🆘 Problèmes courants

### Le serveur ne démarre pas
```bash
# Vérifiez que les ports sont libres
# Windows : netstat -ano | findstr "3000"
# Mac/Linux : lsof -i :3000
```

### Pas de connexion
```bash
# Vérifiez que le backend tourne sur :3001
# Vérifiez l'URL dans App.js ligne 4
```

### Cartes ne se chargent pas
```bash
# Validez votre JSON sur jsonlint.com
# Vérifiez la console du navigateur (F12)
```

---

## 📚 Documentation complète

- `README.md` : Documentation complète
- `GUIDE-CARTES.md` : Créer des cartes personnalisées
- `custom-cards-example.json` : Exemple de cartes custom

---

## 🎮 Commandes utiles

```bash
# Démarrer manuellement

# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

---

**Bon jeu ! 😊**

Besoin d'aide ? Consultez le README.md
