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

let apiService = null;
let authUI = null;
let leaderboardManager = null;

// Helper function to add both click and touch events for mobile compatibility
function addButtonEventListener(element, handler) {
  if (!element) return;

  element.addEventListener('click', (e) => {
    console.log('Button clicked:', element.className);
    handler(e);
  });
  element.addEventListener('touchend', (e) => {
    e.preventDefault();
    console.log('Button touched:', element.className);
    handler(e);
  });
}

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
  initializeComponents();
  setupEventListeners();
});

async function initializeComponents() {
  try {
    apiService = new GameAPI();

    authUI = new AuthUI('auth-section', apiService);
    await authUI.initialize();

    leaderboardManager = new LeaderboardManager(
      '.leaderboard-panel',
      apiService,
      authUI
    );
    await leaderboardManager.initialize();

    window.apiService = apiService;
    window.authUI = authUI;
    window.leaderboardManager = leaderboardManager;

    console.log('All components initialized successfully');
  } catch (error) {
    console.error('Error initializing components:', error);
    showNotification('Failed to initialize game components', 'error');
  }
}

function setupEventListeners() {
  addButtonEventListener(settingsButton, () => showPanel('settings'));
  addButtonEventListener(leaderboardButton, async () => {
    showPanel('leaderboard');
    if (leaderboardManager) {
      await leaderboardManager.refresh();
    } else {
      updateLeaderboardDisplay();
    }
  });

  closePanelButtons.forEach((button) => {
    addButtonEventListener(button, (e) => {
      const panelType = e.target.getAttribute('data-panel');
      hidePanel(panelType);
    });
  });

  backToMenuButtons.forEach((button) => {
    addButtonEventListener(button, (e) => {
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

      window.audioManager.playPlayerShoot({ volume: 0.5 });
    }
  });

  const saveSettingsButton = document.querySelector('.save-settings');
  const resetSettingsButton = document.querySelector('.reset-settings');

  addButtonEventListener(saveSettingsButton, saveSettings);
  addButtonEventListener(resetSettingsButton, resetSettings);

  tabButtons.forEach((tab) => {
    addButtonEventListener(tab, (e) => {
      const tabType = e.target.getAttribute('data-tab');
      switchLeaderboardTab(tabType);
    });
  });

  addButtonEventListener(startButton, () => {
    startGame();
  });

  const clearScoresButton = document.querySelector('.clear-scores');
  if (clearScoresButton) {
    addButtonEventListener(clearScoresButton, clearAllScores);
  }

  // Mobile warning dismiss functionality
  const dismissWarningButton = document.getElementById('dismiss-warning');
  if (dismissWarningButton) {
    addButtonEventListener(dismissWarningButton, () => {
      const mobileWarning = document.getElementById('mobile-warning');
      if (mobileWarning) {
        mobileWarning.style.display = 'none';
        // Adjust body padding
        document.body.style.paddingTop = '0';
        // Store in localStorage so it doesn't show again
        localStorage.setItem('mobileWarningDismissed', 'true');
      }
    });
  }

  // Profile button click handler
  const profileButton = document.querySelector('.profile-btn');
  if (profileButton) {
    addButtonEventListener(profileButton, async () => {
      await showUserProfile();
    });
  }

  // Check if mobile warning was previously dismissed
  const mobileWarning = document.getElementById('mobile-warning');
  if (
    mobileWarning &&
    localStorage.getItem('mobileWarningDismissed') === 'true'
  ) {
    mobileWarning.style.display = 'none';
    document.body.style.paddingTop = '0';
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
  } else if (panelType === 'profile') {
    const profilePanel = document.querySelector('.profile-panel');
    if (profilePanel) {
      profilePanel.classList.remove('hidden');
    }
  }
}

function hidePanel(panelType) {
  if (panelType === 'settings') {
    settingsPanel.classList.add('hidden');
  } else if (panelType === 'leaderboard') {
    leaderboardPanel.classList.add('hidden');
  } else if (panelType === 'profile') {
    const profilePanel = document.querySelector('.profile-panel');
    if (profilePanel) {
      profilePanel.classList.add('hidden');
    }
  }
}

function hideAllPanels() {
  settingsPanel.classList.add('hidden');
  leaderboardPanel.classList.add('hidden');
  const profilePanel = document.querySelector('.profile-panel');
  if (profilePanel) {
    profilePanel.classList.add('hidden');
  }
}

async function showUserProfile() {
  try {
    if (!authUI || !authUI.isAuthenticated()) {
      console.warn('User not authenticated');
      return;
    }

    // Show the profile panel
    showPanel('profile');

    // Fetch user stats from backend
    const currentUser = authUI.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      console.warn('No current user found');
      return;
    }

    const userProfile = await apiService.getUserProfile(currentUser.id);
    console.log('Fetched user profile:', userProfile);

    // Update the stats display
    updateProfileStats(userProfile);

    // Fetch and display user's recent scores
    await updateUserScoresList(currentUser.username);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Still show the panel even if stats fetch fails
    showPanel('profile');
  }
}

