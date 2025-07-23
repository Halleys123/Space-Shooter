const text = document.querySelector('.game-text');

const startButton = document.querySelector('.start-game');
const settingsButton = document.querySelector('.settings');
const leaderboardButton = document.querySelector('.leaderboard');
const exitButton = document.querySelector('.exit-game');

const gameMenu = document.querySelector('.game-menu');
const settingsPanel = document.querySelector('.settings-panel');
const leaderboardPanel = document.querySelector('.leaderboard-panel');

const closePanelButtons = document.querySelectorAll('.close-panel');
const backToMenuButtons = document.querySelectorAll('.back-to-menu');

const masterVolumeSlider = document.getElementById('master-volume');
const musicVolumeSlider = document.getElementById('music-volume');
const sfxVolumeSlider = document.getElementById('sfx-volume');
const graphicsQualitySelect = document.getElementById('graphics-quality');
const showFpsCheckbox = document.getElementById('show-fps');
const particleEffectsCheckbox = document.getElementById('particle-effects');

const tabButtons = document.querySelectorAll('.tab-button');
const leaderboardEntries = document.getElementById('leaderboard-entries');

const gameSettings = {
  masterVolume: 50,
  musicVolume: 30,
  sfxVolume: 70,
  graphicsQuality: 'medium',
  showFps: true,
  particleEffects: true,
  controls: {
    moveUp: 'W',
    moveDown: 'S',
    moveLeft: 'A',
    moveRight: 'D',
    shoot: 'SPACE',
  },
};

const leaderboardData = {
  'all-time': [],
  today: [],
  'this-week': [],
};

document.addEventListener('DOMContentLoaded', function () {
  initializeSettings();
  setupEventListeners();
  //   loadLeaderboard('all-time');
});

function setupEventListeners() {
  settingsButton.addEventListener('click', () => showPanel('settings'));
  leaderboardButton.addEventListener('click', () => {
    showPanel('leaderboard');
    updateLeaderboardDisplay();
  });

  closePanelButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      const panelType = e.target.getAttribute('data-panel');
      hidePanel(panelType);
    });
  });

  backToMenuButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      const panelType = e.target.getAttribute('data-panel');
      hidePanel(panelType);

      // If coming from game over screen, restart the game
      if (window.gameState && window.gameState.isGameOver) {
        restartGame();
      }
    });
  });

  masterVolumeSlider.addEventListener('input', updateVolumeDisplay);
  musicVolumeSlider.addEventListener('input', updateVolumeDisplay);
  sfxVolumeSlider.addEventListener('input', updateVolumeDisplay);

  document
    .querySelector('.save-settings')
    .addEventListener('click', saveSettings);
  document
    .querySelector('.reset-settings')
    .addEventListener('click', resetSettings);

  tabButtons.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      const tabType = e.target.getAttribute('data-tab');
      switchLeaderboardTab(tabType);
    });
  });

  startButton.addEventListener('click', () => {
    startGame();
  });

  // Add clear scores functionality
  const clearScoresButton = document.querySelector('.clear-scores');
  if (clearScoresButton) {
    clearScoresButton.addEventListener('click', clearAllScores);
  }
}

function showPanel(panelType) {
  hideAllPanels();
  if (panelType === 'settings') {
    settingsPanel.classList.remove('hidden');
  } else if (panelType === 'leaderboard') {
    leaderboardPanel.classList.remove('hidden');

    // Reset button text when accessing leaderboard normally (not from game over)
    if (!window.gameState || !window.gameState.isGameOver) {
      const backToMenuButton = leaderboardPanel.querySelector('.back-to-menu');
      if (backToMenuButton) {
        backToMenuButton.textContent = 'Back to Menu';
      }
    }
  }
}

function hidePanel(panelType) {
  if (panelType === 'settings') {
    settingsPanel.classList.add('hidden');
  } else if (panelType === 'leaderboard') {
    leaderboardPanel.classList.add('hidden');
  }
}

function hideAllPanels() {
  settingsPanel.classList.add('hidden');
  leaderboardPanel.classList.add('hidden');
}

function initializeSettings() {
  const savedSettings = localStorage.getItem('spaceShooterSettings');
  if (savedSettings) {
    Object.assign(gameSettings, JSON.parse(savedSettings));
  }

  masterVolumeSlider.value = gameSettings.masterVolume;
  musicVolumeSlider.value = gameSettings.musicVolume;
  sfxVolumeSlider.value = gameSettings.sfxVolume;
  graphicsQualitySelect.value = gameSettings.graphicsQuality;
  showFpsCheckbox.checked = gameSettings.showFps;
  particleEffectsCheckbox.checked = gameSettings.particleEffects;

  updateVolumeDisplay();
}

