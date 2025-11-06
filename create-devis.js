import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, 
    addDoc, 
    getDocs,
    query,
    where,
    orderBy,
    doc,
    setDoc,
    updateDoc,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;
let currentStep = 1;
let selectedClient = null;
let devisItems = [];
let companyInfo = {};
let selectedItemTemplate = null;

// Vérifier l'authentification
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        currentUser = user;
        init();
    }
});

// Initialisation
function init() {
    updateProgress();
    loadClients();
    setupEventListeners();
    loadCompanyInfo();
    
    // Définir la date du jour et calculer la validité
    const today = new Date();
    document.getElementById('devisDate').valueAsDate = today;
    updateValidityDate();
    
    // Event listener pour recalculer la date de validité
    document.getElementById('devisDate').addEventListener('change', updateValidityDate);
    
    // Event listener pour gérer l'affichage du champ acompte
    document.getElementById('acompteCheck').addEventListener('change', function() {
        const wrapper = document.getElementById('acompteInputWrapper');
        wrapper.style.display = this.checked ? 'block' : 'none';
    });
}

// Calculer la date de validité (+30 jours)
function updateValidityDate() {
    const devisDate = document.getElementById('devisDate').value;
    if (!devisDate) return;
    
    const date = new Date(devisDate);
    date.setDate(date.getDate() + 30);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    document.getElementById('validityDate').value = `${year}-${month}-${day}`;
}

// Configuration des event listeners
function setupEventListeners() {
    // Boutons de navigation
    document.getElementById('backToStep1')?.addEventListener('click', () => goToStep(1));
    document.getElementById('nextToStep3')?.addEventListener('click', () => goToStep(3));
    document.getElementById('backToStep2')?.addEventListener('click', () => goToStep(2));
    
    // Boutons d'action
    document.getElementById('createClientBtn')?.addEventListener('click', openClientModal);
    document.getElementById('addItemBtn')?.addEventListener('click', openItemModal);
    document.getElementById('generateDevis')?.addEventListener('click', generateDevis);
    
    // Modals
    document.getElementById('closeClientModal')?.addEventListener('click', closeClientModal);
    document.getElementById('cancelClient')?.addEventListener('click', closeClientModal);
    document.getElementById('createClientForm')?.addEventListener('submit', createClient);
    
    document.getElementById('closeItemModal')?.addEventListener('click', closeItemModal);
    document.getElementById('createNewItemBtn')?.addEventListener('click', openCreateItemModal);
    document.getElementById('closeCreateItemModal')?.addEventListener('click', closeCreateItemModal);
    document.getElementById('cancelCreateItem')?.addEventListener('click', closeCreateItemModal);
    document.getElementById('createItemForm')?.addEventListener('submit', createItem);
    document.getElementById('backToItemsList')?.addEventListener('click', backToItemsList);
    document.getElementById('addSelectedItem')?.addEventListener('click', addItemToDevis);
    
    // Type de client (particulier/entreprise)
    const clientTypeRadios = document.querySelectorAll('input[name="clientType"]');
    clientTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleClientTypeChange);
    });
    
    // Recherche SIREN automatique
    const sirenInput = document.getElementById('entSiren');
    
    let searchTimeout;
    
    sirenInput?.addEventListener('input', (e) => {
        const siren = e.target.value.replace(/\s/g, '');
        
        // Annuler la recherche précédente
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Recherche automatique après 9 chiffres
        if (siren.length === 9 && /^\d{9}$/.test(siren)) {
            searchTimeout = setTimeout(() => {
                searchSiren();
            }, 800);
        }
    });
}

// Navigation entre les étapes
function goToStep(step) {
    // Validation avant de passer à l'étape suivante
    if (step === 2 && !selectedClient) {
        alert('Veuillez sélectionner un client');
        return;
    }
    
    if (step === 3 && devisItems.length === 0) {
        alert('Veuillez ajouter au moins un article');
        return;
    }
    
    // Cacher toutes les étapes
    document.querySelectorAll('.wizard-step').forEach(el => el.classList.add('hidden'));
    
    // Afficher l'étape demandée
    document.getElementById(`step${step}`).classList.remove('hidden');
    
    currentStep = step;
    updateProgress();
    
    // Actions spécifiques par étape
    if (step === 2 && selectedClient) {
        displaySelectedClient();
        displayItems();
    }
    
    if (step === 3) {
        displayReviewSummary();
    }
}

// Mettre à jour la barre de progression
function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    const percentage = (currentStep / 3) * 100;
    progressFill.style.width = percentage + '%';
    progressText.textContent = `${currentStep}/3`;
}

