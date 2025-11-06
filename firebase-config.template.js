// Configuration Firebase - TEMPLATE
// INSTRUCTIONS:
// 1. Copiez ce fichier et renommez-le en "firebase-config.js"
// 2. Remplacez les valeurs ci-dessous par votre configuration Firebase
// 3. Ne committez JAMAIS firebase-config.js avec vos vraies valeurs !

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// TODO: Remplacez par votre configuration Firebase
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
    appId: "VOTRE_APP_ID",
    measurementId: "VOTRE_MEASUREMENT_ID"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("Firebase initialisé avec succès");
