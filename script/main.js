// script/main.js

import { openDatabase } from './db.js';
import { renderCardList, cancelEdit } from './admin.js';
import { renderPlayCards } from './play.js';

// --- DOM Element References ---
const adminBtn = document.getElementById('adminBtn');
const playBtn = document.getElementById('playBtn');

const adminSection = document.getElementById('adminSection');
const playSection = document.getElementById('playSection');


// --- Utility Functions ---

/**
 * Shows a specific section and hides others.
 * @param {HTMLElement} sectionToShow - The section to display.
 */
function showSection(sectionToShow) {
    adminSection.classList.add('hidden');
    playSection.classList.add('hidden');
    sectionToShow.classList.remove('hidden');
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', async () => {
    // Open the database first
    await openDatabase();

    // Navigation Buttons
    adminBtn.addEventListener('click', async () => {
        showSection(adminSection);
        // We moved cardSearchInput.value and currentPage reset into admin.js's DOMContentLoaded for cleaner separation
        // But for initial state when switching, we still need to trigger a re-render
        // The renderCardList function in admin.js now handles resetting pagination and clearing search on its own when called
        await renderCardList(); // Ensure data is loaded and displayed correctly
        cancelEdit(); // Reset form when entering admin section
    });

    playBtn.addEventListener('click', async () => {
        showSection(playSection);
        await renderPlayCards(); // Ensure data is loaded
    });

    // --- Initial Load ---
    // Default view should be the Admin section when the page loads
    showSection(adminSection);

    // Initial render of the card list, now asynchronous
    await renderCardList();
});
