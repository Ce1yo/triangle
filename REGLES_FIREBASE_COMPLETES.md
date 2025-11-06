# 🔒 Règles Firestore Complètes - À Copier-Coller

## ⚠️ IMPORTANT : Mettez à jour vos règles Firebase MAINTENANT

Allez sur : https://console.firebase.google.com/project/triangle-be256/firestore/rules

**Supprimez TOUT** et remplacez par ceci :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Règles pour les clients
    match /clients/{clientId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      
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
    
    // Règles pour les informations entreprise
    match /company_info/{companyId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
    }
    
    // 🆕 NOUVEAU : Règles pour les articles/produits
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

## 📝 Étapes à suivre :

1. ✅ **Ouvrez** le lien : https://console.firebase.google.com/project/triangle-be256/firestore/rules

2. ✅ **Supprimez** TOUT le contenu actuel

3. ✅ **Copiez-collez** les règles ci-dessus

4. ✅ **Cliquez** sur "Publier" en haut à droite

5. ✅ **Attendez** 5 secondes

6. ✅ **Actualisez** votre page (F5)

## ✅ Collections couvertes :

- ✅ `clients` - Vos clients
- ✅ `devis` - Vos devis
- ✅ `factures` - Vos factures
- ✅ `company_info` - Infos de votre entreprise
- ✅ `items` - Vos articles/produits (NOUVEAU)
- ✅ `biometric_credentials` - Authentification biométrique

---

**Une fois les règles publiées, tous vos problèmes de permissions seront résolus !** 🚀
