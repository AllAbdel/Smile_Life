# 🌐 Guide Ngrok - Jouer en ligne

## 🎯 Qu'est-ce que ngrok ?

Ngrok crée un tunnel sécurisé qui rend ton serveur local accessible sur Internet. Parfait pour jouer avec des amis à distance !

## 📥 Installation

1. Va sur https://ngrok.com/
2. Crée un compte gratuit
3. Télécharge ngrok pour Windows
4. Extrais le fichier `ngrok.exe` quelque part (ex: `C:\ngrok\`)

## 🔑 Configuration (une seule fois)

1. Récupère ton token sur https://dashboard.ngrok.com/get-started/your-authtoken
2. Ouvre CMD et va dans le dossier ngrok :
```bash
cd C:\ngrok
```
3. Configure ton token :
```bash
ngrok authtoken TON_TOKEN_ICI
```

## 🚀 Utilisation

### Étape 1 : Lance ton serveur Smile Life

Double-clic sur `start-silent.bat` (ou `start.bat`)

### Étape 2 : Lance ngrok

Ouvre un nouveau CMD et lance :
```bash
cd C:\ngrok
ngrok http 3001
```

Tu vas voir quelque chose comme :
```
Forwarding    https://abc123def.ngrok.io -> http://localhost:3001
```

### Étape 3 : Partage l'URL

**TOI (l'hôte) :**
1. Va sur `http://localhost:3000`
2. Clique sur "🌐 Serveur"
3. Entre : `abc123def.ngrok.io:3001` (sans https://)
4. Clique sur "Changer le serveur"
5. Crée une partie

**TES AMIS :**
1. Vont sur `https://abc123def.ngrok.io` (dans leur navigateur)
2. Cliquent sur "🌐 Serveur"  
3. Entrent : `abc123def.ngrok.io:3001`
4. Cliquent sur "Changer le serveur"
5. Rejoignent ta partie avec le code

## ⚠️ Limitations version gratuite

- ✅ Illimité en durée
- ❌ L'URL change à chaque fois que tu relances ngrok
- ❌ Session expire après 2h d'inactivité
- ❌ Limité à 40 connexions/minute

## 💡 Astuces

### URL fixe (compte payant)

Avec un compte payant, tu peux avoir une URL fixe :
```bash
ngrok http 3001 --domain=ton-nom.ngrok.io
```

### Voir les connexions

Dashboard ngrok : http://localhost:4040

### Arrêter ngrok

Dans le CMD ngrok : `Ctrl + C`

## 🔥 Démarrage rapide

**Script automatique** (à créer : `start-with-ngrok.bat`) :

```batch
@echo off
echo Lancement de Smile Life avec ngrok...

REM Lancer le jeu
start "" cmd /k "cd /d %~dp0 && start-silent.bat"

REM Attendre 5 secondes
timeout /t 5 /nobreak

REM Lancer ngrok
start "" cmd /k "cd C:\ngrok && ngrok http 3001"

echo.
echo Ngrok lance ! Copie l'URL affichee et partage-la !
pause
```

## 🐛 Problèmes courants

### "Connection refused"
→ Le serveur backend n'est pas lancé. Lance `start.bat` d'abord.

### "Tunnel not found"
→ Vérifie que tu as bien configuré ton authtoken.

### "Invalid Host header"
→ Normal avec ngrok gratuit, ignore ce message.

### Les amis ne peuvent pas rejoindre
→ Vérifie qu'ils ont bien changé l'URL du serveur dans le menu.

## 📞 Alternatives à ngrok

- **Hamachi** : Crée un réseau VPN virtuel
- **Tailscale** : VPN moderne et gratuit
- **Playit.gg** : Spécialisé pour les jeux
- **LocalTunnel** : Alternative open-source à ngrok

## 🎮 Résumé visuel

```
┌─────────────┐
│   TON PC    │
│             │
│  Backend    │ ← Lance start.bat
│  :3001      │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   NGROK     │ ← Lance ngrok http 3001
│  Tunnel     │
└──────┬──────┘
       │
       ↓ Internet
       │
┌─────────────┐
│  TES AMIS   │ ← Vont sur abc123.ngrok.io
│  Navigateur │
└─────────────┘
```

---

**Bon jeu en ligne ! 🌐🎮**