// Charger les clients
async function loadClients() {
    if (!currentUser) {
        console.log('❌ Pas d\'utilisateur connecté');
        return;
    }
    
    console.log('📋 Chargement des clients pour l\'utilisateur:', currentUser.uid);
    const clientsList = document.getElementById('clientsList');
    
    try {
        const q = query(
            collection(db, 'clients'),
            where('userId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        console.log('📊 Nombre de clients trouvés:', querySnapshot.size);
        
        if (querySnapshot.empty) {
            console.log('ℹ️ Aucun client trouvé');
            clientsList.innerHTML = `
                <div class="empty-state">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#CCC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="#CCC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p>Aucun client pour le moment</p>
                </div>
            `;
            return;
        }
        
        clientsList.innerHTML = '';
        
        // Convertir en tableau et trier par date de création (plus récent en premier)
        const clients = [];
        querySnapshot.forEach((docSnapshot) => {
            clients.push({
                id: docSnapshot.id,
                data: docSnapshot.data()
            });
        });
        
        // Trier par date de création (plus récent en premier)
        clients.sort((a, b) => {
            const dateA = new Date(a.data.createdAt || 0);
            const dateB = new Date(b.data.createdAt || 0);
            return dateB - dateA;
        });
        
        // Afficher les clients
        clients.forEach(({ id, data }) => {
            console.log('👤 Client trouvé:', data.type === 'entreprise' ? data.companyName : `${data.prenom} ${data.nom}`);
            const clientElement = createClientElement(id, data);
            clientsList.appendChild(clientElement);
        });
        
        console.log('✅ Clients chargés avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des clients:', error);
    }
}

// Créer un élément client
function createClientElement(id, data) {
    const div = document.createElement('div');
    div.className = 'client-item';
    
    let displayName, addressLine, initial;
    
    if (data.type === 'entreprise') {
        displayName = data.companyName || 'Entreprise';
        initial = displayName.charAt(0).toUpperCase();
        // Afficher l'adresse complète comme dans l'exemple
        addressLine = `
            <div class="client-address">${data.adresse || ''}</div>
            <div class="client-address">${data.codePostal || ''} ${data.ville || ''}</div>
        `;
    } else {
        displayName = `${data.prenom} ${data.nom}`;
        initial = data.nom ? data.nom.charAt(0).toUpperCase() : '?';
        // Afficher l'adresse pour les particuliers aussi
        addressLine = `
            <div class="client-address">${data.adresse || ''}</div>
            <div class="client-address">${data.codePostal || ''} ${data.ville || ''}</div>
        `;
    }
    
    const colorClass = getAvatarColor(initial);
    
    div.innerHTML = `
        <div class="client-avatar ${colorClass}">${initial}</div>
        <div class="client-info">
            <div class="client-name">${displayName}</div>
            ${addressLine}
        </div>
        <button class="client-edit-btn" data-client-id="${id}" title="Modifier">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
    `;
    
    div.addEventListener('click', (e) => {
        // Ne pas sélectionner si on clique sur le bouton d'édition
        if (e.target.closest('.client-edit-btn')) {
            return;
        }
        
        selectedClient = { id, ...data };
        
        // Marquer comme sélectionné
        document.querySelectorAll('.client-item').forEach(el => el.classList.remove('selected'));
        div.classList.add('selected');
        
        // Animation puis passage à l'étape 2
        showSuccessMessage(`✓ Client sélectionné : ${displayName}`);
        setTimeout(() => {
            goToStep(2);
        }, 400);
    });
    
    // Gestion du bouton d'édition
    const editBtn = div.querySelector('.client-edit-btn');
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // TODO: Implémenter l'édition du client
        console.log('Édition du client:', id, data);
        showSuccessMessage('Fonction d\'édition à venir !');
    });
    
    return div;
}

// Gérer le changement de type de client
function handleClientTypeChange(e) {
    const type = e.target.value;
    const particulierFields = document.getElementById('particulierFields');
    const entrepriseFields = document.getElementById('entrepriseFields');
    
    if (type === 'entreprise') {
        particulierFields.style.display = 'none';
        entrepriseFields.style.display = 'block';
        
        // Désactiver les champs particulier
        particulierFields.querySelectorAll('input').forEach(input => input.required = false);
        
        // Activer les champs entreprise
        entrepriseFields.querySelectorAll('input[required]').forEach(input => input.required = true);
        document.getElementById('entNom').required = true;
        document.getElementById('entSiren').required = true;
        document.getElementById('entTVA').required = true;
        document.getElementById('entEmail').required = true;
        document.getElementById('entAdresse').required = true;
        document.getElementById('entCodePostal').required = true;
        document.getElementById('entVille').required = true;
        document.getElementById('entPays').required = true;
        document.getElementById('entContactPrenom').required = true;
        document.getElementById('entContactNom').required = true;
        document.getElementById('entContactTel').required = true;
    } else {
        particulierFields.style.display = 'block';
        entrepriseFields.style.display = 'none';
        
        // Activer les champs particulier
        document.getElementById('particNom').required = true;
        document.getElementById('particPrenom').required = true;
        document.getElementById('particEmail').required = true;
        document.getElementById('particTel').required = true;
        document.getElementById('particAdresse').required = true;
        document.getElementById('particCodePostal').required = true;
        document.getElementById('particVille').required = true;
        document.getElementById('particPays').required = true;
        
        // Désactiver les champs entreprise
        entrepriseFields.querySelectorAll('input').forEach(input => input.required = false);
    }
}

// Modal client
function openClientModal() {
    document.getElementById('createClientModal').classList.remove('hidden');
    // Réinitialiser l'affichage au type particulier par défaut
    document.getElementById('particulierFields').style.display = 'block';
    document.getElementById('entrepriseFields').style.display = 'none';
}

