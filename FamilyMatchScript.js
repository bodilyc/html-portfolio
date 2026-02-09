/**
 * Family Match - Memory Game
 * A fun game to help learn family members' names
 */

// ============================================
// Game Configuration - Add or remove images here
// ============================================
const familyImages = [
    "images/Gordon Bodily.jpg",
    "images/Harriett Ann Roberts.jpg",
    "images/Jackie Barlow Bodily.jpg",
    "images/Lois Carrigan Barlow.jpg",
    "images/Olive Marie Merkley Bodily.jpg",
    "images/Robert Bodily Jr.jpg",
    "images/Vinal Stoker Barlow.jpg",
    "images/Walton Edwin Bodily.jpg",
    "images/George Davis Merkley.jpg",
    "images/Zelpha Allen Bodily.jpg"
];

// ============================================
// Game State
// ============================================
let gameCards = [];
let flippedCards = [];
let matchedPairs = [];
let turnCount = 0;
let isProcessing = false; // Prevents clicking during card flip animation

// ============================================
// DOM Elements
// ============================================
const cardContainer = document.getElementById('card-container');
const turnCountDisplay = document.getElementById('turn-count');
const matchCountDisplay = document.getElementById('match-count');
const bestRecordDisplay = document.getElementById('best-record');
const matchedListDisplay = document.getElementById('matched-list');
const victoryModal = document.getElementById('victory-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');

// ============================================
// Utility Functions
// ============================================

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} - The shuffled array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Extracts the person's name from the image path
 * @param {string} imagePath - The full image path
 * @returns {string} - The person's name
 */
function extractName(imagePath) {
    return imagePath.split("/").pop().split(".")[0];
}

/**
 * Gets the best record from localStorage
 * @returns {number|null} - The best record or null if none exists
 */
function getBestRecord() {
    const record = localStorage.getItem('familyMatchRecord');
    return record ? parseInt(record, 10) : null;
}

/**
 * Sets a new best record in localStorage
 * @param {number} turns - The number of turns to save
 */
function setBestRecord(turns) {
    localStorage.setItem('familyMatchRecord', turns);
}

// ============================================
// Card Creation & Management
// ============================================

/**
 * Creates a single card element
 * @param {string} imagePath - The path to the family member's image
 * @param {number} index - The card's index in the game
 * @returns {HTMLElement} - The card element
 */
function createCard(imagePath, index) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.imagePath = imagePath;
    card.dataset.index = index;

    const cardInner = document.createElement('div');
    cardInner.classList.add('card-inner');

    // Front of card (hidden side)
    const cardFront = document.createElement('div');
    cardFront.classList.add('card-front');

    // Back of card (shows the image)
    const cardBack = document.createElement('div');
    cardBack.classList.add('card-back');

    const img = document.createElement('img');
    img.src = imagePath;
    img.alt = extractName(imagePath);
    img.loading = 'lazy';
    cardBack.appendChild(img);

    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);
    card.appendChild(cardInner);

    card.addEventListener('click', () => handleCardClick(card));

    return card;
}

/**
 * Initializes the game board with shuffled cards
 */
function initializeBoard() {
    // Create pairs of each image
    gameCards = shuffleArray([...familyImages, ...familyImages]);

    // Clear existing cards
    cardContainer.innerHTML = '';

    // Create and add card elements
    gameCards.forEach((imagePath, index) => {
        const card = createCard(imagePath, index);
        cardContainer.appendChild(card);
    });
}

// ============================================
// Game Logic
// ============================================

/**
 * Handles a card click event
 * @param {HTMLElement} card - The card element that was clicked
 */
function handleCardClick(card) {
    // Ignore clicks if processing, card is already flipped, or card is matched
    if (isProcessing ||
        card.classList.contains('flipped') ||
        card.classList.contains('matched')) {
        return;
    }

    // Flip the card
    card.classList.add('flipped');
    flippedCards.push(card);

    // Check if two cards are flipped
    if (flippedCards.length === 2) {
        isProcessing = true;
        turnCount++;
        updateStats();
        checkForMatch();
    }
}

/**
 * Checks if the two flipped cards match
 */
function checkForMatch() {
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.imagePath === card2.dataset.imagePath;

    if (isMatch) {
        handleMatch(card1, card2);
    } else {
        handleMismatch(card1, card2);
    }
}

/**
 * Handles a successful match
 * @param {HTMLElement} card1 - First matching card
 * @param {HTMLElement} card2 - Second matching card
 */
function handleMatch(card1, card2) {
    const personName = extractName(card1.dataset.imagePath);

    card1.classList.add('matched');
    card2.classList.add('matched');

    matchedPairs.push(personName);
    updateMatchedList(personName);

    flippedCards = [];
    isProcessing = false;
    updateStats();

    // Check for victory
    if (matchedPairs.length === familyImages.length) {
        setTimeout(showVictory, 600);
    }
}

/**
 * Handles a mismatch - flips cards back
 * @param {HTMLElement} card1 - First card
 * @param {HTMLElement} card2 - Second card
 */
function handleMismatch(card1, card2) {
    setTimeout(() => {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        flippedCards = [];
        isProcessing = false;
    }, 1000);
}

// ============================================
// UI Updates
// ============================================

/**
 * Updates the stats display
 */
function updateStats() {
    turnCountDisplay.textContent = turnCount;
    matchCountDisplay.textContent = matchedPairs.length;

    const bestRecord = getBestRecord();
    bestRecordDisplay.textContent = bestRecord !== null ? bestRecord : '-';
}

/**
 * Adds a name to the matched list display
 * @param {string} name - The person's name to add
 */
function updateMatchedList(name) {
    // Remove "no matches" message if present
    const emptyMessage = matchedListDisplay.querySelector('.empty-message');
    if (emptyMessage) {
        emptyMessage.remove();
    }

    const listItem = document.createElement('li');
    listItem.textContent = name;
    matchedListDisplay.appendChild(listItem);
}

/**
 * Clears the matched list display
 */
function clearMatchedList() {
    matchedListDisplay.innerHTML = '<li class="empty-message">No matches yet - start playing!</li>';
}

/**
 * Shows the victory modal
 */
function showVictory() {
    const bestRecord = getBestRecord();
    const isNewRecord = bestRecord === null || turnCount < bestRecord;

    if (isNewRecord) {
        setBestRecord(turnCount);
        modalTitle.textContent = '🎉 New Record!';
        modalMessage.innerHTML = `You completed the game in <span class="highlight">${turnCount} turns</span>!<br>That's a new best record!`;
    } else {
        modalTitle.textContent = 'Congratulations!';
        modalMessage.innerHTML = `You completed the game in <span class="highlight">${turnCount} turns</span>.<br>Best record: <span class="highlight">${bestRecord} turns</span>`;
    }

    updateStats(); // Update the record display
    victoryModal.style.display = 'flex';
}

/**
 * Hides the victory modal
 */
function hideVictory() {
    victoryModal.style.display = 'none';
}

// ============================================
// Game Controls
// ============================================

/**
 * Resets and starts a new game
 */
function resetGame() {
    hideVictory();
    flippedCards = [];
    matchedPairs = [];
    turnCount = 0;
    isProcessing = false;

    updateStats();
    clearMatchedList();
    initializeBoard();
}

/**
 * Resets the best record
 */
function resetRecord() {
    localStorage.removeItem('familyMatchRecord');
    updateStats();
}

// ============================================
// Initialize Game on Page Load
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    initializeBoard();
});