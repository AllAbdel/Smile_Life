# 🎮 SMILE LIFE - DÉMARRAGE RAPIDE

## ⚡ POUR CRÉER L'EXE (3 méthodes au choix)

### Méthode 1 : SUPER FACILE (recommandée) 🌟

**Double-cliquez sur** : `build-exe.bat`

C'est tout ! Le script fait tout automatiquement.

---

### Méthode 2 : Commande directe

Ouvrez PowerShell dans ce dossier et tapez :

```powershell
npm run dist
```

---

### Méthode 3 : Version portable uniquement

```powershell
npm run dist:portable
```

---

## 📁 OÙ TROUVER L'EXE ?

Après le build, allez dans le dossier **`dist/`**

Vous y trouverez :
- `Smile Life Setup 1.0.0.exe` ← Installateur complet
- `Smile-Life-Portable.exe` ← Version portable (mon préféré !)

---

## 🧪 TESTER AVANT DE CRÉER L'EXE

Pour tester le jeu avec Electron (sans créer l'exe) :

**Double-cliquez sur** : `start-electron-dev.bat`

OU en ligne de commande :

```powershell
npm run electron:dev
```

---

## 📦 DISTRIBUER VOTRE JEU

### Pour vos amis/famille (facile)

Envoyez-leur : **`Smile-Life-Portable.exe`**

Ils double-cliquent, c'est tout ! Aucune installation.

### Pour une vraie distribution (avec installateur)

Envoyez-leur : **`Smile Life Setup 1.0.0.exe`**

Ça créera :
- Un raccourci sur le bureau
- Une entrée dans le menu Démarrer  
- Un désinstalleur dans Panneau de configuration

---

## ⏱️ COMBIEN DE TEMPS ÇA PREND ?

- **Premier build** : 5-10 minutes (télécharge des trucs)
- **Builds suivants** : 2-3 minutes

---

## 💾 TAILLE DU FICHIER

- **~180 MB** pour l'installateur
- **~200 MB** pour la version portable

C'est gros car ça contient TOUT (Node.js + navigateur + votre jeu).

**Avantage** : Vos amis n'ont RIEN à installer !

---

## 🐛 EN CAS DE PROBLÈME

1. **Le build échoue ?**
   - Vérifiez que Node.js est installé : `node --version`
   - Supprimez le dossier `dist/` et réessayez

2. **Windows bloque l'exe ?**
   - Clic droit → Propriétés → Débloquer
   - OU : "Informations complémentaires" → "Exécuter quand même"

3. **L'exe ne démarre pas ?**
   - Testez d'abord avec `npm run electron:dev`
   - Regardez les logs d'erreur

---

## 🎨 AJOUTER UNE ICÔNE (optionnel)

1. Créez une image 256x256 pixels
2. Convertissez en `.ico` sur : https://convertio.co/png-ico/
3. Renommez en `icon.ico`
4. Placez à la racine du projet (à côté de `electron.js`)
5. Rebuild l'exe

---

## ✅ CHECKLIST AVANT DE DISTRIBUER

- [ ] J'ai testé le jeu en mode dev (`npm run electron:dev`)
- [ ] Le jeu fonctionne correctement
- [ ] J'ai créé l'exe (`npm run dist`)
- [ ] J'ai testé l'exe sur mon PC
- [ ] (Optionnel) J'ai ajouté une icône personnalisée
- [ ] (Optionnel) J'ai testé sur un autre PC sans Node.js

---

## 🎯 COMMANDES UTILES

| Je veux... | Commande |
|------------|----------|
| Tester en mode web | `npm start` |
| Tester avec Electron | `npm run electron:dev` |
| Créer l'exe complet | `npm run dist` |
| Créer seulement portable | `npm run dist:portable` |
| Nettoyer et rebuild | Supprimer `dist/` puis `npm run dist` |

---

**🎮 Amusez-vous bien avec Smile Life ! ✨**

Questions ? Consultez `BUILD-GUIDE.md` pour plus de détails.