function closeClientModal() {
    document.getElementById('createClientModal').classList.add('hidden');
    document.getElementById('createClientForm').reset();
    document.getElementById('particulierFields').style.display = 'block';
    document.getElementById('entrepriseFields').style.display = 'none';
}

async function createClient(e) {
    e.preventDefault();
    
    console.log('🆕 Début de la création du client...');
    
    const clientType = document.querySelector('input[name="clientType"]:checked').value;
    console.log('Type de client:', clientType);
    
    let clientData = {
        type: clientType,
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
    };
    
    if (clientType === 'particulier') {
        clientData = {
            ...clientData,
            nom: document.getElementById('particNom').value,
            prenom: document.getElementById('particPrenom').value,
            email: document.getElementById('particEmail').value,
            telephone: document.getElementById('particTel').value,
            adresse: document.getElementById('particAdresse').value,
            codePostal: document.getElementById('particCodePostal').value,
            ville: document.getElementById('particVille').value,
            pays: document.getElementById('particPays').value
        };
    } else {
        clientData = {
            ...clientData,
            companyName: document.getElementById('entNom').value,
            siren: document.getElementById('entSiren').value,
            numTVA: document.getElementById('entTVA').value,
            email: document.getElementById('entEmail').value,
            adresse: document.getElementById('entAdresse').value,
            codePostal: document.getElementById('entCodePostal').value,
            ville: document.getElementById('entVille').value,
            pays: document.getElementById('entPays').value,
            contactPrenom: document.getElementById('entContactPrenom').value,
            contactNom: document.getElementById('entContactNom').value,
            contactTelephone: document.getElementById('entContactTel').value
        };
    }
    
    try {
        console.log('💾 Données du client à sauvegarder:', clientData);
        const docRef = await addDoc(collection(db, 'clients'), clientData);
        console.log('✅ Client créé avec ID:', docRef.id);
        
        // Message de succès
        showSuccessMessage('✓ Client créé avec succès !');
        
        // Fermer le modal
        closeClientModal();
        
        // Recharger les clients
        console.log('🔄 Rechargement de la liste des clients...');
        await loadClients();
        console.log('✅ Liste des clients rechargée');
        
        // Sélectionner automatiquement le client créé et passer à l'étape 2
        selectedClient = { id: docRef.id, ...clientData };
        
        // Attendre un peu que le DOM se mette à jour
        setTimeout(() => {
            // Trouver et marquer le bon client
            const clientElements = document.querySelectorAll('.client-item');
            console.log('🔍 Recherche du client dans le DOM... Éléments trouvés:', clientElements.length);
            
            clientElements.forEach(el => {
                el.classList.remove('selected');
            });
            
            // Chercher le client avec le bon ID dans le DOM
            const newClientElement = Array.from(clientElements).find(el => {
                const clientName = el.querySelector('.client-name').textContent;
                const expectedName = clientData.type === 'entreprise' 
                    ? clientData.companyName 
                    : `${clientData.prenom} ${clientData.nom}`;
                
                console.log('Comparaison:', clientName, '===', expectedName);
                return clientName === expectedName;
            });
            
            if (newClientElement) {
                console.log('✅ Client trouvé dans le DOM, sélection...');
                newClientElement.classList.add('selected');
                // Passer à l'étape 2
                setTimeout(() => {
                    goToStep(2);
                }, 300);
            } else {
                console.log('⚠️ Client non trouvé dans le DOM');
            }
        }, 300);
        
    } catch (error) {
        console.error('❌ Erreur lors de la création du client:', error);
        console.error('Détails de l\'erreur:', error.message);
        console.error('Stack:', error.stack);
        showErrorMessage('Erreur: ' + error.message);
    }
}

// Afficher le client sélectionné
function displaySelectedClient() {
    if (!selectedClient) return;
    
    const selectedClientInfo = document.getElementById('selectedClientInfo');
    
    let displayName, detailsLine, initial;
    
    if (selectedClient.type === 'entreprise') {
        displayName = selectedClient.companyName;
        initial = displayName.charAt(0).toUpperCase();
        detailsLine = `<div class="client-email">Contact: ${selectedClient.contactPrenom} ${selectedClient.contactNom}</div>`;
    } else {
        displayName = `${selectedClient.prenom} ${selectedClient.nom}`;
        initial = selectedClient.nom.charAt(0).toUpperCase();
        detailsLine = selectedClient.email ? `<div class="client-email">${selectedClient.email}</div>` : '';
    }
    
    const colorClass = getAvatarColor(initial);
    
    selectedClientInfo.innerHTML = `
        <div class="client-avatar ${colorClass}">${initial}</div>
        <div class="client-info">
            <div class="client-name">${displayName}</div>
            ${detailsLine}
        </div>
    `;
}

// Modal articles - Sélection
function openItemModal() {
    document.getElementById('addItemModal').classList.remove('hidden');
    document.getElementById('itemsListModal').style.display = 'block';
    document.getElementById('quantityForm').classList.add('hidden');
    loadSavedItems();
}

function closeItemModal() {
    document.getElementById('addItemModal').classList.add('hidden');
    selectedItemTemplate = null;
}

