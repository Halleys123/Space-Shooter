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

      // Play enemy shoot sound
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

      // Play enemy shoot sound
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

    // Play enemy hit sound
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

    // Boss is much larger and more powerful
    this.width = 120;
    this.height = 120;
    this.maxHealth = 500;
    this.healthBar = new HealthBar(this.maxHealth, 150, 12);
    this.healthBar.setOffset(0, -50);

    this.speed = 0.8;
    this.damage = 40;
    this.scoreValue = 2000;

    // Boss can shoot multiple projectiles
    this.canShoot = true;
    this.shootInterval = 45; // Shoots more frequently
    this.multiShot = true;

    // Movement pattern variables
    this.movementTimer = 0;
    this.movementPhase = 'entering'; // entering, circling, charging, retreating
    this.phaseTimer = 0;
    this.targetY = 100; // Stay near top of screen
    this.originalX = x;
    this.chargeTarget = null;

    // Special attack patterns
    this.specialAttackTimer = 0;
    this.specialAttackInterval = 300; // Special attack every 5 seconds
    this.isPerformingSpecialAttack = false;

    // Track player for intelligent movement
    this.lastPlayerPosition = { x: 0, y: 0 };

    // Enhanced collision radius for boss
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
      case 'charging':
        this.chargingMovement(playerPosition);
        break;
      case 'retreating':
        this.retreatingMovement();
        break;
    }

    // Change movement phases based on health and time
    this.updateMovementPhase();

    // Keep boss within screen bounds with some leeway
    this.constrainToScreen();
  }

  enteringMovement() {
    // Move down to target position
    if (this.position.y < this.targetY) {
      this.velocity.y = this.speed;
      this.velocity.x = 0;
    } else {
      this.movementPhase = 'circling';
      this.phaseTimer = 0;
    }
  }

  circlingMovement(playerPosition) {
    // Horizontal movement following player roughly
    const dx = playerPosition.x - this.position.x;
    const followSpeed = this.speed * 0.6;

    if (Math.abs(dx) > 50) {
      this.velocity.x = dx > 0 ? followSpeed : -followSpeed;
    } else {
      this.velocity.x *= 0.9; // Slow down when close
    }

    // Small vertical oscillation
    this.velocity.y = Math.sin(this.movementTimer * 0.05) * 0.3;

    // Face towards player
    const dy = playerPosition.y - this.position.y;
    this.rotation = Math.atan2(dy, dx) + Math.PI / 2;
  }

  chargingMovement(playerPosition) {
    if (!this.chargeTarget) {
      // Set charge target to player's current position
      this.chargeTarget = { x: playerPosition.x, y: playerPosition.y };
    }

    // Move towards charge target
    const dx = this.chargeTarget.x - this.position.x;
    const dy = this.chargeTarget.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 10) {
      const chargeSpeed = this.speed * 2.5;
      this.velocity.x = (dx / distance) * chargeSpeed;
      this.velocity.y = (dy / distance) * chargeSpeed;
      this.rotation = Math.atan2(dy, dx) + Math.PI / 2;
    } else {
      // Reached target, start retreating
      this.movementPhase = 'retreating';
      this.phaseTimer = 0;
      this.chargeTarget = null;
    }
  }

  retreatingMovement() {
    // Move back up and to a safe position
    this.velocity.y = -this.speed * 0.8;
    this.velocity.x *= 0.95; // Gradually stop horizontal movement

    if (this.position.y <= this.targetY) {
      this.movementPhase = 'circling';
      this.phaseTimer = 0;
    }
  }

  updateMovementPhase() {
    const healthPercentage = this.healthBar.getHealth() / this.maxHealth;

    // More aggressive as health decreases
    if (this.movementPhase === 'circling' && this.phaseTimer > 180) {
      if (healthPercentage < 0.5 && Math.random() < 0.3) {
        this.movementPhase = 'charging';
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

    // Update special attack timer
    this.specialAttackTimer++;

    // Perform special attack if timer reached and not already performing one
    if (
      this.specialAttackTimer >= this.specialAttackInterval &&
      !this.isPerformingSpecialAttack
    ) {
      this.performSpecialAttack(playerPosition);
      this.specialAttackTimer = 0;
      return;
    }

    // Regular shooting pattern
    const dx = playerPosition.x - this.position.x;
    const dy = playerPosition.y - this.position.y;
    const angle = Math.atan2(dy, dx);

    if (this.bulletManager) {
      const bulletSpawnX = this.position.x + this.width / 2;
      const bulletSpawnY = this.position.y + this.height / 2;

      // Multi-shot pattern
      const numBullets =
        this.healthBar.getHealth() / this.maxHealth < 0.5 ? 3 : 2;
      const spreadAngle = 0.3;

      for (let i = 0; i < numBullets; i++) {
        const bulletAngle = angle + (i - (numBullets - 1) / 2) * spreadAngle;
        this.bulletManager.createBullet(
          bulletSpawnX - 6,
          bulletSpawnY - 10,
          bulletAngle + Math.PI / 2,
          4,
          this.damage / 3,
          './assets/sprites/bullet_enemy.png',
          'enemy'
        );
      }

      // Play enemy shoot sound for boss
      if (window.audioManager) {
        window.audioManager.playEnemyShoot({ volume: 1.2, pitch: 0.8 });
      }
    }

    this.shootCooldown = this.shootInterval;
  }

  performSpecialAttack(playerPosition) {
    this.isPerformingSpecialAttack = true;

    if (this.bulletManager) {
      const bulletSpawnX = this.position.x + this.width / 2;
      const bulletSpawnY = this.position.y + this.height / 2;

      // Circular bullet pattern
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

      // Play special attack sound
      if (window.audioManager) {
        window.audioManager.playEnemyShoot({ volume: 1.5, pitch: 0.7 });
      }
    }

    // Reset special attack state after a short delay
    setTimeout(() => {
      this.isPerformingSpecialAttack = false;
    }, 1000);
  }

  checkBoundaries() {
    // Boss has more lenient boundary checking - only remove if way off screen
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
    if (!this.isAlive || !this.sprite.complete) return;

    // Add boss-specific visual effects
    this.ctx.save();

    // Add a subtle glow effect for the boss
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

    // Draw enhanced health bar for boss
    this.drawBossHealthBar();

    this.drawBullets();
  }

  drawBossHealthBar() {
    // Draw boss health bar at top of screen
    const barWidth = this.canvas.width * 0.6;
    const barHeight = 20;
    const barX = (this.canvas.width - barWidth) / 2;
    const barY = 20;

    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

    // Health bar background
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health bar fill
    const healthPercentage = this.healthBar.getHealth() / this.maxHealth;
    const fillWidth = barWidth * healthPercentage;

    // Color changes based on health
    if (healthPercentage > 0.6) {
      this.ctx.fillStyle = '#00ff00';
    } else if (healthPercentage > 0.3) {
      this.ctx.fillStyle = '#ffff00';
    } else {
      this.ctx.fillStyle = '#ff0000';
    }

    this.ctx.fillRect(barX, barY, fillWidth, barHeight);

    // Border
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Boss name
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BOSS', this.canvas.width / 2, barY - 10);

    // Health text
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

      // Create special boss explosion
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

      // Play boss death explosion sound
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
