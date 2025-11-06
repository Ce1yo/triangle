import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    isWebAuthnAvailable, 
    isBiometricEnabled, 
    signInWithBiometric,
    registerBiometric,
    getBiometricType
} from './webauthn.js';

// Vérifier si l'utilisateur est déjà connecté
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Vérifier si on doit proposer l'enregistrement biométrique
        const shouldSetupBiometric = sessionStorage.getItem('setup_biometric');
        if (shouldSetupBiometric === 'true') {
            sessionStorage.removeItem('setup_biometric');
            await promptBiometricSetup(user);
        } else {
            // Utilisateur connecté, rediriger vers le dashboard
            window.location.href = 'dashboard.html';
        }
    }
});

// Initialiser le bouton biométrique au chargement
window.addEventListener('DOMContentLoaded', () => {
    initBiometricButton();
});

// Gestion du formulaire de connexion
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Si la biométrie est disponible et pas encore configurée, proposer de l'activer
        if (isWebAuthnAvailable() && !isBiometricEnabled()) {
            sessionStorage.setItem('setup_biometric', 'true');
        }
        
        // La redirection se fera automatiquement via onAuthStateChanged
    } catch (error) {
        showError(getErrorMessage(error.code));
    }
});

// Connexion avec Google
const googleSignInBtn = document.getElementById('googleSignIn');
googleSignInBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    
    try {
        await signInWithPopup(auth, provider);
        // La redirection se fera automatiquement via onAuthStateChanged
    } catch (error) {
        showError(getErrorMessage(error.code));
    }
});

// Inscription
const registerLink = document.getElementById('registerLink');
registerLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showError('Veuillez remplir tous les champs pour créer un compte');
        return;
    }
    
    if (password.length < 6) {
        showError('Le mot de passe doit contenir au moins 6 caractères');
        return;
    }
    
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        // La redirection se fera automatiquement via onAuthStateChanged
    } catch (error) {
        showError(getErrorMessage(error.code));
    }
});

// Afficher les messages d'erreur
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

// Messages d'erreur en français
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'Cette adresse email est déjà utilisée',
        'auth/invalid-email': 'Adresse email invalide',
        'auth/operation-not-allowed': 'Opération non autorisée',
        'auth/weak-password': 'Le mot de passe est trop faible',
        'auth/user-disabled': 'Ce compte a été désactivé',
        'auth/user-not-found': 'Aucun compte trouvé avec cette adresse email',
        'auth/wrong-password': 'Mot de passe incorrect',
        'auth/invalid-credential': 'Identifiants invalides',
        'auth/popup-closed-by-user': 'Connexion annulée',
        'auth/cancelled-popup-request': 'Connexion annulée'
    };
    
    return errorMessages[errorCode] || 'Une erreur est survenue. Veuillez réessayer.';
}

// Afficher les messages de succès
function showSuccess(message) {
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = message;
    successMessage.classList.add('show');
    setTimeout(() => {
        successMessage.classList.remove('show');
    }, 4000);
}

// Initialiser le bouton biométrique
function initBiometricButton() {
    const biometricBtn = document.getElementById('biometricSignIn');
    const biometricText = document.getElementById('biometricButtonText');
    
    // Vérifier si WebAuthn est disponible
    if (!isWebAuthnAvailable()) {
        console.log('WebAuthn non disponible sur cet appareil');
        return;
    }
    
    // Vérifier si la biométrie est déjà configurée
    if (isBiometricEnabled()) {
        // Afficher le bouton avec le bon texte
        const biometricType = getBiometricType();
        biometricText.textContent = `Se connecter avec ${biometricType}`;
        biometricBtn.style.display = 'flex';
        
        // Ajouter l'événement de clic
        biometricBtn.addEventListener('click', handleBiometricSignIn);
    }
}

// Gérer la connexion biométrique
async function handleBiometricSignIn() {
    const biometricBtn = document.getElementById('biometricSignIn');
    const originalText = biometricBtn.innerHTML;
    
    try {
        // Désactiver le bouton pendant le traitement
        biometricBtn.disabled = true;
        biometricBtn.innerHTML = '<div class="loading"></div> Authentification...';
        
        // Tenter la connexion biométrique
        const result = await signInWithBiometric();
        
        if (result && result.credentialVerified) {
            // Connexion avec les credentials sauvegardés
            const email = result.email;
            
            showSuccess('Authentification réussie !');
            
            // Récupérer le mot de passe sauvegardé (si disponible) ou utiliser une session
            // Pour simplifier, on demande une fois le mot de passe pour établir la session
            const savedPassword = localStorage.getItem('temp_pwd_' + btoa(email));
            
            if (savedPassword) {
                await signInWithEmailAndPassword(auth, email, atob(savedPassword));
            } else {
                // Demander le mot de passe une seule fois pour créer la session persistante
                showError('Veuillez vous connecter une fois avec votre mot de passe');
                document.getElementById('email').value = email;
                document.getElementById('password').focus();
            }
        }
    } catch (error) {
        console.error('Erreur biométrique:', error);
        showError('Échec de l\'authentification biométrique. Utilisez email/mot de passe.');
    } finally {
        biometricBtn.disabled = false;
        biometricBtn.innerHTML = originalText;
    }
}

// Proposer l'activation de la biométrie
async function promptBiometricSetup(user) {
    const biometricType = getBiometricType();
    
    const shouldSetup = confirm(
        `Voulez-vous activer ${biometricType} pour vous connecter plus rapidement la prochaine fois ?\n\n` +
        `Vous pourrez vous connecter en quelques secondes sans taper votre mot de passe.`
    );
    
    if (shouldSetup) {
        try {
            await registerBiometric(user);
            alert(`${biometricType} activé avec succès ! \n\nVous pourrez l'utiliser lors de votre prochaine connexion.`);
        } catch (error) {
            console.error('Erreur lors de l\'activation:', error);
            
            if (error.name === 'NotAllowedError') {
                // L'utilisateur a annulé ou refusé
                console.log('Activation annulée par l\'utilisateur');
            } else {
                alert('Impossible d\'activer l\'authentification biométrique sur cet appareil.');
            }
        }
    }
    
    // Rediriger vers le dashboard
    window.location.href = 'dashboard.html';
}
