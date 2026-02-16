/**
 * Family Match - Memory Game
 * A fun game to help learn family members' names
 * Dynamically loads family images from FamilyImages/manifest.json
 */

// ============================================
// Game Configuration
// ============================================
const MAX_PAIRS = 15; // Maximum pairs (30 cards) for grid layout
let familyImages = [];    // Populated dynamically from selected family
let selectedFamily = '';  // Name of the currently selected family
let manifest = {};        // Full manifest data

// ============================================
// Game State
// ============================================
let gameCards = [];
let flippedCards = [];
let matchedPairs = [];
let turnCount = 0;
let isProcessing = false;

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
const familySelectModal = document.getElementById('family-select-modal');
const familyButtonsContainer = document.getElementById('family-buttons');

// ============================================
// Utility Functions
// ============================================

/**
 * Shuffles an array using Fisher-Yates algorithm
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
 */
function extractName(imagePath) {
    return imagePath.split("/").pop().split(".")[0];
}

/**
 * Gets all high scores from localStorage (per-family)
 */
function getHighScores() {
    const key = `familyMatchHighScores_${selectedFamily}`;
    const scores = localStorage.getItem(key);
    return scores ? JSON.parse(scores) : [];
}

/**
 * Saves high scores to localStorage (per-family)
 */
function saveHighScores(scores) {
    const key = `familyMatchHighScores_${selectedFamily}`;
    localStorage.setItem(key, JSON.stringify(scores));
}

/**
 * Gets the best record from high scores
 */
function getBestRecord() {
    const scores = getHighScores();
    return scores.length > 0 ? scores[0].turns : null;
}

/**
 * Checks if a score qualifies for the leaderboard
 */
function isHighScore(turns) {
    const scores = getHighScores();
    if (scores.length < 10) return true;
    return turns < scores[scores.length - 1].turns;
}

/**
 * Adds a new high score to the leaderboard
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

    if (scores.length > 10) {
        scores.length = 10;
    }

    saveHighScores(scores);
}

// ============================================
// Family Selection
// ============================================

/**
 * Fetches manifest.json and populates the family selection modal
 */
async function loadManifest() {
    try {
        const response = await fetch('FamilyImages/manifest.json');
        manifest = await response.json();
        populateFamilyButtons();
    } catch (err) {
        console.error('Failed to load manifest:', err);
        familyButtonsContainer.innerHTML = '<p style="color:#e94560;">Could not load family data. Make sure manifest.json exists.</p>';
    }
}

/**
 * Populates family selection buttons from manifest data
 */
function populateFamilyButtons() {
    familyButtonsContainer.innerHTML = '';
    const familyNames = Object.keys(manifest);

    if (familyNames.length === 0) {
        familyButtonsContainer.innerHTML = '<p style="color:#aaa;">No families found. Add image folders to FamilyImages/.</p>';
        return;
    }

    const icons = ['👨‍👩‍👧‍👦', '👪', '🏠', '❤️', '🌟', '🎯', '🎨', '🌈'];

    familyNames.forEach((name, index) => {
        const count = manifest[name].length;
        const icon = icons[index % icons.length];

        const btn = document.createElement('button');
        btn.className = 'family-btn';
        btn.innerHTML = `
            <div class="family-btn-icon">${icon}</div>
            <div class="family-btn-info">
                <div class="family-btn-name">${name}</div>
                <div class="family-btn-count">${count} family member${count !== 1 ? 's' : ''}</div>
            </div>
        `;
        btn.addEventListener('click', () => selectFamily(name));
        familyButtonsContainer.appendChild(btn);
    });
}

/**
 * Selects a family and starts the game
 */
