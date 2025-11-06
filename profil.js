import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    updateDoc,
    doc 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;
let companyInfoId = null;
let searchTimeout = null;

// Vérifier l'authentification
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        currentUser = user;
        displayUserInfo();
        loadCompanyInfo();
        setupEventListeners();
    }
});

// Afficher les informations de l'utilisateur
function displayUserInfo() {
    if (!currentUser) return;

    console.log('👤 Utilisateur connecté:', currentUser);

    // Email
    const email = currentUser.email || 'Non renseigné';
    document.getElementById('userEmail').textContent = email;
    document.getElementById('emailValue').textContent = email;

    // UID
    document.getElementById('uidValue').textContent = currentUser.uid;

    // Avatar (première lettre de l'email)
    const initial = email.charAt(0).toUpperCase();
    document.getElementById('userAvatar').textContent = initial;

    // Date de création du compte
    if (currentUser.metadata && currentUser.metadata.creationTime) {
        const creationDate = new Date(currentUser.metadata.creationTime);
        const formattedDate = formatDate(creationDate);
        document.getElementById('memberSince').textContent = formattedDate;
    } else {
        document.getElementById('memberSince').textContent = 'Date inconnue';
    }
}

// Gestion de la déconnexion
document.getElementById('logoutBtn').addEventListener('click', async () => {
    const confirmLogout = confirm('Voulez-vous vraiment vous déconnecter ?');
    
    if (confirmLogout) {
        try {
            console.log('🚪 Déconnexion en cours...');
            await signOut(auth);
            console.log('✅ Déconnexion réussie');
            // La redirection sera gérée automatiquement par onAuthStateChanged
        } catch (error) {
            console.error('❌ Erreur lors de la déconnexion:', error);
            alert('Erreur lors de la déconnexion. Veuillez réessayer.');
        }
    }
});

// Configuration des événements
function setupEventListeners() {
    const editCompanyBtn = document.getElementById('editCompanyBtn');
    const cancelCompanyBtn = document.getElementById('cancelCompanyBtn');
    const companyInfoForm = document.getElementById('companyInfoForm');
    const companySirenInput = document.getElementById('companySiren');
    
    // Bouton modifier
    editCompanyBtn.addEventListener('click', () => {
        document.getElementById('companyForm').classList.add('active');
        document.getElementById('companyInfoDisplay').style.display = 'none';
        editCompanyBtn.style.display = 'none';
    });
    
    // Bouton annuler
    cancelCompanyBtn.addEventListener('click', () => {
        document.getElementById('companyForm').classList.remove('active');
        document.getElementById('companyInfoDisplay').style.display = 'block';
        editCompanyBtn.style.display = 'flex';
        companyInfoForm.reset();
    });
    
    // Soumission du formulaire
    companyInfoForm.addEventListener('submit', saveCompanyInfo);
    
    // Recherche SIREN automatique
    companySirenInput.addEventListener('input', (e) => {
        const siren = e.target.value.replace(/\s/g, '');
        
        // Annuler la recherche précédente
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Recherche automatique après 9 chiffres
        if (siren.length === 9 && /^\d{9}$/.test(siren)) {
            searchTimeout = setTimeout(() => {
                searchSiren(siren);
            }, 800);
        }
    });
}

