const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.imageSmoothingEnabled = false;
const screenSize = Math.min(window.screen.width, window.screen.height);
const isSmallScreen = screenSize < 908;
const uiScale = isSmallScreen ? 0.8 : 1.0;

const keys = {};
const mouse = { x: 0, y: 0 };

let gameState = {
  isGameStarted: false,
  isPaused: false,
  isGameOver: false,
  currentScore: 0,
  currentStage: 1,
  difficulty: 'medium',
  gameStartTime: null,
  enemiesKilled: 0,
  powerUpsCollected: 0,
  // Accuracy tracking
  bulletsFired: 0,
  damageDealt: 0,
  totalEnemyHealth: 0,
};

window.gameState = gameState;

let fps = 0;
let lastFrameTime = performance.now();
let frameCount = 0;
let fpsUpdateTime = 0;

let player,
  stage,
  blastManager,
  collisionManager,
  bulletManager,
  powerupManager;

function initializeGameObjects() {
  player = new Player(ctx, canvas, './assets/sprites/player.png');
  stage = new Stage(ctx, canvas);
  blastManager = new BlastManager(ctx);
  collisionManager = new CollisionManager(blastManager);
  bulletManager = new BulletManager(ctx, canvas, collisionManager);
  powerupManager = new PowerUpManager(ctx, canvas);

  window.collisionManager = collisionManager;
  window.player = player;
  window.powerupManager = powerupManager;

  player.setBulletManager(bulletManager);

  const playerCollision = CollisionManager.createForGameObject(
    player,
    'player',
    {
      width: player.visuals.width * 0.6,
      height: player.visuals.height * 0.6,
      damage: 25,
      callbacks: {
        onCollisionEnter: (other, collisionData) => {
          console.log('Player collided with:', other.layer);

          if (other.layer === 'enemyBullet') {
            blastManager.createExplosion(
              collisionData.point.x,
              collisionData.point.y,
              'small',
              0.6
            );
          }
        },
        onDamageReceived: (other, damage) => {
          console.log(`Player took ${damage} damage from ${other.layer}`);
        },
      },
    }
  );

  collisionManager.addComponent(playerCollision);
  player.setCollisionComponent(playerCollision);
}

initializeGameObjects();

// Helper function to check if user is currently typing in an input field
function isUserTyping() {
  const activeElement = document.activeElement;
  return (
    activeElement &&
    (activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true' ||
      activeElement.isContentEditable)
  );
}

