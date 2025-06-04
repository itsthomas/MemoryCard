import { showToast } from './utils.js'; // Import toast for error handling

const db = new Dexie('MemoryCardsDB');

db.version(1).stores({
    cards: '++id, imageSide, textSide.name, textSide.painter, textSide.location',
});

// Open the database (this is asynchronous)
export async function openDatabase() {
    try {
        await db.open();
        console.log('Dexie database opened successfully.');
    } catch (err) {
        console.error('Failed to open Dexie database:', err.stack || err);
        showToast('Error initializing the database. Your data might not be saved.', 'error');
        // Consider disabling features if the database cannot be opened
    }
}

// Export the db instance directly for other modules to use
export { db };
