const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.imageSmoothingEnabled = false;

const keys = {};
const mouse = { x: 0, y: 0 };

const sprites = {
  vfx: {
    player: undefined,
    player_thrust: undefined,
    player_bump_on_boundary: undefined,
  },
};

class Player {
  control = {
    position: { x: ctx.canvas.width / 2, y: ctx.canvas.height - 150 },
    velocity: { x: 0, y: 0 },
    rotation: 0,
    rotationSpeed: 0,
    maxRotationSpeed: 0.05,
    speed: 0.2,
    friction: 0.98,
    maxSpeed: 5,
  };
  health = {
    current: 100,
    max: 100,
    isAlive: true,
  };
  score = 0;
  shooting = {
    fireRate: 2,
    cooldown: 0,
    projectiles: [],
  };
  visuals = {
    width: 105,
    height: 150,
  };
  ctx = undefined;

  constructor(ctx, src) {
    this.ctx = ctx;
    sprites.player = new Image(this.visuals.width, this.visuals.height);
    sprites.player.src = src;
    sprites.player.onload = () => {
      this.draw();
    };

    // Initialize particle system
    this.thrustParticles = new ThrustParticleSystem();
    this.collisionParticles = new CollisionParticleSystem();
  }
  update() {
    let isAccelerating = false;

    if (keys['w'] || keys['W']) {
      this.control.velocity.x +=
        Math.sin(this.control.rotation) * this.control.speed;
      this.control.velocity.y -=
        Math.cos(this.control.rotation) * this.control.speed;
      isAccelerating = true;
    }
    if (keys['s'] || keys['S']) {
      this.control.velocity.x -=
        Math.sin(this.control.rotation) * this.control.speed;
      this.control.velocity.y +=
        Math.cos(this.control.rotation) * this.control.speed;
      isAccelerating = true;
    }
    if (keys['a'] || keys['A']) {
      this.control.velocity.x -=
        Math.cos(this.control.rotation) * this.control.speed;
      this.control.velocity.y -=
        Math.sin(this.control.rotation) * this.control.speed;
      isAccelerating = true;
    }
    if (keys['d'] || keys['D']) {
      this.control.velocity.x +=
        Math.cos(this.control.rotation) * this.control.speed;
      this.control.velocity.y +=
        Math.sin(this.control.rotation) * this.control.speed;
      isAccelerating = true;
    }

    const speed = Math.sqrt(
      this.control.velocity.x ** 2 + this.control.velocity.y ** 2
    );
    if (speed > this.control.maxSpeed) {
      this.control.velocity.x =
        (this.control.velocity.x / speed) * this.control.maxSpeed;
      this.control.velocity.y =
        (this.control.velocity.y / speed) * this.control.maxSpeed;
    }

    this.control.position.x += this.control.velocity.x;
    this.control.position.y += this.control.velocity.y;

    this.control.velocity.x *= this.control.friction;
    this.control.velocity.y *= this.control.friction;

    // Store previous position for collision detection
    const prevX = this.control.position.x;
    const prevY = this.control.position.y;

    this.control.position.x = Math.max(
      0,
      Math.min(canvas.width - this.visuals.width, this.control.position.x)
    );
    this.control.position.y = Math.max(
      0,
      Math.min(canvas.height - this.visuals.height, this.control.position.y)
    );

    // Check for boundary collisions and emit particles
    const centerX = this.control.position.x + this.visuals.width / 2;
    const centerY = this.control.position.y + this.visuals.height / 2;

    if (prevX !== this.control.position.x) {
      if (this.control.position.x === 0) {
        // Hit left boundary
        this.collisionParticles.emit(centerX, centerY, 'left');
      } else if (
        this.control.position.x ===
        canvas.width - this.visuals.width
      ) {
        // Hit right boundary
        this.collisionParticles.emit(centerX, centerY, 'right');
      }
    }

    if (prevY !== this.control.position.y) {
      if (this.control.position.y === 0) {
        // Hit top boundary
        this.collisionParticles.emit(centerX, centerY, 'top');
      } else if (
        this.control.position.y ===
        canvas.height - this.visuals.height
      ) {
        // Hit bottom boundary
        this.collisionParticles.emit(centerX, centerY, 'bottom');
      }
    }
    this.control.rotation =
      Math.atan2(mouse.y - centerY, mouse.x - centerX) + Math.PI / 2;

    // Update and emit thrust particles
    this.thrustParticles.emit(
      centerX - 10,
      centerY,
      this.control.rotation,
      isAccelerating
    );
    this.thrustParticles.emit(
      centerX + 10,
      centerY,
      this.control.rotation,
      isAccelerating
    );
    this.thrustParticles.update();
    this.collisionParticles.update();
  }

  draw() {
    // Draw thrust particles first (behind the ship)
    this.thrustParticles.draw(this.ctx);

    // Draw collision particles
    this.collisionParticles.draw(this.ctx);

    if (!sprites.player || !sprites.player.complete) return;

    this.ctx.save();
    this.ctx.translate(
      this.control.position.x + this.visuals.width / 2,
      this.control.position.y + this.visuals.height / 2
    );
    this.ctx.rotate(this.control.rotation);
    this.ctx.drawImage(
      sprites.player,
      -this.visuals.width / 2,
      -this.visuals.height / 2,
      this.visuals.width,
      this.visuals.height
    );
    this.ctx.restore();
  }
}

const player = new Player(ctx, './assets/sprites/player.png');

document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
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