document.addEventListener('keydown', (e) => {
  keys[e.key] = true;

  if (e.key === 'Escape') {
    if (!gameState.isGameOver) {
      gameState.isPaused = !gameState.isPaused;

      if (gameState.isPaused) {
        console.log('Game Paused - Press ESC to resume');

        if (window.audioManager) {
          window.audioManager.pauseMusic();
        }
      } else {
        console.log('Game Resumed');

        if (window.audioManager) {
          window.audioManager.resumeMusic();
        }
      }
    }
  }

  if (e.key === 'h' || e.key === 'H') {
    // Don't trigger help menu if user is typing in an input field
    if (!isUserTyping()) {
      if (e.shiftKey) {
        player.damage(10);
      } else {
        toggleHelpPanel();
      }
    }
  }

  if (e.key === 'F1') {
    e.preventDefault();

    if (typeof showPanel === 'function') {
      showPanel('settings');
    }
  }

  // if (e.key === 'g' || e.key === 'G') {
  //   player.heal(10);
  // }

  // if (e.key === 'z') {
  //   player.score += 1000;
  // }

  // if (e.key === '1') {
  //   if (powerupManager) powerupManager.spawnPowerup('firerate', mouse.x, mouse.y);
  // }

  // if (e.key === '2') {
  //   if (powerupManager) powerupManager.spawnPowerup('health', mouse.x, mouse.y);
  // }

  // if (e.key === '3') {
  //   if (powerupManager) powerupManager.spawnPowerup('shield', mouse.x, mouse.y);
  // }

  // if (e.key === 'n' || e.key === 'N') {
  //   stage.forceNextStage();
  // }

  // if (e.key === 'b' || e.key === 'B') {
  //   blastManager.createExplosion(mouse.x, mouse.y, 'normal', 1);
  // }

  // if (e.key === 'v' || e.key === 'V') {
  //   blastManager.createExplosion(mouse.x, mouse.y, 'large', 1.5);
  // }

  // if (e.key === 'c' || e.key === 'C') {
  //   blastManager.createEnemyExplosion(mouse.x, mouse.y, 'kamikaze');
  // }

  // if (e.key === 'x' || e.key === 'X') {
  //   collisionManager.setDebugMode(!collisionManager.debugMode);
  // }

  // if (e.key === 'm' || e.key === 'M') {
  //   stage.getStarField().createMeteor();
  // }

  // if (e.key === 't' || e.key === 'T') {
  //   stage.getStarField().startWarpEffect();
  // }

  if (e.key === 'p' || e.key === 'P') {
    if (window.performanceManager) {
      const currentLevel = window.performanceManager.performanceLevel;
      const levels = ['low', 'medium', 'high'];
      const currentIndex = levels.indexOf(currentLevel);
      const nextIndex = (currentIndex + 1) % levels.length;
      window.performanceManager.setPerformanceLevel(levels[nextIndex]);
      console.log(`Performance level changed to: ${levels[nextIndex]}`);

      const settings = window.performanceManager.getSettings();
      stage.getStarField().setStarCount(settings.starCount);
      stage.getStarField().enableGlow = settings.enableGlow;
      stage.getStarField().enableFilters = settings.enableFilters;
    }
  }

  if (e.key === 'r' || e.key === 'R') {
    if (window.spritePreloader) {
      window.spritePreloader.diagnoseSprites();
    }
  }

  if (e.key === 'u' || e.key === 'U') {
    if (window.spritePreloader) {
      window.spritePreloader.reloadFailedSprites();
    }
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

function initializeGame() {
  if (typeof player === 'undefined' || !player) {
    initializeGameObjects();
  }

  gameState.isGameStarted = true;
  gameState.isPaused = false;
  gameState.isGameOver = false;
  gameState.currentScore = 0;
  gameState.currentStage = 1;
  gameState.difficulty = 'medium';
  gameState.gameStartTime = Date.now();
  gameState.enemiesKilled = 0;
  gameState.powerUpsCollected = 0;
  // Reset accuracy tracking
  gameState.bulletsFired = 0;
  gameState.damageDealt = 0;
  gameState.totalEnemyHealth = 0;

  player.healthBar.reset();
  player.score = 0;

  if (player.powerupEffects) {
    if (player.powerupEffects.firerate) {
      player.shooting.fireRate = player.powerupEffects.firerate.originalValue;
    }

    if (player.powerupEffects.shield) {
      player.healthBar.maxHealth =
        player.powerupEffects.shield.originalMaxHealth;
    }
    delete player.powerupEffects;
  }

  if (powerupManager) {
    powerupManager.clearAll();
  }

  player.health.collisionDamageTimer = 0;

  player.control.position.x = canvas.width / 2 - player.visuals.width / 2;
  player.control.position.y = canvas.height - player.visuals.height - 50;

  if (window.mobileControls) {
    window.mobileControls.setGameStarted(true);
  }

  // Create game session if authenticated
  if (window.apiService && window.apiService.isAuthenticated()) {
    createGameSession();
  }

  console.log('Game started!');
}

window.initializeGame = initializeGame;

async function createGameSession() {
  try {
    if (window.apiService && window.apiService.isAuthenticated()) {
      const difficulty =
        gameState.difficulty === 'medium'
          ? 'normal'
          : gameState.difficulty || 'normal';
      await window.apiService.createGameSession(difficulty);
      console.log('Game session created successfully');
    }
  } catch (error) {
    console.error('Failed to create game session:', error);
    // Continue with the game even if session creation fails
  }
}

async function endGameSession(finalData) {
  try {
    if (window.apiService && window.apiService.isAuthenticated()) {
      await window.apiService.endGameSession(finalData);
      console.log('Game session ended successfully');
    }
  } catch (error) {
    console.error('Failed to end game session:', error);
    // Don't block the game over flow if session ending fails
  }
}
function drawPauseScreen() {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold ' + 48 * uiScale + 'px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText('GAME PAUSED', canvas.width / 2, canvas.height / 2 - 30);

  ctx.font = 24 * uiScale + 'px Orbitron';
  ctx.fillText('Press ESC to resume', canvas.width / 2, canvas.height / 2 + 30);
  ctx.restore();
}

function applyGraphicsSettings() {
  if (!window.performanceManager) return;

  if (typeof window.gameSettings === 'undefined') return;

  if (window.performanceManager.isInEmergencyPerformanceMode()) {
    console.log('Emergency mode active, skipping manual graphics settings');
    return;
  }

  const quality = window.gameSettings.graphics.quality;

  window.performanceManager.setPerformanceLevel(quality);

  const settings = window.performanceManager.getSettings();

  if (typeof stage !== 'undefined' && stage && stage.getStarField) {
    stage.getStarField().setStarCount(settings.starCount);
    stage.getStarField().enableGlow =
      settings.enableGlow && window.gameSettings.graphics.particleEffects;
    stage.getStarField().enableFilters = settings.enableFilters;
  }

  if (
    typeof blastManager !== 'undefined' &&
    blastManager &&
    !window.gameSettings.graphics.particleEffects
  ) {
    const currentSettings = window.performanceManager.getSettings();
    currentSettings.maxParticles.thrust = Math.floor(
      currentSettings.maxParticles.thrust * 0.2
    );
    currentSettings.maxParticles.collision = Math.floor(
      currentSettings.maxParticles.collision * 0.2
    );
    currentSettings.maxParticles.blast = Math.floor(
      currentSettings.maxParticles.blast * 0.2
    );
  } else if (blastManager && window.gameSettings.graphics.particleEffects) {
    window.performanceManager.setPerformanceLevel(quality);
  }

  console.log(
    `Graphics settings applied - Quality: ${quality}, Particles: ${
      window.gameSettings.graphics.particleEffects ? 'On' : 'Off'
    }`
  );
}

function handleGameOver() {
  if (gameState.isGameOver) return;

  gameState.isGameOver = true;
  gameState.isPaused = true;

  gameState.currentScore = player.score;

  if (window.mobileControls) {
    window.mobileControls.setGameStarted(false);
  }

  // End game session before adding score to leaderboard
  if (window.apiService && window.apiService.isAuthenticated()) {
    // Calculate accuracy for session end
    let accuracy = 0;
    if (gameState.totalEnemyHealth > 0) {
      accuracy = gameState.damageDealt / gameState.totalEnemyHealth;
      accuracy = Math.min(accuracy, 1);
    }

    const sessionData = {
      finalScore: gameState.currentScore,
      finalStage: gameState.currentStage || 1,
      finalCycle: 1,
      totalPlayTime:
        Math.floor((Date.now() - gameState.gameStartTime) / 1000) || 1,
      enemiesKilled: gameState.enemiesKilled || 0,
      accuracy: parseFloat(accuracy.toFixed(4)),
      powerupsCollected: gameState.powerUpsCollected || 0,
      endReason: player.isAlive ? 'quit' : 'game-over',
    };

    endGameSession(sessionData);
  }

  addScoreToLeaderboard(gameState.currentScore);

  showGameOverLeaderboard();
}

async function addScoreToLeaderboard(score) {
  let playerName = 'Anonymous';
  let shouldSubmitToBackend = false;

  if (window.authUI && window.authUI.isAuthenticated()) {
    const currentUser = window.authUI.getCurrentUser();
    playerName = currentUser.username;
    shouldSubmitToBackend = true;
  } else {
    const enteredName = prompt(
      'Game Over! Enter your name for the leaderboard:'
    );
    if (enteredName) {
      playerName = enteredName.trim();
    }
  }

  const currentDate = new Date().toISOString().split('T')[0];

  const newEntry = {
    name: playerName,
    score: score,
    date: currentDate,
  };

  if (shouldSubmitToBackend && window.apiService) {
    try {
      // Calculate accuracy: damageDealt / totalEnemyHealth
      let accuracy = 0;
      if (gameState.totalEnemyHealth > 0) {
        accuracy = gameState.damageDealt / gameState.totalEnemyHealth;
        // Cap accuracy at 100% but keep in 0-1 range
        accuracy = Math.min(accuracy, 1);
      }

      const gameData = {
        username: playerName,
        score: score,
        stage: gameState.currentStage || 1,
        cycle: 1,
        difficulty:
          gameState.difficulty === 'medium'
            ? 'normal'
            : gameState.difficulty || 'normal',
        playTime:
          Math.floor((Date.now() - gameState.gameStartTime) / 1000) || 1,
        enemiesKilled: gameState.enemiesKilled || 0,
        powerupsCollected: gameState.powerUpsCollected || 0,
        accuracy: parseFloat(accuracy.toFixed(4)),
        gameVersion: '1.0.0',
        sessionId: window.apiService.sessionId,
      };

      console.log('Submitting game data to backend:', gameData);

      await window.apiService.submitScore(gameData);
      console.log('Score submitted to backend successfully');

      if (window.showNotification) {
        window.showNotification('Score saved to your profile!', 'success');
      }
    } catch (error) {
      console.error('Failed to submit score to backend:', error);
      if (window.showNotification) {
        window.showNotification('Failed to save score online', 'error');
      }
    }
  }

  // Only save to local storage if user is NOT authenticated (for local leaderboard viewing)
  if (!shouldSubmitToBackend) {
    let leaderboardData = JSON.parse(
      localStorage.getItem('spaceShooterLeaderboard')
    ) || {
      'all-time': [],
      today: [],
      'this-week': [],
    };

    leaderboardData['all-time'].push(newEntry);
    leaderboardData['all-time'].sort((a, b) => b.score - a.score);
    leaderboardData['all-time'] = leaderboardData['all-time'].slice(0, 10);

    const today = new Date().toISOString().split('T')[0];
    const todayEntries = leaderboardData['all-time'].filter(
      (entry) => entry.date === today
    );
    leaderboardData.today = todayEntries.slice(0, 10);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekEntries = leaderboardData['all-time'].filter(
      (entry) => new Date(entry.date) >= oneWeekAgo
    );
    leaderboardData['this-week'] = weekEntries.slice(0, 10);

    localStorage.setItem(
      'spaceShooterLeaderboard',
      JSON.stringify(leaderboardData)
    );
  }
}

async function showGameOverLeaderboard() {
  document.getElementById('gameCanvas').classList.add('hidden-canvas');

  const leaderboardPanel = document.querySelector('.leaderboard-panel');
  leaderboardPanel.classList.remove('hidden');

  if (window.leaderboardManager) {
    await window.leaderboardManager.refresh();
  } else {
    if (window.updateLeaderboardDisplay) {
      window.updateLeaderboardDisplay();
    }
  }

  const panelTitle = leaderboardPanel.querySelector('.panel-title');
  panelTitle.textContent = `GAME OVER - FINAL SCORE: ${gameState.currentScore}`;

  const backToMenuButton = leaderboardPanel.querySelector('.back-to-menu');
  if (backToMenuButton) {
    backToMenuButton.textContent = 'Play Again';
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
  const activeTab = document
    .querySelector('.tab-button.active')
    .getAttribute('data-tab');
  const entries = leaderboardData[activeTab] || [];

  entriesContainer.innerHTML = '';

  if (entries.length === 0) {
    entriesContainer.innerHTML =
      '<div class="leaderboard-entry"><span class="no-scores">No scores yet!</span></div>';
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

function toggleHelpPanel() {
  const helpPanel = document.querySelector('.help-panel');
  const canvas = document.getElementById('gameCanvas');
  const helpHint = document.querySelector('.help-hint');

  if (helpPanel.classList.contains('hidden')) {
    helpPanel.classList.remove('hidden');
    canvas.classList.add('hidden-canvas');
    helpHint.style.display = 'none';
    gameState.isPaused = true;
  } else {
    helpPanel.classList.add('hidden');
    canvas.classList.remove('hidden-canvas');
    helpHint.style.display = 'block';
    gameState.isPaused = false;
  }
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.close-panel').forEach((button) => {
    button.addEventListener('click', function () {
      const panel = this.getAttribute('data-panel');
      if (panel === 'help') {
        toggleHelpPanel();
      }
    });
  });

  document.querySelectorAll('.back-to-game').forEach((button) => {
    button.addEventListener('click', function () {
      const panel = this.getAttribute('data-panel');
      if (panel === 'help') {
        toggleHelpPanel();
      }
    });
  });
});

window.addEventListener('performanceEmergency', function (event) {
  const { isEmergency, fps, settings } = event.detail;

  if (isEmergency) {
    console.warn(`Emergency mode activated due to low FPS (${fps.toFixed(1)})`);

    if (typeof stage !== 'undefined' && stage && stage.getStarField) {
      stage.getStarField().setStarCount(settings.starCount);
      stage.getStarField().enableGlow = false;
      stage.getStarField().enableFilters = false;
    }

    if (
      typeof blastManager !== 'undefined' &&
      blastManager &&
      blastManager.maxParticles !== undefined
    ) {
      blastManager.maxParticles = settings.maxParticles.blast;
    }

    if (
      window.thrustParticles &&
      window.thrustParticles.maxParticles !== undefined
    ) {
      window.thrustParticles.maxParticles = settings.maxParticles.thrust;
    }

    if (
      window.collisionParticles &&
      window.collisionParticles.maxParticles !== undefined
    ) {
      window.collisionParticles.maxParticles = settings.maxParticles.collision;
    }

    console.log('Emergency graphics settings applied:', settings);
    console.log(
      'Emergency mode will persist until user manually changes graphics settings'
    );
  } else {
    console.log(
      `Emergency mode manually disabled by user (Current FPS: ${fps.toFixed(
        1
      )})`
    );

    try {
      applyGraphicsSettings();
    } catch (error) {
      console.warn('Could not restore graphics settings:', error);
    }

    console.log('User-selected graphics settings restored');
  }
});

function gameLoop() {
  const currentTime = performance.now();
  const deltaTime = currentTime - lastFrameTime;
  lastFrameTime = currentTime;

  frameCount++;
  fpsUpdateTime += deltaTime;

  if (fpsUpdateTime >= 1000) {
    fps = Math.round((frameCount * 1000) / fpsUpdateTime);
    frameCount = 0;
    fpsUpdateTime = 0;
  }

  if (window.performanceManager) {
    window.performanceManager.updateFPS();
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  if (!gameState.isGameStarted) {
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameState.isPaused || gameState.isGameOver) {
    if (gameState.isPaused && !gameState.isGameOver) {
      drawPauseScreen();
    }
    requestAnimationFrame(gameLoop);
    return;
  }

  if (
    !player ||
    !stage ||
    !blastManager ||
    !bulletManager ||
    !collisionManager ||
    !powerupManager
  ) {
    console.warn('Game objects not initialized, initializing now...');
    initializeGameObjects();
    requestAnimationFrame(gameLoop);
    return;
  }

  const playerCenter = {
    x: player.control.position.x + player.visuals.width / 2,
    y: player.control.position.y + player.visuals.height / 2,
  };

  const mergedKeys = { ...keys };
  let mergedMouse = { ...mouse };

  if (window.mobileControls) {
    const mobileKeys = window.mobileControls.getMobileKeys();
    Object.assign(mergedKeys, mobileKeys);

    const mobileMouse = window.mobileControls.getMobileMouse(canvas);
    if (mobileMouse) {
      mergedMouse = mobileMouse;
    }
  }

  player.update(mergedKeys, mergedMouse);

  if (!player.isAlive && !gameState.isGameOver) {
    handleGameOver();
    return;
  }

  stage.update(playerCenter);
  blastManager.update();
  bulletManager.update();
  powerupManager.update();

  powerupManager.checkPlayerCollision(player);

  collisionManager.update();
  stage.enemies.forEach((enemy) => {
    if (!enemy.collisionComponent) {
      enemy.setBulletManager(bulletManager);

      const enemyCollision = CollisionManager.createForGameObject(
        enemy,
        'enemy',
        {
          width: enemy.width * 0.9,
          height: enemy.height * 0.9,
          damage: enemy.damage,
          callbacks: {
            onCollisionEnter: (other, collisionData) => {
              if (other.layer === 'player') {
                console.log(`${enemy.constructor.name} collided with player`);

                if (enemy.constructor.name === 'KamikazeEnemy') {
                  blastManager.createExplosion(
                    collisionData.point.x,
                    collisionData.point.y,
                    'large',
                    1.5
                  );

                  player.takeDamage(enemy.damage * 0.5);

                  enemy.markedForRemoval = true;
                  enemy.isAlive = false;
                } else if (enemy.constructor.name === 'BossEnemy') {
                  blastManager.createExplosion(
                    collisionData.point.x,
                    collisionData.point.y,
                    'large',
                    2.0
                  );

                  player.takeDamage(enemy.damage * 0.7);
                }
              }
            },
            onDamageReceived: (other, damage) => {
              console.log(`${enemy.constructor.name} took ${damage} damage`);

              if (enemy.constructor.name === 'BossEnemy') {
                blastManager.createExplosion(
                  enemy.position.x + enemy.width / 2,
                  enemy.position.y + enemy.height / 2,
                  'small',
                  0.8
                );
              }
            },
          },
        }
      );

      collisionManager.addComponent(enemyCollision);
      enemy.setCollisionComponent(enemyCollision);
    }
  });

  stage.draw();
  player.draw();
  bulletManager.draw();
  powerupManager.draw();
  blastManager.draw();

  collisionManager.drawDebug(ctx);

  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';

  if (
    typeof window.gameSettings !== 'undefined' &&
    window.gameSettings.graphics.showFps
  ) {
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold ' + 16 * uiScale + 'px Arial';

    const isEmergencyMode =
      window.performanceManager &&
      window.performanceManager.isInEmergencyPerformanceMode();
    const currentFps = window.performanceManager
      ? window.performanceManager.getCurrentFPS()
      : fps;

    if (isEmergencyMode) {
      ctx.fillStyle = '#ff4444';
      ctx.fillText(
        `FPS: ${Math.round(currentFps)} [EMERGENCY]`,
        canvas.width - 180,
        30
      );
    } else {
      if (currentFps >= 50) ctx.fillStyle = '#00ff00';
      else if (currentFps >= 30) ctx.fillStyle = '#ffff00';
      else ctx.fillStyle = '#ff0000';

      ctx.fillText(`FPS: ${Math.round(currentFps)}`, canvas.width - 100, 30);
    }
  }

  ctx.fillStyle = 'white';
  ctx.font = 14 * uiScale + 'px Arial';

  const performanceLevel = window.performanceManager
    ? window.performanceManager.performanceLevel
    : 'unknown';
  const settings = window.performanceManager
    ? window.performanceManager.getSettings()
    : {};
  const isEmergencyMode =
    window.performanceManager &&
    window.performanceManager.isInEmergencyPerformanceMode();
  const avgFps = window.performanceManager
    ? window.performanceManager.getAverageFPS()
    : fps;

  if (isEmergencyMode) {
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('⚠️ EMERGENCY LOW GRAPHICS MODE', 10, canvas.height - 200);
    ctx.fillStyle = 'white';
    ctx.font = 14 * uiScale + 'px Arial';
  }

  ctx.fillText(
    `Performance Level: ${performanceLevel.toUpperCase()}${
      isEmergencyMode ? ' (OVERRIDE)' : ''
    }`,
    10,
    canvas.height - 180
  );
  ctx.fillText(
    `Avg FPS: ${Math.round(avgFps)} | Current: ${Math.round(fps)}`,
    10,
    canvas.height - 160
  );
  ctx.fillText(
    `Star Count: ${settings.starCount || 'N/A'}`,
    10,
    canvas.height - 120
  );
  ctx.fillText(
    `Active Blasts: ${blastManager.getActiveBlasts()}`,
    10,
    canvas.height - 100
  );
  ctx.fillText(
    `Active Particles: ${blastManager.getActiveParticles()}`,
    10,
    canvas.height - 80
  );
  ctx.fillText(
    `Collision Components: ${collisionManager.collisionComponents.length}`,
    10,
    canvas.height - 60
  );
  ctx.fillText(
    `Active Bullets: ${bulletManager.getActiveBullets()}`,
    10,
    canvas.height - 40
  );
  ctx.fillText(
    `Stars: ${stage.getStarField().stars.length}`,
    10,
    canvas.height - 20
  );

  if (typeof window.gameSettings !== 'undefined') {
    ctx.fillText(
      `Particles: ${
        window.gameSettings.graphics.particleEffects ? 'ON' : 'OFF'
      }`,
      10,
      canvas.height - 160
    );
  }

  if (keys['KeyX']) {
    ctx.fillStyle = '#ffff00';
    ctx.font = 12 * uiScale + 'px Arial';
    ctx.fillText(
      'Collision Debug Mode - Press X to toggle',
      10,
      canvas.height - 200
    );

    if (collisionManager) {
      collisionManager.setDebugMode(true);
      collisionManager.drawDebug(ctx);
    }
  } else {
    if (collisionManager) {
      collisionManager.setDebugMode(false);
    }
  }

  ctx.restore();
  requestAnimationFrame(gameLoop);
}

gameLoop();
