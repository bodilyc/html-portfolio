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
const initialsModal = document.getElementById('initials-modal');
const initialsInput = document.getElementById('initials-input');
const initialsScore = document.getElementById('initials-score');
const leaderboardModal = document.getElementById('leaderboard-modal');
const leaderboardList = document.getElementById('leaderboard-list');

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
 * Gets all high scores from localStorage
 * @returns {Array} - Array of high score objects {initials, turns, date}
 */
function getHighScores() {
    const scores = localStorage.getItem('familyMatchHighScores');
    return scores ? JSON.parse(scores) : [];
}

/**
 * Saves high scores to localStorage
 * @param {Array} scores - Array of high score objects
 */
function saveHighScores(scores) {
    localStorage.setItem('familyMatchHighScores', JSON.stringify(scores));
}

/**
 * Gets the best record from high scores
 * @returns {number|null} - The best record or null if none exists
 */
function getBestRecord() {
    const scores = getHighScores();
    return scores.length > 0 ? scores[0].turns : null;
}

/**
 * Checks if a score qualifies for the leaderboard
 * @param {number} turns - The number of turns to check
 * @returns {boolean} - True if score qualifies
 */
function isHighScore(turns) {
    const scores = getHighScores();
    if (scores.length < 10) return true;
    return turns < scores[scores.length - 1].turns;
}

/**
 * Adds a new high score to the leaderboard
 * @param {string} initials - The player's 3-letter initials
 * @param {number} turns - The number of turns
 */
function addHighScore(initials, turns) {
    const scores = getHighScores();
    const newScore = {
        initials: initials.toUpperCase(),
        turns: turns,
        date: new Date().toLocaleDateString()
    };

    scores.push(newScore);
    scores.sort((a, b) => a.turns - b.turns);

    // Keep only top 10
    if (scores.length > 10) {
        scores.length = 10;
    }

    saveHighScores(scores);
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
 * Shows the victory modal or initials input if high score
 */
function showVictory() {
    const bestRecord = getBestRecord();
    const qualifiesForLeaderboard = isHighScore(turnCount);

    if (qualifiesForLeaderboard) {
        // Show initials input modal
        initialsScore.textContent = turnCount;
        initialsInput.value = '';
        initialsModal.style.display = 'flex';
        setTimeout(() => initialsInput.focus(), 100);
    } else {
        // Show regular victory modal
        modalTitle.textContent = 'Congratulations!';
        modalMessage.innerHTML = `You completed the game in <span class="highlight">${turnCount} turns</span>.<br>Best record: <span class="highlight">${bestRecord} turns</span>`;
        victoryModal.style.display = 'flex';
    }

    updateStats();
}

/**
 * Submits the high score with initials
 */
function submitHighScore() {
    let initials = initialsInput.value.trim().toUpperCase();

    // Validate initials (1-3 letters)
    if (initials.length === 0) {
        initials = 'AAA';
    }

    // Pad to 3 characters if needed
    while (initials.length < 3) {
        initials += '-';
    }

    // Only keep first 3 characters
    initials = initials.substring(0, 3);

    addHighScore(initials, turnCount);
    hideInitialsModal();

    // Show victory modal with new record message
    const bestRecord = getBestRecord();
    if (turnCount === bestRecord) {
        modalTitle.textContent = '🎉 New Record!';
        modalMessage.innerHTML = `You completed the game in <span class="highlight">${turnCount} turns</span>!<br>That's the best score!`;
    } else {
        modalTitle.textContent = '🏆 High Score!';
        modalMessage.innerHTML = `You made the leaderboard with <span class="highlight">${turnCount} turns</span>!`;
    }

    updateStats();
    victoryModal.style.display = 'flex';
}

/**
 * Hides the initials input modal
 */
function hideInitialsModal() {
    initialsModal.style.display = 'none';
}

/**
 * Shows the leaderboard modal
 */
function showLeaderboard() {
    const scores = getHighScores();
    leaderboardList.innerHTML = '';

    if (scores.length === 0) {
        leaderboardList.innerHTML = '<li class="no-scores">No high scores yet!</li>';
    } else {
        scores.forEach((score, index) => {
            const li = document.createElement('li');
            li.className = 'leaderboard-entry';
            if (index === 0) li.classList.add('gold');
            if (index === 1) li.classList.add('silver');
            if (index === 2) li.classList.add('bronze');

            li.innerHTML = `
                <span class="rank">${index + 1}</span>
                <span class="initials">${score.initials}</span>
                <span class="turns">${score.turns} turns</span>
            `;
            leaderboardList.appendChild(li);
        });
    }

    leaderboardModal.style.display = 'flex';
}

/**
 * Hides the leaderboard modal
 */
function hideLeaderboard() {
    leaderboardModal.style.display = 'none';
}

/**
 * Handles clicking on the leaderboard overlay to close
 */
function handleLeaderboardOverlayClick(event) {
    if (event.target === leaderboardModal) {
        hideLeaderboard();
    }
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
 * Resets all high scores
 */
function resetRecord() {
    if (confirm('Are you sure you want to reset all high scores?')) {
        localStorage.removeItem('familyMatchHighScores');
        updateStats();
    }
}

// ============================================
// Initialize Game on Page Load
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    initializeBoard();

    // Add Enter key support for initials input
    initialsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            submitHighScore();
        }
    });
});