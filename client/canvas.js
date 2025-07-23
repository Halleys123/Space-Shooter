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

  // Draw game objects
  stage.draw(); // Draw enemies and stage UI
  player.draw();
  blastManager.draw(); // Draw explosions on top

  // Debug information
  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';
  ctx.fillText(
    `Active Blasts: ${blastManager.getActiveBlasts()}`,
    10,
    canvas.height - 60
  );
  ctx.fillText(
    `Active Particles: ${blastManager.getActiveParticles()}`,
    10,
    canvas.height - 40
  );
  ctx.fillText(
    `Test Controls: B=Normal Blast, V=Large Blast, C=Enemy Blast`,
    10,
    canvas.height - 20
  );

  requestAnimationFrame(gameLoop);
}

gameLoop();