function updateProfileStats(userProfile) {
  if (!userProfile || !userProfile.stats) {
    console.warn('No user stats available');
    return;
  }

  const stats = userProfile.stats;

  // Update basic stats
  const totalGamesEl = document.getElementById('total-games');
  const bestScoreEl = document.getElementById('best-score');
  const avgScoreEl = document.getElementById('avg-score');
  const totalTimeEl = document.getElementById('total-time');

  if (totalGamesEl) totalGamesEl.textContent = stats.gamesPlayed || 0;
  if (bestScoreEl) bestScoreEl.textContent = stats.bestScore || 0;
  if (avgScoreEl) avgScoreEl.textContent = stats.averageScore || 0;

  // Convert total time from seconds to hours and minutes
  if (totalTimeEl) {
    const totalSeconds = stats.totalTimePlayed || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      totalTimeEl.textContent = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      totalTimeEl.textContent = `${minutes}m`;
    } else {
      totalTimeEl.textContent = '0m';
    }
  }

  // Add additional stats if we have elements for them
  const accuracyEl = document.getElementById('accuracy-stat');
  if (accuracyEl && stats.accuracy !== undefined) {
    accuracyEl.textContent = `${(stats.accuracy * 100).toFixed(1)}%`;
  }

  const totalEnemiesEl = document.getElementById('total-enemies');
  if (totalEnemiesEl)
    totalEnemiesEl.textContent = stats.totalEnemiesKilled || 0;

  const totalBulletsEl = document.getElementById('total-bullets');
  if (totalBulletsEl) totalBulletsEl.textContent = stats.totalBulletsFired || 0;

  const totalPowerupsEl = document.getElementById('total-powerups');
  if (totalPowerupsEl)
    totalPowerupsEl.textContent = stats.totalPowerupsCollected || 0;

  console.log('Updated profile stats display');
}

async function updateUserScoresList(username) {
  try {
    // Get user's recent scores from the leaderboard API
    const response = await apiService.getUserScores(username);
    const scoresContainer = document.getElementById('user-scores-list');

    if (!scoresContainer) return;

    // Extract the entries array from the response
    const userScores = response?.entries || [];
    
    if (!userScores || !Array.isArray(userScores) || userScores.length === 0) {
      scoresContainer.innerHTML =
        '<div class="no-scores">No scores yet. Play a game to see your scores here!</div>';
      return;
    }

    // Display up to 5 most recent scores
    const recentScores = userScores.slice(0, 5);
    const scoresHTML = recentScores
      .map((score, index) => {
        const date = new Date(score.date).toLocaleDateString();
        const time = new Date(score.date).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        return `
        <div class="score-entry">
          <div class="score-info">
            <div class="score-value">${score.score.toLocaleString()}</div>
            <div class="score-details">
              <span class="score-rank">#${index + 1}</span>
              <span class="score-date">${date} ${time}</span>
            </div>
          </div>
          <div class="score-stats">
            <span class="score-stat">Stage ${score.stage}</span>
            <span class="score-stat">Cycle ${score.cycle}</span>
            <span class="score-stat">${
              score.accuracy ? (score.accuracy * 100).toFixed(1) + '%' : 'N/A'
            }</span>
            <span class="score-stat">${score.metadata?.difficulty || 'Normal'}</span>
          </div>
        </div>
      `;
      })
      .join('');

    scoresContainer.innerHTML = scoresHTML;
  } catch (error) {
    console.error('Error fetching user scores:', error);
    const scoresContainer = document.getElementById('user-scores-list');
    if (scoresContainer) {
      scoresContainer.innerHTML =
        '<div class="no-scores">Error loading scores. Try again later.</div>';
    }
  }
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
      try {
        applyGraphicsSettings();
      } catch (error) {
        console.warn(
          'Could not apply graphics settings during initialization:',
          error
        );
      }
    }

    if (window.audioManager) {
      window.audioManager.initialize();

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

  // Save settings to backend if authenticated
  if (window.apiService && window.apiService.isAuthenticated()) {
    const backendSettings = {
      masterVolume: gameSettings.audio.masterVolume / 100, // Backend expects 0-1 range
      sfxVolume: gameSettings.audio.sfxVolume / 100,
      musicVolume: gameSettings.audio.musicVolume / 100,
      difficulty: 'normal', // Default difficulty
      showFPS: gameSettings.graphics.showFps,
      showParticles: gameSettings.graphics.particleEffects,
      keyBindings: gameSettings.controls,
    };

    window.apiService
      .updateUserSettings(backendSettings)
      .then(() => {
        console.log('Settings saved to backend successfully');
      })
      .catch((error) => {
        console.error('Failed to save settings to backend:', error);
        // Don't block the UI if backend save fails
      });
  }

  if (typeof applyGraphicsSettings === 'function') {
    try {
      applyGraphicsSettings();
    } catch (error) {
      console.warn('Could not apply graphics settings:', error);
    }
  }

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

  if (typeof window.initializeGame === 'function') {
    window.initializeGame();
  }

  if (window.gameState) {
    window.gameState.isPaused = false;
    window.gameState.isGameOver = false;
    window.gameState.currentScore = 0;
  }

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

    // Hide mobile controls when returning to menu
    if (window.mobileControls) {
      window.mobileControls.setGameStarted(false);
    }
  }

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

function showNotification(message, type = 'info', duration = 4000) {
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 100);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
}

window.showNotification = showNotification;
