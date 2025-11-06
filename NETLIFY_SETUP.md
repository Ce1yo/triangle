# Configuration Netlify pour Triangle

## Problème résolu
Le fichier `firebase-config.js` était ignoré par Git et n'était donc pas déployé sur Netlify, empêchant la connexion de fonctionner.

## Solution implémentée
Un script de build génère automatiquement `firebase-config.js` à partir des variables d'environnement Netlify.

## Étapes de configuration sur Netlify

### 1. Variables d'environnement à configurer

Dans votre dashboard Netlify, allez dans **Site settings > Environment variables** et ajoutez :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `FIREBASE_API_KEY` | Clé API Firebase | `AIzaSyD...` |
| `FIREBASE_AUTH_DOMAIN` | Domaine d'authentification | `votre-projet.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | ID du projet Firebase | `votre-projet` |
| `FIREBASE_STORAGE_BUCKET` | Bucket de stockage | `votre-projet.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | ID de l'expéditeur | `123456789` |
| `FIREBASE_APP_ID` | ID de l'application | `1:123456789:web:abc...` |
| `FIREBASE_MEASUREMENT_ID` | ID de mesure (optionnel) | `G-XXXXXXXXXX` |

### 2. Récupérer vos valeurs Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Allez dans **Paramètres du projet** (icône ⚙️)
4. Scrollez jusqu'à "Vos applications" et copiez les valeurs de configuration

### 3. Configuration du domaine Firebase

⚠️ **IMPORTANT** : Dans votre Firebase Console, vous devez ajouter votre domaine Netlify aux domaines autorisés :

1. Allez dans **Authentication > Settings > Authorized domains**
2. Ajoutez votre domaine Netlify : `votre-site.netlify.app`
3. Si vous avez un domaine personnalisé, ajoutez-le aussi

### 4. Déploiement

Une fois les variables d'environnement configurées :
- Pushez votre code sur Git
- Netlify redéploiera automatiquement le site
- Le script `generate-firebase-config.js` s'exécutera et créera `firebase-config.js` avec vos vraies valeurs

## Test

Pour tester que tout fonctionne :
1. Ouvrez votre site sur Netlify
2. Ouvrez la console du navigateur (F12)
3. Vous devriez voir : "Firebase initialisé avec succès"
4. Essayez de vous connecter

## Fichiers modifiés/créés

- ✅ `netlify.toml` - Configuration Netlify
- ✅ `generate-firebase-config.js` - Script de génération de config
- ✅ `NETLIFY_SETUP.md` - Ce guide

## En cas de problème

### Erreur "Firebase not initialized"
- Vérifiez que toutes les variables d'environnement sont correctement définies sur Netlify
- Redéployez le site

### Erreur d'authentification
- Vérifiez que le domaine Netlify est dans les domaines autorisés Firebase
- Vérifiez que les règles Firebase permettent l'authentification

### Page blanche
- Ouvrez la console du navigateur pour voir les erreurs
- Vérifiez que le build Netlify s'est terminé avec succès
