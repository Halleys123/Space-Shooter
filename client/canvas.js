const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.imageSmoothingEnabled = false;

const keys = {};
const mouse = { x: 0, y: 0 };

const player = new Player(ctx, canvas, './assets/sprites/player.png');

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
  player.update();
  player.draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
