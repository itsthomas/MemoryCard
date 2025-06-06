document.addEventListener('DOMContentLoaded', async () => {
  // --- DOM Element References ---
  const adminBtn = document.getElementById('adminBtn');
  const playBtn = document.getElementById('playBtn');

  const adminSection = document.getElementById('adminSection');
  const playSection = document.getElementById('playSection');

  const cardForm = document.getElementById('cardForm');
  const cardIdInput = document.getElementById('cardId'); // This will now hold the Dexie auto-incremented ID
  const imageURLInput = document.getElementById('imageURL');
  const nameOfPaintingInput = document.getElementById('nameOfPainting');
  const painterInput = document.getElementById('painter');
  const locationInput = document.getElementById('location');
  const saveCardBtn = document.getElementById('saveCardBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  const cardListDiv = document.getElementById('cardList');
  const noCardsMessage = document.getElementById('noCardsMessage');
  const totalCardsCountSpan = document.getElementById('totalCardsCount');

  const memoryCardsGrid = document.getElementById('memoryCardsGrid');
  const playErrorMessage = document.getElementById('playErrorMessage');

  // Search Input Reference
  const cardSearchInput = document.getElementById('cardSearchInput');
  // New: References for search and clear icons
  const searchIcon = document.getElementById('searchIcon');
  const clearSearchIcon = document.getElementById('clearSearchIcon');

  // Pagination Controls
  const paginationControls = document.getElementById('paginationControls');

  // Image Preview Elements
  const previewImage = document.getElementById('previewImage');
  const noImagePreview = document.getElementById('noImagePreview'); // This is the 'No image URL provided' text

  // Export/Import Controls (Dynamically added for cleaner HTML) ---
  const exportDataBtn = document.createElement('button');
  exportDataBtn.id = 'exportDataBtn';
  exportDataBtn.textContent = 'Export Data';
  exportDataBtn.style.cssText = 'background-color: #17a2b8; margin-left: 10px;'; // Add some basic styling
  exportDataBtn.classList.add('admin-utility-btn'); // Add a class for potential styling
  const importDataInput = document.createElement('input');
  importDataInput.type = 'file';
  importDataInput.id = 'importDataInput';
  importDataInput.accept = '.json';
  importDataInput.style.display = 'none'; // Hide the file input
  const importDataLabel = document.createElement('label');
  importDataLabel.htmlFor = 'importDataInput';
  importDataLabel.textContent = 'Import Data';
  importDataLabel.style.cssText = 'background-color: #ffc107; color: #333; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 1em; transition: background-color 0.3s ease; margin-left: 10px; display: inline-block;'; // Mimic button styling
  importDataLabel.classList.add('admin-utility-btn'); // Add a class for potential styling

  const adminSectionDiv = document.getElementById('adminSection');
  if (adminSectionDiv) {
    const utilityDiv = document.createElement('div');
    utilityDiv.style.marginTop = '20px';
    utilityDiv.style.display = 'flex';
    utilityDiv.style.justifyContent = 'flex-end'; // Align to the right
    utilityDiv.appendChild(exportDataBtn);
    utilityDiv.appendChild(importDataInput); // The hidden input
    utilityDiv.appendChild(importDataLabel); // The styled label acting as button
    adminSectionDiv.appendChild(utilityDiv);
  }

  // Toast Container (Dynamically added) ---
  const toastContainer = document.createElement('div');
  toastContainer.classList.add('toast-container');
  document.body.appendChild(toastContainer);

  // --- Lightbox Elements (Dynamically created) ---
  const lightbox = document.createElement('div');
  lightbox.id = 'lightbox';
  lightbox.classList.add('hidden'); // Initially hidden
  lightbox.innerHTML = `
    <div class="lightbox-content">
      <span class="close-lightbox">&times;</span>
      <img src="" alt="Full size image" id="lightboxImage">
    </div>
  `;
  document.body.appendChild(lightbox);

  const closeLightboxBtn = lightbox.querySelector('.close-lightbox');
  const lightboxImage = lightbox.querySelector('#lightboxImage');

  // --- Dexie.js Database Setup ---
  const db = new Dexie('MemoryCardsDB');
  db.version(1).stores({
    cards: '++id, imageSide, textSide.name, textSide.painter, textSide.location',
  });

  // Open the database (this is asynchronous)
  try {
    await db.open();
    console.log('Dexie database opened successfully.');
  } catch (err) {
    console.error('Failed to open Dexie database:', err.stack || err);
    // Potentially show an error message to the user
    // Consider disabling features if the database cannot be opened
    showToast('Error initializing the database. Your data might not be saved.', 'error');
  }

  // --- Data Storage and State ---
  let currentEditCardId = null; // To keep track of the card being edited

  // Pagination State
  const cardsPerPage = 10;
  let currentPage = 1;

  // New: Variable to hold the debounce timer for search input
  let searchTimeout = null;
  const DEBOUNCE_DELAY = 1000; // milliseconds

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

  /**
   * Validates if a string is a well-formed URL.
   * @param {string} string - The string to validate.
   * @returns {boolean} - True if the string is a valid URL, false otherwise.
   */
  function isValidURL(string) {
    try {
      new URL(string);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Determines the orientation of an image (portrait, landscape, or square)
   * by loading it temporarily.
   * @param {string} imgUrl - The URL of the image.
   * @param {function(string): void} callback - A callback function to receive the orientation class.
   */
  function getOrientationClass(imgUrl, callback) {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > img.naturalHeight) {
        callback('landscape');
      } else if (img.naturalHeight > img.naturalWidth) {
        callback('portrait');
      } else {
        callback('square');
      }
    };
    img.onerror = () => {
      console.error(
        'Failed to load image for orientation check, defaulting to square:',
        imgUrl
      );
      callback('square'); // Default to square if image fails to load
    };
    img.src = imgUrl;
  }

  /**
   * Displays a toast notification.
   * @param {string} message - The message to display.
   * @param {'success' | 'error' | 'info' | 'warning'} type - The type of toast (for styling).
   */
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.classList.add('toast', type);

    let iconClass = '';
    switch (type) {
      case 'success':
        iconClass = 'fas fa-check-circle';
        break;
      case 'error':
        iconClass = 'fas fa-times-circle';
        break;
      case 'warning':
        iconClass = 'fas fa-exclamation-triangle';
        break;
      case 'info':
      default:
        iconClass = 'fas fa-info-circle';
        break;
    }

    toast.innerHTML = `<i class="toast-icon ${iconClass}"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);

    // Remove toast after a delay (e.g., 3 seconds)
    setTimeout(() => {
      toast.remove();
    }, 3000); // This duration should match the CSS animation duration for fadeOut + some buffer
  }

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

  // Variables to store current event handlers, allowing them to be removed later
  let currentLightboxOnLoadHandler = null;
  let currentLightboxOnErrorHandler = null;

  /**
   * Opens the lightbox with the specified image URL.
   * @param {string} imageUrl - The URL of the image to display in the lightbox.
   */
  function openLightbox(imageUrl) {
    // 1. Clear any previous max-width style before loading a new image
    lightboxImage.style.maxWidth = '';

    // 2. Remove any previously attached handlers to prevent accumulation
    // This is crucial to prevent the "Failed to load" errors after closing.
    if (currentLightboxOnLoadHandler) {
      lightboxImage.removeEventListener('load', currentLightboxOnLoadHandler);
    }
    if (currentLightboxOnErrorHandler) {
      lightboxImage.removeEventListener('error', currentLightboxOnErrorHandler);
    }

    // 3. Set the image source
    lightboxImage.src = imageUrl;

    // 4. Define and store the new handlers
    currentLightboxOnLoadHandler = () => {
      // Determine orientation and apply style
      if (lightboxImage.naturalHeight > lightboxImage.naturalWidth) {
        lightboxImage.style.maxWidth = '50%';
      } else {
        lightboxImage.style.maxWidth = '90%';
      }
      // Remove this specific onload handler after it fires, it's a one-time event per image load
      lightboxImage.removeEventListener('load', currentLightboxOnLoadHandler);
      currentLightboxOnLoadHandler = null; // Clear reference
    };

    currentLightboxOnErrorHandler = () => {
      console.error('Failed to load image in lightbox:', imageUrl);
      showToast('Failed to load full size image. Please check the URL.', 'error');
      // If image fails, close the lightbox and prevent further errors from this handler
      closeLightbox(); // This will also remove its own handler

      // Remove this specific onerror handler after it fires
      lightboxImage.removeEventListener('error', currentLightboxOnErrorHandler);
      currentLightboxOnErrorHandler = null; // Clear reference
    };

    // 5. Attach the new handlers
    lightboxImage.addEventListener('load', currentLightboxOnLoadHandler);
    lightboxImage.addEventListener('error', currentLightboxOnErrorHandler);


    // 6. Display the lightbox
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent body scrolling
  }

  /**
   * Closes the lightbox.
   */
  function closeLightbox() {
    lightbox.classList.add('hidden');

    // IMPORTANT: Remove event listeners *before* clearing the src.
    // Clearing src triggers onerror if listeners are still attached.
    if (currentLightboxOnLoadHandler) {
      lightboxImage.removeEventListener('load', currentLightboxOnLoadHandler);
      currentLightboxOnLoadHandler = null; // Clear reference
    }
    if (currentLightboxOnErrorHandler) {
      lightboxImage.removeEventListener('error', currentLightboxOnErrorHandler);
      currentLightboxOnErrorHandler = null; // Clear reference
    }

    lightboxImage.src = ''; // Clear image source
    document.body.style.overflow = ''; // Restore body scrolling
  }


  // --- Admin Section Functions ---

  /**
   * Renders the list of all memory cards in the admin section,
   * applying search filters and pagination.
   */
  async function renderCardList() {
    // Clear existing list items
    cardListDiv.innerHTML = '';

    const searchQuery = cardSearchInput.value.toLowerCase().trim();
    let allCards = await db.cards.toArray(); // Fetch all cards for filtering

    const filteredCards = allCards.filter((card) => {
      if (searchQuery === '') {
        return true; // If search box is empty, show all cards
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

    // Update the total card count span based on filtered results
    totalCardsCountSpan.textContent = `Total cards: ${filteredCards.length}`;

    if (filteredCards.length === 0) {
      noCardsMessage.textContent =
        searchQuery === ''
          ? 'No cards added yet. Start by creating some!'
          : 'No matching cards found. Try a different search!';
      noCardsMessage.classList.remove('hidden');
      paginationControls.classList.add('hidden'); // Hide pagination if no cards
      return;
    }
    noCardsMessage.classList.add('hidden'); // Hide "no cards" message

    // Calculate pagination
    const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
    currentPage = Math.min(currentPage, totalPages); // Ensure current page is valid

    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    const cardsToDisplay = filteredCards.slice(startIndex, endIndex);

    cardsToDisplay.forEach((card) => {
      const cardItem = document.createElement('div');
      cardItem.classList.add('card-item');
      cardItem.setAttribute('data-id', card.id); // 'id' will now be numerical

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
    paginationControls.innerHTML = ''; // Clear existing buttons

    if (totalPages <= 1) {
      paginationControls.classList.add('hidden');
      return;
    }

    paginationControls.classList.remove('hidden');

    // Previous button
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

    // Page number buttons
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

    // Next button
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
    event.preventDefault(); // Prevent default form submission

    const imageURL = imageURLInput.value.trim();
    const nameOfPainting = nameOfPaintingInput.value.trim();
    const painter = painterInput.value.trim();
    const location = locationInput.value.trim();

    // Basic input validation
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
      // Logic for editing an existing card
      try {
        await db.cards.update(currentEditCardId, cardData);
        console.log('Card updated:', currentEditCardId);
        showToast('Card updated successfully!', 'success');
      } catch (error) {
        console.error('Error updating card:', error);
        showToast('Failed to update card. Please try again.', 'error');
        return;
      }
      saveCardBtn.textContent = 'Add Card'; // Change button text back
      cancelEditBtn.classList.add('hidden'); // Hide cancel button
      currentEditCardId = null; // Clear edit state
      // currentPage remains unchanged here, keeping the user on the same page
    } else {
      // Logic for adding a new card
      try {
        await db.cards.add(cardData);
        console.log('Card added.');
        showToast('Card added successfully!', 'success');
      } catch (error) {
        console.error('Error adding card:', error);
        showToast('Failed to add card. Please try again.', 'error');
        return;
      }
      currentPage = 1; // Reset to first page for new additions
    }

    await renderCardList(); // Re-render the list, applying any current filter
    cardForm.reset(); // Clear form fields
    updateImagePreview(''); // Clear the preview image
  }

  /**
   * Populates the form with data of the card to be edited.
   * @param {number} id - The ID of the card to edit (number because Dexie auto-increments).
   */
  async function editCard(id) {
    const cardToEdit = await db.cards.get(id);
    if (cardToEdit) {
      currentEditCardId = id; // Set the current edit ID
      imageURLInput.value = cardToEdit.imageSide;
      nameOfPaintingInput.value = cardToEdit.textSide.name;
      painterInput.value = cardToEdit.textSide.painter;
      locationInput.value = cardToEdit.textSide.location;

      saveCardBtn.textContent = 'Update Card'; // Change button text
      cancelEditBtn.classList.remove('hidden'); // Show cancel button
      showToast('Editing card. Modify fields and click "Update Card".', 'info');
      updateImagePreview(cardToEdit.imageSide); // Show preview of the image being edited

      // Scroll to the top of the form
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

        // After deletion, re-evaluate current page to prevent being on an empty page
        const totalCardsAfterDeletion = await db.cards.count();
        const totalPagesAfterDeletion = Math.ceil(
          totalCardsAfterDeletion / cardsPerPage
        );
        if (currentPage > totalPagesAfterDeletion && totalPagesAfterDeletion > 0) {
          currentPage = totalPagesAfterDeletion;
        } else if (totalPagesAfterDeletion === 0) {
          currentPage = 1; // If no cards left, reset to page 1
        }
        await renderCardList(); // Re-render the list, applying any current filter
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
  function cancelEdit() {
    cardForm.reset();
    currentEditCardId = null;
    saveCardBtn.textContent = 'Add Card';
    cancelEditBtn.classList.add('hidden');
    showToast('Card editing cancelled.', 'info');
    updateImagePreview(''); // Clear the preview image
  }

  // --- Play Section Functions ---

  /**
   * Renders a maximum of 10 random memory cards in the play section.
   */
  async function renderPlayCards() {
    memoryCardsGrid.innerHTML = ''; // Clear existing cards
    playErrorMessage.classList.add('hidden'); // Hide any previous error messages

    let allCardsInDB = await db.cards.toArray();

    if (allCardsInDB.length === 0) {
      playErrorMessage.textContent =
        'No cards added yet. Please go to the Admin section to create some!';
      playErrorMessage.classList.remove('hidden');
      showToast('No cards to play. Add some in the Admin section!', 'warning');
      return;
    }

    // Shuffle cards and take up to 10
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

      // Front side of the card (Image)
      const cardFront = document.createElement('div');
      cardFront.classList.add('memory-card-front');
      const img = document.createElement('img');
      img.src = card.imageSide;
      img.alt = 'Memory Card Image';
      cardFront.appendChild(img);

      // Magnifying Glass Icon for Lightbox ---
      const lightboxIcon = document.createElement('button');
      lightboxIcon.classList.add('lightbox-icon');
      lightboxIcon.innerHTML = '<i class="fas fa-search-plus"></i>';
      lightboxIcon.title = 'View full size image';
      lightboxIcon.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card flip when clicking icon
        openLightbox(card.imageSide);
      });
      cardFront.appendChild(lightboxIcon);


      // Back side of the card (Text)
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

      // Determine image orientation and add class for CSS sizing
      getOrientationClass(card.imageSide, (orientationClass) => {
        cardElement.classList.add(orientationClass);
      });

      // Add click listener to flip the card
      cardElement.addEventListener('click', () => {
        cardElement.classList.toggle('flipped');
      });

      memoryCardsGrid.appendChild(cardElement);
    });
  }

  // Export/Import Functions ---

  /**
   * Exports all data from the Dexie.js database to a JSON file.
   */
  async function exportData() {
    try {
      const allCards = await db.cards.toArray();
      const dataStr = JSON.stringify(allCards, null, 2); // Pretty print JSON
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
      event.target.value = ''; // Clear the input so the same file can be selected again
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

        // Validate structure of imported cards (optional but recommended)
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

        // Clear existing data and then bulk add new data
        await db.cards.clear(); // Clear all existing cards
        // Remove 'id' property from imported cards if they have them,
        // to let Dexie assign new auto-incremented IDs during bulkAdd
        const cardsWithoutIds = importedCards.map(card => {
            const { id, ...rest } = card; // Destructure to exclude id
            return rest;
        });
        await db.cards.bulkAdd(cardsWithoutIds);
        showToast('Data imported successfully!', 'success');
        currentPage = 1; // Reset to first page after import
        await renderCardList(); // Re-render the list to show imported data
        event.target.value = ''; // Clear the input
      } catch (error) {
        console.error('Error importing data:', error);
        showToast('Failed to import data. Please ensure the file is a valid JSON and formatted correctly.', 'error');
        event.target.value = ''; // Clear the input
      }
    };
    reader.readAsText(file);
  }


  // --- Event Listeners ---

  // Navigation Buttons
  adminBtn.addEventListener('click', async () => {
    showSection(adminSection);
    cardSearchInput.value = ''; // Clear search on section change
    currentPage = 1; // Reset to first page when entering admin
    await renderCardList(); // Ensure data is loaded
    cancelEdit(); // Reset form when entering admin section
    // Ensure search icon is visible and clear icon is hidden when navigating to admin
    searchIcon.classList.remove('hidden');
    clearSearchIcon.classList.add('hidden');
  });

  playBtn.addEventListener('click', async () => {
    showSection(playSection);
    await renderPlayCards(); // Ensure data is loaded
  });

  // Admin Form Actions
  cardForm.addEventListener('submit', addOrUpdateCard);
  cancelEditBtn.addEventListener('click', cancelEdit);

  // Event delegation for Edit and Delete buttons in the card list
  cardListDiv.addEventListener('click', async (event) => {
    const target = event.target;
    const cardItem = target.closest('.card-item');

    if (!cardItem) return;

    // Dexie's auto-incremented IDs are numbers, so parse it
    const cardId = parseInt(cardItem.getAttribute('data-id'), 10);

    if (target.closest('.edit-btn')) {
      await editCard(cardId);
    } else if (target.closest('.delete-btn')) {
      await deleteCard(cardId);
    }
  });

  // Search input event listener with debouncing
  cardSearchInput.addEventListener('input', () => {
    // New: Clear the previous timeout if the user types again quickly
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Toggle icon visibility immediately (no need to debounce this part)
    if (cardSearchInput.value.trim().length > 0) {
      searchIcon.classList.add('hidden');
      clearSearchIcon.classList.remove('hidden');
    } else {
      searchIcon.classList.remove('hidden');
      clearSearchIcon.classList.add('hidden');
    }

    // New: Set a new timeout to call renderCardList after a delay
    searchTimeout = setTimeout(async () => {
      currentPage = 1; // Reset to first page on new search
      await renderCardList();
    }, DEBOUNCE_DELAY); // Wait for DEBOUNCE_DELAY milliseconds after typing stops
  });


  // Event listener for the clear search icon
  clearSearchIcon.addEventListener('click', async () => {
    // New: Clear any pending search timeout when clearing manually
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    cardSearchInput.value = ''; // Clear the input
    searchIcon.classList.remove('hidden'); // Show search icon
    clearSearchIcon.classList.add('hidden'); // Hide clear icon
    currentPage = 1; // Reset to first page after clearing search
    await renderCardList(); // Re-render the list with all cards
  });


  // Image URL input listener for preview
  imageURLInput.addEventListener('input', (event) => {
    updateImagePreview(event.target.value);
  });

  // Export/Import Event Listeners ---
  exportDataBtn.addEventListener('click', exportData);
  importDataInput.addEventListener('change', importData);

  // Lightbox Event Listeners ---
  closeLightboxBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) { // Close only if clicking on the overlay, not the image
      closeLightbox();
    }
  });


  // --- Initial Load ---
  // Default view should be the Admin section when the page loads
  showSection(adminSection);

  // Initial render of the card list, now asynchronous
  await renderCardList();
});
