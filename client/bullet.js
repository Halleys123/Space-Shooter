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

    this.width = 8;
    this.height = 16;

    this.sprite = new Image();
    this.sprite.src = spriteSource;

    this.collisionComponent = null;

    this.maxLifetime = 180;
    this.lifetime = 0;
  }

  update() {
    if (!this.isActive) return;

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

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

  draw() {
    if (!this.isActive) return;

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
          width: bullet.width,
          height: bullet.height,
          damage: bullet.damage,
          canReceiveDamage: false,
          callbacks: {
            onCollisionEnter: (other, collisionData) => {
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
