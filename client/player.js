class Player {
  control = {
    position: { x: 0, y: 0 },
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
    damageInterval: 30,
  };
  score = 0;
  shooting = {
    fireRate: 10,
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

    this.control.position.x = canvas.width / 2;
    this.control.position.y = canvas.height - 150;

    this.sprite = new Image(this.visuals.width, this.visuals.height);
    this.sprite.src = src;
    this.sprite.onload = () => {
      this.draw();
    };

    this.healthBar = new HealthBar(100, 150, 12);
    this.healthBar.setOffset(0, -40);

    this.thrustParticles = new ThrustParticleSystem();
    this.collisionParticles = new CollisionParticleSystem();

    this.collisionComponent = null;

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

    const centerX = this.control.position.x + this.visuals.width / 2;
    const centerY = this.control.position.y + this.visuals.height / 2;

    let isColliding = false;

    if (prevX !== this.control.position.x) {
      if (this.control.position.x === 0) {
        this.collisionParticles.emit(centerX, centerY, 'left');
        isColliding = true;
      } else if (
        this.control.position.x ===
        this.canvas.width - this.visuals.width
      ) {
        this.collisionParticles.emit(centerX, centerY, 'right');
        isColliding = true;
      }
    }

    if (prevY !== this.control.position.y) {
      if (this.control.position.y === 0) {
        this.collisionParticles.emit(centerX, centerY, 'top');
        isColliding = true;
      } else if (
        this.control.position.y ===
        this.canvas.height - this.visuals.height
      ) {
        this.collisionParticles.emit(centerX, centerY, 'bottom');
        isColliding = true;
      }
    }

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

    this.handleShooting(keys, centerX, centerY);

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

    this.healthBar.update();
  }

  handleShooting(keys, centerX, centerY) {
    if (this.shooting.cooldown > 0) {
      this.shooting.cooldown--;
    }

    if (
      (keys[' '] || keys['Space']) &&
      this.shooting.cooldown <= 0 &&
      this.bulletManager
    ) {
      this.shoot(centerX, centerY);
    }
  }

  shoot(centerX, centerY) {
    if (!this.bulletManager) return;

    const bulletSpawnDistance = this.visuals.height / 2 + 10;
    const spawnX =
      centerX + Math.sin(this.control.rotation) * bulletSpawnDistance;
    const spawnY =
      centerY - Math.cos(this.control.rotation) * bulletSpawnDistance;

    this.bulletManager.createBullet(
      spawnX - 4,
      spawnY - 8,
      this.control.rotation,
      this.shooting.bulletSpeed,
      this.shooting.bulletDamage,
      this.shooting.bulletSprite,
      'player'
    );

    this.shooting.cooldown = this.shooting.fireRate;

    // Play player shoot sound
    if (window.audioManager) {
      window.audioManager.playPlayerShoot();
    }
  }

  setBulletManager(bulletManager) {
    this.bulletManager = bulletManager;
  }

  draw() {
    this.thrustParticles.draw(this.ctx);

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

    this.healthBar.draw(
      this.ctx,
      this.control.position.x,
      this.control.position.y,
      this.visuals.width
    );
  }

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

    // Play powerup sound when healing
    if (window.audioManager) {
      window.audioManager.playPowerup();
    }
  }

  takeDamage(amount) {
    this.healthBar.damage(amount);

    // Play player hit sound
    if (window.audioManager) {
      window.audioManager.playPlayerHit();
    }
  }

  getCollisionBounds() {
    return {
      x: this.control.position.x + this.visuals.width * 0.2,
      y: this.control.position.y + this.visuals.height * 0.2,
      width: this.visuals.width * 0.6,
      height: this.visuals.height * 0.6,
    };
  }

  setCollisionComponent(component) {
    this.collisionComponent = component;
  }
}
