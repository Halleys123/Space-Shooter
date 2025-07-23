// Abstract Enemy Parent Class
class Enemy {
  constructor(ctx, canvas, x, y, spriteSource) {
    if (this.constructor === Enemy) {
      throw new Error('Abstract class Enemy cannot be instantiated directly');
    }

    this.ctx = ctx;
    this.canvas = canvas;
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
    this.rotation = 0;
    this.isAlive = true;
    this.markedForRemoval = false;

    // Visual properties
    this.width = 60;
    this.height = 60;
    this.sprite = new Image();
    this.sprite.src = spriteSource;

    // Health system
    this.maxHealth = 100;
    this.healthBar = new HealthBar(this.maxHealth, 80, 8);
    this.healthBar.setOffset(0, -35);

    // Damage and collision
    this.damage = 10;
    this.collisionRadius = Math.min(this.width, this.height) / 2;

    // Movement properties (to be overridden)
    this.speed = 1;
    this.movementPattern = 'basic';

    // Shooting properties
    this.canShoot = false;
    this.shootCooldown = 0;
    this.shootInterval = 60; // frames between shots
    this.bullets = []; // Keep for backward compatibility, but will use bulletManager when available

    // Collision component (will be set by collision manager)
    this.collisionComponent = null;

    // Bullet manager reference (will be set from main game)
    this.bulletManager = null;
  }

  // Abstract methods that must be implemented by child classes
  updateMovement() {
    throw new Error('updateMovement() must be implemented by child class');
  }

  getScoreValue() {
    throw new Error('getScoreValue() must be implemented by child class');
  }

  // Common update logic
  update(playerPosition) {
    if (!this.isAlive) return;

    // Update movement pattern
    this.updateMovement(playerPosition);

    // Apply velocity
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Update shooting
    if (this.canShoot) {
      this.updateShooting(playerPosition);
    }

    // Update bullets
    this.updateBullets();

    // Check boundaries
    this.checkBoundaries();

    // Update health bar
    this.healthBar.update();

    // Mark for removal if dead
    if (this.healthBar.isDead()) {
      this.isAlive = false;
      this.markedForRemoval = true;
    }
  }

  updateShooting(playerPosition) {
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
      return;
    }

    // Calculate angle to player
    const dx = playerPosition.x - this.position.x;
    const dy = playerPosition.y - this.position.y;
    const angle = Math.atan2(dy, dx);

    // Use bullet manager if available, otherwise fall back to old system
    if (this.bulletManager) {
      const bulletSpawnX = this.position.x + this.width / 2;
      const bulletSpawnY = this.position.y + this.height / 2;

      this.bulletManager.createBullet(
        bulletSpawnX - 4, // Center the bullet
        bulletSpawnY - 8, // Center the bullet
        angle + Math.PI / 2, // Adjust rotation for bullet sprite
        3, // speed
        this.damage / 2, // damage
        './assets/sprites/bullet_enemy.png',
        'enemy'
      );
    } else {
      // Fallback to old bullet system
      this.bullets.push({
        x: this.position.x + this.width / 2,
        y: this.position.y + this.height / 2,
        velocityX: Math.cos(angle) * 3,
        velocityY: Math.sin(angle) * 3,
        damage: this.damage / 2,
      });
    }