// Charger les articles sauvegardés
async function loadSavedItems() {
    if (!currentUser) return;
    
    const savedItemsList = document.getElementById('savedItemsList');
    
    try {
        console.log('📋 Chargement des articles sauvegardés...');
        const q = query(
            collection(db, 'items'),
            where('userId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        console.log('📊 Nombre d\'articles trouvés:', querySnapshot.size);
        
        if (querySnapshot.empty) {
            savedItemsList.innerHTML = `
                <div class="empty-items-state">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 11L12 14L22 4" stroke="#CCC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="#CCC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p>Aucun article sauvegardé</p>
                </div>
            `;
            return;
        }
        
        savedItemsList.innerHTML = '';
        
        const items = [];
        querySnapshot.forEach((docSnapshot) => {
            items.push({
                id: docSnapshot.id,
                data: docSnapshot.data()
            });
        });
        
        // Trier par date de création
        items.sort((a, b) => {
            const dateA = new Date(a.data.createdAt || 0);
            const dateB = new Date(b.data.createdAt || 0);
            return dateB - dateA;
        });
        
        // Afficher les articles
        items.forEach(({ id, data }) => {
            const itemCard = createSavedItemCard(id, data);
            savedItemsList.appendChild(itemCard);
        });
        
        console.log('✅ Articles chargés');
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des articles:', error);
    }
}

// Créer une carte d'article sauvegardé
function createSavedItemCard(id, data) {
    const div = document.createElement('div');
    div.className = 'saved-item-card';
    
    div.innerHTML = `
        <div class="saved-item-info">
            <div class="saved-item-title">${data.title || data.description}</div>
            <div class="saved-item-description">${data.description}</div>
            <div class="saved-item-price">${formatAmount(data.price)}</div>
        </div>
        <div class="saved-item-actions">
            <button class="item-action-btn edit-item-btn" data-item-id="${id}" title="Modifier">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <button class="item-action-btn delete-item-btn" data-item-id="${id}" title="Supprimer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>
    `;
    
    // Sélection de l'article au clic sur la carte (mais pas sur les boutons)
    div.addEventListener('click', (e) => {
        if (!e.target.closest('.item-action-btn')) {
            selectItem(id, data);
        }
    });
    
    // Bouton modifier
    const editBtn = div.querySelector('.edit-item-btn');
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editItem(id, data);
    });
    
    // Bouton supprimer
    const deleteBtn = div.querySelector('.delete-item-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteItem(id, data);
    });
    
    return div;
}

// Sélectionner un article
function selectItem(id, data) {
    selectedItemTemplate = { id, ...data };
    
    // Afficher le formulaire de quantité
    document.getElementById('itemsListModal').style.display = 'none';
    document.getElementById('quantityForm').classList.remove('hidden');
    
    // Afficher l'article sélectionné
    document.getElementById('selectedItemDisplay').innerHTML = `
        <div class="saved-item-title">${data.title || data.description}</div>
        <div class="saved-item-description">${data.description}</div>
        <div class="saved-item-price">${formatAmount(data.price)}</div>
    `;
    
    // Réinitialiser la quantité
    document.getElementById('itemQuantitySelect').value = 1;
}

// Retour à la liste des articles
function backToItemsList() {
    document.getElementById('itemsListModal').style.display = 'block';
    document.getElementById('quantityForm').classList.add('hidden');
    selectedItemTemplate = null;
}

// Ajouter l'article au devis
function addItemToDevis() {
    if (!selectedItemTemplate) return;
    
    const quantity = parseFloat(document.getElementById('itemQuantitySelect').value);
    
    const item = {
        description: `${selectedItemTemplate.title || selectedItemTemplate.description} - ${selectedItemTemplate.description}`,
        quantity: quantity,
        price: selectedItemTemplate.price
    };
    
    item.total = item.quantity * item.price;
    
    devisItems.push(item);
    
    closeItemModal();
    displayItems();
    updateTotals();
    
    showSuccessMessage('✓ Article ajouté au devis !');
}

// Modal création d'article
function openCreateItemModal() {
    // Réinitialiser le formulaire avant d'ouvrir
    document.getElementById('createItemForm').reset();
    resetCreateItemForm();
    document.getElementById('createItemModal').classList.remove('hidden');
}

function closeCreateItemModal() {
    document.getElementById('createItemModal').classList.add('hidden');
    document.getElementById('createItemForm').reset();
    resetCreateItemForm();
}

// Créer un nouvel article
async function createItem(e) {
    e.preventDefault();
    
    const itemData = {
        userId: currentUser.uid,
        title: document.getElementById('newItemTitle').value,
        description: document.getElementById('newItemDescription').value,
        price: parseFloat(document.getElementById('newItemPrice').value),
        createdAt: new Date().toISOString()
    };
    
    try {
        console.log('🆕 Création de l\'article...', itemData);
        const docRef = await addDoc(collection(db, 'items'), itemData);
        console.log('✅ Article créé avec ID:', docRef.id);
        
        showSuccessMessage('✓ Article sauvegardé !');
        
        closeCreateItemModal();
        
        // Recharger la liste des articles
        await loadSavedItems();
        
    } catch (error) {
        console.error('❌ Erreur lors de la création:', error);
        showErrorMessage('Erreur: ' + error.message);
    }
}

