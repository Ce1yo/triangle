# 📱 Guide du Dashboard Mobile

## 🎨 Nouvelle Interface

Votre site a maintenant une **interface moderne de type application mobile** avec un dashboard central, inspirée des applications de facturation professionnelles.

## 📋 Structure du Site

### 1️⃣ Page de Connexion (`index.html`)
- Connexion par email/mot de passe
- Connexion Google
- **Connexion Face ID / Touch ID** (sur appareils compatibles)
- Inscription de nouveaux utilisateurs

### 2️⃣ Dashboard (`dashboard.html`) - **Page d'accueil**
Interface principale avec :
- **Onglets** : Devis / Factures
- **Bouton de création** : "+ Créer un devis" ou "+ Créer une facture"
- **Résumé mensuel** : Total du mois en cours
- **Liste des documents** avec :
  - Avatar coloré avec initiale du client
  - Nom du client
  - Numéro de document
  - Montant TTC
  - Statut (En attente, Payé, etc.)
- **Navigation inférieure** :
  - 📄 Facturation (actif)
  - 💰 Compte Bancaire
  - 👤 Profil (avec déconnexion)

### 3️⃣ Page Devis (`devis.html`)
- Bouton **retour** vers le dashboard
- Formulaire de création de devis
- Bouton de déconnexion en haut à droite

### 4️⃣ Page Factures (`factures.html`)
- Bouton **retour** vers le dashboard
- Formulaire de création de facture
- Bouton de déconnexion en haut à droite

## 🎯 Flux d'utilisation

### Créer un nouveau document

1. **Depuis le dashboard** : Cliquez sur "+ Créer un devis" ou "+ Créer une facture"
2. Remplissez le formulaire
3. Générez le PDF ou sauvegardez
4. Revenez au dashboard avec le bouton ⬅️
5. Votre document apparaît dans la liste

### Consulter un document

1. Dans le dashboard, cliquez sur n'importe quel document de la liste
2. Le formulaire se pré-remplit avec les données
3. Modifiez si nécessaire
4. Générez un nouveau PDF ou supprimez

### Changer de type de document

1. Dans le dashboard, cliquez sur l'onglet **"Devis"** ou **"Factures"**
2. La liste se met à jour automatiquement
3. Le bouton de création change aussi

## 🎨 Design Mobile-First

### Caractéristiques
- ✅ **Responsive** : S'adapte à tous les écrans
- ✅ **Optimisé mobile** : Interface tactile fluide
- ✅ **Avatars colorés** : 6 couleurs générées automatiquement
- ✅ **Navigation claire** : Barre inférieure fixe
- ✅ **Animations** : Transitions douces

### Couleurs des avatars
Les avatars sont colorés automatiquement selon l'initiale du client :
- 🟣 Violet
- 🩷 Rose
- 🔵 Bleu
- 🟢 Vert
- 🟠 Orange
- 🔴 Rouge

## 📱 Navigation Bottom Bar

### Facturation (📄)
- **Actif par défaut**
- Affiche le dashboard avec devis/factures

### Compte Bancaire (💰)
- Fonctionnalité à venir
- Gérera les paiements et transactions

### Profil (👤)
- Cliquez pour **se déconnecter**
- Affichera les paramètres du compte

## 💡 Fonctionnalités

### Total mensuel
- Calcul automatique du montant total du mois en cours
- Mise à jour en temps réel

### Statuts des documents
- **En attente** : Document créé, non payé
- **Payé** : Document réglé
- **Annulé** : Document annulé

### Tri des documents
- Par **date de création** (plus récent en premier)
- Affichage par mois

## 🔧 Configuration requise

### Pour le développement
- Serveur web local (Python http.server ou Live Server)
- Firebase configuré (Authentication + Firestore)

### Pour les utilisateurs
- **Mobile** : iOS 14+, Android 9+
- **Desktop** : Navigateurs modernes (Chrome, Safari, Firefox)
- Connexion Internet

## 📊 Structure Firebase

### Collection `devis`
```javascript
{
  userId: "uid_utilisateur",
  clientName: "Nom du client",
  clientEmail: "email@client.com",
  companyName: "Votre entreprise",
  totalHT: 1000.00,
  totalTVA: 200.00,
  totalTTC: 1200.00,
  items: [...],
  createdAt: "2024-11-05T15:00:00.000Z",
  status: "En attente"
}
```

### Collection `factures`
```javascript
{
  userId: "uid_utilisateur",
  clientName: "Nom du client",
  factureNumber: "F-2024-001",
  companyName: "Votre entreprise",
  totalHT: 1000.00,
  totalTVA: 200.00,
  totalTTC: 1200.00,
  items: [...],
  createdAt: "2024-11-05T15:00:00.000Z",
  status: "En attente"
}
```

## 🎨 Personnalisation

### Modifier les couleurs
Éditez `dashboard-style.css` :
```css
.tab.active {
    background: #D4F4DD; /* Vert pour l'onglet actif */
}

.create-btn {
    background: #000; /* Noir pour le bouton */
}
```

### Ajouter des statuts
Éditez `dashboard.js` - fonction `createDocumentElement()` :
```javascript
const status = data.status || 'En attente';
// Ajoutez vos propres statuts
```

## 🚀 Déploiement

### En local
Le serveur Python est déjà lancé sur `http://localhost:8000`

### Pour mobile (même réseau)
Accédez depuis votre téléphone : `http://172.16.100.171:8000`

### En production
1. Hébergez sur Firebase Hosting, Netlify ou Vercel
2. Configurez le domaine
3. Ajoutez le domaine aux domaines autorisés Firebase

## 🆘 Dépannage

### Les documents ne s'affichent pas
- Vérifiez que Firestore est activé
- Vérifiez les règles de sécurité Firestore
- Ouvrez la console (F12) pour voir les erreurs

### Le bouton Face ID n'apparaît pas
- Normal si pas encore activé
- Connectez-vous une fois avec mot de passe d'abord

### Le total ne s'affiche pas
- Vérifiez que `totalTTC` est bien sauvegardé dans Firebase
- Rechargez la page

---

**Profitez de votre nouveau dashboard mobile ! 📱✨**