    this.shootCooldown = this.shootInterval;
  }

  updateBullets() {
    this.bullets = this.bullets.filter((bullet) => {
      bullet.x += bullet.velocityX;
      bullet.y += bullet.velocityY;

      // Remove bullets that are off screen
      return (
        bullet.x > -10 &&
        bullet.x < this.canvas.width + 10 &&
        bullet.y > -10 &&
        bullet.y < this.canvas.height + 10
      );
    });
  }

  checkBoundaries() {
    // Remove enemy if it goes too far off screen
    if (
      this.position.x < -this.width - 100 ||
      this.position.x > this.canvas.width + 100 ||
      this.position.y < -this.height - 100 ||
      this.position.y > this.canvas.height + 100
    ) {
      this.markedForRemoval = true;
    }
  }

  // Common draw logic
  draw() {
    if (!this.isAlive || !this.sprite.complete) return;

    // Draw enemy sprite
    this.ctx.save();
    this.ctx.translate(
      this.position.x + this.width / 2,
      this.position.y + this.height / 2
    );
    this.ctx.rotate(this.rotation);
    this.ctx.drawImage(
      this.sprite,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
    this.ctx.restore();

    // Draw health bar
    this.healthBar.draw(this.ctx, this.position.x, this.position.y, this.width);

    // Draw bullets
    this.drawBullets();
  }

  drawBullets() {
    this.ctx.fillStyle = '#ff0000';
    this.bullets.forEach((bullet) => {
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  // Collision detection
  checkCollision(other) {
    const dx =
      this.position.x + this.width / 2 - (other.position.x + other.width / 2);
    const dy =
      this.position.y + this.height / 2 - (other.position.y + other.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < this.collisionRadius + other.collisionRadius;
  }

  // Take damage
  takeDamage(amount) {
    const wasAlive = this.healthBar.getHealth() > 0;
    this.healthBar.damage(amount);

    // Check if enemy just died
    if (wasAlive && this.healthBar.getHealth() <= 0) {
      this.isAlive = false;
      this.markedForRemoval = true;

      // Award points to player
      if (window.player && this.getScoreValue) {
        window.player.score += this.getScoreValue();
      }
    }
  }

  // Get current health
  getHealth() {
    return this.healthBar.getHealth();
  }

  // Check if enemy should be removed
  shouldBeRemoved() {
    return this.markedForRemoval;
  }

  // Set bullet manager reference
  setBulletManager(bulletManager) {
    this.bulletManager = bulletManager;
  }

  // Set collision component (called by collision manager)
  setCollisionComponent(component) {
    this.collisionComponent = component;
  }

  // Get collision bounds for collision system
  getCollisionBounds() {
    return {
      x: this.position.x + this.width * 0.1,
      y: this.position.y + this.height * 0.1,
      width: this.width * 0.8,
      height: this.height * 0.8,
    };
  }
}

// Basic Enemy - Simple downward movement
class BasicEnemy extends Enemy {
  constructor(ctx, canvas, x, y) {
    super(ctx, canvas, x, y, './assets/sprites/enemy_basic.png');
    this.maxHealth = 50;
    this.healthBar = new HealthBar(this.maxHealth, 80, 8);
    this.healthBar.setOffset(0, -35);
    this.speed = 2;
    this.damage = 15;
    this.scoreValue = 100;
  }

  updateMovement(playerPosition) {
    // Simple downward movement
    this.velocity.y = this.speed;
    this.velocity.x = 0;
  }

  getScoreValue() {
    return this.scoreValue;
  }
}

// Shooter Enemy - Moves down and shoots at player
class ShooterEnemy extends Enemy {
  constructor(ctx, canvas, x, y) {
    super(ctx, canvas, x, y, './assets/sprites/enemy_shooter.png');
    this.maxHealth = 75;
    this.healthBar = new HealthBar(this.maxHealth, 80, 8);
    this.healthBar.setOffset(0, -35);
    this.speed = 1.5;
    this.damage = 20;
    this.canShoot = true;
    this.shootInterval = 90; // Slower shooting
    this.scoreValue = 150;
  }

  updateMovement(playerPosition) {
    // Move down slowly while shooting
    this.velocity.y = this.speed;
    this.velocity.x = 0;

    // Rotate to face player
    const dx = playerPosition.x - this.position.x;
    const dy = playerPosition.y - this.position.y;
    this.rotation = Math.atan2(dy, dx) + Math.PI / 2;
  }

  getScoreValue() {
    return this.scoreValue;
  }
}

// Zigzag Enemy - Moves in zigzag pattern
class ZigzagEnemy extends Enemy {
  constructor(ctx, canvas, x, y) {
    super(ctx, canvas, x, y, './assets/sprites/enemy_zigzag.png');
    this.maxHealth = 60;
    this.healthBar = new HealthBar(this.maxHealth, 80, 8);
    this.healthBar.setOffset(0, -35);
    this.speed = 2.5;
    this.damage = 18;
    this.zigzagTimer = 0;
    this.zigzagDirection = 1;
    this.scoreValue = 125;
  }

  updateMovement(playerPosition) {
    // Zigzag movement
    this.velocity.y = this.speed;

    this.zigzagTimer++;
    if (this.zigzagTimer > 30) {
      // Change direction every 30 frames
      this.zigzagDirection *= -1;
      this.zigzagTimer = 0;
    }

    this.velocity.x = this.zigzagDirection * 2;

    // Rotate based on movement direction
    this.rotation = Math.atan2(this.velocity.y, this.velocity.x);
  }

  getScoreValue() {
    return this.scoreValue;
  }
}

// Kamikaze Enemy - Fast, aggressive movement toward player
class KamikazeEnemy extends Enemy {
  constructor(ctx, canvas, x, y) {
    super(ctx, canvas, x, y, './assets/sprites/enemy_kamikaze.png');
    this.maxHealth = 30;
    this.healthBar = new HealthBar(this.maxHealth, 80, 8);
    this.healthBar.setOffset(0, -35);
    this.speed = 4;
    this.damage = 30; // High damage on collision
    this.accelerationTimer = 0;
    this.scoreValue = 75;
  }

  updateMovement(playerPosition) {
    // Move aggressively toward player
    const dx = playerPosition.x - this.position.x;
    const dy = playerPosition.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      // Accelerate over time
      this.accelerationTimer++;
      const currentSpeed = this.speed + this.accelerationTimer * 0.05;

      this.velocity.x = (dx / distance) * currentSpeed;
      this.velocity.y = (dy / distance) * currentSpeed;

      // Rotate to face movement direction
      this.rotation = Math.atan2(dy, dx) + Math.PI / 2;
    }
  }

  getScoreValue() {
    return this.scoreValue;
  }
}
