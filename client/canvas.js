const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// DUMMY ELEMENTS FOR PLAYER
class Bullet {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.width = 5;
    this.height = 10;
  }

  update() {
    this.y -= this.speed;
  }

  draw() {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Player {
  control = {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    rotation: 0, // radians
    speed: 5,
    rotationSpeed: 0.1, // radians / frame
  };
  health = {
    current: 100,
    max: 100,
    isAlive: true,
  };
  score = 0;
  shooting = {
    fireRate: 2, // 2 bullets / second
    cooldown: 0,
    projectiles: [],
  };
  visuals = {
    sprite: ctx.createImageData(50, 50),
    width: 50,
    height: 50,
  };
}
