import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, 
    getDocs, 
    query, 
    where,
    doc,
    deleteDoc,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;
let currentTab = 'devis';
let selectedDocId = null;
let selectedDocData = null;

// Vérifier l'authentification
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        currentUser = user;
        initDashboard();
    }
});

// Initialiser le dashboard
function initDashboard() {
    setupTabs();
    setupCreateButton();
    setupNavigation();
    setupModalListeners();
    updateCurrentMonth();
    loadDocuments();
}

// Configuration des listeners de la modale
function setupModalListeners() {
    document.getElementById('closeDetailModal')?.addEventListener('click', closeDetailModal);
    document.getElementById('closeDetailBtn')?.addEventListener('click', updateDevisStatus);
    document.getElementById('downloadPdfBtn')?.addEventListener('click', downloadDevisPdf);
    document.getElementById('generateFactureBtn')?.addEventListener('click', generateFactureFromDevis);
}

// Configuration des onglets
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Désactiver tous les onglets
            tabs.forEach(t => t.classList.remove('active'));
            // Activer l'onglet cliqué
            tab.classList.add('active');
            
            // Changer l'onglet actuel
            currentTab = tab.dataset.tab;
            
            // Mettre à jour le texte du bouton
            const createBtnText = document.getElementById('createBtnText');
            createBtnText.textContent = currentTab === 'devis' ? 'Créer un devis' : 'Créer une facture';
            
            // Recharger les documents
            loadDocuments();
        });
    });
}

// Configuration du bouton de création
function setupCreateButton() {
    const createBtn = document.getElementById('createBtn');
    const createFirstBtn = document.getElementById('createFirstBtn');
    
    createBtn.addEventListener('click', createDocument);
    createFirstBtn.addEventListener('click', createDocument);
}

// Créer un nouveau document
function createDocument() {
    if (currentTab === 'devis') {
        window.location.href = 'create-devis.html';
    } else {
        window.location.href = 'create-facture.html';
    }
}

// Configuration de la navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const helpBtn = document.getElementById('helpBtn');
    const profilBtn = document.getElementById('profilBtn');
    
    helpBtn.addEventListener('click', () => {
        alert('Aide\n\n• Créez des devis et factures professionnels\n• Gérez vos documents en un clic\n• Exportez en PDF\n\nPour plus d\'aide, contactez le support.');
    });
    
    profilBtn.addEventListener('click', () => {
        window.location.href = 'profil.html';
    });
}

// Mettre à jour le mois actuel
function updateCurrentMonth() {
    const monthElement = document.getElementById('currentMonth');
    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    const currentMonth = new Date().getMonth();
    monthElement.textContent = months[currentMonth];
}

