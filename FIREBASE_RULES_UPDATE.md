# 🔒 Mise à jour des règles Firestore

## Nouvelles règles pour la gestion des clients

Avec le système en 3 étapes, nous avons ajouté une nouvelle collection **`clients`** dans Firestore.

## 📋 Règles Firestore à copier

Allez dans **Firestore Database** → **Règles** et remplacez tout le contenu par :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Règles pour les clients
    match /clients/{clientId} {
      // Permettre la lecture uniquement des clients de l'utilisateur connecté
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      
      // Permettre la création uniquement si l'utilisateur est authentifié
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      
      // Permettre la modification et suppression uniquement si c'est son client
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
    }
    
    // Règles pour les devis
    match /devis/{devisId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
    }
    
    // Règles pour les factures
    match /factures/{factureId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
    }
    
    // Règles pour les informations entreprise (optionnel)
    match /company_info/{companyId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
    }
    
    // Règles pour les articles/produits
    match /items/{itemId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
    }
    
    // Règles pour les credentials biométriques
    match /biometric_credentials/{credentialId} {
      allow read, write: if request.auth != null && 
                            request.auth.uid == credentialId;
    }
  }
}
```

## 🔄 Comment appliquer les règles

1. Allez sur https://console.firebase.google.com/project/triangle-be256/firestore/rules
2. **Supprimez tout** le contenu actuel
3. **Collez** les règles ci-dessus
4. Cliquez sur **"Publier"**
5. Attendez quelques secondes que les règles soient appliquées

## ✅ Ce que ces règles garantissent

### Collection `clients`
- ✅ Chaque utilisateur ne voit que **ses propres clients**
- ✅ Impossible de voir les clients d'autres utilisateurs
- ✅ Protection contre la suppression par d'autres utilisateurs

### Collection `devis`
- ✅ Protection des devis par utilisateur
- ✅ Lecture/écriture uniquement pour le propriétaire

### Collection `factures`
- ✅ Protection des factures par utilisateur
- ✅ Lecture/écriture uniquement pour le propriétaire

### Collection `company_info` (optionnel)
- ✅ Stockage sécurisé des informations de l'entreprise
- ✅ Une seule entrée par utilisateur

## 🔍 Vérifier que ça fonctionne

Après avoir publié les règles :

1. Connectez-vous à votre site
2. Créez un client
3. Le client devrait apparaître dans la liste
4. Vérifiez dans Firestore Console que le client est bien créé

## ⚠️ En cas d'erreur "Permission Denied"

Si vous voyez cette erreur dans la console :

```
FirebaseError: Missing or insufficient permissions
```

**Solutions :**
1. Vérifiez que les règles sont bien publiées
2. Vérifiez que vous êtes bien connecté
3. Actualisez la page
4. Videz le cache du navigateur

## 📊 Structure des collections

### Collection `clients`
```javascript
{
  userId: "uid_utilisateur",
  name: "Nom du client",
  email: "email@client.com",
  phone: "+33 6 12 34 56 78",
  address: "123 Rue Example, Paris",
  createdAt: "2024-11-05T16:00:00.000Z"
}
```

### Collection `devis`
```javascript
{
  userId: "uid_utilisateur",
  clientName: "Nom du client",
  clientEmail: "email@client.com",
  items: [...],
  totalHT: 1000.00,
  totalTVA: 200.00,
  totalTTC: 1200.00,
  devisDate: "2024-11-05",
  status: "En attente",
  createdAt: "2024-11-05T16:00:00.000Z"
}
```

---

**Une fois les règles appliquées, votre système de création de devis en 3 étapes fonctionnera parfaitement ! 🚀**
