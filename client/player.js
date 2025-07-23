class Player {
  control = {
    position: { x: 0, y: 0 }, // Will be set in constructor
    velocity: { x: 0, y: 0 },
    rotation: 0,
    rotationSpeed: 0,
    maxRotationSpeed: 0.05,
    speed: 0.2,
    friction: 0.98,
    maxSpeed: 5,
  };
  health = {
    collisionDamageTimer: 0,
    damagePerSecond: 2,
    damageInterval: 30, // frames (0.5 seconds at 60 FPS)
  };
  score = 0;
  shooting = {
    fireRate: 10, // frames between shots (6 shots per second at 60 FPS)
    cooldown: 0,
    bulletSpeed: 8,
    bulletDamage: 25,
    bulletSprite: './assets/sprites/bullet_player.png',
  };
  visuals = {
    width: 105,
    height: 150,
  };
  ctx = undefined;
  canvas = undefined;
  sprite = undefined;

  constructor(ctx, canvas, src) {
    this.ctx = ctx;
    this.canvas = canvas;

    // Set initial position
    this.control.position.x = canvas.width / 2;
    this.control.position.y = canvas.height - 150;

    // Load player sprite
    this.sprite = new Image(this.visuals.width, this.visuals.height);
    this.sprite.src = src;
    this.sprite.onload = () => {
      this.draw();
    };

    // Initialize health bar
    this.healthBar = new HealthBar(100, 150, 12);
    this.healthBar.setOffset(0, -40); // Position above the player

    // Initialize particle system
    this.thrustParticles = new ThrustParticleSystem();
    this.collisionParticles = new CollisionParticleSystem();

    // Initialize collision component (will be set by collision manager)
    this.collisionComponent = null;

    // Initialize bullet manager reference (will be set from main game)
    this.bulletManager = null;
  }

  update(keys, mouse) {
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
      Math.min(this.canvas.width - this.visuals.width, this.control.position.x)
    );
    this.control.position.y = Math.max(
      0,
      Math.min(
        this.canvas.height - this.visuals.height,
        this.control.position.y
      )
    );

    // Check for boundary collisions and emit particles
    const centerX = this.control.position.x + this.visuals.width / 2;
    const centerY = this.control.position.y + this.visuals.height / 2;

    let isColliding = false;

    if (prevX !== this.control.position.x) {
      if (this.control.position.x === 0) {
        // Hit left boundary
        this.collisionParticles.emit(centerX, centerY, 'left');
        isColliding = true;
      } else if (
        this.control.position.x ===
        this.canvas.width - this.visuals.width
      ) {
        // Hit right boundary
        this.collisionParticles.emit(centerX, centerY, 'right');
        isColliding = true;
      }
    }

    if (prevY !== this.control.position.y) {
      if (this.control.position.y === 0) {
        // Hit top boundary
        this.collisionParticles.emit(centerX, centerY, 'top');
        isColliding = true;
      } else if (
        this.control.position.y ===
        this.canvas.height - this.visuals.height
      ) {
        // Hit bottom boundary
        this.collisionParticles.emit(centerX, centerY, 'bottom');
        isColliding = true;
      }
    }

    // Handle collision damage
    if (isColliding) {
      this.health.collisionDamageTimer++;
      if (this.health.collisionDamageTimer >= this.health.damageInterval) {
        this.healthBar.damage(1);
        this.health.collisionDamageTimer = 0;
      }
    } else {
      this.health.collisionDamageTimer = 0;
    }

    this.control.rotation =
      Math.atan2(mouse.y - centerY, mouse.x - centerX) + Math.PI / 2;

    // Handle shooting
    this.handleShooting(keys, centerX, centerY);

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

    // Update health bar
    this.healthBar.update();
  }

  // Handle shooting logic
  handleShooting(keys, centerX, centerY) {
    // Decrease cooldown
    if (this.shooting.cooldown > 0) {
      this.shooting.cooldown--;
    }

    // Check for space key press
    if (
      (keys[' '] || keys['Space']) &&
      this.shooting.cooldown <= 0 &&
      this.bulletManager
    ) {
      this.shoot(centerX, centerY);
    }
  }

  // Shoot a bullet
  shoot(centerX, centerY) {
    if (!this.bulletManager) return;

    // Calculate bullet spawn position (front of the ship)
    const bulletSpawnDistance = this.visuals.height / 2 + 10;
    const spawnX =
      centerX + Math.sin(this.control.rotation) * bulletSpawnDistance;
    const spawnY =
      centerY - Math.cos(this.control.rotation) * bulletSpawnDistance;

    // Create bullet
    this.bulletManager.createBullet(
      spawnX - 4, // Center the bullet
      spawnY - 8, // Center the bullet
      this.control.rotation,
      this.shooting.bulletSpeed,
      this.shooting.bulletDamage,
      this.shooting.bulletSprite,
      'player'
    );

    // Set cooldown
    this.shooting.cooldown = this.shooting.fireRate;

    // TODO: Add shooting sound effect here
  }

  // Set bullet manager reference
  setBulletManager(bulletManager) {
    this.bulletManager = bulletManager;
  }

  draw() {
    // Draw thrust particles first (behind the ship)
    this.thrustParticles.draw(this.ctx);

    // Draw collision particles
    this.collisionParticles.draw(this.ctx);

    if (!this.sprite || !this.sprite.complete) return;

    this.ctx.save();
    this.ctx.translate(
      this.control.position.x + this.visuals.width / 2,
      this.control.position.y + this.visuals.height / 2
    );
    this.ctx.rotate(this.control.rotation);
    this.ctx.drawImage(
      this.sprite,
      -this.visuals.width / 2,
      -this.visuals.height / 2,
      this.visuals.width,
      this.visuals.height
    );
    this.ctx.restore();

    // Draw health bar above the player
    this.healthBar.draw(
      this.ctx,
      this.control.position.x,
      this.control.position.y,
      this.visuals.width
    );
  }

  // Helper methods for external access
  getHealth() {
    return this.healthBar.getHealth();
  }

  isAlive() {
    return !this.healthBar.isDead();
  }

  damage(amount) {
    this.healthBar.damage(amount);
  }

  heal(amount) {
    this.healthBar.heal(amount);
  }

  // Collision damage method (called by collision system)
  takeDamage(amount) {
    this.healthBar.damage(amount);
  }

  // Get collision bounds for collision system
  getCollisionBounds() {
    return {
      x: this.control.position.x + this.visuals.width * 0.2,
      y: this.control.position.y + this.visuals.height * 0.2,
      width: this.visuals.width * 0.6,
      height: this.visuals.height * 0.6,
    };
  }

  // Set collision component (called by collision manager)
  setCollisionComponent(component) {
    this.collisionComponent = component;
  }
}
