# 🌐 Guide Multijoueur en Réseau Local (LAN)

## 🎯 Comment jouer avec des amis sur le même réseau WiFi/Ethernet

### 📋 Prérequis

- Tous les joueurs doivent être sur le **même réseau WiFi** ou connectés au **même routeur**
- Le pare-feu Windows doit autoriser Node.js (il demandera la permission au premier lancement)
- Connaître ton adresse IP locale

---

## 🚀 Démarrage (Hôte du jeu)

### Option 1 : Script automatique (RECOMMANDÉ)

1. Double-cliquer sur `scripts/start-lan.bat`
2. Deux fenêtres s'ouvrent : Backend et Frontend
3. **IMPORTANT** : Dans la fenêtre "Backend", cherche ton adresse IP :
   ```
   🌐 Adresses IP disponibles :
      - Localhost: http://localhost:3001
      - Ethernet: http://192.168.1.10:3001  ← TON IP ICI
   ```
4. Note cette adresse (par exemple : `192.168.1.10`)

### Option 2 : Démarrage manuel

1. Ouvrir un terminal dans le dossier `backend`
2. Lancer : `npm start`
3. Noter l'adresse IP affichée
4. Dans un autre terminal, aller dans `frontend`
5. Lancer : `npm start`

---

## 👥 Connexion des Amis

### Méthode Simple (si tout le monde a Chrome/Edge)

1. Tes amis ouvrent leur navigateur
2. Ils vont sur : `http://TON_IP:3000`
   - Exemple : `http://192.168.1.10:3000`
3. Ils cliquent sur **⚙️ Configuration** en haut à droite
4. Ils entrent l'adresse du serveur : `http://TON_IP:3001`
   - Exemple : `http://192.168.1.10:3001`
5. Ils cliquent sur **Connecter**
6. Ils entrent leur pseudo et rejoignent ton salon !

### Méthode Alternative (Frontend sur chaque PC)

Si tes amis ont aussi téléchargé le jeu :

1. Ils lancent `start.bat` normalement
2. Cliquez sur **⚙️ Configuration**
3. Entrent ton IP serveur : `http://TON_IP:3001`
4. Se connectent et rejoignent !

---

## 🔧 Configuration du Pare-feu

### Windows Defender Firewall

Au premier lancement, Windows va demander :
- ✅ **Autoriser Node.js** sur les réseaux privés
- ✅ **Autoriser Node.js** sur les réseaux publics (optionnel)

Si tu as bloqué par erreur :

1. Panneau de configuration → Pare-feu Windows
2. Paramètres avancés
3. Règles de trafic entrant
4. Chercher "Node.js"
5. Activer les règles pour les ports 3000 et 3001

---

## 🎮 Créer et Rejoindre un Salon

### Pour l'Hôte :

1. Entre ton pseudo
2. Clique sur **Créer un salon**
3. Note le **Code du salon** (ex : ABC123)
4. Partage ce code avec tes amis

### Pour les Joueurs :

1. Entre ton pseudo
2. Entre le **Code du salon** reçu
3. Clique sur **Rejoindre**
4. Attends que l'hôte lance la partie !

---

## ❓ Dépannage

### ⚠️ Impossible de se connecter

**Problème** : Les amis ne peuvent pas accéder à `http://TON_IP:3000`

**Solutions** :
1. Vérifie que le serveur est lancé (fenêtre Backend active)
2. Vérifie ton IP avec : `ipconfig` dans cmd (cherche "Adresse IPv4")
3. Désactive temporairement le pare-feu Windows pour tester
4. Vérifie que tout le monde est sur le même WiFi
5. Redémarre le routeur si besoin

### 🔴 Erreur "Connection refused"

**Problème** : Message "Impossible de se connecter au serveur"

**Solutions** :
1. L'adresse serveur doit être `http://IP:3001` (pas 3000 !)
2. Vérifie que le backend est lancé
3. Vérifie le pare-feu
4. Ping ton IP depuis l'ordinateur ami : `ping TON_IP`

### 🐌 Lag / Latence

**Problème** : Le jeu rame

**Solutions** :
1. Utilise un câble Ethernet au lieu du WiFi
2. Rapproche-toi du routeur WiFi
3. Ferme les téléchargements en cours
4. Vérifie qu'aucun VPN n'est actif

### 💻 "You must enable JavaScript"

**Problème** : Page blanche avec ce message

**Solutions** :
1. Utilise Chrome, Edge ou Firefox (pas Internet Explorer)
2. Vérifie que JavaScript est activé dans les paramètres
3. Désactive les extensions de blocage (AdBlock, etc.)

---

## 📱 Jouer depuis un Téléphone/Tablette

**Oui, c'est possible !** 📲

1. Ton téléphone/tablette doit être sur le **même WiFi**
2. Ouvre le navigateur (Chrome, Safari)
3. Va sur `http://TON_IP:3000`
4. Configure le serveur : `http://TON_IP:3001`
5. Joue normalement !

> **Note** : L'interface est optimisée pour ordinateur, mais fonctionne sur mobile

---

## 🌍 Jouer via Internet (hors réseau local)

Pour jouer avec des amis **non connectés au même WiFi**, tu as 2 options :

### Option 1 : Ngrok (Simple)

1. Installe [Ngrok](https://ngrok.com/)
2. Lance : `ngrok http 3001`
3. Partage l'URL `https://xxxx.ngrok.io` avec tes amis
4. Voir le guide complet : `Documentation/GUIDE-NGROK.md`

### Option 2 : Redirection de ports (Avancé)

1. Accède à ton routeur (192.168.1.1 en général)
2. Redirige le port 3001 vers ton PC
3. Partage ton IP publique (cherche "mon ip" sur Google)
4. Tes amis utilisent : `http://TON_IP_PUBLIQUE:3001`

⚠️ **Attention** : Expose ton réseau sur Internet, risques de sécurité

---

## 💡 Astuces Pro

### 🎤 Communication Vocale

Le jeu n'a pas de chat vocal intégré, utilise :
- Discord
- TeamSpeak
- Skype
- WhatsApp/Messenger en appel

### 📊 Nombre de Joueurs

- Minimum : 2 joueurs
- Maximum : 6 joueurs
- Optimal : 3-4 joueurs pour plus de fun

### 🎨 Cartes Personnalisées

Tu peux charger des cartes custom en LAN :
1. L'hôte créé le salon avec son fichier JSON
2. Tous les joueurs utilisent ces cartes automatiquement
3. Pas besoin que les amis aient le fichier !

---

## 📞 Support

Des problèmes ? Vérifie :
1. Tout le monde sur le même réseau ✅
2. Pare-feu autorise Node.js ✅
3. Bonne adresse IP serveur ✅
4. Backend lancé et actif ✅

Si ça ne marche toujours pas, demande de l'aide avec ces infos :
- Message d'erreur exact
- OS (Windows 10/11)
- Navigateur utilisé
- Sortie console du backend

Bon jeu ! 🎮🎉