// Charger les documents
async function loadDocuments() {
    if (!currentUser) return;
    
    const documentsList = document.getElementById('documentsList');
    const totalAmountElement = document.getElementById('totalAmount');
    
    try {
        // Déterminer la collection
        const collectionName = currentTab;
        
        // Requête Firebase
        console.log('📋 Chargement des documents pour:', collectionName);
        const q = query(
            collection(db, collectionName),
            where('userId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        console.log('📊 Nombre de documents trouvés:', querySnapshot.size);
        
        if (querySnapshot.empty) {
            // Afficher l'état vide
            documentsList.innerHTML = `
                <div class="empty-state">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#CCC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M14 2V8H20" stroke="#CCC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M16 13H8" stroke="#CCC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M16 17H8" stroke="#CCC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M10 9H9H8" stroke="#CCC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p>Aucun ${currentTab === 'devis' ? 'devis' : 'facture'} pour le moment</p>
                    <button class="create-first-btn" id="createFirstBtn">Créer votre premier document</button>
                </div>
            `;
            
            // Réattacher l'événement
            document.getElementById('createFirstBtn').addEventListener('click', createDocument);
            
            totalAmountElement.textContent = '0,00 €';
            return;
        }
        
        // Construire la liste des documents
        documentsList.innerHTML = '';
        let totalMonth = 0;
        const currentMonth = new Date().getMonth();
        
        // Convertir en tableau et trier par date côté client
        const docs = [];
        querySnapshot.forEach((docSnapshot) => {
            docs.push({
                id: docSnapshot.id,
                data: docSnapshot.data()
            });
        });
        
        // Trier par date de création (plus récent en premier)
        docs.sort((a, b) => {
            const dateA = new Date(a.data.createdAt || 0);
            const dateB = new Date(b.data.createdAt || 0);
            return dateB - dateA;
        });
        
        // Afficher les documents
        docs.forEach(({ id, data }) => {
            // Calculer le total du mois
            const docDate = new Date(data.createdAt);
            if (docDate.getMonth() === currentMonth) {
                totalMonth += data.totalTTC || 0;
            }
            
            // Créer l'élément de document
            const docElement = createDocumentElement(id, data);
            documentsList.appendChild(docElement);
        });
        
        // Mettre à jour le total
        totalAmountElement.textContent = formatAmount(totalMonth);
        
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        documentsList.innerHTML = `
            <div class="empty-state">
                <p style="color: #e74c3c;">Erreur lors du chargement des documents</p>
                <p style="color: #999; font-size: 14px; margin-top: 10px;">Veuillez actualiser la page</p>
            </div>
        `;
    }
}

// Créer un élément de document
function createDocumentElement(docId, data) {
    const div = document.createElement('div');
    div.className = 'document-item';
    
    // Calculer le nom du client
    const clientName = data.type === 'entreprise' 
        ? (data.companyName || 'Entreprise')
        : (data.prenom && data.nom ? `${data.prenom} ${data.nom}` : 'Client');
    
    // Obtenir l'initiale et la couleur
    const initial = clientName.charAt(0).toUpperCase();
    const colorClass = getAvatarColor(initial);
    
    // Déterminer le numéro de document
    const docNumber = currentTab === 'factures' ? data.factureNumber : `Devis ${formatDate(data.createdAt)}`;
    
    // Statut
    const status = data.status || 'En attente';
    const statusClass = status.toLowerCase().replace(' ', '-');
    
    div.innerHTML = `
        <div class="document-avatar ${colorClass}">
            ${initial}
        </div>
        <div class="document-info">
            <div class="document-name">${clientName}</div>
            <div class="document-number">${docNumber}</div>
        </div>
        <div class="document-right">
            <div class="document-amount">${formatAmount(data.totalTTC || 0)}</div>
            <div class="document-status ${statusClass}">${status}</div>
        </div>
    `;
    
    // Ajouter l'événement de clic
    div.addEventListener('click', () => {
        openDocument(docId, data);
    });
    
    return div;
}

// Ouvrir un document
function openDocument(docId, data) {
    selectedDocId = docId;
    selectedDocData = data;
    
    // Afficher la modale avec les détails
    displayDocumentDetails(data);
    document.getElementById('devisDetailModal').classList.remove('hidden');
}

// Afficher les détails du document
function displayDocumentDetails(data) {
    const content = document.getElementById('devisDetailContent');
    
    // Afficher ou masquer le bouton générer facture selon le type
    const generateFactureBtn = document.getElementById('generateFactureBtn');
    if (generateFactureBtn) {
        generateFactureBtn.style.display = currentTab === 'devis' ? 'flex' : 'none';
    }
    
    const clientName = data.type === 'entreprise' 
        ? data.companyName 
        : `${data.prenom} ${data.nom}`;
    
    let itemsHtml = '';
    if (data.items && data.items.length > 0) {
        itemsHtml = '<div class="detail-section"><h3>Articles</h3>';
        data.items.forEach(item => {
            itemsHtml += `
                <div class="detail-row">
                    <div class="detail-label">${item.description}</div>
                    <div class="detail-value">${item.quantity} × ${formatAmount(item.price)}</div>
                </div>
            `;
        });
        itemsHtml += '</div>';
    }
    
    content.innerHTML = `
        <div class="status-section">
            <label for="devisStatus">Modifier le statut</label>
            <div class="status-options">
                <label class="status-option ${data.status === 'En attente' ? 'selected' : ''}" data-status="En attente">
                    <input type="radio" name="devisStatus" value="En attente" ${data.status === 'En attente' ? 'checked' : ''}>
                    <span class="status-badge status-attente">En attente</span>
                </label>
                <label class="status-option ${data.status === 'Accepté' ? 'selected' : ''}" data-status="Accepté">
                    <input type="radio" name="devisStatus" value="Accepté" ${data.status === 'Accepté' ? 'checked' : ''}>
                    <span class="status-badge status-accepte">Accepté</span>
                </label>
                <label class="status-option ${data.status === 'Refusé' ? 'selected' : ''}" data-status="Refusé">
                    <input type="radio" name="devisStatus" value="Refusé" ${data.status === 'Refusé' ? 'checked' : ''}>
                    <span class="status-badge status-refuse">Refusé</span>
                </label>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Informations générales</h3>
            <div class="detail-row">
                <div class="detail-label">Numéro</div>
                <div class="detail-value">${data.devisNumber || 'N/A'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Date</div>
                <div class="detail-value">${data.devisDate || data.createdAt}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Validité</div>
                <div class="detail-value">${data.validityDate || 'N/A'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Statut</div>
                <div class="detail-value">${data.status || 'En attente'}</div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Client</h3>
            <div class="detail-row">
                <div class="detail-label">Nom</div>
                <div class="detail-value">${clientName}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Adresse complète</div>
                <div class="detail-value">${data.adresse || ''}, ${data.codePostal || ''} ${data.ville || ''}</div>
            </div>
        </div>
        
        ${itemsHtml}
        
        <div class="detail-section">
            <h3>Montants</h3>
            <div class="detail-row">
                <div class="detail-label">Total HT</div>
                <div class="detail-value">${formatAmount(data.totalHT || 0)}</div>
            </div>
            ${data.tvaApplicable ? `
                <div class="detail-row">
                    <div class="detail-label">TVA (20%)</div>
                    <div class="detail-value">${formatAmount(data.totalTVA || 0)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Total TTC</div>
                    <div class="detail-value" style="font-size: 18px; color: #000;">${formatAmount(data.totalTTC || 0)}</div>
                </div>
            ` : `
                <div class="detail-row">
                    <div class="detail-label" style="font-size: 11px;">TVA non applicable</div>
                    <div class="detail-value"></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Total</div>
                    <div class="detail-value" style="font-size: 18px; color: #000;">${formatAmount(data.totalHT || 0)}</div>
                </div>
            `}
            ${data.acompteRequired ? `
                <div class="detail-row">
                    <div class="detail-label">Acompte demandé (${data.acomptePercent}%)</div>
                    <div class="detail-value">${formatAmount(data.acompteAmount || 0)}</div>
                </div>
            ` : ''}
        </div>
        
        <button class="btn-delete-bottom" id="deleteDevisBottomBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Supprimer ce devis
        </button>
    `;
    
    // Ajouter les event listeners pour les options de statut
    setTimeout(() => {
        const statusOptions = document.querySelectorAll('.status-option');
        statusOptions.forEach(option => {
            option.addEventListener('click', function() {
                statusOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                this.querySelector('input').checked = true;
            });
        });
        
        // Event listener pour le bouton supprimer en bas
        document.getElementById('deleteDevisBottomBtn')?.addEventListener('click', deleteDocument);
    }, 0);
}

// Fermer la modale
function closeDetailModal() {
    document.getElementById('devisDetailModal').classList.add('hidden');
    selectedDocId = null;
    selectedDocData = null;
}

// Mettre à jour le statut du devis
async function updateDevisStatus() {
    if (!selectedDocId) return;
    
    // Récupérer le statut sélectionné depuis les radio buttons
    const selectedRadio = document.querySelector('input[name="devisStatus"]:checked');
    if (!selectedRadio) {
        closeDetailModal();
        return;
    }
    
    const newStatus = selectedRadio.value;
    
    try {
        console.log('🔄 Mise à jour du statut:', newStatus);
        await updateDoc(doc(db, currentTab, selectedDocId), {
            status: newStatus
        });
        console.log('✅ Statut mis à jour');
        
        // Mettre à jour les données locales
        selectedDocData.status = newStatus;
        
        // Recharger la liste
        await loadDocuments();
        
        alert(`Statut mis à jour : ${newStatus}`);
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour:', error);
        alert('Erreur lors de la mise à jour : ' + error.message);
    }
}

// Télécharger le PDF du devis
function downloadDevisPdf() {
    if (!selectedDocData) return;
    
    // Charger jsPDF
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
        generatePDF(selectedDocData);
    };
    document.head.appendChild(script);
}

// Générer le PDF (copié et adapté de create-devis.js)
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
    doc.setFont(undefined, 'normal');
    doc.text('N° ' + (data.devisNumber || 'N/A'), 105, 28, { align: 'center' });
    
    // Informations entreprise émettrice
    doc.setFontSize(10);
    let myY = 40;
    doc.text(data.myCompanyName || '', 20, myY);
    myY += 5;
    if (data.myCompanyAddress) {
        doc.text(data.myCompanyAddress, 20, myY);
        myY += 5;
    }
    if (data.myCompanySiret) {
        doc.text('SIRET: ' + data.myCompanySiret, 20, myY);
        myY += 5;
        const siren = data.myCompanySiret.substring(0, 9);
        doc.text('SIREN: ' + siren, 20, myY);
        myY += 5;
    }
    if (data.myCompanyPhone) {
        doc.text('Tél: ' + data.myCompanyPhone, 20, myY);
    }
    
    // Informations client
    doc.text('Client:', 120, 40);
    let clientY = 45;
    
    const clientName = data.type === 'entreprise' 
        ? data.companyName 
        : `${data.prenom} ${data.nom}`;
    
    doc.setFont(undefined, 'bold');
    doc.text(clientName, 120, clientY);
    clientY += 5;
    doc.setFont(undefined, 'normal');
    
    if (data.type === 'entreprise' && data.siren) {
        doc.text('SIREN: ' + data.siren, 120, clientY);
        clientY += 5;
    }
    
    doc.text(data.adresse || '', 120, clientY);
    clientY += 5;
    doc.text((data.codePostal || '') + ' ' + (data.ville || ''), 120, clientY);
    clientY += 5;
    doc.text(data.pays || '', 120, clientY);
    
    // Date
    doc.text('Date: ' + (data.devisDate || ''), 20, 70);
    
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
    
    if (data.items) {
        data.items.forEach(item => {
            doc.text(item.description, 25, y);
            doc.text(item.quantity.toString(), 125, y, { align: 'right' });
            doc.text(item.price.toFixed(2) + ' €', 155, y, { align: 'right' });
            doc.text(item.total.toFixed(2) + ' €', 185, y, { align: 'right' });
            y += 7;
        });
    }
    
    // Totaux
    y += 10;
    doc.setFontSize(11);
    doc.text('Total HT:', 140, y);
    doc.text((data.totalHT || 0).toFixed(2) + ' €', 185, y, { align: 'right' });
    y += 7;
    
    if (data.tvaApplicable) {
        doc.text('TVA (20%):', 140, y);
        doc.text((data.totalTVA || 0).toFixed(2) + ' €', 185, y, { align: 'right' });
        y += 7;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Total TTC:', 140, y);
        doc.text((data.totalTTC || 0).toFixed(2) + ' €', 185, y, { align: 'right' });
    } else {
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text('TVA non applicable, art. 293 B du CGI', 140, y);
        y += 7;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Total:', 140, y);
        doc.text((data.totalHT || 0).toFixed(2) + ' €', 185, y, { align: 'right' });
    }
    
    // Acompte
    if (data.acompteRequired) {
        y += 10;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setDrawColor(0, 0, 0);
        doc.rect(20, y - 3, 170, 10, 'S');
        doc.text(`Acompte à la commande (${data.acomptePercent}%):`, 25, y + 3);
        doc.setFont(undefined, 'bold');
        doc.text((data.acompteAmount || 0).toFixed(2) + ' €', 185, y + 3, { align: 'right' });
    }
    
    // Date de validité
    y += 15;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Devis valable jusqu\'au: ' + (data.validityDate || ''), 20, y);
    
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
    doc.save(`Devis_${clientName.replace(/\s/g, '_')}_${data.devisDate || 'N/A'}.pdf`);
    
    alert('✓ PDF téléchargé !');
}

