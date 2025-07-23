// Individual bullet class
class Bullet {
  constructor(
    ctx,
    canvas,
    x,
    y,
    rotation,
    speed,
    damage,
    spriteSource,
    owner = 'player'
  ) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.position = { x, y };
    this.rotation = rotation;
    this.speed = speed;
    this.damage = damage;
    this.owner = owner; // 'player' or 'enemy'
    this.isActive = true;
    this.markedForRemoval = false;

    // Calculate velocity based on rotation
    this.velocity = {
      x: Math.sin(rotation) * speed,
      y: -Math.cos(rotation) * speed,
    };

    // Visual properties
    this.width = 8;
    this.height = 16;

    // Load bullet sprite
    this.sprite = new Image();
    this.sprite.src = spriteSource;

    // Collision component (will be set by collision manager)
    this.collisionComponent = null;

    // Lifetime management
    this.maxLifetime = 180; // frames (3 seconds at 60 FPS)
    this.lifetime = 0;
  }

  update() {
    if (!this.isActive) return;

    // Move bullet
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Update lifetime
    this.lifetime++;
    if (this.lifetime > this.maxLifetime) {
      this.markedForRemoval = true;
      this.isActive = false;
      return;
    }

    // Check boundaries
    if (
      this.position.x < -this.width ||
      this.position.x > this.canvas.width + this.width ||
      this.position.y < -this.height ||
      this.position.y > this.canvas.height + this.height
    ) {
      this.markedForRemoval = true;
      this.isActive = false;
    }
  }

  draw() {
    if (!this.isActive) return;

    this.ctx.save();

    if (this.sprite.complete) {
      // Draw sprite
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
    } else {
      // Fallback: draw colored rectangle if sprite not loaded
      this.ctx.translate(
        this.position.x + this.width / 2,
        this.position.y + this.height / 2
      );
      this.ctx.rotate(this.rotation);

      this.ctx.fillStyle = this.owner === 'player' ? '#00ff00' : '#ff0000';
      this.ctx.fillRect(
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    }

    this.ctx.restore();
  }

  // Check if bullet should be removed
  shouldBeRemoved() {
    return this.markedForRemoval;
  }

  // Take damage (for collision system)
  takeDamage(amount) {
    this.markedForRemoval = true;
    this.isActive = false;
  }

  // Get health (for collision system compatibility)
  getHealth() {
    return this.isActive ? 1 : 0;
  }

  // Set collision component
  setCollisionComponent(component) {
    this.collisionComponent = component;
  }

  // Destroy bullet (called on collision)
  destroy() {
    this.markedForRemoval = true;
    this.isActive = false;
  }
}

// Bullet manager class to handle multiple bullets efficiently
class BulletManager {
  constructor(ctx, canvas, collisionManager = null) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.collisionManager = collisionManager;
    this.bullets = [];
    this.maxBullets = 100; // Performance limit
  }

  // Create a new bullet
  createBullet(x, y, rotation, speed, damage, spriteSource, owner = 'player') {
    // Remove oldest bullets if at limit
    if (this.bullets.length >= this.maxBullets) {
      const oldBullet = this.bullets.shift();
      if (oldBullet.collisionComponent && this.collisionManager) {
        this.collisionManager.removeComponent(oldBullet.collisionComponent);
      }
    }

    const bullet = new Bullet(
      this.ctx,
      this.canvas,
      x,
      y,
      rotation,
      speed,
      damage,
      spriteSource,
      owner
    );

    this.bullets.push(bullet);

    // Add collision component if collision manager is available
    if (this.collisionManager) {
      const layer = owner === 'player' ? 'playerBullet' : 'enemyBullet';
      const bulletCollision = CollisionManager.createForGameObject(
        bullet,
        layer,
        {
          width: bullet.width,
          height: bullet.height,
          damage: bullet.damage,
          canReceiveDamage: false, // Bullets don't take damage, they just get destroyed
          callbacks: {
            onCollisionEnter: (other, collisionData) => {
              // Destroy bullet on collision with valid targets
              if (
                (layer === 'playerBullet' && other.layer === 'enemy') ||
                (layer === 'enemyBullet' && other.layer === 'player')
              ) {
                bullet.destroy();
              }
            },
          },
        }
      );

      this.collisionManager.addComponent(bulletCollision);
      bullet.setCollisionComponent(bulletCollision);
    }

    return bullet;
  }

  // Update all bullets
  update() {
    this.bullets.forEach((bullet) => bullet.update());

    // Remove inactive bullets
    this.bullets = this.bullets.filter((bullet) => {
      if (bullet.shouldBeRemoved()) {
        // Remove collision component
        if (bullet.collisionComponent && this.collisionManager) {
          this.collisionManager.removeComponent(bullet.collisionComponent);
        }
        return false;
      }
      return true;
    });
  }

  // Draw all bullets
  draw() {
    this.bullets.forEach((bullet) => bullet.draw());
  }

  // Get active bullet count
  getActiveBullets() {
    return this.bullets.length;
  }

  // Get bullets by owner
  getBulletsByOwner(owner) {
    return this.bullets.filter(
      (bullet) => bullet.owner === owner && bullet.isActive
    );
  }

  // Clear all bullets (useful for stage transitions)
  clear() {
    this.bullets.forEach((bullet) => {
      if (bullet.collisionComponent && this.collisionManager) {
        this.collisionManager.removeComponent(bullet.collisionComponent);
      }
    });
    this.bullets = [];
  }

  // Remove bullets by owner
  clearByOwner(owner) {
    this.bullets = this.bullets.filter((bullet) => {
      if (bullet.owner === owner) {
        if (bullet.collisionComponent && this.collisionManager) {
          this.collisionManager.removeComponent(bullet.collisionComponent);
        }
        return false;
      }
      return true;
    });
  }
}
