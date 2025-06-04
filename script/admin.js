import { db } from './db.js';
import { isValidURL, showToast, getOrientationClass, openLightbox } from './utils.js';

// --- DOM Element References ---
const cardForm = document.getElementById('cardForm');
const cardIdInput = document.getElementById('cardId');
const imageURLInput = document.getElementById('imageURL');
const nameOfPaintingInput = document.getElementById('nameOfPainting');
const painterInput = document.getElementById('painter');
const locationInput = document.getElementById('location');
const saveCardBtn = document.getElementById('saveCardBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const cardListDiv = document.getElementById('cardList');
const noCardsMessage = document.getElementById('noCardsMessage');
const totalCardsCountSpan = document.getElementById('totalCardsCount');

const cardSearchInput = document.getElementById('cardSearchInput');
const paginationControls = document.getElementById('paginationControls');

// Image Preview Elements
const previewImage = document.getElementById('previewImage');
const noImagePreview = document.getElementById('noImagePreview');

// NEW: Export/Import Controls (Dynamically added for cleaner HTML)
const exportDataBtn = document.createElement('button');
exportDataBtn.id = 'exportDataBtn';
exportDataBtn.textContent = 'Export Data';
exportDataBtn.style.cssText = 'background-color: #17a2b8; margin-left: 10px;';
exportDataBtn.classList.add('admin-utility-btn');
const importDataInput = document.createElement('input');
importDataInput.type = 'file';
importDataInput.id = 'importDataInput';
importDataInput.accept = '.json';
importDataInput.style.display = 'none';
const importDataLabel = document.createElement('label');
importDataLabel.htmlFor = 'importDataInput';
importDataLabel.textContent = 'Import Data';
importDataLabel.style.cssText = 'background-color: #ffc107; color: #333; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 1em; transition: background-color 0.3s ease; margin-left: 10px; display: inline-block;';
importDataLabel.classList.add('admin-utility-btn');

const adminSectionDiv = document.getElementById('adminSection');
document.addEventListener('DOMContentLoaded', () => {
    if (adminSectionDiv) {
        const utilityDiv = document.createElement('div');
        utilityDiv.style.marginTop = '20px';
        utilityDiv.style.display = 'flex';
        utilityDiv.style.justifyContent = 'flex-end';
        utilityDiv.appendChild(exportDataBtn);
        utilityDiv.appendChild(importDataInput);
        utilityDiv.appendChild(importDataLabel);
        adminSectionDiv.appendChild(utilityDiv);
    }
});


// --- Data Storage and State ---
let currentEditCardId = null;

// Pagination State
const cardsPerPage = 10;
let currentPage = 1;

// --- Utility Functions for Admin Section ---

/**
 * Updates the image preview in the form.
 * @param {string} url - The URL of the image to preview.
 */
function updateImagePreview(url) {
    if (isValidURL(url)) {
        previewImage.src = url;
        previewImage.classList.remove('hidden');
        noImagePreview.classList.add('hidden'); // Hide the "No image URL provided" text
    } else {
        previewImage.src = '';
        previewImage.classList.add('hidden');
        noImagePreview.classList.remove('hidden'); // Show the "No image URL provided" text
    }
}

// --- Admin Section Functions ---

/**
 * Renders the list of all memory cards in the admin section,
 * applying search filters and pagination.
 */
export async function renderCardList() {
    cardListDiv.innerHTML = ''; // Clear existing list items

    const searchQuery = cardSearchInput.value.toLowerCase().trim();
    let allCards = await db.cards.toArray(); // Fetch all cards for filtering

    const filteredCards = allCards.filter((card) => {
        if (searchQuery === '') {
            return true;
        }
        const paintingName = card.textSide.name.toLowerCase();
        const painter = card.textSide.painter.toLowerCase();
        const location = card.textSide.location.toLowerCase();
        return (
            paintingName.includes(searchQuery) ||
            painter.includes(searchQuery) ||
            location.includes(searchQuery)
        );
    });

    totalCardsCountSpan.textContent = `Total cards: ${filteredCards.length}`;

    if (filteredCards.length === 0) {
        noCardsMessage.textContent =
            searchQuery === ''
                ? 'No cards added yet. Start by creating some!'
                : 'No matching cards found. Try a different search!';
        noCardsMessage.classList.remove('hidden');
        paginationControls.classList.add('hidden');
        return;
    }
    noCardsMessage.classList.add('hidden');

    const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
    currentPage = Math.min(currentPage, totalPages);

    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    const cardsToDisplay = filteredCards.slice(startIndex, endIndex);

    cardsToDisplay.forEach((card) => {
        const cardItem = document.createElement('div');
        cardItem.classList.add('card-item');
        cardItem.setAttribute('data-id', card.id);

        cardItem.innerHTML = `
            <div class="card-info">
                <img src="${card.imageSide}" alt="${card.textSide.name}">
                <span>
                    <strong>${card.textSide.name}</strong><br>
                    by ${card.textSide.painter}<br>
                    <i>${card.textSide.location}</i>
                </span>
            </div>
            <div class="card-actions">
                <button class="edit-btn" title="Edit Card"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" title="Delete Card"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        cardListDiv.appendChild(cardItem);
    });

    renderPaginationControls(totalPages);
}

/**
 * Renders the pagination buttons.
 * @param {number} totalPages - The total number of pages.
 */
function renderPaginationControls(totalPages) {
    paginationControls.innerHTML = '';

    if (totalPages <= 1) {
        paginationControls.classList.add('hidden');
        return;
    }

    paginationControls.classList.remove('hidden');

    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderCardList();
        }
    });
    paginationControls.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.classList.toggle('active', i === currentPage);
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            renderCardList();
        });
        paginationControls.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderCardList();
        }
    });
    paginationControls.appendChild(nextBtn);
}

/**
 * Handles the form submission for adding or updating a memory card.
 * @param {Event} event - The form submit event.
 */
async function addOrUpdateCard(event) {
    event.preventDefault();

    const imageURL = imageURLInput.value.trim();
    const nameOfPainting = nameOfPaintingInput.value.trim();
    const painter = painterInput.value.trim();
    const location = locationInput.value.trim();

    if (!imageURL || !nameOfPainting || !painter || !location) {
        showToast('Please fill in all fields.', 'warning');
        return;
    }

    if (!isValidURL(imageURL)) {
        showToast('Please enter a valid image URL.', 'warning');
        return;
    }

    const cardData = {
        imageSide: imageURL,
        textSide: {
            name: nameOfPainting,
            painter: painter,
            location: location,
        },
    };

    if (currentEditCardId !== null) {
        try {
            await db.cards.update(currentEditCardId, cardData);
            console.log('Card updated:', currentEditCardId);
            showToast('Card updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating card:', error);
            showToast('Failed to update card. Please try again.', 'error');
            return;
        }
        saveCardBtn.textContent = 'Add Card';
        cancelEditBtn.classList.add('hidden');
        currentEditCardId = null;
    } else {
        try {
            await db.cards.add(cardData);
            console.log('Card added.');
            showToast('Card added successfully!', 'success');
        } catch (error) {
            console.error('Error adding card:', error);
            showToast('Failed to add card. Please try again.', 'error');
            return;
        }
        currentPage = 1;
    }

    await renderCardList();
    cardForm.reset();
    updateImagePreview('');
}

/**
 * Populates the form with data of the card to be edited.
 * @param {number} id - The ID of the card to edit.
 */
async function editCard(id) {
    const cardToEdit = await db.cards.get(id);
    if (cardToEdit) {
        currentEditCardId = id;
        imageURLInput.value = cardToEdit.imageSide;
        nameOfPaintingInput.value = cardToEdit.textSide.name;
        painterInput.value = cardToEdit.textSide.painter;
        locationInput.value = cardToEdit.textSide.location;

        saveCardBtn.textContent = 'Update Card';
        cancelEditBtn.classList.remove('hidden');
        showToast('Editing card. Modify fields and click "Update Card".', 'info');
        updateImagePreview(cardToEdit.imageSide);

        cardForm.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } else {
        console.error('Card not found for editing:', id);
        showToast('Card not found for editing.', 'error');
    }
}

/**
 * Deletes a memory card after user confirmation.
 * @param {number} id - The ID of the card to delete.
 */
async function deleteCard(id) {
    if (confirm('Are you sure you want to delete this card?')) {
        try {
            await db.cards.delete(id);
            console.log('Card deleted:', id);
            showToast('Card deleted successfully!', 'success');

            const totalCardsAfterDeletion = await db.cards.count();
            const totalPagesAfterDeletion = Math.ceil(
                totalCardsAfterDeletion / cardsPerPage
            );
            if (currentPage > totalPagesAfterDeletion && totalPagesAfterDeletion > 0) {
                currentPage = totalPagesAfterDeletion;
            } else if (totalPagesAfterDeletion === 0) {
                currentPage = 1;
            }
            await renderCardList();
        } catch (error) {
            console.error('Error deleting card:', error);
            showToast('Failed to delete card. Please try again.', 'error');
        }
    } else {
        showToast('Card deletion cancelled.', 'info');
    }
}

/**
 * Resets the card creation/edit form and hides the cancel button.
 */
export function cancelEdit() {
    cardForm.reset();
    currentEditCardId = null;
    saveCardBtn.textContent = 'Add Card';
    cancelEditBtn.classList.add('hidden');
    showToast('Card editing cancelled.', 'info');
    updateImagePreview('');
}

// --- NEW: Export/Import Functions ---

/**
 * Exports all data from the Dexie.js database to a JSON file.
 */
async function exportData() {
    try {
        const allCards = await db.cards.toArray();
        const dataStr = JSON.stringify(allCards, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'memory_cards_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showToast('Failed to export data. Please try again.', 'error');
    }
}

/**
 * Imports data from a selected JSON file into the Dexie.js database.
 * Warns the user about overwriting existing data.
 */
async function importData(event) {
    const file = event.target.files[0];
    if (!file) {
        showToast('No file selected for import.', 'info');
        return;
    }

    if (!confirm('Importing data will replace all existing memory cards. Are you sure you want to continue?')) {
        event.target.value = '';
        showToast('Data import cancelled.', 'info');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importedCards = JSON.parse(e.target.result);

            if (!Array.isArray(importedCards)) {
                showToast('Invalid JSON format. Expected an array of card objects.', 'error');
                return;
            }

            const isValidImport = importedCards.every(card =>
                typeof card.imageSide === 'string' &&
                typeof card.textSide === 'object' &&
                typeof card.textSide.name === 'string' &&
                typeof card.textSide.painter === 'string' &&
                typeof card.textSide.location === 'string'
            );

            if (!isValidImport) {
                showToast('Invalid card data structure in the JSON file. Please ensure it matches the expected format.', 'error');
                return;
            }

            await db.cards.clear();
            const cardsWithoutIds = importedCards.map(card => {
                const { id, ...rest } = card;
                return rest;
            });
            await db.cards.bulkAdd(cardsWithoutIds);
            showToast('Data imported successfully!', 'success');
            currentPage = 1;
            await renderCardList();
            event.target.value = '';
        } catch (error) {
            console.error('Error importing data:', error);
            showToast('Failed to import data. Please ensure the file is a valid JSON and formatted correctly.', 'error');
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

// --- Event Listeners for Admin Section ---
document.addEventListener('DOMContentLoaded', () => {
    cardForm.addEventListener('submit', addOrUpdateCard);
    cancelEditBtn.addEventListener('click', cancelEdit);

    cardListDiv.addEventListener('click', async (event) => {
        const target = event.target;
        const cardItem = target.closest('.card-item');

        if (!cardItem) return;

        const cardId = parseInt(cardItem.getAttribute('data-id'), 10);

        if (target.closest('.edit-btn')) {
            await editCard(cardId);
        } else if (target.closest('.delete-btn')) {
            await deleteCard(cardId);
        }
    });

    cardSearchInput.addEventListener('input', async () => {
        currentPage = 1;
        await renderCardList();
    });

    imageURLInput.addEventListener('input', (event) => {
        updateImagePreview(event.target.value);
    });

    exportDataBtn.addEventListener('click', exportData);
    importDataInput.addEventListener('change', importData);
});