function selectFamily(familyName) {
    selectedFamily = familyName;
    const allImages = manifest[familyName];

    // Build full image paths
    let images = allImages.map(filename => `FamilyImages/${familyName}/${filename}`);

    // If more images than max, randomly select a subset
    if (images.length > MAX_PAIRS) {
        images = shuffleArray(images).slice(0, MAX_PAIRS);
    }

    familyImages = images;

    // Update subtitle to show selected family
    const subtitle = document.querySelector('.header .subtitle');
    subtitle.innerHTML = `<span class="family-label">Playing: ${familyName}</span>`;

    // Hide family selection modal
    familySelectModal.style.display = 'none';

    // Update grid columns based on card count
    updateGridColumns(familyImages.length);

    // Start the game
    resetGame();
}

/**
 * Shows the family selection modal
 */
function showFamilySelect() {
    familySelectModal.style.display = 'flex';
}

/**
 * Dynamically adjusts grid columns based on number of pairs
 */
function updateGridColumns(numPairs) {
    const totalCards = numPairs * 2;
    let cols;

    if (totalCards <= 8) {
        cols = 4;
    } else if (totalCards <= 12) {
        cols = 4;
    } else if (totalCards <= 20) {
        cols = 5;
    } else if (totalCards <= 24) {
        cols = 6;
    } else {
        cols = 6;
    }

    cardContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
}

// ============================================
// Card Creation & Management
// ============================================

/**
 * Creates a single card element
 */
function createCard(imagePath, index) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.imagePath = imagePath;
    card.dataset.index = index;

    const cardInner = document.createElement('div');
    cardInner.classList.add('card-inner');

    const cardFront = document.createElement('div');
    cardFront.classList.add('card-front');

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
    gameCards = shuffleArray([...familyImages, ...familyImages]);
    cardContainer.innerHTML = '';

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
 */
function handleCardClick(card) {
    if (isProcessing ||
        card.classList.contains('flipped') ||
        card.classList.contains('matched')) {
        return;
    }

    card.classList.add('flipped');
    flippedCards.push(card);

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
 * Handles a mismatch
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
 */
function updateMatchedList(name) {
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
        initialsScore.textContent = turnCount;
        initialsInput.value = '';
        initialsModal.style.display = 'flex';
        setTimeout(() => initialsInput.focus(), 100);
    } else {
        modalTitle.textContent = 'Congratulations!';
        modalMessage.innerHTML = `You completed the game in <span class="highlight">${turnCount} turns</span>.<br>Best record: <span class="highlight">${bestRecord} turns</span>`;
        showVictoryThenLeaderboard();
    }

    updateStats();
}

/**
 * Shows victory modal, then leaderboard when closed
 */
function showVictoryThenLeaderboard() {
    victoryModal.style.display = 'flex';
    victoryModal.dataset.showLeaderboard = 'true';
}

/**
 * Submits the high score with initials
 */
function submitHighScore() {
    let initials = initialsInput.value.trim().toUpperCase();

    if (initials.length === 0) {
        initials = 'AAA';
    }

    while (initials.length < 3) {
        initials += '-';
    }

    initials = initials.substring(0, 3);

    addHighScore(initials, turnCount);
    hideInitialsModal();
    updateStats();

    showLeaderboard();
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
 * Hides the victory modal and optionally shows leaderboard
 */
function hideVictory() {
    const shouldShowLeaderboard = victoryModal.dataset.showLeaderboard === 'true';
    victoryModal.style.display = 'none';
    victoryModal.dataset.showLeaderboard = 'false';

    if (shouldShowLeaderboard) {
        showLeaderboard();
    }
}

// ============================================
// Game Controls
// ============================================

/**
 * Resets and starts a new game
 */
function resetGame() {
    if (familyImages.length === 0) {
        // No family selected yet — show selector
        showFamilySelect();
        return;
    }

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
 * Resets all high scores for the selected family
 */
function resetRecord() {
    if (!selectedFamily) {
        alert('Please select a family first.');
        return;
    }
    if (confirm(`Are you sure you want to reset all high scores for ${selectedFamily}?`)) {
        const key = `familyMatchHighScores_${selectedFamily}`;
        localStorage.removeItem(key);
        updateStats();
    }
}

// ============================================
// Initialize Game on Page Load
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    loadManifest();

    // Add Enter key support for initials input
    initialsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            submitHighScore();
        }
    });
});