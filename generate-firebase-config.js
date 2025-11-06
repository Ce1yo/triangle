// Script pour générer firebase-config.js depuis les variables d'environnement Netlify
const fs = require('fs');

const firebaseConfig = `// Configuration Firebase - Générée automatiquement
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "${process.env.FIREBASE_API_KEY || ''}",
    authDomain: "${process.env.FIREBASE_AUTH_DOMAIN || ''}",
    projectId: "${process.env.FIREBASE_PROJECT_ID || ''}",
    storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET || ''}",
    messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID || ''}",
    appId: "${process.env.FIREBASE_APP_ID || ''}",
    measurementId: "${process.env.FIREBASE_MEASUREMENT_ID || ''}"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("Firebase initialisé avec succès");
`;

fs.writeFileSync('firebase-config.js', firebaseConfig);
console.log('✅ firebase-config.js généré avec succès');
