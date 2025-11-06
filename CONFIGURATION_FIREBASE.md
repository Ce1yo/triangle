# Guide de Configuration Firebase

## Étape 1 : Créer un projet Firebase

1. Allez sur https://console.firebase.google.com/
2. Cliquez sur "Ajouter un projet"
3. Donnez un nom à votre projet (ex: "gestion-devis-factures")
4. Acceptez les conditions et créez le projet

## Étape 2 : Configurer Authentication

1. Dans le menu de gauche, cliquez sur "Authentication"
2. Cliquez sur "Commencer"
3. Activez les méthodes de connexion suivantes :
   - **Email/Password** : Activez-le
   - **Google** : Activez-le et configurez votre email de support

## Étape 3 : Configurer Firestore Database

1. Dans le menu de gauche, cliquez sur "Firestore Database"
2. Cliquez sur "Créer une base de données"
3. Choisissez "Démarrer en mode test" (pour le développement)
4. Sélectionnez votre région (europe-west par exemple)
5. Cliquez sur "Activer"

### Configuration des règles Firestore

Une fois la base de données créée, cliquez sur l'onglet "Règles" et remplacez le contenu par :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles pour les devis
    match /devis/{devisId} {
      // Permettre la lecture uniquement si l'utilisateur est le propriétaire
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      // Permettre l'écriture uniquement si l'utilisateur est le propriétaire
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      // Permettre la création pour tout utilisateur authentifié
      allow create: if request.auth != null;
    }
    
    // Règles pour les factures
    match /factures/{factureId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

Cliquez sur "Publier" pour sauvegarder.

## Étape 4 : Récupérer votre configuration

1. Cliquez sur l'icône engrenage ⚙️ à côté de "Vue d'ensemble du projet"
2. Cliquez sur "Paramètres du projet"
3. Faites défiler vers le bas jusqu'à "Vos applications"
4. Cliquez sur l'icône web `</>`
5. Donnez un nom à votre application (ex: "app-devis")
6. **NE PAS** cocher "Configurer Firebase Hosting"
7. Cliquez sur "Enregistrer l'application"

Vous verrez quelque chose comme :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

## Étape 5 : Configurer votre application

1. Ouvrez le fichier `firebase-config.js` dans votre éditeur de code
2. Remplacez les valeurs par votre configuration Firebase :

```javascript
const firebaseConfig = {
    apiKey: "COLLEZ_VOTRE_API_KEY_ICI",
    authDomain: "COLLEZ_VOTRE_AUTH_DOMAIN_ICI",
    projectId: "COLLEZ_VOTRE_PROJECT_ID_ICI",
    storageBucket: "COLLEZ_VOTRE_STORAGE_BUCKET_ICI",
    messagingSenderId: "COLLEZ_VOTRE_MESSAGING_SENDER_ID_ICI",
    appId: "COLLEZ_VOTRE_APP_ID_ICI"
};
```

3. Sauvegardez le fichier

## Étape 6 : Tester l'application

1. Ouvrez le dossier du projet dans VS Code
2. Installez l'extension "Live Server" si nécessaire
3. Faites un clic droit sur `index.html`
4. Sélectionnez "Open with Live Server"
5. Créez un compte pour tester

## ⚠️ Important

### Pour le développement :
- Les règles en "mode test" expirent après 30 jours
- Pensez à les mettre à jour avant l'expiration

### Pour la production :
- Changez les règles Firestore pour être plus sécurisées
- Ajoutez des validations de données
- Limitez le nombre de requêtes par utilisateur
- Activez l'authentification à deux facteurs si possible

## 🔐 Sécurité

**NE PARTAGEZ JAMAIS :**
- Votre fichier `firebase-config.js` avec les vraies valeurs
- Vos clés API sur GitHub ou autres plateformes publiques

**CONSEILS :**
- Utilisez des variables d'environnement en production
- Configurez les domaines autorisés dans Firebase Console
- Surveillez l'utilisation dans la console Firebase

## 🐛 Dépannage

### "Firebase not defined"
- Vérifiez que vous utilisez un serveur web local (Live Server)
- Ne pas ouvrir les fichiers directement (file://)

### "Permission denied"
- Vérifiez que les règles Firestore sont correctement configurées
- Vérifiez que l'utilisateur est bien authentifié

### "Configuration manquante"
- Vérifiez que vous avez remplacé toutes les valeurs dans firebase-config.js
- Vérifiez qu'il n'y a pas de fautes de frappe

## 📞 Support Firebase

- Documentation officielle : https://firebase.google.com/docs
- Console Firebase : https://console.firebase.google.com/
- Support : https://firebase.google.com/support

---

Bonne configuration ! 🎉
