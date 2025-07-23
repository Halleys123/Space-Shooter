const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.imageSmoothingEnabled = false;

const keys = {};
const mouse = { x: 0, y: 0 };

let gameState = {
  isPaused: false,
  isGameOver: false,
  currentScore: 0,
};

window.gameState = gameState;

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
      } else {
        console.log('Game Resumed');
      }
    }
  }

  if (e.key === 'h' || e.key === 'H') {
    player.damage(10);
  }

  if (e.key === 'g' || e.key === 'G') {
    player.heal(10);
  }

  if (e.key === 'z') {
    player.score += 1000;
  }

  if (e.key === 'n' || e.key === 'N') {
    stage.forceNextStage();
  }

  if (e.key === 'b' || e.key === 'B') {
    blastManager.createExplosion(mouse.x, mouse.y, 'normal', 1);
  }

  if (e.key === 'v' || e.key === 'V') {
    blastManager.createExplosion(mouse.x, mouse.y, 'large', 1.5);
  }

  if (e.key === 'c' || e.key === 'C') {
    blastManager.createEnemyExplosion(mouse.x, mouse.y, 'kamikaze');
  }

  if (e.key === 'x' || e.key === 'X') {
    collisionManager.setDebugMode(!collisionManager.debugMode);
  }

  if (e.key === 'm' || e.key === 'M') {
    stage.getStarField().createMeteor();
  }

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

function handleGameOver() {
  if (gameState.isGameOver) return;

  gameState.isGameOver = true;
  gameState.isPaused = true;

  gameState.currentScore = player.score;

  addScoreToLeaderboard(gameState.currentScore);

  showGameOverLeaderboard();
}

function addScoreToLeaderboard(score) {
  const playerName =
    prompt('Game Over! Enter your name for the leaderboard:') || 'Anonymous';
  const currentDate = new Date().toISOString().split('T')[0];

  const newEntry = {
    name: playerName,
    score: score,
    date: currentDate,
  };

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

function showGameOverLeaderboard() {
  document.getElementById('gameCanvas').classList.add('hidden-canvas');

  const leaderboardPanel = document.querySelector('.leaderboard-panel');
  leaderboardPanel.classList.remove('hidden');

  updateLeaderboardDisplay();

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

function gameLoop() {
  if (gameState.isPaused || gameState.isGameOver) {
    requestAnimationFrame(gameLoop);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

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

  stage.draw();
  player.draw();
  bulletManager.draw();
  blastManager.draw();

  collisionManager.drawDebug(ctx);

  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';

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
