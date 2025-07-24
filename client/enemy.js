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
    
    // Try to use preloaded sprite first
    const spriteKey = this.getSpriteKey(spriteSource);
    if (window.spritePreloader && spriteKey && window.spritePreloader.hasSprite(spriteKey)) {
      this.sprite = window.spritePreloader.cloneSprite(spriteKey);
      this.spriteLoaded = true;
      this.spriteError = false;
    } else {
      this.sprite = new Image();
      this.spriteLoaded = false;
      this.spriteError = false;
      
      this.sprite.onload = () => {
        this.spriteLoaded = true;
      };
      
      this.sprite.onerror = () => {
        console.error(`Failed to load enemy sprite: ${spriteSource}`);
        this.spriteError = true;
      };
      
      this.sprite.src = spriteSource;
    }

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

  getSpriteKey(spriteSource) {
    // Map sprite paths to keys
    const spriteMap = {
      './assets/sprites/enemy_basic.png': 'enemy_basic',
      './assets/sprites/enemy_shooter.png': 'enemy_shooter',
      './assets/sprites/enemy_zigzag.png': 'enemy_zigzag',
      './assets/sprites/enemy_kamikaze.png': 'enemy_kamikaze',
      './assets/sprites/boss.png': 'boss'
    };
    return spriteMap[spriteSource] || null;
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

      if (window.audioManager) {
        window.audioManager.playEnemyShoot();
      }
    } else {
      this.bullets.push({
        x: this.position.x + this.width / 2,
        y: this.position.y + this.height / 2,
        velocityX: Math.cos(angle) * 3,
        velocityY: Math.sin(angle) * 3,
        damage: this.damage / 2,
      });

      if (window.audioManager) {
        window.audioManager.playEnemyShoot();
      }
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
    if (!this.isAlive) return;
    
    // Only draw if sprite is loaded successfully
    if (!this.spriteLoaded || this.spriteError) {
      // Draw fallback rectangle if sprite failed to load
      this.ctx.save();
      this.ctx.fillStyle = '#ff4444';
      this.ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
      this.ctx.restore();
    } else {
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
    }

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

    if (window.audioManager) {
      if (this.constructor.name === 'BossEnemy') {
        window.audioManager.playEnemyHit({ volume: 1.2, pitch: 0.8 });
      } else {
        window.audioManager.playEnemyHit();
      }
    }

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

class BossEnemy extends Enemy {
  constructor(ctx, canvas, x, y) {
    super(ctx, canvas, x, y, './assets/sprites/boss.png');

    this.width = 150;
    this.height = 150;
    this.maxHealth = 5000;
    this.healthBar = new HealthBar(this.maxHealth, 150, 12);
    this.healthBar.setOffset(0, -50);

    this.speed = 0.8;
    this.damage = 40;
    this.scoreValue = 2000;

    this.canShoot = true;
    this.shootInterval = 45;
    this.multiShot = true;

    this.movementTimer = 0;
    this.movementPhase = 'entering';
    this.phaseTimer = 0;
    this.targetY = 100;
    this.originalX = x;
    this.chargeTarget = null;

    this.specialAttackTimer = 0;
    this.specialAttackInterval = 300;
    this.isPerformingSpecialAttack = false;

    this.lastPlayerPosition = { x: 0, y: 0 };

    this.collisionRadius = Math.min(this.width, this.height) / 2.5;
  }

  updateMovement(playerPosition) {
    this.lastPlayerPosition = { x: playerPosition.x, y: playerPosition.y };
    this.movementTimer++;
    this.phaseTimer++;

    switch (this.movementPhase) {
      case 'entering':
        this.enteringMovement();
        break;
      case 'circling':
        this.circlingMovement(playerPosition);
        break;
      case 'following':
        this.followingMovement(playerPosition);
        break;
      case 'charging':
        this.chargingMovement(playerPosition);
        break;
      case 'retreating':
        this.retreatingMovement();
        break;
    }

    this.updateMovementPhase();

    this.constrainToScreen();
  }

  enteringMovement() {
    if (this.position.y < this.targetY) {
      this.velocity.y = this.speed;
      this.velocity.x = 0;
    } else {
      this.movementPhase = 'circling';
      this.phaseTimer = 0;
    }
  }

  circlingMovement(playerPosition) {
    const dx = playerPosition.x - this.position.x;
    const followSpeed = this.speed * 0.6;

    if (Math.abs(dx) > 50) {
      this.velocity.x = dx > 0 ? followSpeed : -followSpeed;
    } else {
      this.velocity.x *= 0.9;
    }

    this.velocity.y = Math.sin(this.movementTimer * 0.05) * 0.3;

    const dy = playerPosition.y - this.position.y;
    this.rotation = Math.atan2(dy, dx) + Math.PI / 2;
  }

  followingMovement(playerPosition) {
    // Aggressively follow player on x-axis
    const dx = playerPosition.x - this.position.x;
    const followSpeed = this.speed * 1.2; // Faster than circling phase

    // Follow player horizontally with higher responsiveness
    if (Math.abs(dx) > 20) {
      this.velocity.x = dx > 0 ? followSpeed : -followSpeed;
    } else {
      // Fine-tuning when close to player's x position
      this.velocity.x = dx * 0.1;
    }

    // Slight vertical movement to maintain engagement
    this.velocity.y = Math.sin(this.movementTimer * 0.08) * 0.4;

    // Rotate to face player
    const dy = playerPosition.y - this.position.y;
    this.rotation = Math.atan2(dy, dx) + Math.PI / 2;
  }

  chargingMovement(playerPosition) {
    if (!this.chargeTarget) {
      this.chargeTarget = { x: playerPosition.x, y: playerPosition.y };
    }

    const dx = this.chargeTarget.x - this.position.x;
    const dy = this.chargeTarget.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 10) {
      const chargeSpeed = this.speed * 2.5;
      this.velocity.x = (dx / distance) * chargeSpeed;
      this.velocity.y = (dy / distance) * chargeSpeed;
      this.rotation = Math.atan2(dy, dx) + Math.PI / 2;
    } else {
      this.movementPhase = 'retreating';
      this.phaseTimer = 0;
      this.chargeTarget = null;
    }
  }

  retreatingMovement() {
    this.velocity.y = -this.speed * 0.8;
    this.velocity.x *= 0.95;

    if (this.position.y <= this.targetY) {
      this.movementPhase = 'circling';
      this.phaseTimer = 0;
    }
  }

  updateMovementPhase() {
    const healthPercentage = this.healthBar.getHealth() / this.maxHealth;

    if (this.movementPhase === 'circling' && this.phaseTimer > 180) {
      // Transition to following phase when health is below 75%
      if (healthPercentage < 0.75 && Math.random() < 0.4) {
        this.movementPhase = 'following';
        this.phaseTimer = 0;
      } else if (healthPercentage < 0.5 && Math.random() < 0.3) {
        this.movementPhase = 'charging';
        this.phaseTimer = 0;
      }
    }

    if (this.movementPhase === 'following' && this.phaseTimer > 150) {
      // After following phase, decide next movement
      if (healthPercentage < 0.4 && Math.random() < 0.5) {
        this.movementPhase = 'charging';
        this.phaseTimer = 0;
      } else {
        this.movementPhase = 'circling';
        this.phaseTimer = 0;
      }
    }

    if (this.movementPhase === 'charging' && this.phaseTimer > 120) {
      this.movementPhase = 'retreating';
      this.phaseTimer = 0;
    }

    if (this.movementPhase === 'retreating' && this.phaseTimer > 90) {
      this.movementPhase = 'circling';
      this.phaseTimer = 0;
    }
  }

  constrainToScreen() {
    const margin = 50;
    if (this.position.x < -margin) {
      this.position.x = -margin;
      this.velocity.x = Math.abs(this.velocity.x);
    }
    if (this.position.x > this.canvas.width - this.width + margin) {
      this.position.x = this.canvas.width - this.width + margin;
      this.velocity.x = -Math.abs(this.velocity.x);
    }
    if (this.position.y < -margin) {
      this.position.y = -margin;
      this.velocity.y = Math.abs(this.velocity.y);
    }
  }

  updateShooting(playerPosition) {
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
      return;
    }

    this.specialAttackTimer++;

    if (
      this.specialAttackTimer >= this.specialAttackInterval &&
      !this.isPerformingSpecialAttack
    ) {
      this.performSpecialAttack(playerPosition);
      this.specialAttackTimer = 0;
      return;
    }

    const dx = playerPosition.x - this.position.x;
    const dy = playerPosition.y - this.position.y;
    const angle = Math.atan2(dy, dx);

    if (this.bulletManager) {
      const bulletSpawnX = this.position.x + this.width / 2;
      const bulletSpawnY = this.position.y + this.height / 2;

      // Adjust shooting pattern based on movement phase
      let numBullets, spreadAngle, bulletSpeed;

      if (this.movementPhase === 'following') {
        // More aggressive shooting during following phase
        numBullets = this.healthBar.getHealth() / this.maxHealth < 0.5 ? 4 : 3;
        spreadAngle = 0.4;
        bulletSpeed = 4.5;
      } else {
        numBullets = this.healthBar.getHealth() / this.maxHealth < 0.5 ? 3 : 2;
        spreadAngle = 0.3;
        bulletSpeed = 4;
      }

      for (let i = 0; i < numBullets; i++) {
        const bulletAngle = angle + (i - (numBullets - 1) / 2) * spreadAngle;
        this.bulletManager.createBullet(
          bulletSpawnX - 6,
          bulletSpawnY - 10,
          bulletAngle + Math.PI / 2,
          bulletSpeed,
          this.damage / 3,
          './assets/sprites/bullet_enemy.png',
          'enemy'
        );
      }

      if (window.audioManager) {
        window.audioManager.playEnemyShoot({ volume: 1.2, pitch: 0.8 });
      }
    }

    // Faster shooting during following phase
    const shootInterval =
      this.movementPhase === 'following'
        ? this.shootInterval * 0.7
        : this.shootInterval;
    this.shootCooldown = shootInterval;
  }

  performSpecialAttack(playerPosition) {
    this.isPerformingSpecialAttack = true;

    if (this.bulletManager) {
      const bulletSpawnX = this.position.x + this.width / 2;
      const bulletSpawnY = this.position.y + this.height / 2;

      const numBullets = 8;
      for (let i = 0; i < numBullets; i++) {
        const angle = (i / numBullets) * Math.PI * 2;
        this.bulletManager.createBullet(
          bulletSpawnX - 6,
          bulletSpawnY - 10,
          angle + Math.PI / 2,
          3,
          this.damage / 4,
          './assets/sprites/bullet_enemy.png',
          'enemy'
        );
      }

      if (window.audioManager) {
        window.audioManager.playEnemyShoot({ volume: 1.5, pitch: 0.7 });
      }
    }

    setTimeout(() => {
      this.isPerformingSpecialAttack = false;
    }, 1000);
  }

  checkBoundaries() {
    if (
      this.position.x < -this.width - 200 ||
      this.position.x > this.canvas.width + 200 ||
      this.position.y < -this.height - 200 ||
      this.position.y > this.canvas.height + 200
    ) {
      this.markedForRemoval = true;
    }
  }

  draw() {
    if (!this.isAlive) return;

    // Only draw if sprite is loaded successfully
    if (!this.spriteLoaded || this.spriteError) {
      // Draw fallback rectangle if sprite failed to load
      this.ctx.save();
      this.ctx.fillStyle = '#ff6666';
      this.ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
      this.ctx.restore();
    } else {
      this.ctx.save();

      if (this.isPerformingSpecialAttack) {
        this.ctx.shadowColor = '#ff0000';
        this.ctx.shadowBlur = 20;
      } else {
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 10;
      }

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
    }

    this.drawBossHealthBar();

    this.drawBullets();
  }

  drawBossHealthBar() {
    const barWidth = this.canvas.width * 0.6;
    const barHeight = 20;
    const barX = (this.canvas.width - barWidth) / 2;
    const barY = 20;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    const healthPercentage = this.healthBar.getHealth() / this.maxHealth;
    const fillWidth = barWidth * healthPercentage;

    if (healthPercentage > 0.6) {
      this.ctx.fillStyle = '#00ff00';
    } else if (healthPercentage > 0.3) {
      this.ctx.fillStyle = '#ffff00';
    } else {
      this.ctx.fillStyle = '#ff0000';
    }

    this.ctx.fillRect(barX, barY, fillWidth, barHeight);

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BOSS', this.canvas.width / 2, barY - 10);

    this.ctx.font = '12px Arial';
    this.ctx.fillText(
      `${Math.ceil(this.healthBar.getHealth())} / ${this.maxHealth}`,
      this.canvas.width / 2,
      barY + barHeight + 15
    );
  }

  takeDamage(amount) {
    const wasAlive = this.healthBar.getHealth() > 0;
    this.healthBar.damage(amount);

    if (wasAlive && this.healthBar.getHealth() <= 0) {
      this.isAlive = false;
      this.markedForRemoval = true;

      if (
        typeof window.blastManager !== 'undefined' &&
        window.blastManager.createEnemyExplosion
      ) {
        window.blastManager.createEnemyExplosion(
          this.position.x + this.width / 2,
          this.position.y + this.height / 2,
          'boss'
        );
      }

      if (window.audioManager) {
        window.audioManager.playExplosion('boss');
      }

      if (window.player && this.getScoreValue) {
        window.player.score += this.getScoreValue();
      }
    }
  }

  getScoreValue() {
    return this.scoreValue;
  }
}
