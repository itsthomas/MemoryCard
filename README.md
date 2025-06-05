# Memory Card Game App

A simple yet interactive web-based memory card game, featuring an administrative panel for managing cards and a play section to enjoy the game. This application utilizes client-side storage for data persistence, ensuring user data is saved directly in their browser.

## Features

* **Admin Section:**
    * Create, Read, Update, and Delete (CRUD) memory cards.
    * Each card stores an image URL, painting name, painter, and location.
    * Search functionality to filter cards by painting name, painter, or location.
    * Pagination for easy navigation through a large collection of cards.
    * **Export Data:** Download all your memory card data as a JSON file for backup.
    * **Import Data:** Upload a JSON file to restore or add memory card data (overwrites existing data).
* **Play Section:**
    * Displays up to 10 randomly selected memory cards from your collection.
    * Click a card to flip it and reveal the painting's details (name, painter, location).
    * Cards dynamically adjust their display based on image orientation (portrait, landscape, square).
* **Responsive Design:** Adapts to various screen sizes for a seamless experience on desktop and mobile devices.

## Technologies Used

This application is built using standard web technologies with a focus on client-side data persistence and a rich user experience.

### Core Technologies:

* **HTML5:** Provides the structure and content of the web pages.
* **CSS3:** Styles the application, defining its layout, colors, and visual appearance, including responsive design.
* **JavaScript (ES6+):** Powers the interactive elements, application logic, and data management.

### Libraries and Why They Are Used:

1.  **Dexie.js (v3.2.0)**
    * **Purpose:** A wrapper library for IndexedDB.
    * **Why it's used:** Instead of relying on traditional server-side databases, this app uses `Dexie.js` to store all memory card data directly in the user's browser (client-side persistence). Dexie simplifies the complex IndexedDB API, making it much easier to perform CRUD operations (add, retrieve, update, delete) on structured data. This allows the app to function entirely offline once loaded, as all data is local.

2.  **Font Awesome (v6.0.0-beta3)**
    * **Purpose:** A popular icon library.
    * **Why it's used:** Provides scalable vector icons (e.g., edit, trash, search icons) that are easily customizable with CSS. This enhances the user interface by providing intuitive visual cues for various actions without relying on image files for small icons.

### Image Hosting

This application **does not provide image hosting**. It relies on **external image URLs**.

Users are expected to provide valid URLs to images that are already hosted online. This means you can use any image hosting service you prefer (e.g. imgbox.com, Imgur, Cloudinary, your own web server, or even direct links from public domain image repositories like Wikimedia Commons), as long as the URLs are publicly accessible.

## How to Use

1.  **Clone or Download:** Get the project files.
2.  **Open `index.html`:** Simply open the `index.html` file in your web browser. There's no server-side setup required.

### Admin Section:

* Navigate to the "Admin" section.
* Use the "Create/Edit Memory Card" form to add new cards or update existing ones.
* The "All Memory Cards" list displays your collection. Use the "Edit" and "Delete" buttons to manage individual cards.
* Use the search bar to find specific cards.
* Utilize the "Export Data" button to save your entire card collection as a `memory_cards_data.json` file.
* Use the "Import Data" button to load cards from a previously exported JSON file. **Be aware that importing will overwrite your current card collection.**

### Play Section:

* Navigate to the "Play" section.
* The game will automatically display up to 10 random cards from your collection.
* Click any card to flip it and reveal its details. Click again to flip it back.

---
