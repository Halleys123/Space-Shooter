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

    this.width = 60;
    this.height = 60;
    this.sprite = new Image();
    this.sprite.src = spriteSource;

    this.maxHealth = 100;
    this.healthBar = new HealthBar(this.maxHealth, 80, 8);
    this.healthBar.setOffset(0, -35);

    this.damage = 10;
    this.collisionRadius = Math.min(this.width, this.height) / 2;

    this.speed = 1;
    this.movementPattern = 'basic';

    this.canShoot = false;
    this.shootCooldown = 0;
    this.shootInterval = 60;
    this.bullets = [];

    this.collisionComponent = null;

    this.bulletManager = null;
  }

  updateMovement() {
    throw new Error('updateMovement() must be implemented by child class');
  }

  getScoreValue() {
    throw new Error('getScoreValue() must be implemented by child class');
  }

  update(playerPosition) {
    if (!this.isAlive) return;

    this.updateMovement(playerPosition);

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    if (this.canShoot) {
      this.updateShooting(playerPosition);
    }

    this.updateBullets();

    this.checkBoundaries();

    this.healthBar.update();

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

    const dx = playerPosition.x - this.position.x;
    const dy = playerPosition.y - this.position.y;
    const angle = Math.atan2(dy, dx);

    if (this.bulletManager) {
      const bulletSpawnX = this.position.x + this.width / 2;
      const bulletSpawnY = this.position.y + this.height / 2;

      this.bulletManager.createBullet(
        bulletSpawnX - 4,
        bulletSpawnY - 8,
        angle + Math.PI / 2,
        3,
        this.damage / 2,
        './assets/sprites/bullet_enemy.png',
        'enemy'
      );
    } else {
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

      return (
        bullet.x > -10 &&
        bullet.x < this.canvas.width + 10 &&
        bullet.y > -10 &&
        bullet.y < this.canvas.height + 10
      );
    });
  }

  checkBoundaries() {
    if (
      this.position.x < -this.width - 100 ||
      this.position.x > this.canvas.width + 100 ||
      this.position.y < -this.height - 100 ||
      this.position.y > this.canvas.height + 100
    ) {
      this.markedForRemoval = true;
    }
  }

  draw() {
    if (!this.isAlive || !this.sprite.complete) return;

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

    this.healthBar.draw(this.ctx, this.position.x, this.position.y, this.width);

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

  checkCollision(other) {
    const dx =
      this.position.x + this.width / 2 - (other.position.x + other.width / 2);
    const dy =
      this.position.y + this.height / 2 - (other.position.y + other.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < this.collisionRadius + other.collisionRadius;
  }

  takeDamage(amount) {
    const wasAlive = this.healthBar.getHealth() > 0;
    this.healthBar.damage(amount);

    if (wasAlive && this.healthBar.getHealth() <= 0) {
      this.isAlive = false;
      this.markedForRemoval = true;

      if (window.player && this.getScoreValue) {
        window.player.score += this.getScoreValue();
      }
    }
  }

  getHealth() {
    return this.healthBar.getHealth();
  }

  shouldBeRemoved() {
    return this.markedForRemoval;
  }

  setBulletManager(bulletManager) {
    this.bulletManager = bulletManager;
  }

  setCollisionComponent(component) {
    this.collisionComponent = component;
  }

  getCollisionBounds() {
    return {
      x: this.position.x + this.width * 0.1,
      y: this.position.y + this.height * 0.1,
      width: this.width * 0.8,
      height: this.height * 0.8,
    };
  }
}

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
    this.velocity.y = this.speed;
    this.velocity.x = 0;
  }

  getScoreValue() {
    return this.scoreValue;
  }
}

class ShooterEnemy extends Enemy {
  constructor(ctx, canvas, x, y) {
    super(ctx, canvas, x, y, './assets/sprites/enemy_shooter.png');
    this.maxHealth = 75;
    this.healthBar = new HealthBar(this.maxHealth, 80, 8);
    this.healthBar.setOffset(0, -35);
    this.speed = 1.5;
    this.damage = 20;
    this.canShoot = true;
    this.shootInterval = 90;
    this.scoreValue = 150;
  }

  updateMovement(playerPosition) {
    this.velocity.y = this.speed;
    this.velocity.x = 0;

    const dx = playerPosition.x - this.position.x;
    const dy = playerPosition.y - this.position.y;
    this.rotation = Math.atan2(dy, dx) + Math.PI / 2;
  }

  getScoreValue() {
    return this.scoreValue;
  }
}

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
    this.velocity.y = this.speed;

    this.zigzagTimer++;
    if (this.zigzagTimer > 30) {
      this.zigzagDirection *= -1;
      this.zigzagTimer = 0;
    }

    this.velocity.x = this.zigzagDirection * 2;

    this.rotation = Math.atan2(this.velocity.y, this.velocity.x);
  }

  getScoreValue() {
    return this.scoreValue;
  }
}

class KamikazeEnemy extends Enemy {
  constructor(ctx, canvas, x, y) {
    super(ctx, canvas, x, y, './assets/sprites/enemy_kamikaze.png');
    this.maxHealth = 30;
    this.healthBar = new HealthBar(this.maxHealth, 80, 8);
    this.healthBar.setOffset(0, -35);
    this.speed = 4;
    this.damage = 30;
    this.accelerationTimer = 0;
    this.scoreValue = 75;
  }

  updateMovement(playerPosition) {
    const dx = playerPosition.x - this.position.x;
    const dy = playerPosition.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      this.accelerationTimer++;
      const currentSpeed = this.speed + this.accelerationTimer * 0.05;

      this.velocity.x = (dx / distance) * currentSpeed;
      this.velocity.y = (dy / distance) * currentSpeed;

      this.rotation = Math.atan2(dy, dx) + Math.PI / 2;
    }
  }

  getScoreValue() {
    return this.scoreValue;
  }
}