// Modifier un article
function editItem(id, data) {
    console.log('✏️ Édition de l\'article:', id);
    
    // Pré-remplir le formulaire
    document.getElementById('newItemTitle').value = data.title || '';
    document.getElementById('newItemDescription').value = data.description || '';
    document.getElementById('newItemPrice').value = data.price || '';
    
    // Fermer le modal de sélection
    closeItemModal();
    
    // Ouvrir le modal de création en mode édition
    document.getElementById('createItemModal').classList.remove('hidden');
    document.querySelector('#createItemModal .modal-header h2').textContent = 'Modifier l\'article';
    
    // Changer le comportement du formulaire
    const form = document.getElementById('createItemForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        await updateItem(id);
    };
    
    // Changer le texte du bouton
    document.querySelector('#createItemForm .btn-primary').textContent = 'Mettre à jour';
}

// Mettre à jour un article
async function updateItem(id) {
    const itemData = {
        title: document.getElementById('newItemTitle').value,
        description: document.getElementById('newItemDescription').value,
        price: parseFloat(document.getElementById('newItemPrice').value),
        updatedAt: new Date().toISOString()
    };
    
    try {
        console.log('💾 Mise à jour de l\'article...', itemData);
        await updateDoc(doc(db, 'items', id), itemData);
        console.log('✅ Article mis à jour');
        
        showSuccessMessage('✓ Article modifié !');
        
        // Réinitialiser le formulaire
        resetCreateItemForm();
        closeCreateItemModal();
        
        // Recharger la liste
        await loadSavedItems();
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour:', error);
        showErrorMessage('Erreur: ' + error.message);
    }
}

// Supprimer un article
async function deleteItem(id, data) {
    const confirmDelete = confirm(`Supprimer l\'article "${data.title || data.description}" ?\n\nCette action est irréversible.`);
    
    if (!confirmDelete) return;
    
    try {
        console.log('🗑️ Suppression de l\'article:', id);
        await deleteDoc(doc(db, 'items', id));
        console.log('✅ Article supprimé');
        
        showSuccessMessage('✓ Article supprimé !');
        
        // Recharger la liste
        await loadSavedItems();
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        showErrorMessage('Erreur: ' + error.message);
    }
}

// Réinitialiser le formulaire de création
function resetCreateItemForm() {
    const form = document.getElementById('createItemForm');
    form.onsubmit = createItem;
    const titleEl = document.querySelector('#createItemModal .modal-header h2');
    const btnEl = document.querySelector('#createItemForm .btn-primary');
    if (titleEl) titleEl.textContent = 'Créer un article';
    if (btnEl) btnEl.textContent = 'Sauvegarder';
}