// Charger les informations d'entreprise
async function loadCompanyInfo() {
    if (!currentUser) return;
    
    try {
        console.log('📋 Chargement des infos entreprise...');
        const q = query(
            collection(db, 'company_info'),
            where('userId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            companyInfoId = doc.id;
            const data = doc.data();
            
            console.log('✅ Infos entreprise trouvées:', data);
            displayCompanyInfo(data);
        } else {
            console.log('ℹ️ Aucune info entreprise trouvée');
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement:', error);
    }
}

// Afficher les informations d'entreprise
function displayCompanyInfo(data) {
    document.getElementById('companyNameDisplay').textContent = data.name || 'Non renseigné';
    document.getElementById('companySirenDisplay').textContent = data.siren || 'Non renseigné';
    
    // Construire l'adresse complète
    let fullAddress = '';
    if (data.address) fullAddress += data.address;
    if (data.city) fullAddress += (fullAddress ? ', ' : '') + data.postalCode + ' ' + data.city;
    
    document.getElementById('companyAddressDisplay').textContent = fullAddress || 'Non renseigné';
    
    // Remplir le formulaire pour l'édition
    document.getElementById('companySiren').value = data.siren || '';
    document.getElementById('companyName').value = data.name || '';
    document.getElementById('companySiret').value = data.siret || '';
    document.getElementById('companyAddress').value = data.address || '';
    document.getElementById('companyCity').value = data.city || '';
    document.getElementById('companyPostalCode').value = data.postalCode || '';
    document.getElementById('companyPhone').value = data.phone || '';
    document.getElementById('companyRib').value = data.rib || '';
    
    // Format devis
    if (data.devisFormat) {
        document.getElementById('devisFormat').value = data.devisFormat;
    }
    
    // Format facture
    if (data.factureFormat) {
        document.getElementById('factureFormat').value = data.factureFormat;
    }
    
    // TVA Status
    if (data.tvaStatus) {
        const tvaRadios = document.getElementsByName('tvaStatus');
        for (let radio of tvaRadios) {
            if (radio.value === data.tvaStatus) {
                radio.checked = true;
                break;
            }
        }
    }
}

// Sauvegarder les informations d'entreprise
async function saveCompanyInfo(e) {
    e.preventDefault();
    
    const tvaRadios = document.getElementsByName('tvaStatus');
    let tvaStatus = '';
    for (let radio of tvaRadios) {
        if (radio.checked) {
            tvaStatus = radio.value;
            break;
        }
    }
    
    const companyData = {
        userId: currentUser.uid,
        siren: document.getElementById('companySiren').value,
        name: document.getElementById('companyName').value,
        siret: document.getElementById('companySiret').value,
        address: document.getElementById('companyAddress').value,
        city: document.getElementById('companyCity').value,
        postalCode: document.getElementById('companyPostalCode').value,
        phone: document.getElementById('companyPhone').value,
        rib: document.getElementById('companyRib').value,
        devisFormat: document.getElementById('devisFormat').value,
        factureFormat: document.getElementById('factureFormat').value,
        tvaStatus: tvaStatus,
        updatedAt: new Date().toISOString()
    };
    
    try {
        console.log('💾 Sauvegarde des infos entreprise...', companyData);
        
        if (companyInfoId) {
            // Mise à jour
            await updateDoc(doc(db, 'company_info', companyInfoId), companyData);
            console.log('✅ Infos mises à jour');
        } else {
            // Création
            companyData.createdAt = new Date().toISOString();
            const docRef = await addDoc(collection(db, 'company_info'), companyData);
            companyInfoId = docRef.id;
            console.log('✅ Infos créées avec ID:', companyInfoId);
        }
        
        // Afficher les nouvelles données
        displayCompanyInfo(companyData);
        
        // Fermer le formulaire
        document.getElementById('companyForm').classList.remove('active');
        document.getElementById('companyInfoDisplay').style.display = 'block';
        document.getElementById('editCompanyBtn').style.display = 'flex';
        
        // Message de succès
        showSuccessMessage('✓ Informations enregistrées !');
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        alert('Erreur lors de la sauvegarde : ' + error.message);
    }
}

// Recherche SIREN via API
async function searchSiren(siren) {
    const loadingDiv = document.getElementById('sirenLoading');
    
    try {
        loadingDiv.style.display = 'flex';
        console.log('🔍 Recherche SIREN:', siren);
        
        // API recherche-entreprises.api.gouv.fr
        const response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${siren}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📊 Réponse API:', data);
            
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                
                // Remplir automatiquement le formulaire
                document.getElementById('companyName').value = result.nom_complet || result.nom_raison_sociale || '';
                
                if (result.siege) {
                    let address = '';
                    if (result.siege.numero_voie) address += result.siege.numero_voie + ' ';
                    if (result.siege.type_voie) address += result.siege.type_voie + ' ';
                    if (result.siege.libelle_voie) address += result.siege.libelle_voie;
                    
                    document.getElementById('companyAddress').value = address.trim();
                    document.getElementById('companyPostalCode').value = result.siege.code_postal || '';
                    document.getElementById('companyCity').value = result.siege.libelle_commune || '';
                }
                
                console.log('✅ Informations remplies automatiquement');
                showSuccessMessage('✓ Informations trouvées !');
            } else {
                console.log('⚠️ Aucun résultat');
            }
        }
    } catch (error) {
        console.error('❌ Erreur recherche SIREN:', error);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Afficher un message de succès
function showSuccessMessage(message) {
    const msg = document.createElement('div');
    msg.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #000;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    msg.textContent = message;
    document.body.appendChild(msg);
    
    setTimeout(() => {
        msg.style.opacity = '0';
        msg.style.transition = 'opacity 0.3s';
        setTimeout(() => msg.remove(), 300);
    }, 2000);
}

// Formater la date
function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('fr-FR', options);
}