function updateVolumeDisplay() {
  const masterVolumeValue =
    masterVolumeSlider.parentElement.querySelector('.volume-value');
  const musicVolumeValue =
    musicVolumeSlider.parentElement.querySelector('.volume-value');
  const sfxVolumeValue =
    sfxVolumeSlider.parentElement.querySelector('.volume-value');

  if (masterVolumeValue)
    masterVolumeValue.textContent = masterVolumeSlider.value + '%';
  if (musicVolumeValue)
    musicVolumeValue.textContent = musicVolumeSlider.value + '%';
  if (sfxVolumeValue) sfxVolumeValue.textContent = sfxVolumeSlider.value + '%';
}

function saveSettings() {
  gameSettings.masterVolume = parseInt(masterVolumeSlider.value);
  gameSettings.musicVolume = parseInt(musicVolumeSlider.value);
  gameSettings.sfxVolume = parseInt(sfxVolumeSlider.value);
  gameSettings.graphicsQuality = graphicsQualitySelect.value;
  gameSettings.showFps = showFpsCheckbox.checked;
  gameSettings.particleEffects = particleEffectsCheckbox.checked;

  localStorage.setItem('spaceShooterSettings', JSON.stringify(gameSettings));

  alert('Settings saved successfully!');

  hidePanel('settings');
}

function resetSettings() {
  gameSettings.masterVolume = 50;
  gameSettings.musicVolume = 30;
  gameSettings.sfxVolume = 70;
  gameSettings.graphicsQuality = 'medium';
  gameSettings.showFps = false;
  gameSettings.particleEffects = true;

  initializeSettings();

  alert('Settings reset to default values!');
}

function switchLeaderboardTab(tabType) {
  tabButtons.forEach((tab) => {
    tab.classList.remove('active');
    if (tab.getAttribute('data-tab') === tabType) {
      tab.classList.add('active');
    }
  });

  // Update leaderboard display when tab changes
  if (typeof updateLeaderboardDisplay === 'function') {
    updateLeaderboardDisplay();
  }
}

// Function to start the game
function startGame() {
  gameMenu.classList.add('hidden');
  text.classList.add('hidden');
  document.getElementById('gameCanvas').classList.remove('hidden-canvas');

  // Reset game state if it exists
  if (window.gameState) {
    window.gameState.isPaused = false;
    window.gameState.isGameOver = false;
    window.gameState.currentScore = 0;
  }
}

// Function to restart the game
function restartGame() {
  // Hide all panels
  hideAllPanels();

  // Show game menu
  gameMenu.classList.remove('hidden');
  text.classList.remove('hidden');
  document.getElementById('gameCanvas').classList.add('hidden-canvas');

  // Reset leaderboard panel title and button text
  const leaderboardPanel = document.querySelector('.leaderboard-panel');
  const panelTitle = leaderboardPanel.querySelector('.panel-title');
  panelTitle.textContent = 'LEADERBOARD';

  const backToMenuButton = leaderboardPanel.querySelector('.back-to-menu');
  if (backToMenuButton) {
    backToMenuButton.textContent = 'Back to Menu';
  }

  // Reset game state
  if (window.gameState) {
    window.gameState.isPaused = false;
    window.gameState.isGameOver = false;
    window.gameState.currentScore = 0;
  }

  // Reload the page to fully reset the game
  window.location.reload();
}

// Function to clear all scores
function clearAllScores() {
  if (
    confirm(
      'Are you sure you want to clear all leaderboard scores? This action cannot be undone.'
    )
  ) {
    localStorage.removeItem('spaceShooterLeaderboard');

    // Update display
    if (typeof updateLeaderboardDisplay === 'function') {
      updateLeaderboardDisplay();
    }

    alert('All scores have been cleared.');
  }
}

// Function to update leaderboard display (duplicate from canvas.js for access from script.js)
function updateLeaderboardDisplay() {
  const leaderboardData = JSON.parse(
    localStorage.getItem('spaceShooterLeaderboard')
  ) || {
    'all-time': [],
    today: [],
    'this-week': [],
  };

  const entriesContainer = document.getElementById('leaderboard-entries');
  const activeTabElement = document.querySelector('.tab-button.active');
  const activeTab = activeTabElement
    ? activeTabElement.getAttribute('data-tab')
    : 'all-time';
  const entries = leaderboardData[activeTab] || [];

  entriesContainer.innerHTML = '';

  if (entries.length === 0) {
    entriesContainer.innerHTML =
      '<div class="leaderboard-entry"><span style="grid-column: 1 / -1; text-align: center; color: #888;">No scores yet!</span></div>';
    return;
  }

  entries.forEach((entry, index) => {
    const entryElement = document.createElement('div');
    entryElement.className = 'leaderboard-entry';
    entryElement.innerHTML = `
      <span class="rank">${index + 1}</span>
      <span class="player-name">${entry.name}</span>
      <span class="score">${entry.score.toLocaleString()}</span>
      <span class="date">${entry.date}</span>
    `;
    entriesContainer.appendChild(entryElement);
  });
}
