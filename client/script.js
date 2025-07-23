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

window.gameSettings = {
  audio: {
    masterVolume: 50,
    musicVolume: 30,
    sfxVolume: 70,
  },
  graphics: {
    quality: 'medium',
    showFps: false,
    particleEffects: true,
  },
  controls: {
    moveUp: 'W',
    moveDown: 'S',
    moveLeft: 'A',
    moveRight: 'D',
    shoot: 'SPACE',
  },
};

const gameSettings = window.gameSettings;

const leaderboardData = {
  'all-time': [],
  today: [],
  'this-week': [],
};

document.addEventListener('DOMContentLoaded', function () {
  initializeSettings();
  setupEventListeners();
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

      if (window.gameState && window.gameState.isGameOver) {
        restartGame();
      }
    });
  });

  masterVolumeSlider.addEventListener('input', updateVolumeDisplay);
  musicVolumeSlider.addEventListener('input', updateVolumeDisplay);
  sfxVolumeSlider.addEventListener('input', updateVolumeDisplay);

  // Add real-time volume adjustment
  masterVolumeSlider.addEventListener('input', () => {
    if (window.audioManager) {
      gameSettings.audio.masterVolume = parseInt(masterVolumeSlider.value);
      window.audioManager.updateSettings();
    }
  });

  musicVolumeSlider.addEventListener('input', () => {
    if (window.audioManager) {
      gameSettings.audio.musicVolume = parseInt(musicVolumeSlider.value);
      window.audioManager.updateSettings();
    }
  });

  sfxVolumeSlider.addEventListener('input', () => {
    if (window.audioManager) {
      gameSettings.audio.sfxVolume = parseInt(sfxVolumeSlider.value);
      window.audioManager.updateSettings();
      // Play a test sound to preview the volume
      window.audioManager.playPlayerShoot({ volume: 0.5 });
    }
  });

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

  masterVolumeSlider.value = gameSettings.audio.masterVolume;
  musicVolumeSlider.value = gameSettings.audio.musicVolume;
  sfxVolumeSlider.value = gameSettings.audio.sfxVolume;
  graphicsQualitySelect.value = gameSettings.graphics.quality;
  showFpsCheckbox.checked = gameSettings.graphics.showFps;
  particleEffectsCheckbox.checked = gameSettings.graphics.particleEffects;

  updateVolumeDisplay();

  setTimeout(() => {
    if (typeof applyGraphicsSettings === 'function') {
      applyGraphicsSettings();
    }

    // Initialize audio manager with settings
    if (window.audioManager) {
      window.audioManager.initialize();
      // Start menu music
      window.audioManager.playMenuMusic();
    }
  }, 500);
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
  gameSettings.audio.masterVolume = parseInt(masterVolumeSlider.value);
  gameSettings.audio.musicVolume = parseInt(musicVolumeSlider.value);
  gameSettings.audio.sfxVolume = parseInt(sfxVolumeSlider.value);
  gameSettings.graphics.quality = graphicsQualitySelect.value;
  gameSettings.graphics.showFps = showFpsCheckbox.checked;
  gameSettings.graphics.particleEffects = particleEffectsCheckbox.checked;

  localStorage.setItem('spaceShooterSettings', JSON.stringify(gameSettings));

  if (typeof applyGraphicsSettings === 'function') {
    applyGraphicsSettings();
  }

  // Update audio manager settings
  if (window.audioManager) {
    window.audioManager.updateSettings();
  }

  console.log('Settings saved and applied:', gameSettings);
  alert('Settings saved successfully!');
  hidePanel('settings');
}

function resetSettings() {
  gameSettings.audio.masterVolume = 50;
  gameSettings.audio.musicVolume = 30;
  gameSettings.audio.sfxVolume = 70;
  gameSettings.graphics.quality = 'medium';
  gameSettings.graphics.showFps = false;
  gameSettings.graphics.particleEffects = true;

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

  if (typeof updateLeaderboardDisplay === 'function') {
    updateLeaderboardDisplay();
  }
}

function startGame() {
  gameMenu.classList.add('hidden');
  text.classList.add('hidden');
  document.getElementById('gameCanvas').classList.remove('hidden-canvas');

  // Call the game's initializeGame function to actually start the game logic
  if (typeof window.initializeGame === 'function') {
    window.initializeGame();
  }

  if (window.gameState) {
    window.gameState.isPaused = false;
    window.gameState.isGameOver = false;
    window.gameState.currentScore = 0;
  }

  // Switch to game music
  if (window.audioManager) {
    window.audioManager.playGameMusic();
  }
}

function restartGame() {
  hideAllPanels();

  gameMenu.classList.remove('hidden');
  text.classList.remove('hidden');
  document.getElementById('gameCanvas').classList.add('hidden-canvas');

  const leaderboardPanel = document.querySelector('.leaderboard-panel');
  const panelTitle = leaderboardPanel.querySelector('.panel-title');
  panelTitle.textContent = 'LEADERBOARD';

  const backToMenuButton = leaderboardPanel.querySelector('.back-to-menu');
  if (backToMenuButton) {
    backToMenuButton.textContent = 'Back to Menu';
  }

  if (window.gameState) {
    window.gameState.isGameStarted = false;
    window.gameState.isPaused = false;
    window.gameState.isGameOver = false;
    window.gameState.currentScore = 0;
  }

  // Switch back to menu music
  if (window.audioManager) {
    window.audioManager.playMenuMusic();
  }

  window.location.reload();
}

function clearAllScores() {
  if (
    confirm(
      'Are you sure you want to clear all leaderboard scores? This action cannot be undone.'
    )
  ) {
    localStorage.removeItem('spaceShooterLeaderboard');

    if (typeof updateLeaderboardDisplay === 'function') {
      updateLeaderboardDisplay();
    }

    alert('All scores have been cleared.');
  }
}

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
