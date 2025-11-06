# ✅ Checklist de Vérification Rapide

## Avant de redéployer, vérifiez ces points :

### 1. Variables Netlify (Site configuration > Environment variables)

Vous devez avoir **EXACTEMENT** ces 7 variables :

- [ ] `FIREBASE_API_KEY`
- [ ] `FIREBASE_AUTH_DOMAIN`
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_STORAGE_BUCKET`
- [ ] `FIREBASE_MESSAGING_SENDER_ID`
- [ ] `FIREBASE_APP_ID`
- [ ] `FIREBASE_MEASUREMENT_ID`

**⚠️ Attention :**
- Les noms doivent être EXACTEMENT comme ci-dessus (avec les majuscules et underscores)
- PAS de guillemets dans les valeurs
- PAS d'espaces avant ou après les valeurs

### 2. Domaines Firebase (Firebase Console > Authentication > Settings)

Dans "Authorized domains", vous devez avoir AU MINIMUM :

- [ ] `localhost` (par défaut)
- [ ] `votre-projet.firebaseapp.com` (par défaut)
- [ ] `votre-site.netlify.app` (VOTRE domaine Netlify) ← **IMPORTANT !**

### 3. Valeur authDomain

⚠️ **ERREUR FRÉQUENTE** :

La variable `FIREBASE_AUTH_DOMAIN` doit être :
- ✅ CORRECT : `votre-projet.firebaseapp.com`
- ❌ FAUX : `votre-site.netlify.app`

**C'est le domaine Firebase, PAS le domaine Netlify !**

### 4. Fichiers du projet

Vérifiez que ces fichiers existent :

- [ ] `netlify.toml` (configuré)
- [ ] `generate-firebase-config.js` (créé)
- [ ] `package.json` (créé)
- [ ] `firebase-config.template.js` (existe déjà)

### 5. Git

- [ ] Tous les nouveaux fichiers sont commités
- [ ] Le code est pushé sur votre dépôt Git
- [ ] Netlify est bien connecté à votre dépôt

---

## 🔍 Comment trouver votre domaine Netlify ?

Sur Netlify :
1. Cliquez sur votre site
2. En haut vous verrez l'URL : `https://quelquechose-123abc.netlify.app`
3. Copiez juste la partie : `quelquechose-123abc.netlify.app` (sans https://)
4. C'est ce domaine qu'il faut ajouter dans Firebase

---

## 📝 Erreurs courantes et solutions

### Erreur : "auth/unauthorized-domain"
**Cause** : Le domaine Netlify n'est pas dans les domaines autorisés Firebase  
**Solution** : Ajoutez `votre-site.netlify.app` dans Firebase Console > Authentication > Settings > Authorized domains

### Erreur : "Firebase not initialized" dans la console
**Cause** : Les variables d'environnement ne sont pas correctement configurées  
**Solution** : 
1. Vérifiez les noms des variables (respectez exactement les majuscules)
2. Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs
3. Redéployez avec "Clear cache and deploy site"

### Erreur : "auth/invalid-api-key"
**Cause** : La clé API est incorrecte ou contient des espaces  
**Solution** : Recopiez la valeur depuis Firebase (attention aux espaces invisibles)

### Page blanche
**Cause** : Erreur JavaScript qui bloque le chargement  
**Solution** : 
1. Ouvrez la console du navigateur (F12)
2. Regardez l'onglet "Console" pour voir l'erreur exacte
3. Regardez l'onglet "Network" pour voir si les fichiers se chargent

---

## 🧪 Test rapide

Après le déploiement :

1. Ouvrez votre site Netlify
2. Appuyez sur F12 (ou Cmd+Option+I sur Mac)
3. Allez dans l'onglet "Console"
4. Vous devriez voir : **"Firebase initialisé avec succès"**
5. Si vous ne voyez pas ce message, il y a un problème avec les variables

---

## 📋 Si ça ne marche toujours pas...

Envoyez-moi ces informations :

1. **Logs de build Netlify** :
   - Sur Netlify, cliquez sur `Deploys`
   - Cliquez sur le dernier deploy
   - Copiez les logs (surtout cherchez les lignes avec "firebase")

2. **Console du navigateur** :
   - Ouvrez votre site
   - F12 → onglet Console
   - Copiez tous les messages d'erreur en rouge

3. **Variables configurées** :
   - Screenshot de votre page `Environment variables` sur Netlify
   - (masquez les valeurs si sensible, mais montrez les noms)
