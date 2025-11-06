#!/bin/bash

# Script pour générer firebase-config.js depuis les variables d'environnement Netlify

echo "🔧 Génération de firebase-config.js..."

cat > firebase-config.js << EOF
// Configuration Firebase - Générée automatiquement par Netlify
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "${FIREBASE_API_KEY}",
    authDomain: "${FIREBASE_AUTH_DOMAIN}",
    projectId: "${FIREBASE_PROJECT_ID}",
    storageBucket: "${FIREBASE_STORAGE_BUCKET}",
    messagingSenderId: "${FIREBASE_MESSAGING_SENDER_ID}",
    appId: "${FIREBASE_APP_ID}",
    measurementId: "${FIREBASE_MEASUREMENT_ID}"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("Firebase initialisé avec succès");
EOF

echo "✅ firebase-config.js généré avec succès"
echo "📋 Vérification des variables d'environnement:"

if [ -z "$FIREBASE_API_KEY" ]; then
    echo "❌ FIREBASE_API_KEY n'est pas définie"
else
    echo "✅ FIREBASE_API_KEY définie"
fi

if [ -z "$FIREBASE_AUTH_DOMAIN" ]; then
    echo "❌ FIREBASE_AUTH_DOMAIN n'est pas définie"
else
    echo "✅ FIREBASE_AUTH_DOMAIN définie"
fi

if [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo "❌ FIREBASE_PROJECT_ID n'est pas définie"
else
    echo "✅ FIREBASE_PROJECT_ID définie"
fi

echo ""
echo "📄 Contenu de firebase-config.js (premiers caractères):"
head -n 5 firebase-config.js
