import { db } from './db.js';
import { showToast, getOrientationClass, openLightbox } from './utils.js';

// --- DOM Element References ---
const memoryCardsGrid = document.getElementById('memoryCardsGrid');
const playErrorMessage = document.getElementById('playErrorMessage');

// --- Play Section Functions ---

/**
 * Renders a maximum of 10 random memory cards in the play section.
 */
export async function renderPlayCards() {
    memoryCardsGrid.innerHTML = '';
    playErrorMessage.classList.add('hidden');

    let allCardsInDB = await db.cards.toArray();

    if (allCardsInDB.length === 0) {
        playErrorMessage.textContent =
            'No cards added yet. Please go to the Admin section to create some!';
        playErrorMessage.classList.remove('hidden');
        showToast('No cards to play. Add some in the Admin section!', 'warning');
        return;
    }

    const shuffledCards = [...allCardsInDB].sort(() => 0.5 - Math.random());
    const cardsToDisplay = shuffledCards.slice(0, 10);

    if (cardsToDisplay.length === 0) {
        playErrorMessage.textContent = 'Something went wrong. No cards selected for display.';
        playErrorMessage.classList.remove('hidden');
        showToast('Error: No cards selected for play.', 'error');
        return;
    } else if (cardsToDisplay.length < 10 && cardsToDisplay.length > 0) {
        playErrorMessage.textContent = `Displaying ${cardsToDisplay.length} cards. Add more cards in Admin to get a full set of 10.`;
        playErrorMessage.classList.remove('hidden');
        showToast(`Displaying ${cardsToDisplay.length} cards.`, 'info');
    }

    cardsToDisplay.forEach((card) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('memory-card');
        cardElement.setAttribute('data-id', card.id);

        const cardInner = document.createElement('div');
        cardInner.classList.add('memory-card-inner');

        const cardFront = document.createElement('div');
        cardFront.classList.add('memory-card-front');
        const img = document.createElement('img');
        img.src = card.imageSide;
        img.alt = 'Memory Card Image';
        cardFront.appendChild(img);

        const lightboxIcon = document.createElement('button');
        lightboxIcon.classList.add('lightbox-icon');
        lightboxIcon.innerHTML = '<i class="fas fa-search-plus"></i>';
        lightboxIcon.title = 'View full size image';
        lightboxIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            openLightbox(card.imageSide);
        });
        cardFront.appendChild(lightboxIcon);

        const cardBack = document.createElement('div');
        cardBack.classList.add('memory-card-back');
        cardBack.innerHTML = `
            <p class="painting-name">${card.textSide.name}</p>
            <p class="painter-name">${card.textSide.painter}</p>
            <hr> <p class="location-name">${card.textSide.location}</p>
        `;

        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        cardElement.appendChild(cardInner);

        getOrientationClass(card.imageSide, (orientationClass) => {
            cardElement.classList.add(orientationClass);
        });

        cardElement.addEventListener('click', () => {
            cardElement.classList.toggle('flipped');
        });

        memoryCardsGrid.appendChild(cardElement);
    });
}
