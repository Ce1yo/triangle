# Site de Génération de Devis et Factures

Application web pour créer et gérer des devis et factures avec authentification Firebase.

## 🚀 Fonctionnalités

- ✅ Authentification utilisateur (Email/Password et Google)
- ✅ Génération de devis en PDF
- ✅ Génération de factures en PDF
- ✅ Sauvegarde des devis et factures dans Firebase
- ✅ Calcul automatique des totaux HT, TVA et TTC
- ✅ Interface moderne et responsive

## 📋 Prérequis

- Un compte Firebase (gratuit)
- Un navigateur web moderne
- Un serveur web local (Live Server pour VS Code ou similaire)

## 🔧 Installation

### 1. Configuration Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Créez un nouveau projet (ou utilisez un projet existant)
3. Dans les paramètres du projet, récupérez votre configuration Firebase
4. Activez les services suivants :
   - **Authentication** : Email/Password et Google Sign-In
   - **Firestore Database** : Mode test (à sécuriser en production)

### 2. Configuration du projet

1. Ouvrez le fichier `firebase-config.js`
2. Remplacez les valeurs de configuration par les vôtres :

```javascript
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_PROJECT_ID.appspot.com",
    messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
    appId: "VOTRE_APP_ID"
};
```

### 3. Configuration Firestore

Dans Firebase Console, allez dans Firestore Database et créez les règles suivantes (pour le développement) :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /devis/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    match /factures/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

### 4. Lancement du projet

1. Ouvrez le dossier du projet dans VS Code
2. Installez l'extension "Live Server" si ce n'est pas déjà fait
3. Faites un clic droit sur `index.html` et sélectionnez "Open with Live Server"
4. Le site s'ouvrira automatiquement dans votre navigateur

## 📖 Utilisation

### Connexion / Inscription

- Créez un compte avec votre email et mot de passe
- Ou connectez-vous avec Google
- Le mot de passe doit contenir au moins 6 caractères

### Créer un Devis

1. Cliquez sur l'onglet "Devis"
2. Remplissez les informations du client et de votre entreprise
3. Ajoutez les articles/services avec quantités et prix
4. Le total se calcule automatiquement
5. Cliquez sur "Générer le devis PDF" pour télécharger le PDF
6. Ou cliquez sur "Sauvegarder" pour enregistrer le devis

### Créer une Facture

1. Cliquez sur l'onglet "Factures"
2. Remplissez toutes les informations requises
3. Ajoutez un numéro de facture unique
4. Ajoutez les articles/services
5. Cliquez sur "Générer la facture PDF" pour télécharger le PDF
6. Ou cliquez sur "Sauvegarder" pour enregistrer la facture

### Gérer les documents sauvegardés

- Les devis et factures sauvegardés apparaissent dans la barre latérale
- Cliquez sur "Charger" pour pré-remplir le formulaire avec les données
- Cliquez sur "Supprimer" pour effacer définitivement un document

## 🛠️ Technologies utilisées

- HTML5
- CSS3
- JavaScript (ES6+)
- Firebase Authentication
- Firebase Firestore
- jsPDF (génération de PDF)

## 📱 Responsive

Le site est entièrement responsive et s'adapte aux :
- Ordinateurs de bureau
- Tablettes
- Smartphones

## ⚠️ Important

- Ne partagez jamais votre configuration Firebase publiquement
- En production, sécurisez vos règles Firestore
- Ajoutez des validations côté serveur pour plus de sécurité
- Sauvegardez régulièrement votre base de données Firestore

## 🔒 Sécurité

Pour la production, modifiez les règles Firestore pour être plus restrictives et ajoutez :
- Validation des données
- Limitation du nombre de requêtes
- Authentification renforcée
- HTTPS obligatoire

## 📝 Licence

Ce projet est libre d'utilisation pour vos besoins personnels ou professionnels.

## 💡 Support

Pour toute question ou problème :
1. Vérifiez que Firebase est correctement configuré
2. Vérifiez la console du navigateur pour les erreurs
3. Assurez-vous que tous les fichiers sont dans le même dossier
4. Vérifiez que vous utilisez un serveur web local (pas file://)

Bon développement ! 🚀
