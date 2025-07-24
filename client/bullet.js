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
    this.owner = owner;
    this.isActive = true;
    this.markedForRemoval = false;

    this.velocity = {
      x: Math.sin(rotation) * speed,
      y: -Math.cos(rotation) * speed,
    };

    // Different sizes for different bullet types
    if (owner === 'enemy') {
      this.width = 12; // Increased from 8
      this.height = 20; // Increased from 16
    } else {
      this.width = 8;
      this.height = 16;
    }

    this.sprite = new Image();
    this.sprite.src = spriteSource;

    this.collisionComponent = null;

    this.maxLifetime = 180;
    this.lifetime = 0;

    // Bullet trail particles
    this.trailParticles = new BulletTrailParticleSystem();
  }

  update() {
    if (!this.isActive) return;

    // Store previous position for continuous collision detection
    const prevPosition = { x: this.position.x, y: this.position.y };

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Emit trail particles for player bullets
    if (this.owner === 'player') {
      this.trailParticles.emit(
        this.position.x + this.width / 2,
        this.position.y + this.height / 2,
        this.rotation,
        this.owner
      );
    }

    // Update trail particles
    this.trailParticles.update();

    // Perform continuous collision detection for fast bullets
    if (this.collisionComponent && this.speed > 5) {
      this.performContinuousCollisionDetection(prevPosition, this.position);
    }

    this.lifetime++;
    if (this.lifetime > this.maxLifetime) {
      this.markedForRemoval = true;
      this.isActive = false;
      return;
    }

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

  performContinuousCollisionDetection(startPos, endPos) {
    // Check if bullet manager has collision manager access
    if (!window.collisionManager || !this.collisionComponent) return;

    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If movement is small, skip continuous detection
    if (distance < 2) return;

    // Sample points along the bullet's path
    const samples = Math.ceil(distance / 2); // Check every 2 pixels

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const sampleX = startPos.x + dx * t;
      const sampleY = startPos.y + dy * t;

      // Temporarily update position for collision check
      const originalPos = { x: this.position.x, y: this.position.y };
      this.position.x = sampleX;
      this.position.y = sampleY;

      // Update collision shape position
      this.collisionComponent.updatePosition();

      // Check for collisions at this sample point
      const collisionComponents = window.collisionManager.collisionComponents;
      for (let component of collisionComponents) {
        if (component === this.collisionComponent || !component.isActive)
          continue;

        // Check if layers can collide
        if (
          !window.collisionManager.canLayersCollide(
            this.collisionComponent.layer,
            component.layer
          )
        )
          continue;

        // Perform collision check
        const collisionResult = window.collisionManager.checkCollision(
          this.collisionComponent,
          component
        );
        if (collisionResult.collision) {
          // Collision detected! Set position to collision point and trigger collision
          this.position.x = sampleX;
          this.position.y = sampleY;
          this.collisionComponent.updatePosition();

          // Trigger collision handling
          window.collisionManager.handleCollision(
            this.collisionComponent,
            component,
            collisionResult
          );
          return; // Exit early since collision occurred
        }
      }

      // Restore original position if no collision
      this.position.x = originalPos.x;
      this.position.y = originalPos.y;
    }
  }

  draw() {
    if (!this.isActive) return;

    // Draw trail particles first (behind bullet)
    this.trailParticles.draw(this.ctx);

    this.ctx.save();

    if (this.sprite.complete) {
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

  shouldBeRemoved() {
    return this.markedForRemoval;
  }

  takeDamage(amount) {
    this.markedForRemoval = true;
    this.isActive = false;
  }

  getHealth() {
    return this.isActive ? 1 : 0;
  }

  setCollisionComponent(component) {
    this.collisionComponent = component;
  }

  destroy() {
    this.markedForRemoval = true;
    this.isActive = false;
  }
}

class BulletManager {
  constructor(ctx, canvas, collisionManager = null) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.collisionManager = collisionManager;
    this.bullets = [];
    this.maxBullets = 100;
  }

  createBullet(x, y, rotation, speed, damage, spriteSource, owner = 'player') {
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

    if (this.collisionManager) {
      const layer = owner === 'player' ? 'playerBullet' : 'enemyBullet';
      const bulletCollision = CollisionManager.createForGameObject(
        bullet,
        layer,
        {
          width: bullet.width * 1.2, // Slightly larger collision box for better hit detection
          height: bullet.height * 1.2, // Slightly larger collision box for better hit detection
          damage: bullet.damage,
          canReceiveDamage: false,
          callbacks: {
            onCollisionEnter: (other, collisionData) => {
              console.log(`${layer} collision with ${other.layer}`, {
                bulletPos: { x: bullet.position.x, y: bullet.position.y },
                otherPos: other.gameObject.position,
                damage: bullet.damage,
              });

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

  update() {
    this.bullets.forEach((bullet) => bullet.update());

    this.bullets = this.bullets.filter((bullet) => {
      if (bullet.shouldBeRemoved()) {
        if (bullet.collisionComponent && this.collisionManager) {
          this.collisionManager.removeComponent(bullet.collisionComponent);
        }
        return false;
      }
      return true;
    });
  }

  draw() {
    this.bullets.forEach((bullet) => bullet.draw());
  }

  getActiveBullets() {
    return this.bullets.length;
  }

  getBulletsByOwner(owner) {
    return this.bullets.filter(
      (bullet) => bullet.owner === owner && bullet.isActive
    );
  }

  clear() {
    this.bullets.forEach((bullet) => {
      if (bullet.collisionComponent && this.collisionManager) {
        this.collisionManager.removeComponent(bullet.collisionComponent);
      }
    });
    this.bullets = [];
  }

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
