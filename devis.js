import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, 
    addDoc, 
    getDocs,
    query,
    where,
    orderBy 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;
let selectedClient = null;
let currentStep = 1;

// Vérifier l'authentification
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        currentUser = user;
        loadClients();
    }
});

// Déconnexion
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
    }
});

// Gestion du wizard
function goToStep(step) {
    // Cacher tous les contenus
    document.querySelectorAll('.wizard-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Désactiver tous les steps
    document.querySelectorAll('.wizard-step').forEach(wizardStep => {
        wizardStep.classList.remove('active');
        wizardStep.classList.remove('completed');
    });
    
    // Activer l'étape actuelle
    document.getElementById(`wizardStep${step}`).classList.add('active');
    document.querySelector(`.wizard-step[data-step="${step}"]`).classList.add('active');
    
    // Marquer les étapes précédentes comme complétées
    for (let i = 1; i < step; i++) {
        document.querySelector(`.wizard-step[data-step="${i}"]`).classList.add('completed');
    }
    
    currentStep = step;
}

// Bouton créer un nouveau client
document.getElementById('createNewClient').addEventListener('click', () => {
    window.location.href = 'clients.html?new=true&return=devis';
});

// Recherche de clients
document.getElementById('clientSearch').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.client-select-card');
    
    cards.forEach(card => {
        const name = card.querySelector('h4').textContent.toLowerCase();
        const email = card.querySelector('p').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || email.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

// Charger les clients
async function loadClients() {
    try {
        const q = query(
            collection(db, 'clients'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const clientsGrid = document.getElementById('clientsGrid');
        
        if (querySnapshot.empty) {
            clientsGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <p>Aucun client trouvé</p>
                    <button class="btn btn-secondary" onclick="window.location.href='clients.html?new=true'">Créer un client</button>
                </div>
            `;
            return;
        }
        
        clientsGrid.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const card = createClientSelectCard(doc.id, data);
            clientsGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
    }
}

// Créer une carte de sélection de client
function createClientSelectCard(id, data) {
    const card = document.createElement('div');
    card.className = 'client-select-card';
    card.dataset.clientId = id;
    
    const displayName = data.type === 'particulier' 
        ? `${data.firstName} ${data.lastName}`
        : data.companyName;
    
    card.innerHTML = `
        <h4>${displayName}</h4>
        <p>${data.email}</p>
    `;
    
    card.addEventListener('click', () => {
        // Désélectionner tous les autres
        document.querySelectorAll('.client-select-card').forEach(c => {
            c.classList.remove('selected');
        });
        
        // Sélectionner celui-ci
        card.classList.add('selected');
        selectedClient = { id, ...data };
        
        // Passer à l'étape suivante
        setTimeout(() => {
            goToStep(2);
            displaySelectedClient();
            initDevisForm();
        }, 300);
    });
    
    return card;
}

// Afficher le client sélectionné
function displaySelectedClient() {
    const selectedClientInfo = document.getElementById('selectedClientInfo');
    
    if (!selectedClient) {
        selectedClientInfo.innerHTML = '';
        return;
    }
    
    const displayName = selectedClient.type === 'particulier' 
        ? `${selectedClient.firstName} ${selectedClient.lastName}`
        : selectedClient.companyName;
    
    selectedClientInfo.innerHTML = `
        <h4>Client sélectionné</h4>
        <div style="display: flex; gap: 20px; margin-top: 10px;">
            <div>
                <strong>${displayName}</strong><br>
                <span style="font-size: 14px; color: #666;">${selectedClient.email}</span>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.devisApp.changeClient()">Changer</button>
        </div>
    `;
}

// Changer de client
window.devisApp = {
    changeClient: () => {
        selectedClient = null;
        goToStep(1);
    }
};

// Navigation entre les étapes
document.getElementById('backToStep1').addEventListener('click', () => {
    goToStep(1);
});

document.getElementById('backToStep2').addEventListener('click', () => {
    goToStep(2);
});

document.getElementById('nextToStep3').addEventListener('click', () => {
    if (validateDevisForm()) {
        goToStep(3);
        displayRecap();
    }
});

// Initialiser le formulaire de devis
function initDevisForm() {
    // Définir la date du jour
    document.getElementById('devisDate').valueAsDate = new Date();
    
    // Ajouter les événements pour les articles
    document.getElementById('addItemBtn').addEventListener('click', addItemRow);
    
    // Initialiser le calcul
    updateTotal();
    
    // Ajouter les événements sur les inputs existants
    document.querySelectorAll('.item-quantity, .item-price').forEach(input => {
        input.addEventListener('input', updateTotal);
    });
}

// Ajouter une ligne d'article
function addItemRow() {
    const itemsContainer = document.getElementById('itemsContainer');
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.innerHTML = `
        <input type="text" placeholder="Description" class="item-description" required>
        <input type="number" placeholder="Quantité" class="item-quantity" value="1" min="1" required>
        <input type="number" placeholder="Prix unitaire (€)" class="item-price" step="0.01" min="0" required>
        <button type="button" class="btn-remove-item">-</button>
    `;
    
    itemsContainer.appendChild(itemRow);
    
    const removeBtn = itemRow.querySelector('.btn-remove-item');
    removeBtn.addEventListener('click', () => {
        itemRow.remove();
        updateTotal();
        updateRemoveButtons();
    });
    
    const inputs = itemRow.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', updateTotal);
    });
    
    updateRemoveButtons();
}

// Mettre à jour les boutons de suppression
function updateRemoveButtons() {
    const itemRows = document.querySelectorAll('.item-row');
    itemRows.forEach((row) => {
        const removeBtn = row.querySelector('.btn-remove-item');
        removeBtn.disabled = itemRows.length === 1;
    });
}

// Calculer le total
function updateTotal() {
    const itemRows = document.querySelectorAll('.item-row');
    let totalHT = 0;
    
    itemRows.forEach(row => {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        totalHT += quantity * price;
    });
    
    const totalTVA = totalHT * 0.20;
    const totalTTC = totalHT + totalTVA;
    
    document.getElementById('totalHT').textContent = totalHT.toFixed(2) + ' €';
    document.getElementById('totalTVA').textContent = totalTVA.toFixed(2) + ' €';
    document.getElementById('totalTTC').textContent = totalTTC.toFixed(2) + ' €';
}

// Valider le formulaire
function validateDevisForm() {
    const itemRows = document.querySelectorAll('.item-row');
    
    if (itemRows.length === 0) {
        alert('Veuillez ajouter au moins un article');
        return false;
    }
    
    for (let row of itemRows) {
        const description = row.querySelector('.item-description').value;
        if (!description) {
            alert('Veuillez remplir toutes les descriptions d\'articles');
            return false;
        }
    }
    
    if (!document.getElementById('devisDate').value) {
        alert('Veuillez sélectionner une date');
        return false;
    }
    
    return true;
}

// Afficher le récapitulatif
function displayRecap() {
    // Client
    const displayName = selectedClient.type === 'particulier' 
        ? `${selectedClient.firstName} ${selectedClient.lastName}`
        : selectedClient.companyName;
    
    document.getElementById('recapClient').innerHTML = `
        <strong>${displayName}</strong><br>
        Email: ${selectedClient.email}<br>
        ${selectedClient.phone ? `Téléphone: ${selectedClient.phone}<br>` : ''}
        Adresse: ${selectedClient.address}
    `;
    
    // Articles
    const itemRows = document.querySelectorAll('.item-row');
    let itemsHTML = '<table style="width: 100%; border-collapse: collapse;">';
    itemsHTML += '<tr style="border-bottom: 1px solid #ddd;"><th style="text-align: left; padding: 8px;">Article</th><th style="text-align: right; padding: 8px;">Qté</th><th style="text-align: right; padding: 8px;">P.U.</th><th style="text-align: right; padding: 8px;">Total</th></tr>';
    
    itemRows.forEach(row => {
        const description = row.querySelector('.item-description').value;
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = quantity * price;
        
        itemsHTML += `<tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">${description}</td><td style="text-align: right; padding: 8px;">${quantity}</td><td style="text-align: right; padding: 8px;">${price.toFixed(2)} €</td><td style="text-align: right; padding: 8px;">${total.toFixed(2)} €</td></tr>`;
    });
    
    itemsHTML += '</table>';
    document.getElementById('recapItems').innerHTML = itemsHTML;
    
    // Totaux
    const totalHT = document.getElementById('totalHT').textContent;
    const totalTVA = document.getElementById('totalTVA').textContent;
    const totalTTC = document.getElementById('totalTTC').textContent;
    
    document.getElementById('recapTotals').innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Total HT:</span><span>${totalHT}</span></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>TVA (20%):</span><span>${totalTVA}</span></div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; color: #667eea; padding-top: 10px; border-top: 2px solid #ddd;"><span>Total TTC:</span><span>${totalTTC}</span></div>
    `;
}

// Sauvegarder le devis
document.getElementById('saveDevisBtn').addEventListener('click', async () => {
    await saveDevis();
});

// Générer le PDF
document.getElementById('generatePdfBtn').addEventListener('click', async () => {
    await saveDevis();
    generatePDF();
});

// Sauvegarder le devis dans Firebase
async function saveDevis() {
    const devisData = getDevisData();
    
    try {
        await addDoc(collection(db, 'devis'), devisData);
        alert('Devis sauvegardé avec succès!');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        alert('Erreur lors de la sauvegarde du devis');
    }
}

// Récupérer les données du devis
function getDevisData() {
    const itemRows = document.querySelectorAll('.item-row');
    const items = [];
    let totalHT = 0;
    
    itemRows.forEach(row => {
        const description = row.querySelector('.item-description').value;
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = quantity * price;
        
        items.push({ description, quantity, price, total });
        totalHT += total;
    });
    
    const totalTVA = totalHT * 0.20;
    const totalTTC = totalHT + totalTVA;
    
    const displayName = selectedClient.type === 'particulier' 
        ? `${selectedClient.firstName} ${selectedClient.lastName}`
        : selectedClient.companyName;
    
    return {
        userId: currentUser.uid,
        clientId: selectedClient.id,
        clientName: displayName,
        clientEmail: selectedClient.email,
        clientPhone: selectedClient.phone || '',
        clientAddress: selectedClient.address,
        clientType: selectedClient.type,
        devisDate: document.getElementById('devisDate').value,
        validityDate: document.getElementById('validityDate').value,
        notes: document.getElementById('notes').value,
        items,
        totalHT,
        totalTVA,
        totalTTC,
        createdAt: new Date().toISOString()
    };
}

// Générer le PDF (utilise jsPDF)
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = getDevisData();
    
    // En-tête
    doc.setFontSize(24);
    doc.setTextColor(102, 126, 234);
    doc.text('DEVIS', 105, 20, { align: 'center' });
    
    // Client
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Client:', 120, 40);
    doc.text(data.clientName, 120, 45);
    doc.text(data.clientAddress, 120, 50);
    if (data.clientEmail) doc.text(data.clientEmail, 120, 55);
    if (data.clientPhone) doc.text('Tél: ' + data.clientPhone, 120, 60);
    
    // Date
    doc.text('Date: ' + data.devisDate, 20, 70);
    if (data.validityDate) doc.text('Valide jusqu\'au: ' + data.validityDate, 20, 75);
    
    // Tableau des articles
    let y = 90;
    doc.setFontSize(12);
    doc.setFillColor(102, 126, 234);
    doc.setTextColor(255, 255, 255);
    doc.rect(20, y, 170, 8, 'F');
    doc.text('Description', 25, y + 6);
    doc.text('Qté', 120, y + 6);
    doc.text('P.U.', 140, y + 6);
    doc.text('Total', 165, y + 6);
    
    y += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    data.items.forEach(item => {
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
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
    doc.text('TVA (20%):', 140, y);
    doc.text(data.totalTVA.toFixed(2) + ' €', 185, y, { align: 'right' });
    y += 7;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Total TTC:', 140, y);
    doc.text(data.totalTTC.toFixed(2) + ' €', 185, y, { align: 'right' });
    
    // Notes
    if (data.notes) {
        y += 15;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text('Notes:', 20, y);
        y += 5;
        const splitNotes = doc.splitTextToSize(data.notes, 170);
        doc.text(splitNotes, 20, y);
    }
    
    // Télécharger
    const fileName = `Devis_${data.clientName.replace(/\s/g, '_')}_${data.devisDate}.pdf`;
    doc.save(fileName);
}
