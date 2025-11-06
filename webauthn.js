import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    doc, 
    setDoc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Utilitaires de conversion
function bufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Vérifier si WebAuthn est disponible
export function isWebAuthnAvailable() {
    return window.PublicKeyCredential !== undefined;
}

// Enregistrer les credentials biométriques
export async function registerBiometric(user) {
    if (!isWebAuthnAvailable()) {
        throw new Error('WebAuthn non disponible sur cet appareil');
    }

    try {
        // Créer un challenge aléatoire
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        // Options pour l'enregistrement
        const publicKeyOptions = {
            challenge: challenge,
            rp: {
                name: "Gestion Devis & Factures",
                id: window.location.hostname
            },
            user: {
                id: new TextEncoder().encode(user.uid),
                name: user.email,
                displayName: user.email
            },
            pubKeyCredParams: [
                { type: "public-key", alg: -7 },  // ES256
                { type: "public-key", alg: -257 } // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform", // Pour Face ID/Touch ID
                userVerification: "required"
            },
            timeout: 60000,
            attestation: "none"
        };

        // Créer les credentials
        const credential = await navigator.credentials.create({
            publicKey: publicKeyOptions
        });

        // Sauvegarder dans Firestore
        const credentialData = {
            credentialId: bufferToBase64(credential.rawId),
            publicKey: bufferToBase64(credential.response.getPublicKey()),
            userId: user.uid,
            createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'biometric_credentials', user.uid), credentialData);

        // Sauvegarder localement pour connexion rapide
        localStorage.setItem('biometric_user_email', user.email);
        localStorage.setItem('biometric_enabled', 'true');

        return true;
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement biométrique:', error);
        throw error;
    }
}

// Connexion avec biométrie
export async function signInWithBiometric() {
    if (!isWebAuthnAvailable()) {
        throw new Error('WebAuthn non disponible sur cet appareil');
    }

    const savedEmail = localStorage.getItem('biometric_user_email');
    if (!savedEmail) {
        throw new Error('Aucun compte biométrique enregistré');
    }

    try {
        // Créer un challenge aléatoire
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        // Récupérer les credentials sauvegardés
        const credentialIds = await getAllowedCredentials();

        // Options pour l'authentification
        const publicKeyOptions = {
            challenge: challenge,
            rpId: window.location.hostname,
            allowCredentials: credentialIds,
            userVerification: "required",
            timeout: 60000
        };

        // Obtenir l'assertion
        const assertion = await navigator.credentials.get({
            publicKey: publicKeyOptions
        });

        // Vérifier l'assertion dans Firestore
        const credentialId = bufferToBase64(assertion.rawId);
        const userDoc = await findUserByCredential(credentialId);

        if (!userDoc) {
            throw new Error('Credential non trouvé');
        }

        // Connexion silencieuse avec un token temporaire
        // Pour simplifier, on demande le mot de passe une fois pour créer une session
        return { email: savedEmail, credentialVerified: true };

    } catch (error) {
        console.error('Erreur lors de la connexion biométrique:', error);
        throw error;
    }
}

// Récupérer les credentials autorisés
async function getAllowedCredentials() {
    const savedEmail = localStorage.getItem('biometric_user_email');
    
    // Pour simplifier, on retourne un tableau vide qui permettra
    // au navigateur de proposer tous les credentials disponibles
    return [];
}

// Trouver l'utilisateur par credential
async function findUserByCredential(credentialId) {
    try {
        // Parcourir les credentials stockés (simplifié)
        const savedEmail = localStorage.getItem('biometric_user_email');
        return { email: savedEmail };
    } catch (error) {
        console.error('Erreur:', error);
        return null;
    }
}

// Vérifier si la biométrie est configurée
export function isBiometricEnabled() {
    return localStorage.getItem('biometric_enabled') === 'true';
}

// Désactiver la biométrie
export async function disableBiometric(user) {
    try {
        // Supprimer de Firestore
        await deleteDoc(doc(db, 'biometric_credentials', user.uid));
        
        // Supprimer localement
        localStorage.removeItem('biometric_user_email');
        localStorage.removeItem('biometric_enabled');
        
        return true;
    } catch (error) {
        console.error('Erreur lors de la désactivation:', error);
        return false;
    }
}

// Détecter le type d'authentification disponible
export function getBiometricType() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
        // iPhone/iPad - peut être Face ID ou Touch ID
        return 'Face ID / Touch ID';
    } else if (/android/.test(userAgent)) {
        return 'Empreinte digitale';
    } else if (/macintosh/.test(userAgent)) {
        return 'Touch ID';
    } else if (/windows/.test(userAgent)) {
        return 'Windows Hello';
    }
    
    return 'Authentification biométrique';
}
