const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.imageSmoothingEnabled = false;

const keys = {};
const mouse = { x: 0, y: 0 };

const player = new Player(ctx, canvas, './assets/sprites/player.png');
const stage = new Stage(ctx, canvas);
const blastManager = new BlastManager(ctx);
const collisionManager = new CollisionManager(blastManager);

// Initialize player collision component
const playerCollision = CollisionManager.createForGameObject(player, 'player', {
  width: player.visuals.width * 0.6,
  height: player.visuals.height * 0.6,
  damage: 25,
  callbacks: {
    onCollisionEnter: (other, collisionData) => {
      console.log('Player collided with:', other.layer);
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
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update game objects
  const playerCenter = {
    x: player.control.position.x + player.visuals.width / 2,
    y: player.control.position.y + player.visuals.height / 2,
  };

  player.update(keys, mouse);
  stage.update(playerCenter);
  blastManager.update();

  // Update collision system
  collisionManager.update();

  // Add collision components for new enemies
  stage.enemies.forEach((enemy) => {
    if (!enemy.collisionComponent) {
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
  blastManager.draw(); // Draw explosions on top

  // Draw collision debug if enabled
  collisionManager.drawDebug(ctx);

  // Debug information
  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';
  ctx.fillText(
    `Active Blasts: ${blastManager.getActiveBlasts()}`,
    10,
    canvas.height - 80
  );
  ctx.fillText(
    `Active Particles: ${blastManager.getActiveParticles()}`,
    10,
    canvas.height - 60
  );
  ctx.fillText(
    `Collision Components: ${collisionManager.collisionComponents.length}`,
    10,
    canvas.height - 40
  );
  ctx.fillText(
    `Test: B=Blast, V=Large, C=Enemy, X=Debug`,
    10,
    canvas.height - 20
  );

  requestAnimationFrame(gameLoop);
}

gameLoop();
