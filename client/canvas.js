const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.imageSmoothingEnabled = false;

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
};

window.gameState = gameState;

let fps = 0;
let lastFrameTime = performance.now();
let frameCount = 0;
let fpsUpdateTime = 0;

const player = new Player(ctx, canvas, './assets/sprites/player.png');
const stage = new Stage(ctx, canvas);
const blastManager = new BlastManager(ctx);
const collisionManager = new CollisionManager(blastManager);
const bulletManager = new BulletManager(ctx, canvas, collisionManager);

window.player = player;

player.setBulletManager(bulletManager);

const playerCollision = CollisionManager.createForGameObject(player, 'player', {
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
});

collisionManager.addComponent(playerCollision);
player.setCollisionComponent(playerCollision);

document.addEventListener('keydown', (e) => {
  keys[e.key] = true;

  if (e.key === 'Escape') {
    if (!gameState.isGameOver) {
      gameState.isPaused = !gameState.isPaused;

      if (gameState.isPaused) {
        console.log('Game Paused - Press ESC to resume');
        // Pause music when game is paused
        if (window.audioManager) {
          window.audioManager.pauseMusic();
        }
      } else {
        console.log('Game Resumed');
        // Resume music when game is unpaused
        if (window.audioManager) {
          window.audioManager.resumeMusic();
        }
      }
    }
  }

  // if (e.key === 'h' || e.key === 'H') {
  //   if (e.shiftKey) {
  //     player.damage(10);
  //   } else {
  //     toggleHelpPanel();
  //   }
  // }

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

  if (e.key === 'n' || e.key === 'N') {
    stage.forceNextStage();
  }

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
  gameState.isGameStarted = true;
  gameState.isPaused = false;
  gameState.isGameOver = false;
  gameState.currentScore = 0;
  gameState.currentStage = 1;
  gameState.difficulty = 'medium';
  gameState.gameStartTime = Date.now();
  gameState.enemiesKilled = 0;
  gameState.powerUpsCollected = 0;

  // Reset player state
  player.healthBar.reset(); // Reset health using the HealthBar's reset method
  player.score = 0;

  // Reset collision damage timer
  player.health.collisionDamageTimer = 0;

  // Reset player position
  player.control.position.x = canvas.width / 2 - player.visuals.width / 2;
  player.control.position.y = canvas.height - player.visuals.height - 50;

  console.log('Game started!');
}

// Make initializeGame available globally so script.js can call it
window.initializeGame = initializeGame;
function drawPauseScreen() {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 48px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText('GAME PAUSED', canvas.width / 2, canvas.height / 2 - 30);

  ctx.font = '24px Orbitron';
  ctx.fillText('Press ESC to resume', canvas.width / 2, canvas.height / 2 + 30);
  ctx.restore();
}

function applyGraphicsSettings() {
  if (!window.performanceManager) return;

  if (typeof window.gameSettings === 'undefined') return;

  const quality = window.gameSettings.graphics.quality;

  window.performanceManager.setPerformanceLevel(quality);

  const settings = window.performanceManager.getSettings();
  if (stage && stage.getStarField) {
    stage.getStarField().setStarCount(settings.starCount);
    stage.getStarField().enableGlow =
      settings.enableGlow && window.gameSettings.graphics.particleEffects;
    stage.getStarField().enableFilters = settings.enableFilters;
  }

  if (blastManager && !window.gameSettings.graphics.particleEffects) {
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

  addScoreToLeaderboard(gameState.currentScore);

  showGameOverLeaderboard();
}

async function addScoreToLeaderboard(score) {
  let playerName = 'Anonymous';
  let shouldSubmitToBackend = false;

  // Check if user is authenticated
  if (window.authUI && window.authUI.isAuthenticated()) {
    const currentUser = window.authUI.getCurrentUser();
    playerName = currentUser.username;
    shouldSubmitToBackend = true;
  } else {
    // Prompt for name for anonymous players
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

  // Submit to backend if user is authenticated
  if (shouldSubmitToBackend && window.apiService) {
    try {
      const gameData = {
        score: score,
        stage: gameState.currentStage || 1,
        cycle: 1, // Add cycle field as required by backend
        difficulty:
          gameState.difficulty === 'medium'
            ? 'normal'
            : gameState.difficulty || 'normal',
        playTime:
          Math.floor((Date.now() - gameState.gameStartTime) / 1000) || 1,
        enemiesKilled: gameState.enemiesKilled || 0,
        powerupsCollected: gameState.powerUpsCollected || 0,
        accuracy: 85.0, // Add accuracy field as required by backend
      };

      await window.apiService.submitScore(gameData);
      console.log('Score submitted to backend successfully');

      // Show success notification
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

  // Still save to local storage for offline functionality
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

async function showGameOverLeaderboard() {
  document.getElementById('gameCanvas').classList.add('hidden-canvas');

  const leaderboardPanel = document.querySelector('.leaderboard-panel');
  leaderboardPanel.classList.remove('hidden');

  // Refresh leaderboard with new data
  if (window.leaderboardManager) {
    await window.leaderboardManager.refresh();
  } else {
    // Fallback to local leaderboard display
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

  // Clear canvas regardless of game state
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // If game hasn't started yet, just continue the loop without rendering game elements
  if (!gameState.isGameStarted) {
    requestAnimationFrame(gameLoop);
    return;
  }

  // If game is paused or game over, show pause/game over screen
  if (gameState.isPaused || gameState.isGameOver) {
    if (gameState.isPaused && !gameState.isGameOver) {
      drawPauseScreen();
    }
    requestAnimationFrame(gameLoop);
    return;
  }

  const playerCenter = {
    x: player.control.position.x + player.visuals.width / 2,
    y: player.control.position.y + player.visuals.height / 2,
  };

  player.update(keys, mouse);

  if (!player.isAlive && !gameState.isGameOver) {
    handleGameOver();
    return;
  }

  stage.update(playerCenter);
  blastManager.update();
  bulletManager.update();

  collisionManager.update();
  stage.enemies.forEach((enemy) => {
    if (!enemy.collisionComponent) {
      enemy.setBulletManager(bulletManager);

      const enemyCollision = CollisionManager.createForGameObject(
        enemy,
        'enemy',
        {
          width: enemy.width * 0.8,
          height: enemy.height * 0.8,
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
                  // Boss collision creates larger explosion but doesn't destroy boss
                  blastManager.createExplosion(
                    collisionData.point.x,
                    collisionData.point.y,
                    'large',
                    2.0
                  );

                  player.takeDamage(enemy.damage * 0.7); // Boss does more collision damage
                }
              }
            },
            onDamageReceived: (other, damage) => {
              console.log(`${enemy.constructor.name} took ${damage} damage`);

              // Create hit effect for boss
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
  blastManager.draw();

  collisionManager.drawDebug(ctx);

  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';

  if (
    typeof window.gameSettings !== 'undefined' &&
    window.gameSettings.graphics.showFps
  ) {
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`FPS: ${fps}`, canvas.width - 100, 30);

    if (fps >= 50) ctx.fillStyle = '#00ff00';
    else if (fps >= 30) ctx.fillStyle = '#ffff00';
    else ctx.fillStyle = '#ff0000';

    ctx.fillText(`FPS: ${fps}`, canvas.width - 100, 30);
  }

  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';

  const performanceLevel = window.performanceManager
    ? window.performanceManager.performanceLevel
    : 'unknown';
  const settings = window.performanceManager
    ? window.performanceManager.getSettings()
    : {};

  ctx.fillText(
    `Performance Level: ${performanceLevel.toUpperCase()}`,
    10,
    canvas.height - 140
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

  requestAnimationFrame(gameLoop);
}

gameLoop();
