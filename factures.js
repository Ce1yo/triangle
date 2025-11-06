import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc,
    query,
    where,
    orderBy 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;

// Vérifier l'authentification
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        currentUser = user;
        loadSavedFactures();
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

// Gestion des articles
const itemsContainer = document.getElementById('itemsContainer');
const addItemBtn = document.getElementById('addItemBtn');

addItemBtn.addEventListener('click', () => {
    addItemRow();
});

function addItemRow() {
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
    
    // Ajouter les événements pour calculer le total
    const inputs = itemRow.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', updateTotal);
    });
    
    updateRemoveButtons();
}

function updateRemoveButtons() {
    const itemRows = itemsContainer.querySelectorAll('.item-row');
    itemRows.forEach((row, index) => {
        const removeBtn = row.querySelector('.btn-remove-item');
        removeBtn.disabled = itemRows.length === 1;
    });
}

// Calcul du total
function updateTotal() {
    const itemRows = itemsContainer.querySelectorAll('.item-row');
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

// Ajouter les événements de calcul sur les champs initiaux
document.querySelectorAll('.item-quantity, .item-price').forEach(input => {
    input.addEventListener('input', updateTotal);
});

// Définir la date du jour par défaut
document.getElementById('factureDate').valueAsDate = new Date();

// Générer PDF
const factureForm = document.getElementById('factureForm');
factureForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    generatePDF();
});

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Récupérer les données du formulaire
    const data = getFormData();
    
    // En-tête
    doc.setFontSize(24);
    doc.setTextColor(102, 126, 234);
    doc.text('FACTURE', 105, 20, { align: 'center' });
    
    // Numéro de facture
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('N° ' + data.factureNumber, 105, 30, { align: 'center' });
    
    // Informations entreprise
    doc.setFontSize(10);
    doc.text(data.companyName, 20, 45);
    if (data.companyAddress) doc.text(data.companyAddress, 20, 50);
    if (data.companySiret) doc.text('SIRET: ' + data.companySiret, 20, 55);
    if (data.companyPhone) doc.text('Tél: ' + data.companyPhone, 20, 60);
    
    // Informations client
    doc.text('Client:', 120, 45);
    doc.text(data.clientName, 120, 50);
    if (data.clientAddress) doc.text(data.clientAddress, 120, 55);
    if (data.clientEmail) doc.text(data.clientEmail, 120, 60);
    if (data.clientPhone) doc.text('Tél: ' + data.clientPhone, 120, 65);
    
    // Dates et conditions
    doc.text('Date de facture: ' + data.factureDate, 20, 75);
    if (data.dueDate) doc.text('Date d\'échéance: ' + data.dueDate, 20, 80);
    if (data.paymentMethod) doc.text('Moyen de paiement: ' + data.paymentMethod, 20, 85);
    
    // Tableau des articles
    let y = 100;
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
    
    // Mentions légales
    y += 20;
    if (y > 260) {
        doc.addPage();
        y = 20;
    }
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('En cas de retard de paiement, une pénalité de 3 fois le taux d\'intérêt légal sera exigible.', 105, y, { align: 'center' });
    
    // Télécharger le PDF
    const fileName = `Facture_${data.factureNumber.replace(/\s/g, '_')}_${data.clientName.replace(/\s/g, '_')}.pdf`;
    doc.save(fileName);
}

// Sauvegarder la facture
document.getElementById('saveFactureBtn').addEventListener('click', async () => {
    const data = getFormData();
    
    try {
        await addDoc(collection(db, 'factures'), {
            ...data,
            userId: currentUser.uid,
            createdAt: new Date().toISOString()
        });
        
        alert('Facture sauvegardée avec succès!');
        loadSavedFactures();
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        alert('Erreur lors de la sauvegarde de la facture');
    }
});

// Récupérer les données du formulaire
function getFormData() {
    const itemRows = itemsContainer.querySelectorAll('.item-row');
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
    
    return {
        clientName: document.getElementById('clientName').value,
        clientEmail: document.getElementById('clientEmail').value,
        clientPhone: document.getElementById('clientPhone').value,
        clientAddress: document.getElementById('clientAddress').value,
        companyName: document.getElementById('companyName').value,
        companyAddress: document.getElementById('companyAddress').value,
        companySiret: document.getElementById('companySiret').value,
        companyPhone: document.getElementById('companyPhone').value,
        factureNumber: document.getElementById('factureNumber').value,
        factureDate: document.getElementById('factureDate').value,
        dueDate: document.getElementById('dueDate').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        notes: document.getElementById('notes').value,
        items,
        totalHT,
        totalTVA,
        totalTTC
    };
}

// Charger les factures sauvegardées
async function loadSavedFactures() {
    if (!currentUser) return;
    
    try {
        const q = query(
            collection(db, 'factures'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const facturesList = document.getElementById('facturesList');
        
        if (querySnapshot.empty) {
            facturesList.innerHTML = '<p class="empty-message">Aucune facture sauvegardée</p>';
            return;
        }
        
        facturesList.innerHTML = '';
        
        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const factureItem = createSavedItem(docSnapshot.id, data);
            facturesList.appendChild(factureItem);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des factures:', error);
    }
}

// Créer un élément de facture sauvegardée
function createSavedItem(id, data) {
    const div = document.createElement('div');
    div.className = 'saved-item';
    
    const date = new Date(data.createdAt).toLocaleDateString('fr-FR');
    
    div.innerHTML = `
        <h4>${data.factureNumber}</h4>
        <p>${data.clientName}</p>
        <p>Montant: ${data.totalTTC.toFixed(2)} €</p>
        <p class="item-date">${date}</p>
        <div class="item-actions">
            <button class="btn-load">Charger</button>
            <button class="btn-delete">Supprimer</button>
        </div>
    `;
    
    div.querySelector('.btn-load').addEventListener('click', () => loadFactureData(data));
    div.querySelector('.btn-delete').addEventListener('click', () => deleteFacture(id));
    
    return div;
}

// Charger les données d'une facture
function loadFactureData(data) {
    document.getElementById('clientName').value = data.clientName || '';
    document.getElementById('clientEmail').value = data.clientEmail || '';
    document.getElementById('clientPhone').value = data.clientPhone || '';
    document.getElementById('clientAddress').value = data.clientAddress || '';
    document.getElementById('companyName').value = data.companyName || '';
    document.getElementById('companyAddress').value = data.companyAddress || '';
    document.getElementById('companySiret').value = data.companySiret || '';
    document.getElementById('companyPhone').value = data.companyPhone || '';
    document.getElementById('factureNumber').value = data.factureNumber || '';
    document.getElementById('factureDate').value = data.factureDate || '';
    document.getElementById('dueDate').value = data.dueDate || '';
    document.getElementById('paymentMethod').value = data.paymentMethod || '';
    document.getElementById('notes').value = data.notes || '';
    
    // Charger les articles
    itemsContainer.innerHTML = '';
    data.items.forEach((item, index) => {
        if (index > 0) addItemRow();
        const itemRow = itemsContainer.children[index];
        itemRow.querySelector('.item-description').value = item.description;
        itemRow.querySelector('.item-quantity').value = item.quantity;
        itemRow.querySelector('.item-price').value = item.price;
    });
    
    updateTotal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Supprimer une facture
async function deleteFacture(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;
    
    try {
        await deleteDoc(doc(db, 'factures', id));
        loadSavedFactures();
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la facture');
    }
}
