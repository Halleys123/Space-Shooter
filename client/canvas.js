const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.imageSmoothingEnabled = false;

const keys = {};
const mouse = { x: 0, y: 0 };

// Game state management
let gameState = {
  isPaused: false,
  isGameOver: false,
  currentScore: 0,
};

// Make gameState globally accessible
window.gameState = gameState;

const player = new Player(ctx, canvas, './assets/sprites/player.png');
const stage = new Stage(ctx, canvas);
const blastManager = new BlastManager(ctx);
const collisionManager = new CollisionManager(blastManager);
const bulletManager = new BulletManager(ctx, canvas, collisionManager);

// Make player globally accessible
window.player = player;

// Set bullet manager reference in player
player.setBulletManager(bulletManager);

// Initialize player collision component
const playerCollision = CollisionManager.createForGameObject(player, 'player', {
  width: player.visuals.width * 0.6,
  height: player.visuals.height * 0.6,
  damage: 25,
  callbacks: {
    onCollisionEnter: (other, collisionData) => {
      console.log('Player collided with:', other.layer);

      // Handle enemy bullet impacts
      if (other.layer === 'enemyBullet') {
        // Create small explosion at impact point
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

  // Pause/unpause game with ESC key
  if (e.key === 'Escape') {
    if (!gameState.isGameOver) {
      gameState.isPaused = !gameState.isPaused;

      if (gameState.isPaused) {
        // Show pause message
        console.log('Game Paused - Press ESC to resume');
      } else {
        console.log('Game Resumed');
      }
    }
  }

  // Test health bar with 'H' key to damage player
  if (e.key === 'h' || e.key === 'H') {
    player.damage(10);
  }

  // Test health bar with 'G' key to heal player
  if (e.key === 'g' || e.key === 'G') {
    player.heal(10);
  }

  // Test stage advancement with 'N' key
  if (e.key === 'n' || e.key === 'N') {
    stage.forceNextStage();
  }

  // Test explosion effects with 'B' key
  if (e.key === 'b' || e.key === 'B') {
    blastManager.createExplosion(mouse.x, mouse.y, 'normal', 1);
  }

  // Test large explosion with 'V' key
  if (e.key === 'v' || e.key === 'V') {
    blastManager.createExplosion(mouse.x, mouse.y, 'large', 1.5);
  }

  // Test enemy explosion with 'C' key
  if (e.key === 'c' || e.key === 'C') {
    blastManager.createEnemyExplosion(mouse.x, mouse.y, 'kamikaze');
  }

  // Toggle collision debug mode with 'X' key
  if (e.key === 'x' || e.key === 'X') {
    collisionManager.setDebugMode(!collisionManager.debugMode);
  }

  // Test starfield effects with 'M' key (meteor shower)
  if (e.key === 'm' || e.key === 'M') {
    stage.getStarField().createMeteor();
  }

  // Test warp effect with 'T' key
  if (e.key === 't' || e.key === 'T') {
    stage.getStarField().startWarpEffect();
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

// Function to handle game over
function handleGameOver() {
  if (gameState.isGameOver) return;

  gameState.isGameOver = true;
  gameState.isPaused = true;

  // Get current score from player
  gameState.currentScore = player.score;

  // Add score to leaderboard
  addScoreToLeaderboard(gameState.currentScore);

  // Show leaderboard panel
  showGameOverLeaderboard();
}

// Function to add score to leaderboard
function addScoreToLeaderboard(score) {
  const playerName =
    prompt('Game Over! Enter your name for the leaderboard:') || 'Anonymous';
  const currentDate = new Date().toISOString().split('T')[0];

  const newEntry = {
    name: playerName,
    score: score,
    date: currentDate,
  };

  // Get existing leaderboard data from localStorage
  let leaderboardData = JSON.parse(
    localStorage.getItem('spaceShooterLeaderboard')
  ) || {
    'all-time': [],
    today: [],
    'this-week': [],
  };

  // Add to all-time leaderboard
  leaderboardData['all-time'].push(newEntry);
  leaderboardData['all-time'].sort((a, b) => b.score - a.score);
  leaderboardData['all-time'] = leaderboardData['all-time'].slice(0, 10); // Keep top 10

  // Add to today's leaderboard
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = leaderboardData['all-time'].filter(
    (entry) => entry.date === today
  );
  leaderboardData.today = todayEntries.slice(0, 10);

  // Add to this week's leaderboard
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekEntries = leaderboardData['all-time'].filter(
    (entry) => new Date(entry.date) >= oneWeekAgo
  );
  leaderboardData['this-week'] = weekEntries.slice(0, 10);

  // Save to localStorage
  localStorage.setItem(
    'spaceShooterLeaderboard',
    JSON.stringify(leaderboardData)
  );
}

// Function to show game over leaderboard
function showGameOverLeaderboard() {
  // Hide game canvas
  document.getElementById('gameCanvas').classList.add('hidden-canvas');

  // Show leaderboard panel
  const leaderboardPanel = document.querySelector('.leaderboard-panel');
  leaderboardPanel.classList.remove('hidden');

  // Update leaderboard entries from localStorage
  updateLeaderboardDisplay();

  // Add game over message to leaderboard
  const panelTitle = leaderboardPanel.querySelector('.panel-title');
  panelTitle.textContent = `GAME OVER - FINAL SCORE: ${gameState.currentScore}`;

  // Change "Back to Menu" button to "Play Again"
  const backToMenuButton = leaderboardPanel.querySelector('.back-to-menu');
  if (backToMenuButton) {
    backToMenuButton.textContent = 'Play Again';
  }
} // Function to update leaderboard display
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

function gameLoop() {
  // Don't update game if paused or game over
  if (gameState.isPaused || gameState.isGameOver) {
    requestAnimationFrame(gameLoop);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update game objects
  const playerCenter = {
    x: player.control.position.x + player.visuals.width / 2,
    y: player.control.position.y + player.visuals.height / 2,
  };

  player.update(keys, mouse);

  // Check if player is dead
  if (!player.isAlive() && !gameState.isGameOver) {
    handleGameOver();
    return;
  }

  stage.update(playerCenter);
  blastManager.update();
  bulletManager.update();

  // Update collision system
  collisionManager.update(); // Add collision components for new enemies
  stage.enemies.forEach((enemy) => {
    if (!enemy.collisionComponent) {
      // Set bullet manager for enemy
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

                // Handle kamikaze explosion
                if (enemy.constructor.name === 'KamikazeEnemy') {
                  // Create large explosion at collision point
                  blastManager.createExplosion(
                    collisionData.point.x,
                    collisionData.point.y,
                    'large',
                    1.5
                  );

                  // Deal additional explosion damage to player
                  player.takeDamage(enemy.damage * 0.5); // 50% additional explosion damage

                  // Mark kamikaze for removal (they explode on impact)
                  enemy.markedForRemoval = true;
                  enemy.isAlive = false;
                }
              }
            },
            onDamageReceived: (other, damage) => {
              console.log(`${enemy.constructor.name} took ${damage} damage`);
            },
          },
        }
      );

      collisionManager.addComponent(enemyCollision);
      enemy.setCollisionComponent(enemyCollision);
    }
  });

  // Draw game objects
  stage.draw(); // Draw enemies and stage UI
  player.draw();
  bulletManager.draw(); // Draw bullets
  blastManager.draw(); // Draw explosions on top

  // Draw collision debug if enabled
  collisionManager.drawDebug(ctx);

  // Debug information
  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';
  // ctx.fillText(`Score: ${player.score}`, 10, 30);
  // ctx.fillText(`Health: ${player.getHealth()}`, 10, 50);
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

  // Show pause message
  if (gameState.isPaused) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 48px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('GAME PAUSED', canvas.width / 2, canvas.height / 2 - 30);

    ctx.font = '24px Orbitron';
    ctx.fillText(
      'Press ESC to resume',
      canvas.width / 2,
      canvas.height / 2 + 30
    );
    ctx.restore();
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
