// script/utils.js

// --- DOM Element References (for utilities that need them) ---
const toastContainer = document.createElement('div');
document.addEventListener('DOMContentLoaded', () => {
    toastContainer.classList.add('toast-container');
    document.body.appendChild(toastContainer);
});


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
document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(lightbox);
});

const closeLightboxBtn = lightbox.querySelector('.close-lightbox');
const lightboxImage = lightbox.querySelector('#lightboxImage');

// --- Utility Functions ---

/**
 * Validates if a string is a well-formed URL.
 * @param {string} string - The string to validate.
 * @returns {boolean} - True if the string is a valid URL, false otherwise.
 */
export function isValidURL(string) {
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
export function getOrientationClass(imgUrl, callback) {
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
export function showToast(message, type = 'info') {
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
 * Opens the lightbox with the specified image URL.
 * @param {string} imageUrl - The URL of the image to display in the lightbox.
 */
export function openLightbox(imageUrl) {
    lightboxImage.src = imageUrl;
    lightbox.classList.remove('hidden');
    // Optional: Add a class to body to prevent scrolling
    document.body.style.overflow = 'hidden';
}

/**
 * Closes the lightbox.
 */
export function closeLightbox() {
    lightbox.classList.add('hidden');
    lightboxImage.src = ''; // Clear image source
    document.body.style.overflow = ''; // Restore body scrolling
}

// --- Lightbox Event Listeners ---
// These are added here as the lightbox elements are created in this file
document.addEventListener('DOMContentLoaded', () => {
    if (closeLightboxBtn) { // Ensure button exists before attaching listener
        closeLightboxBtn.addEventListener('click', closeLightbox);
    }
    if (lightbox) { // Ensure lightbox exists before attaching listener
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) { // Close only if clicking on the overlay, not the image
                closeLightbox();
            }
        });
    }
});