// Afficher les articles
function displayItems() {
    const itemsList = document.getElementById('itemsList');
    
    if (devisItems.length === 0) {
        itemsList.innerHTML = '';
        return;
    }
    
    itemsList.innerHTML = '';
    
    devisItems.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'item-card';
        
        div.innerHTML = `
            <div class="item-info">
                <div class="item-description">${item.description}</div>
                <div class="item-details">${item.quantity} × ${formatAmount(item.price)}</div>
            </div>
            <div class="item-amount">${formatAmount(item.total)}</div>
            <button class="item-delete" onclick="deleteItem(${index})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;
        
        itemsList.appendChild(div);
    });
}

// Supprimer un article
window.deleteItem = function(index) {
    if (confirm('Supprimer cet article ?')) {
        devisItems.splice(index, 1);
        displayItems();
        updateTotals();
    }
};

// Mettre à jour les totaux
function updateTotals() {
    const totalHT = devisItems.reduce((sum, item) => sum + item.total, 0);
    const isTvaApplicable = companyInfo.tvaStatus === 'oui';
    const totalTVA = isTvaApplicable ? totalHT * 0.20 : 0;
    const totalTTC = totalHT + totalTVA;
    
    document.getElementById('totalHT').textContent = formatAmount(totalHT);
    document.getElementById('totalTVA').textContent = isTvaApplicable ? formatAmount(totalTVA) : 'N/A';
    document.getElementById('totalTTC').textContent = formatAmount(totalTTC);
}

// Afficher le résumé
function displayReviewSummary() {
    const reviewSummary = document.getElementById('reviewSummary');
    
    const totalHT = devisItems.reduce((sum, item) => sum + item.total, 0);
    const isTvaApplicable = companyInfo.tvaStatus === 'oui';
    const totalTVA = isTvaApplicable ? totalHT * 0.20 : 0;
    const totalTTC = totalHT + totalTVA;
    
    const clientName = selectedClient.type === 'entreprise' 
        ? selectedClient.companyName 
        : `${selectedClient.prenom} ${selectedClient.nom}`;
    
    let tvaSection = '';
    if (isTvaApplicable) {
        tvaSection = `
            <div class="total-row">
                <span>TVA (20%)</span>
                <span>${formatAmount(totalTVA)}</span>
            </div>
            <div class="total-row total-final">
                <span>Total TTC</span>
                <span>${formatAmount(totalTTC)}</span>
            </div>
        `;
    } else {
        tvaSection = `
            <div class="total-row" style="font-size: 11px; color: #666;">
                <span>TVA non applicable (art. 293 B du CGI)</span>
                <span></span>
            </div>
            <div class="total-row total-final">
                <span>Total</span>
                <span>${formatAmount(totalHT)}</span>
            </div>
        `;
    }
    
    reviewSummary.innerHTML = `
        <h3>Résumé</h3>
        <div style="margin-bottom: 15px;">
            <strong>Client:</strong> ${clientName}<br>
            ${selectedClient.email ? `<span style="color: #666;">${selectedClient.email}</span>` : ''}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>${devisItems.length} article(s)</strong>
        </div>
        <div class="total-row">
            <span>Total HT</span>
            <span>${formatAmount(totalHT)}</span>
        </div>
        ${tvaSection}
    `;
}

// Générer le devis
async function generateDevis() {
    // Calculer les totaux en fonction du statut TVA
    const totalHT = devisItems.reduce((sum, item) => sum + item.total, 0);
    const isTvaApplicable = companyInfo.tvaStatus === 'oui';
    const totalTVA = isTvaApplicable ? totalHT * 0.20 : 0;
    const totalTTC = totalHT + totalTVA;
    
    // Générer le numéro de devis selon le format
    const devisNumber = await generateDevisNumber();
    
    // Préparer les données client selon le type
    let clientInfo = { type: selectedClient.type };
    
    if (selectedClient.type === 'entreprise') {
        clientInfo = {
            ...clientInfo,
            companyName: selectedClient.companyName,
            siren: selectedClient.siren,
            numTVA: selectedClient.numTVA,
            email: selectedClient.email,
            adresse: selectedClient.adresse,
            codePostal: selectedClient.codePostal,
            ville: selectedClient.ville,
            pays: selectedClient.pays,
            contactPrenom: selectedClient.contactPrenom,
            contactNom: selectedClient.contactNom,
            contactTelephone: selectedClient.contactTelephone
        };
    } else {
        clientInfo = {
            ...clientInfo,
            nom: selectedClient.nom,
            prenom: selectedClient.prenom,
            email: selectedClient.email,
            telephone: selectedClient.telephone,
            adresse: selectedClient.adresse,
            codePostal: selectedClient.codePostal,
            ville: selectedClient.ville,
            pays: selectedClient.pays
        };
    }
    
    // Récupérer les infos acompte
    const acompteCheck = document.getElementById('acompteCheck').checked;
    const acomptePercent = acompteCheck ? parseInt(document.getElementById('acomptePercent').value) : 0;
    const acompteAmount = acompteCheck ? (totalHT * acomptePercent / 100) : 0;
    
    const devisData = {
        ...clientInfo,
        devisNumber: devisNumber,
        myCompanyName: companyInfo.name || 'Votre entreprise',
        myCompanyAddress: companyInfo.address || '',
        myCompanySiret: companyInfo.siret || '',
        myCompanyPhone: companyInfo.phone || '',
        myCompanyRib: companyInfo.rib || '',
        devisDate: document.getElementById('devisDate').value,
        validityDate: document.getElementById('validityDate').value,
        notes: document.getElementById('notes').value,
        items: devisItems,
        totalHT,
        totalTVA,
        totalTTC,
        tvaApplicable: isTvaApplicable,
        acompteRequired: acompteCheck,
        acomptePercent: acomptePercent,
        acompteAmount: acompteAmount,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        status: 'En attente'
    };
    
    try {
        // Sauvegarder dans Firebase
        await addDoc(collection(db, 'devis'), devisData);
        
        // Générer le PDF
        generatePDF(devisData);
        
        // Rediriger vers le dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Erreur lors de la création du devis:', error);
        alert('Erreur lors de la création du devis');
    }
}

// Générer le PDF
function generatePDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('DEVIS', 105, 20, { align: 'center' });
    
    // Numéro de devis
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.text('N° ' + data.devisNumber, 105, 28, { align: 'center' });
    
    // Informations entreprise émettrice
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    let myY = 40;
    doc.text(data.myCompanyName, 20, myY);
    myY += 5;
    if (data.myCompanyAddress) {
        doc.text(data.myCompanyAddress, 20, myY);
        myY += 5;
    }
    if (data.myCompanySiret) {
        doc.text('SIRET: ' + data.myCompanySiret, 20, myY);
        myY += 5;
    }
    // Ajouter SIREN depuis companyInfo
    const siren = data.myCompanySiret ? data.myCompanySiret.substring(0, 9) : '';
    if (siren) {
        doc.text('SIREN: ' + siren, 20, myY);
        myY += 5;
    }
    if (data.myCompanyPhone) {
        doc.text('Tél: ' + data.myCompanyPhone, 20, myY);
        myY += 5;
    }
    
    // Informations client
    doc.text('Client:', 120, 40);
    
    let clientY = 45;
    
    if (data.type === 'entreprise') {
        doc.setFont(undefined, 'bold');
        doc.text(data.companyName, 120, clientY);
        clientY += 5;
        doc.setFont(undefined, 'normal');
        if (data.siren) {
            doc.text('SIREN: ' + data.siren, 120, clientY);
            clientY += 5;
        }
    } else {
        doc.setFont(undefined, 'bold');
        doc.text(data.prenom + ' ' + data.nom, 120, clientY);
        clientY += 5;
        doc.setFont(undefined, 'normal');
    }
    
    doc.text(data.adresse, 120, clientY);
    clientY += 5;
    doc.text(data.codePostal + ' ' + data.ville, 120, clientY);
    clientY += 5;
    doc.text(data.pays, 120, clientY);
    clientY += 5;
    
    // Date
    doc.text('Date: ' + data.devisDate, 20, 70);
    
    // Tableau des articles
    let y = 90;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    doc.text('Description', 25, y + 6);
    doc.text('Qté', 120, y + 6);
    doc.text('P.U.', 140, y + 6);
    doc.text('Total', 165, y + 6);
    y += 8;
    doc.line(20, y, 190, y);
    
    y += 4;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    data.items.forEach(item => {
        doc.text(item.description, 25, y);
        doc.text(item.quantity.toString(), 125, y, { align: 'right' });
        doc.text(item.price.toFixed(2) + ' €', 155, y, { align: 'right' });
        doc.text(item.total.toFixed(2) + ' €', 185, y, { align: 'right' });
        y += 7;
    });
    
    // Totaux
    y += 10;
    doc.setFontSize(11);
    doc.text('Total HT:', 140, y);
    doc.text(data.totalHT.toFixed(2) + ' €', 185, y, { align: 'right' });
    y += 7;
    
    if (data.tvaApplicable) {
        doc.text('TVA (20%):', 140, y);
        doc.text(data.totalTVA.toFixed(2) + ' €', 185, y, { align: 'right' });
        y += 7;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Total TTC:', 140, y);
        doc.text(data.totalTTC.toFixed(2) + ' €', 185, y, { align: 'right' });
    } else {
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text('TVA non applicable, art. 293 B du CGI', 140, y);
        y += 7;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Total:', 140, y);
        doc.text(data.totalHT.toFixed(2) + ' €', 185, y, { align: 'right' });
    }
    
    // Acompte
    if (data.acompteRequired) {
        y += 10;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(0, 0, 0);
        doc.rect(20, y - 3, 170, 10, 'S');
        doc.text(`Acompte à la commande (${data.acomptePercent}%):`, 25, y + 3);
        doc.setFont(undefined, 'bold');
        doc.text(data.acompteAmount.toFixed(2) + ' €', 185, y + 3, { align: 'right' });
    }
    
    // Date de validité
    y += 15;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Devis valable jusqu\'au: ' + data.validityDate, 20, y);
    
    // RIB
    if (data.myCompanyRib) {
        y += 10;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text('Coordonnées bancaires:', 20, y);
        y += 5;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text('IBAN: ' + data.myCompanyRib, 20, y);
    }
    
    // Télécharger
    const clientName = data.type === 'entreprise' 
        ? data.companyName 
        : `${data.prenom} ${data.nom}`;
    doc.save(`Devis_${clientName.replace(/\s/g, '_')}_${data.devisDate}.pdf`);
}

// Charger les infos entreprise depuis Firebase
async function loadCompanyInfo() {
    if (!currentUser) return;
    
    try {
        const q = query(
            collection(db, 'company_info'),
            where('userId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            companyInfo = querySnapshot.docs[0].data();
            console.log('📋 Format devis:', companyInfo.devisFormat);
            console.log('💰 TVA applicable:', companyInfo.tvaStatus);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des infos entreprise:', error);
    }
}

// Générer le numéro de devis selon le format choisi
async function generateDevisNumber() {
    const format = companyInfo.devisFormat || 'D/N';
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    try {
        // Compter les devis existants pour obtenir le prochain numéro
        const q = query(
            collection(db, 'devis'),
            where('userId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const nextNumber = querySnapshot.size + 1;
        const formattedNumber = String(nextNumber).padStart(3, '0');
        
        // Générer selon le format
        let devisNumber = '';
        
        switch (format) {
            case 'DYYYYMMN':
                devisNumber = `D${year}${month}${formattedNumber}`;
                break;
            case 'DYYYYN':
                devisNumber = `D${year}${formattedNumber}`;
                break;
            case 'DN':
                devisNumber = `D${formattedNumber}`;
                break;
            case 'DEVISN':
                devisNumber = `DEVIS${formattedNumber}`;
                break;
            default:
                devisNumber = `D${formattedNumber}`;
        }
        
        console.log('📄 Numéro de devis généré:', devisNumber);
        return devisNumber;
        
    } catch (error) {
        console.error('Erreur lors de la génération du numéro:', error);
        return 'D001';
    }
}

// Recherche SIREN via API
async function searchSiren() {
    const sirenInput = document.getElementById('entSiren');
    const siren = sirenInput.value.replace(/\s/g, '');
    
    if (!/^\d{9}$/.test(siren)) {
        return; // Ne pas afficher d'erreur, juste ignorer
    }
    
    const loadingDiv = document.getElementById('sirenLoading');
    
    try {
        loadingDiv.style.display = 'flex';
        
        console.log('🔍 Recherche SIREN:', siren);
        let entreprise = null;
        let apiUsed = '';
        
        // Essayer d'abord l'API recherche-entreprises (gratuite, sans token, sans CORS)
        try {
            console.log('Tentative API recherche-entreprises.api.gouv.fr...');
            const responseGouv = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${siren}`);
            
            if (responseGouv.ok) {
                const dataGouv = await responseGouv.json();
                console.log('Réponse API recherche-entreprises:', dataGouv);
                
                if (dataGouv.results && dataGouv.results.length > 0) {
                    const result = dataGouv.results[0];
                    
                    // Remplir avec les données
                    document.getElementById('entNom').value = result.nom_complet || result.nom_raison_sociale || '';
                    
                    // Adresse du siège
                    if (result.siege) {
                        let adresse = '';
                        if (result.siege.numero_voie) adresse += result.siege.numero_voie + ' ';
                        if (result.siege.indice_repetition) adresse += result.siege.indice_repetition + ' ';
                        if (result.siege.type_voie) adresse += result.siege.type_voie + ' ';
                        if (result.siege.libelle_voie) adresse += result.siege.libelle_voie;
                        if (result.siege.complement_adresse) adresse += ', ' + result.siege.complement_adresse;
                        
                        document.getElementById('entAdresse').value = adresse.trim();
                        document.getElementById('entCodePostal').value = result.siege.code_postal || '';
                        document.getElementById('entVille').value = result.siege.libelle_commune || '';
                    }
                    
                    apiUsed = 'API Gouv';
                    entreprise = true;
                    console.log('✅ Données trouvées via API Gouv');
                }
            }
        } catch (e) {
            console.log('❌ API recherche-entreprises non disponible:', e);
        }
        
        // Si API Gouv n'a pas fonctionné, essayer l'ancienne API data.gouv.fr
        if (!entreprise) {
            try {
                console.log('Tentative API entreprise.data.gouv.fr (ancienne)...');
                const response = await fetch(`https://entreprise.data.gouv.fr/api/sirene/v3/unites_legales/${siren}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Réponse API data.gouv:', data);
                    const unite = data.unite_legale;
                    
                    if (unite) {
                        // Nom
                        const nom = unite.denomination || 
                                   `${unite.prenom_1_unite_legale || ''} ${unite.nom_unite_legale || ''}`.trim();
                        document.getElementById('entNom').value = nom;
                        
                        // Adresse du siège
                        if (unite.etablissement_siege) {
                            const siege = unite.etablissement_siege;
                            let adresse = '';
                            
                            if (siege.numero_voie) adresse += siege.numero_voie + ' ';
                            if (siege.indice_repetition) adresse += siege.indice_repetition + ' ';
                            if (siege.type_voie) adresse += siege.type_voie + ' ';
                            if (siege.libelle_voie) adresse += siege.libelle_voie;
                            if (siege.complement_adresse) adresse += ', ' + siege.complement_adresse;
                            
                            document.getElementById('entAdresse').value = adresse.trim();
                            document.getElementById('entCodePostal').value = siege.code_postal || '';
                            document.getElementById('entVille').value = siege.libelle_commune || '';
                        }
                        
                        apiUsed = 'Data.gouv';
                        entreprise = true;
                        console.log('✅ Données trouvées via Data.gouv');
                    }
                }
            } catch (e) {
                console.log('❌ API data.gouv non disponible:', e);
            }
        }
        
        if (entreprise) {
            // Calculer et remplir le numéro de TVA
            const tva = calculerNumeroTVA(siren);
            document.getElementById('entTVA').value = tva;
            
            // Forcer France par défaut
            if (!document.getElementById('entPays').value) {
                document.getElementById('entPays').value = 'France';
            }
            
            // Message de succès
            console.log('✅ Recherche terminée avec succès via', apiUsed);
            showSuccessMessage(`✓ Informations trouvées (${apiUsed})`);
        } else {
            console.log('❌ Aucune API n\'a retourné de données');
            throw new Error('Aucune donnée trouvée');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la recherche SIREN:', error);
        showErrorMessage('SIREN non trouvé. Vérifiez le numéro.');
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Calculer le numéro de TVA à partir du SIREN
function calculerNumeroTVA(siren) {
    // Formule française : (12 + 3 * (SIREN % 97)) % 97
    const cleeTVA = (12 + 3 * (parseInt(siren) % 97)) % 97;
    const cleeTVAFormatee = cleeTVA.toString().padStart(2, '0');
    return `FR ${cleeTVAFormatee} ${siren}`;
}

// Afficher un message de succès
function showSuccessMessage(message) {
    const msg = document.createElement('div');
    msg.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4CAF50;
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

// Afficher un message d'erreur
function showErrorMessage(message) {
    const msg = document.createElement('div');
    msg.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #FF6B6B;
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

// Utilitaires
function getAvatarColor(initial) {
    const colors = ['avatar-purple', 'avatar-pink', 'avatar-blue', 'avatar-green', 'avatar-orange', 'avatar-red'];
    const charCode = initial.charCodeAt(0);
    return colors[charCode % colors.length];
}

function formatAmount(amount) {
    return amount.toFixed(2).replace('.', ',') + ' €';
}