// Générer une facture depuis un devis
function generateFactureFromDevis() {
    if (!selectedDocData || currentTab !== 'devis') return;
    
    // Préparer les données pour la facture
    const factureData = {
        ...selectedDocData,
        sourceDevisId: selectedDocId,
        sourceDevisNumber: selectedDocData.devisNumber
    };
    
    // Sauvegarder dans sessionStorage
    sessionStorage.setItem('generateFactureFromDevis', JSON.stringify(factureData));
    
    // Rediriger vers la page de création de facture
    window.location.href = 'create-facture.html';
}

// Supprimer un devis
async function deleteDocument() {
    if (!selectedDocId || !selectedDocData) return;
    
    const docType = currentTab === 'devis' ? 'devis' : 'facture';
    const confirmMsg = `Êtes-vous sûr de vouloir supprimer ce ${docType} ?\n\nCette action est irréversible.`;
    
    if (!confirm(confirmMsg)) return;
    
    try {
        console.log('🗑️ Suppression du document:', selectedDocId);
        await deleteDoc(doc(db, currentTab, selectedDocId));
        console.log('✅ Document supprimé');
        
        // Fermer la modale
        closeDetailModal();
        
        // Recharger la liste
        await loadDocuments();
        
        alert(`${docType.charAt(0).toUpperCase() + docType.slice(1)} supprimé avec succès !`);
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression : ' + error.message);
    }
}

// Obtenir la couleur de l'avatar en fonction de l'initiale
function getAvatarColor(initial) {
    const colors = ['avatar-purple', 'avatar-pink', 'avatar-blue', 'avatar-green', 'avatar-orange', 'avatar-red'];
    const charCode = initial.charCodeAt(0);
    return colors[charCode % colors.length];
}

// Formater le montant
function formatAmount(amount) {
    return amount.toFixed(2).replace('.', ',') + ' €';
}

// Formater la date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `D${day}${month}${year}`;
}
