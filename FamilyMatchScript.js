/**
 * Family Match - Memory Game
 * A fun game to help learn family members' names
 * Dynamically loads family images from FamilyImages/manifest.json
 */

// ============================================
// Game Configuration.
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
 * Prefers Deck Builder data when available.
 */
async function loadManifest() {
  try {
    const response = await fetch('FamilyImages/manifest.json');
    const repoManifest = await response.json();
    manifest = repoManifest;
  } catch (err) {
    console.error('Failed to load manifest:', err);
    manifest = {};
  }
  populateFamilyButtons();
}

function resolveFamilyImages(family) {
  const manifestData = resolveManifest();
  const names = manifestData[family] || [];
  const localImages = builderGetImages(family);
  return names.map(name => localImages[name] || `FamilyImages/${family}/${name}`);
}

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
  familyImages = resolveFamilyImages(familyName);

  if (familyImages.length > MAX_PAIRS) {
    familyImages = shuffleArray(familyImages).slice(0, MAX_PAIRS);
  }

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
 * Dynamically adjusts grid columns to target 3 rows on desktop.
 * Cards will wrap to more rows on narrower screens via CSS.
 */
function updateGridColumns(numPairs) {
  const totalCards = numPairs * 2;
  // Target 3 rows: spread cards across columns
  const cols = Math.ceil(totalCards / 3);

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

// ============================================
// Deck Builder
// ============================================
const BUILDER_MANIFEST_KEY = 'familyMatchBuilderManifest';
const BUILDER_IMAGES_PREFIX = 'familyMatchBuilderImage_';

function getBuilderManifest() {
  try {
    const raw = localStorage.getItem(BUILDER_MANIFEST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setBuilderManifest(data) {
  localStorage.setItem(BUILDER_MANIFEST_KEY, JSON.stringify(data));
}

function getDefaultManifest() {
  return manifest || {
    Bodily: [
      'Gordon Bodily.jpg',
      'Harriett Ann Roberts.jpg',
      'Jackie Barlow Bodily.jpg',
      'Lois Carrigan Barlow.jpg',
      'Olive Marie Merkley Bodily.jpg',
      'Robert Bodily Jr.jpg',
      'Vinal Stoker Barlow.jpg',
      'Walton Edwin Bodily.jpg',
      'George Davis Merkley.jpg',
      'Zelpha Allen Bodily.jpg'
    ]
  };
}

function resolveManifest() {
  const repo = (typeof manifest !== 'undefined') ? manifest : getDefaultManifest();
  try {
    const raw = localStorage.getItem(BUILDER_MANIFEST_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const hasBuilderData = parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 0 && Object.values(parsed).every(v => Array.isArray(v));
    if (hasBuilderData) {
      return parsed;
    }
  } catch (e) {
    console.warn('Bad builder manifest; ignoring builder data:', e);
  }
  return repo || getDefaultManifest();
}

function builderGetImages(family) {
  const out = {};
  const prefix = BUILDER_IMAGES_PREFIX + family + '_';
  const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
  keys.forEach(k => {
    const name = k.slice(prefix.length);
    out[name] = localStorage.getItem(k);
  });
  return out;
}

function builderSetImage(family, name, dataUrl) {
  const key = BUILDER_IMAGES_PREFIX + family + '_' + name;
  if (dataUrl) localStorage.setItem(key, dataUrl);
  else localStorage.removeItem(key);
}

function builderDeleteImage(family, name) {
  builderSetImage(family, name, null);
}

function builderOpen() {
  const overlay = document.getElementById('builder-overlay');
  if (!overlay) return;
  const data = resolveManifest();
  document.getElementById('builder-json').value = JSON.stringify(data, null, 2);
  builderRenderFamilyList(data);
  builderRenderMembers(null);
  overlay.classList.add('open');
}

function hideBuilder() {
  const overlay = document.getElementById('builder-overlay');
  if (overlay) overlay.classList.remove('open');
}

function showBuilder() {
  builderOpen();
}

function builderRenderFamilyList(data) {
  const list = document.getElementById('builder-family-list');
  if (!list) return;
  list.innerHTML = '';
  Object.keys(data || {}).forEach(name => {
    const li = document.createElement('li');
    li.className = 'builder-family-item';
    li.innerHTML = `<strong>${escapeHtml(name)}</strong> <span style="color:#94a3b8;">${(data[name] || []).length} members</span>`;
    li.addEventListener('click', () => {
      Array.from(list.children).forEach(el => el.style.borderColor = '#334155');
      li.style.borderColor = '#22c55e';
      builderRenderMembers(name);
    });
    list.appendChild(li);
  });
}

function builderRenderMembers(family) {
  const container = document.getElementById('builder-members');
  const hint = document.getElementById('builder-selected-family-hint');
  if (!container) return;
  container.innerHTML = '';
  if (!family) {
    if (hint) hint.textContent = 'Select a family to manage its members.';
    return;
  }
  if (hint) hint.textContent = `Editing: ${family}`;
  const data = resolveManifest();
  const members = data[family] || [];
  const images = builderGetImages(family);
  members.forEach(name => {
    const li = document.createElement('li');
    li.className = 'builder-member';
    const img = images[name];
    if (img) {
      const imgEl = document.createElement('img');
      imgEl.src = img;
      imgEl.style.width = '26px';
      imgEl.style.height = '26px';
      imgEl.style.borderRadius = '999px';
      imgEl.style.objectFit = 'cover';
      li.prepend(imgEl);
    }
    li.appendChild(document.createTextNode(' ' + name));
    const del = document.createElement('button');
    del.textContent = '×';
    del.addEventListener('click', () => builderRemoveMember(family, name));
    li.appendChild(del);
    container.appendChild(li);
  });
}

function builderAddFamily() {
  const input = document.getElementById('builder-family-name');
  const name = (input ? input.value : '').trim();
  if (!name) return;
  const data = resolveManifest();
  if (data[name]) {
    alert('Family already exists.');
    return;
  }
  data[name] = [];
  input.value = '';
  builderSync(data);
}

function builderDeleteSelectedFamily() {
  const active = document.querySelector('#builder-family-list .builder-family-item[style*="rgb(34, 197, 94)"]') || document.querySelector('#builder-family-list .builder-family-item');
  if (!active) return;
  const name = active.textContent.trim();
  if (!confirm(`Delete family "${name}"? This only affects the local builder manifest.`)) return;
  const data = resolveManifest();
  delete data[name];
  builderSync(data);
}

function builderAddMemberToSelected() {
  const input = document.getElementById('builder-member-name');
  const name = (input ? input.value : '').trim();
  if (!name) return;
  const active = document.querySelector('#builder-family-list .builder-family-item[style*="rgb(34, 197, 94)"]') || document.querySelector('#builder-family-list .builder-family-item');
  if (!active) {
    alert('Select a family first.');
    return;
  }
  const family = active.textContent.trim().replace(/ \d+ members$/, '').trim();
  const data = resolveManifest();
  if (!data[family]) data[family] = [];
  if (!data[family].includes(name)) data[family].push(name);
  input.value = '';
  builderSync(data);
  builderRenderMembers(family);
}

function builderRemoveMember(family, name) {
  const data = resolveManifest();
  if (!data[family]) return;
  data[family] = (data[family] || []).filter(n => n !== name);
  builderSync(data);
  builderRenderMembers(family);
}

function builderSync(data) {
  setBuilderManifest(data);
  document.getElementById('builder-json').value = JSON.stringify(data, null, 2);
  builderRenderFamilyList(data);
}

function builderApplyJson() {
  const raw = document.getElementById('builder-json').value || '';
  try {
    const data = JSON.parse(raw);
    if (typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid manifest');
    setBuilderManifest(data);
    builderRenderFamilyList(data);
    builderRenderMembers(null);
    alert('Manifest applied.');
  } catch (e) {
    alert('Invalid JSON: ' + e.message);
  }
}

function builderSaveLocal() {
  setBuilderManifest(resolveManifest());
  alert('Saved locally for this browser.');
}

function builderDownload() {
  const data = resolveManifest();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'manifest.json';
  a.click();
  URL.revokeObjectURL(url);
}

function builderResetToRepo() {
  if (!confirm('Reset builder to the repo manifest.json?')) return;
  setBuilderManifest(null);
  document.getElementById('builder-json').value = JSON.stringify(getDefaultManifest(), null, 2);
  builderRenderFamilyList(getDefaultManifest());
  builderRenderMembers(null);
}

function builderUploadImages() {
  const active = document.querySelector('#builder-family-list .builder-family-item[style*="rgb(34, 197, 94)"]') || document.querySelector('#builder-family-list .builder-family-item');
  if (!active) {
    alert('Select a family first.');
    return;
  }
  const family = active.textContent.trim().replace(/ \d+ members$/, '').trim();
  const input = document.getElementById('builder-file-input');
  if (input) {
    input.dataset.family = family;
    input.click();
  }
}

function builderHandleFiles(files) {
  if (!files || !files.length) return;
  const family = document.getElementById('builder-file-input')?.dataset.family;
  if (!family) return;
  const data = resolveManifest();
  if (!data[family]) data[family] = [];
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const name = file.name;
      builderSetImage(family, name, e.target.result);
      if (!data[family].includes(name)) data[family].push(name);
      builderSync(data);
    };
    reader.readAsDataURL(file);
  });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}